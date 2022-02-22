const nrp = require('./modules/nrpModule');


class User {

    static dictUsername = {};

    constructor(username) {
        if (User.dictUsername.username)
            return User.dictUsername[username]

        this.username = username
        User.dictUsername[username] = this
        return this
    }

}

class Order {
    static n = 0;
    constructor(type, side, quantity, user, price, market) {
        this.id = ++Order.n;
        this.type = type;
        this.side = side;
        this.quantity = quantity;
        this.user = user;
        this.unFilled = quantity;
        this.price = price;

        nrp.emit("createOrder", {
            id: this.id,
            type: this.type,
            side: this.side,
            quantity :this.quantity,
            username: user.username,
            unFilled : this.unFilled,
            price: this.price,
            marketName : market.name
        })

    }

    // set unFilled(value){
    //     nrp.emit('updateOrder',{id: this.id, unFilled: value} );
    //     this.unFilled = value;
    // }
}

class Trade {

    constructor(price, quantity, maker, makerOrder, takerOrder) {
        this.price = price;
        this.quantity = quantity;
        this.maker = maker;
        const m = new Date();
        const dateString = m.getUTCFullYear() + "/" + (m.getUTCMonth() + 1) + "/" + m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
        this.time = dateString;
        this.makerOrder = makerOrder;
        this.takerOrder = takerOrder;
        this.emit();

    }

    emit() {
        nrp.emit("newTrade", this);
        nrp.emit('createTrade',{
            price: this.price,
            quantity: this.quantity,
            maker: this.maker,
            makerOrderId:this.makerOrder.id,
            takerOrderId : this.takerOrder.id
        })
    }
}

class OrderBook {

    constructor(bids = [], asks = []) {
        this.bids = bids; // sort ascending
        this.asks = asks; // sort descending
        this.bidsVolume = []
        this.asksVolume = []
        this.n = 0;
    }

    get length() {
        return this.bids.length + this.asks.length;
    }

    add(order) {
        // order.id = ++(this.n);
        if (order.side == 'buy') {
            this.bids.push(order);
            this.sortBids();
            this.addToBidsVolume(order.price, order.unFilled);

        } else if (order.side == 'sell') {
            this.asks.push(order);
            this.sortAsks();
            this.addToAsksVolume(order.price, order.unFilled);
        }
    }

    addToBidsVolume(price, volume) {
        let i;
        for (i = this.bidsVolume.length - 1; i >= 0; i--) {
            if (price >= this.bidsVolume[i].price) {
                break
            }
        }


        if (this.bidsVolume[i]?.price === price) {
            this.bidsVolume[i].volume = this.bidsVolume[i].volume + volume;

        } else {
            i++;
            this.bidsVolume.splice(i, 0, {price: price, volume: volume});

        }

        nrp.emit('bidsVolumeChange', this.bidsVolume[i]);
    }

    addToAsksVolume(price, volume) {
        let i;
        for (i = this.asksVolume.length - 1; i >= 0; i--) {
            if (price <= this.asksVolume[i].price) {
                break
            }
        }


        if (this.asksVolume[i]?.price === price) {
            this.asksVolume[i].volume = this.asksVolume[i].volume + volume;
        } else {
            i++;
            this.asksVolume.splice(i, 0, {price: price, volume: volume});
        }


        nrp.emit('asksVolumeChange', this.asksVolume[i])

    }

    reduceBidsVolume(price, volume) {
        let i;
        for (i = this.bidsVolume.length - 1; i >= 0; i--) {
            if (price >= this.bidsVolume[i].price) {
                break
            }
        }

        this.bidsVolume[i].volume -= volume;
        const temp = this.bidsVolume[i];
        if (this.bidsVolume[i].volume === 0) {
            this.bidsVolume.splice(i, 1);
        }

        nrp.emit('bidsVolumeChange', temp);

    }

    reduceAsksVolume(price, volume) {
        let i;
        for (i = this.asksVolume.length - 1; i >= 0; i--) {
            if (price === this.asksVolume[i].price) {
                break
            }
        }
        this.asksVolume[i].volume -= volume;
        const temp = this.asksVolume[i];
        if (this.asksVolume[i].volume === 0) {
            this.asksVolume.splice(i, 1);
        }
        nrp.emit('asksVolumeChange', temp);

    }

