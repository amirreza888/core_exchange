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
    const market = await marketModel.findOne({name:marketName});
    const user = await userModel.findOne({username:username});


    const order = await orderModel.create({
        internalId: id,
        type: type,
        side: side,
        quantity: quantity,
        user : user,
        unFilled: unFilled,
        price: price,
        market: market
    })
}

async function updateOrder(data){
    const {id, unFilled,} = data;
    const order = await orderModel.findOneAndUpdate({internalId:id}, {unFilled:unFilled});
}


async function createTrade(data){
    const {price, quantity, maker, makerOrderId, takerOrderId} = data;
    let temp = await orderModel.findOne();
    let makerOrder = await orderModel.findOne({internalId:makerOrderId});
    let takerOrder = await orderModel.findOne({internalId:takerOrderId});

    // console.log(temp)
    // console.log(makerOrderId,makerOrder)
    // console.log(takerOrderId,takerOrder)

    while (!makerOrder || ! takerOrder){
         makerOrder = await orderModel.findOne({internalId:makerOrderId});
         takerOrder = await orderModel.findOne({internalId:takerOrderId});
        console.log("are")
        await timer(3);
    }
    const trade = await tradeModel.create({
        price: price,
        quantity: quantity,
        maker: maker,
        makerOrder: makerOrder,
        takerOrder: takerOrder
    })

    console.log(trade)
}