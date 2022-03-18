function nGenerator() {

    if (typeof nGenerator.counter == 'undefined') {
        nGenerator.counter = 0;
    }

    return (++nGenerator.counter);
}

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
    constructor(side, quantity, price, status = "new") {
        this.id = nGenerator();
        this.side = side;
        this.quantity = quantity;
        this.unFilled = this.quantity;
        this.price = price;
        this.status = status;
    }
}

class UserOrder extends Order {
    constructor(type, side, quantity, user, leverage, price,) {
        const pureQuantity = quantity;
        quantity *= leverage;
        super(side, quantity, price, "new");
        this.type = type;
        this.pureQuantity = pureQuantity;
        this.leverage = leverage;
        this.user = user;
        this.generateReverseOrder();

    }

    generateReverseOrder(){
        const side = this.side;
        const reverseQuantity = this.quantity - this.pureQuantity;
        new ReverseOrder(side, reverseQuantity, ,this)
    }

}

class ReverseOrder extends Order {
    constructor(type, side, quantity, price, order) {
        super(side, quantity, price, order,);
        this.id = nGenerator();
        this.order = order;
    }
}


class Trade {

    constructor(price, quantity, maker, makerOrder, takerOrder) {
        this.price = price;
        this.quantity = quantity;
        this.maker = maker;
        this.makerOrder = makerOrder;
        this.takerOrder = takerOrder;

    }
}

class OrderBook {

    constructor(bids = [], asks = []) {
        this.bids = bids; // sort ascending
        this.asks = asks; // sort descending
        this.openOrders = [];
        this.bidsVolume = []
        this.asksVolume = []
    }

    add(order) {
        if (order.side === 'buy') {
            this.bids.push(order);
            this.sortBids();
            this.addToBidsVolume(order.price, order.unFilled);

        } else if (order.side === 'sell') {
            this.asks.push(order);
            this.sortAsks();
            this.addToAsksVolume(order.price, order.unFilled);
        }
    }

}

class MatchingEngine {
    constructor(name) {
        this.name = name;
        this.orderBook = new OrderBook();
        this.trades = [];
    }
}