    sortBids() {
        for (let i = this.bids.length - 1; i > 0; i--) {
            if (this.bids[i].price < this.bids[i - 1].price || (this.bids[i].price === this.bids[i - 1].price && this.bids[i].id > this.bids[i - 1].id)) {
                let temp = this.bids[i];
                this.bids[i] = this.bids[i - 1];
                this.bids[i - 1] = temp;
            } else {
                break;
            }
        }
    }

    sortAsks() {
        for (let i = this.asks.length - 1; i > 0; i--) {
            if (this.asks[i].price > this.asks[i - 1].price || (this.asks[i].price === this.asks[i - 1].price && this.asks[i].id > this.asks[i - 1].id)) {
                let temp = this.asks[i];
                this.asks[i] = this.asks[i - 1];
                this.asks[i - 1] = temp;
            } else {
                break;
            }
        }
    }

    remove(order) {
        if (order.side === 'buy') {
            const index = this.bids.indexOf(order);
            if (index > -1) {

                this.reduceBidsVolume(order.price, order.unFilled);
                this.bids.splice(index, 1);
            }
        } else if (order.side === 'sell') {
            const index = this.asks.indexOf(order);
            if (index > -1) {

                this.reduceAsksVolume(order.price, order.unFilled);
                this.asks.splice(index, 1);
            }
        }
    }


}

class MatchingEngine {
    constructor(name) {
        this.name = name;
        this.queue = new Array();
        this.orderBook = new OrderBook();
        this.trades = new Array();
    }

    process(order) {
        this.match(order);
    }

    getTrades() {
        const trades = this.trades;
        return trades;
    }

    match(order) {
        if (order.side == 'buy' && this.orderBook.asks.length && order.price >= this.orderBook.asks[this.orderBook.asks.length - 1].price) {
            let filled = 0;
            const consumedAsks = [];

            for (let i = this.orderBook.asks.length - 1; i >= 0; i--) {
                let ask = this.orderBook.asks[i];

                if (ask.price > order.price || filled === order.quantity) {

                    if (this.orderBook.asks[i + 1])
                        nrp.emit('price', {price: this.orderBook.asks[i + 1].price});
                    if (ask.price > order.price)
                        break;
                    else if (filled === order.quantity)
                        break;
                }


                if (filled + ask.unFilled <= order.quantity) {
                    filled += ask.unFilled;
                    let trade = new Trade(ask.price, ask.unFilled, "ask", ask, order);
                    this.trades.push(trade);
                    consumedAsks.push(ask);
                } else if (filled + ask.unFilled > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    let trade = new Trade(ask.price, volume, "ask",ask, order);
                    this.trades.push(trade);
                    ask.unFilled -= volume;
                    this.orderBook.reduceAsksVolume(ask.price, volume);
                }
            }

            if (filled < order.quantity) {
                order.unFilled =  order.quantity - filled;
                this.orderBook.add(order);
            }

            for (const ask of consumedAsks) {
                this.orderBook.remove(ask);
                ask.unFilled = 0;
            }


        } else if (order.side === 'sell' && this.orderBook.bids.length && order.price <= this.orderBook.bids[this.orderBook.bids.length - 1].price) {

            let filled = 0;
            const consumedBids = [];

            for (let i = this.orderBook.bids.length - 1; i >= 0; i--) {
                let bid = this.orderBook.bids[i];


                if (bid.price < order.price || filled === order.quantity) {
                    if (this.orderBook.bids[i + 1])
                        nrp.emit('price', {price: this.orderBook.bids[i + 1].price})

                    if (bid.price < order.price)
                        break
                    if (filled === order.quantity)
                        break
                }


                if (filled + bid.unFilled <= order.quantity) {
                    filled += bid.unFilled;
                    let trade = new Trade(bid.price, bid.unFilled, "bid",bid, order );
                    this.trades.push(trade);
                    consumedBids.push(bid);
                } else if (filled + bid.unFilled > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    let trade = new Trade(bid.price, volume, "bid",bid, order);
                    this.trades.push(trade);
                    bid.unFilled -= volume;
                    this.orderBook.reduceBidsVolume(bid.price, volume);
                }

            }

            if (filled < order.quantity) {
                order.unFilled = order.quantity - filled;
                this.orderBook.add(order)
            }

            for (const bid of consumedBids) {
                this.orderBook.remove(bid);
                bid.unFilled = 0;
            }


        } else {
            this.orderBook.add(order);
            // nrp.emit('orderBook', order);
        }


    }

