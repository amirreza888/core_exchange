const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http');
const server = http.createServer(app);
const socket = require('socket.io');

io = socket(server, {
    cors: {
        origin: "http://localhost:63343",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});


const path = require('path');

const matchEngineQueue = require('./bridge').matchEngineQueue;
const {matchEngine, Order, eventEmitter} = require("./app");

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({extended: false})

app.use(urlencodedParser);

var cors = require('cors');
app.use(cors());


app.get('/bids-list', (req, res) => {
    return res.json({
        bids: matchEngine.orderBook.bids,
        length: matchEngine.orderBook.bids.length
    });
})

app.get('/bids-volume', (req, res) => {
    return res.json({
        bidsVolume: matchEngine.orderBook.bidsVolume,
        length: matchEngine.orderBook.bidsVolume.length
    });
})


app.get('/asks-list', (req, res) => {
    return res.json({
        asks: matchEngine.orderBook.asks,
        length: matchEngine.orderBook.asks.length
    });
})
app.get('/asks-volume', (req, res) => {
    return res.json({
        asksVolume: matchEngine.orderBook.asksVolume,
        length: matchEngine.orderBook.asksVolume.length
    });
})


app.get('/trades', (req, res) => {
    return res.json({
        lastTrades: matchEngine.trades,
        length: matchEngine.trades.length,
    });
})

app.get('/price', (req, res) => {
    return res.json({
        price: matchEngine.trades[matchEngine.trades.length-1].price,

    });
})


app.post('/order', async (req, res) => {
    let {type, side, price=0, quantity} = req.body;
    price = Number(price);
    quantity = Number(quantity);
    // console.log(req.body)
    const order = new Order(type, side, price, quantity);
    await matchEngineQueue.add("addOrder", {order});
    return res.json({status: true});
})

io.on('connection', (socket) => {

    eventEmitter.on('price', (data) => {
        console.log("price", data)
        socket.emit('price', data);
    });

    eventEmitter.on('bidsVolumeChange', (data) => {
        console.log('bidsVolumeChange', data)
        socket.emit('bidsVolumeChange', data);
    });

    eventEmitter.on('asksVolumeChange', (data) => {
        console.log('asksVolumeChang',data);
        socket.emit('asksVolumeChange', data);
    });

    eventEmitter.on('newTrade', (data) => {
        console.log('newTrade', data);
        socket.emit('newTrade', data)
    });

});

app.use('/static', express.static(path.join(__dirname, 'public')));

server.listen(3000, () => {
    console.log('listening on *:3000');
});


//////////////////////






