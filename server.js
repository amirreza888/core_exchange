const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const http = require('http');
const server = http.createServer(app);
const socket = require('socket.io');
const nrp = require('./modules/nrpModule');

io = socket(server, {
    cors: {
        origin: "http://localhost:63342",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});


const path = require('path');


const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({extended: false})

app.use(urlencodedParser);

const cors = require('cors');
app.use(cors());

const bids = [];
const bidsVolume = [];
const asks = [];
const asksVolume = [];
const trades = [];
let price = Number();

nrp.on('price', (data) => {
    price = data.price;
    io.emit("price", data);
});

nrp.on('newTrade', (data) => {
    trades.push(data);
    io.emit('newTrade', data)
});

nrp.on('bidsVolumeChange', (data) => {

    let i;
    const {price,volume} = data;
    for (i = bidsVolume.length - 1; i >= 0; i--) {
        if (price >= bidsVolume[i].price) {
            break
        }
    }


    if (bidsVolume[i]?.price === price) {
        bidsVolume[i].volume = volume;

    } else {
        i++;
        bidsVolume.splice(i, 0, {price: price, volume: volume});

    }

    if (bidsVolume[i].volume === 0) {
        bidsVolume.splice(i, 1);
    }

    io.emit('bidsVolumeChange', data);
});

nrp.on('asksVolumeChange', (data) => {
    let i;
    const {price,volume} = data;
    console.log(data);
    // console.log(asksVolume);
    for (i = asksVolume.length - 1; i >= 0; i--) {
        if (price <= asksVolume[i].price) {
            break
        }
    }


    if (asksVolume[i]?.price === price) {
        asksVolume[i].volume = volume;
    } else {
        i++;
        asksVolume.splice(i, 0, {price: price, volume: volume});
    }

    if (asksVolume[i].volume === 0) {
        asksVolume.splice(i, 1);
        console.log(asksVolume);
    }

    io.emit('asksVolumeChange', data);
});


app.get('/bids-list', (req, res) => {
    return res.json({
        bids: bids,
        length: bids.length
    });
})

app.get('/bids-volume', (req, res) => {
    return res.json({
        bidsVolume: bidsVolume,
        length: bidsVolume.length
    });
})


app.get('/asks-list', (req, res) => {
    return res.json({
        asks: asks,
        length: asks.length
    });
})
app.get('/asks-volume', (req, res) => {
    return res.json({
        asksVolume: asksVolume,
        length: asksVolume.length
    });
})


app.get('/trades', (req, res) => {
    return res.json({
        lastTrades: trades,
        length: trades.length,
    });
})

app.get('/price', (req, res) => {
    return res.json({
        price: price,
    });
})


app.post('/order', async (req, res) => {
    let {type, side, quantity, price=0,username = "user1"} = req.body;
    nrp.emit("addOrder",{type, side, quantity,price, username});
    return res.json({status: true});
})

io.on('connection', (socket) => {
    console.log("connected")
});

app.use('/static', express.static(path.join(__dirname, 'public')));

server.listen(3000, () => {
    console.log('listening on *:3000');
});







