const Queue = require('bull');

const matchEngineQueue = new Queue('mEQ', {
    redis: {
        host: "127.0.0.1",
        port: "6379",
    },
});

const {matchEngine, order} = require("./app");

matchEngineQueue.process('addOrder', orderAdder);


function orderAdder(job, done) {
    const {order} = job.data;
    if (order.type === 'limit')
        matchEngine.match(order);
    else if (order.type === 'market')
        matchEngine.market(order);
    done()
}


module.exports = {matchEngineQueue: matchEngineQueue};