    market(order) {
        if (order.side === 'buy') {
            let filled = 0;
            const consumedAsks = [];

            for (let i = this.orderBook.asks.length - 1; i >= 0; i--) {
                let ask = this.orderBook.asks[i];


                if (filled === order.quantity) {

                    if (this.orderBook.asks[i + 1])
                        nrp.emit('price', {price: this.orderBook.asks[i + 1].price});
                    if (filled === order.quantity)
                        break;
                }


                if (filled + ask.unFilled <= order.quantity) {
                    filled += ask.unFilled;
                    let trade = new Trade(ask.price, ask.unFilled, "ask",ask, order);
                    this.trades.push(trade);
                    consumedAsks.push(ask);
                } else if (filled + ask.unFilled > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    let trade = new Trade(ask.price, volume, "ask",ask, order);
                    this.trades.push(trade);
                    ask.unFilled -= volume;
                    this.orderBook.reduceAsksVolume(ask.price, volume);
                }
            }

            if (filled < order.quantity) {
                console.log("zart")
            }

            for (const ask of consumedAsks) {
                this.orderBook.remove(ask);
                ask.unFilled = 0;
            }
        } else if (order.side === 'sell') {

            let filled = 0;
            const consumedBids = [];

            for (let i = this.orderBook.bids.length - 1; i >= 0; i--) {
                let bid = this.orderBook.bids[i];


                if (filled === order.quantity) {
                    if (this.orderBook.bids[i + 1])
                        nrp.emit('price', {price: this.orderBook.bids[i + 1].price})

                    if (filled === order.quantity)
                        break
                }


                if (filled + bid.unFilled <= order.quantity) {
                    filled += bid.unFilled;
                    const trade = new Trade(bid.price, bid.unFilled, "bid", bid, order);
                    this.trades.push(trade);
                    consumedBids.push(bid);
                } else if (filled + bid.unFilled > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    const trade = new Trade(bid.price, volume, "bid",bid, order);
                    this.trades.push(trade);
                    bid.unFilled -= volume;
                    this.orderBook.reduceBidsVolume(bid.price, volume);
                }

            }

            if (filled < order.quantity) {
                console.log('zart')
            }

            for (const bid of consumedBids) {

                this.orderBook.remove(bid);
                bid.unFilled = 0;
            }

        }
    }

}

let matchEngine = new MatchingEngine("btcusdt");
const user1 = new User("user1");
const user2 = new User("user2");

// for (let i = 0; i < 1_000; i++) {
//     let price = 100 + i / 10;
//     let order = new Order('limit', 'sell',  Math.floor(Math.random() * 10) + 1, user1, price, matchEngine);
//     console.log(i,order)
//     matchEngine.match(order);
// }
//
// for (let i = 0; i < 1_000; i++) {
//     let price = 99 + i / 10;
//     let order = new Order('limit', 'buy', Math.floor(Math.random() * 10) + 1, user2, price, matchEngine);
//     console.log(i,order)
//     matchEngine.match(order);
// }

console.log("sell orders \n id", "price", "quantity")
for (const order of matchEngine.orderBook.asks) {
    console.log(order.id, "|", order.price, "|", order.quantity);
}
console.log("buy orders \n id", "price", "quantity")
for (const order of matchEngine.orderBook.bids) {
    console.log(order.id, "|", order.price, "|", order.quantity);
}

let order = new Order('limit', 'buy', 3, user1,100.4, matchEngine);
matchEngine.match(order);


console.log("----------------------------------------------------------------------")
console.log("sell orders \n id", "price", "quantity")
for (const order of matchEngine.orderBook.asks) {
    console.log(order.id, "|", order.price, "|", order.quantity);
}
console.log("buy orders \n id", "price", "quantity")
for (const order of matchEngine.orderBook.bids) {
    console.log(order.id, "|", order.price, "|", order.quantity);
}

console.log(matchEngine.orderBook.asksVolume);
console.log(matchEngine.orderBook.bidsVolume);


module.exports = {matchEngine, Order, User};