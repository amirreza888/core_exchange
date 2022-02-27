const OS = require('os')
process.env.UV_THREADPOOL_SIZE = OS.cpus().length

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/coreExchange', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('database is ok')
}).catch((e) => {
    console.log(e)
});
const nrp = require('./modules/nrpModule')

const marketModel = require('./models/market');
const userModel = require('./models/user');
const tradeModel = require('./models/trade');
const orderModel = require('./models/order');

nrp.on('createOrder',createOrder);
nrp.on('updateOrder',updateOrder);
nrp.on('createTrade',createTrade);

orderModel.deleteMany({}, (data)=>{});
tradeModel.deleteMany({},(data)=>{});

const timer = ms => new Promise(res => setTimeout(res, ms))

async function createOrder(data){
    const {id, type, side, quantity, username, unFilled, price=0, marketName: marketName} = data;
    // const market = await marketModel.findOne({name:marketName});
    // const user = await userModel.findOne({username:username});


    const order = await orderModel.create({
        internalId: id,
        type: type,
        side: side,
        quantity: quantity,
        user : username,
        unFilled: unFilled,
        price: price,
        market: marketName
    })
}

async function updateOrder(data){
    const {id, unFilled,} = data;
    const order = await orderModel.findOneAndUpdate({internalId:id}, {unFilled:unFilled});
}

async function createTrade(data){
    const {price, quantity, maker, makerOrderId, takerOrderId} = data;

    const trade = await tradeModel.create({
        price: price,
        quantity: quantity,
        maker: maker,
        makerInternalId: makerOrderId,
        takerInternalId: takerOrderId
    })

    // console.log(trade)
}