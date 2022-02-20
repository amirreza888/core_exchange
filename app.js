const mathjs = require('mathjs');
const events = require('events');
const eventEmitter = new events.EventEmitter();

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
    constructor(type, side, quantity, user, price,) {
        this.id = Number();
        this.type = type;
        this.side = side;
        this.quantity = mathjs.bignumber(quantity);
        this.user = user;
        this.price = mathjs.bignumber(price);
        this.unFilled = mathjs.bignumber(quantity);
    }
}

class Trade {

    constructor(price, quantity, maker, makerOrder, tackerOrder) {
        this.price = mathjs.bignumber(price);
        this.quantity = mathjs.bignumber(quantity);
        this.maker = maker;
        const m = new Date();
        const dateString = m.getUTCFullYear() + "/" + (m.getUTCMonth() + 1) + "/" + m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
        this.time = dateString;
        this.makerOrder = makerOrder;
        this.tackerOrder = tackerOrder;
        this.emit();
    }

    emit() {
        eventEmitter.emit("newTrade", this);
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
        order.id = ++(this.n);
        if (order.side == 'buy') {
            this.bids.push(order);
            this.sortBids();
            this.addToBidsVolume(order.price, order.quantity);

        } else if (order.side == 'sell') {
            this.asks.push(order);
            this.sortAsks();
            this.addToAsksVolume(order.price, order.quantity);
        }
    }

    addToBidsVolume(price, volume) {
        let i;
        for (i = this.bidsVolume.length - 1; i >= 0; i--) {
            if (mathjs.largerEq(price , this.bidsVolume[i].price)) {
                break
            }
        }


        if (mathjs.equal(this.bidsVolume[i]?.price , price)) {
            this.bidsVolume[i].volume = mathjs.sum(this.bidsVolume[i].volume , volume);

        } else {
            i++;
            this.bidsVolume.splice(i, 0, {price: price, volume: volume});

        }

        eventEmitter.emit('bidsVolumeChange', this.bidsVolume[i]);
    }

    addToAsksVolume(price, volume) {
        let i;
        for (i = this.asksVolume.length - 1; i >= 0; i--) {
            if (mathjs.smallerEq(price , this.asksVolume[i].price)) {
                break
            }
        }


        if (mathjs.equal(this.asksVolume[i]?.price , price)) {
            this.asksVolume[i].volume = mathjs.this.asksVolume[i].volume + volume;
        } else {
            i++;
            this.asksVolume.splice(i, 0, {price: price, volume: volume});
        }


        eventEmitter.emit('asksVolumeChange', this.asksVolume[i])

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

        eventEmitter.emit('bidsVolumeChange', temp);

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
        eventEmitter.emit('asksVolumeChange', temp);

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
            if (this.asks[i].price > this.asks[i - 1].price || (this.asks[i].price == this.asks[i - 1].price && this.asks[i].id > this.asks[i - 1].id)) {
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
                this.bids.splice(index, 1);
                this.reduceBidsVolume(order.price, order.quantity);
            }
        } else if (order.side === 'sell') {
            const index = this.asks.indexOf(order);
            if (index > -1) {
                this.asks.splice(index, 1);
                this.reduceAsksVolume(order.price, order.quantity);
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
                        eventEmitter.emit('price', {price: this.orderBook.asks[i + 1].price});
                    if (ask.price > order.price)
                        break;
                    else if (filled === order.quantity)
                        break;
                }


                if (filled + ask.quantity <= order.quantity) {
                    filled += ask.quantity;
                    let trade = new Trade(ask.price, ask.quantity, "ask");
                    this.trades.push(trade);
                    consumedAsks.push(ask);
                } else if (filled + ask.quantity > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    let trade = new Trade(ask.price, volume, "ask");
                    this.trades.push(trade);
                    ask.quantity -= volume;
                    this.orderBook.reduceAsksVolume(ask.price, volume);
                }
            }

            if (filled < order.quantity) {
                const newOrder = new Order('limit', 'buy', order.price, order.quantity - filled)
                this.orderBook.add(newOrder);
            }

