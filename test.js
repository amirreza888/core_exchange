const nrp = require('./modules/nrpModule');
const timer = ms => new Promise(res => setTimeout(res, ms));
const queue = 'addOrder';

const open = require('amqplib').connect('amqp://localhost');

// Publisher
open.then(function(connect) {
    return connect.createChannel();
}).then(function(ch) {
    return ch.assertQueue(queue, {durable: true}).then( async function(ok) {

        for (let i = 0; i < 10_000; i++) {
            let price = 99 + i / 10;
            let data = {
                type: 'limit',
                side: 'buy',
                quantity: Math.floor(Math.random() * 10) + 1,
                price: price,
                username: "user1"
            }
            ch.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {persistent: true})
            await timer(1);
        }


        return;
    });
}).catch(console.warn);


open.then(function(connect) {
    return connect.createChannel();
}).then(function(ch) {
    return ch.assertQueue(queue, {durable: true}).then( async function(ok) {

        for (let i = 0; i < 10_000; i++) {
            let price = 100 + i / 10;
            console.log(price)
            const data = {
                type: 'limit',
                side: 'sell',
                quantity: Math.floor(Math.random() * 10) + 1,
                price: price,
                username: "user1"
            };
            ch.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {persistent: true})
            await timer(1);
        }

        return;
    });
}).catch(console.warn);




