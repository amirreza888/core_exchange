const Queue = require('bull');
const nrp = require('./modules/nrpModule');
const {matchEngine, Order, User} = require("./app");

const matchEngineQueue = new Queue('MEQ', {
    redis: {
        host: "127.0.0.1",
        port: "6379",
    },
});

const queue = 'addOrder';

const open = require('amqplib').connect('amqp://localhost');


open.then(function(conn) {
    return conn.createChannel();
}).then(function(ch) {
    return ch.assertQueue(queue,{durable: true}).then(function(ok) {
        return ch.consume(queue, function(msg) {
            if (msg !== null) {
                let data = JSON.parse(msg.content.toString());
                console.log(data)
                orderAdder(data);
                ch.ack(msg);
            }
        }, {
            noAck: false
        }
        );
    });
}).catch(console.warn);


function orderAdder(data) {
    let {type, side, quantity,price=0, username} = data;
    price = Number(price);
    quantity = Number(quantity);
    // console.log(req.body)
    const user = new User(username);
    const order = new Order(type, side, quantity, user, price, matchEngine);

    if (order.type === 'limit')
        matchEngine.match(order);
    else if (order.type === 'market')
        matchEngine.market(order);

}


// module.exports = {matchEngineQueue: matchEngineQueue};