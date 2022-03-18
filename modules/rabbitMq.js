var q = 'tasks';

var open = require('amqplib').connect('amqp://localhost');

// Publisher
open.then(function(conn) {
    return conn.createChannel();
}).then(function(ch) {
    return ch.assertQueue(q).then(function(ok) {
        console.log(ok)
        return ch.sendToQueue(q, Buffer.from(JSON.stringify({are:"are"})));
    });
}).catch(console.warn);