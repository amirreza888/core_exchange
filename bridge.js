const Queue = require('bull');
const nrp = require('./modules/nrpModule');
const {matchEngine, Order, User} = require("./app");

const matchEngineQueue = new Queue('MEQ', {
    redis: {
        host: "127.0.0.1",
        port: "6379",
    },
});
matchEngineQueue.process('addOrder', orderAdder);

nrp.on('addOrder',async (data)=>{
    console.log(data)
    await matchEngineQueue.add('addOrder', data);
})



function orderAdder(job, done) {
    let {type, side, quantity,price=0, username} = job.data;
    price = Number(price);
    quantity = Number(quantity);
    // console.log(req.body)
    const user = new User(username);
    const order = new Order(type, side, quantity, user, price);

    if (order.type === 'limit')
        matchEngine.match(order);
    else if (order.type === 'market')
        matchEngine.market(order);
    done()
}


// module.exports = {matchEngineQueue: matchEngineQueue};