            for (const ask of consumedAsks) {
                this.orderBook.remove(ask);
            }


        } else if (order.side === 'sell' && this.orderBook.bids.length && order.price <= this.orderBook.bids[this.orderBook.bids.length - 1].price) {

            let filled = 0;
            const consumedBids = [];

            for (let i = this.orderBook.bids.length - 1; i >= 0; i--) {
                let bid = this.orderBook.bids[i];


                if (bid.price < order.price || filled === order.quantity) {
                    if (this.orderBook.bids[i + 1])
                        eventEmitter.emit('price', {price: this.orderBook.bids[i + 1].price})

                    if (bid.price < order.price)
                        break
                    if (filled === order.quantity)
                        break
                }


                if (filled + bid.quantity <= order.quantity) {
                    filled += bid.quantity;
                    let trade = new Trade(bid.price, bid.quantity, "bid");
                    this.trades.push(trade);
                    consumedBids.push(bid);
                } else if (filled + bid.quantity > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    let trade = new Trade(bid.price, volume, "bid");
                    this.trades.push(trade);
                    bid.quantity -= volume;
                    this.orderBook.reduceBidsVolume(bid.price, volume);
                }

            }

            if (filled < order.quantity) {
                let newOrder = new Order('limit', 'sell', order.price, order.quantity - filled);
                this.orderBook.add(newOrder)
            }

            for (const bid of consumedBids) {
                this.orderBook.remove(bid);
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
                        eventEmitter.emit('price', {price: this.orderBook.asks[i + 1].price});
                    if (filled === order.quantity)
                        break;
                }


                if (filled + ask.quantity <= order.quantity) {
                    filled += ask.quantity;
                    let trade = new Trade(ask.price, ask.quantity, "ask");
                    this.trades.push(trade);
                    consumedAsks.push(ask);
                } else if (filled + ask.quantity > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    let trade = new Trade(ask.price, volume, "ask");
                    this.trades.push(trade);
                    ask.quantity -= volume;
                    this.orderBook.reduceAsksVolume(ask.price, volume);
                }
            }

            if (filled < order.quantity) {
                console.log("zart")
            }

            for (const ask of consumedAsks) {
                this.orderBook.remove(ask);
            }
        } else if (order.side === 'sell') {

            let filled = 0;
            const consumedBids = [];

            for (let i = this.orderBook.bids.length - 1; i >= 0; i--) {
                let bid = this.orderBook.bids[i];


                if (filled === order.quantity) {
                    if (this.orderBook.bids[i + 1])
                        eventEmitter.emit('price', {price: this.orderBook.bids[i + 1].price})

                    if (filled === order.quantity)
                        break
                }


                if (filled + bid.quantity <= order.quantity) {
                    filled += bid.quantity;
                    const trade = new Trade(bid.price, bid.quantity, "bid");
                    this.trades.push(trade);
                    consumedBids.push(bid);
                } else if (filled + bid.quantity > order.quantity) {
                    let volume = order.quantity - filled;
                    filled += volume;
                    const trade = new Trade(bid.price, volume, "bid");
                    this.trades.push(trade);
                    bid.quantity -= volume;
                    this.orderBook.reduceBidsVolume(bid.price, volume);
                }

            }

            if (filled < order.quantity) {
                console.log('zart')
            }

            for (const bid of consumedBids) {
                this.orderBook.remove(bid);
            }

        }
    }

}

let matchEngine = new MatchingEngine("btcusdt");


for (let i = 0; i < 10; i++) {
    let price = 100 + i / 10;
    let order = new Order('limit', 'sell', price, Math.floor(Math.random() * 10) + 1);
    matchEngine.match(order);
}

for (let i = 0; i < 10; i++) {
    let price = 99 + i / 10;
    let order = new Order('limit', 'buy', price, Math.floor(Math.random() * 10) + 1);
    matchEngine.match(order);
}

console.log("sell orders \n id", "price", "quantity")
for (const order of matchEngine.orderBook.asks) {
    console.log(order.id, "|", order.price, "|", order.quantity);
}
console.log("buy orders \n id", "price", "quantity")
for (const order of matchEngine.orderBook.bids) {
    console.log(order.id, "|", order.price, "|", order.quantity);
}

let order = new Order('limit', 'buy', 100.4, 3);
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


module.exports = {matchEngine, Order, eventEmitter};