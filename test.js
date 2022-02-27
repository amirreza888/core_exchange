const nrp = require('./modules/nrpModule');
const timer = ms => new Promise(res => setTimeout(res, ms))
async function buy() {
    for (let i = 0; i < 10_000; i++) {
        let price = 99 + i / 10;
        nrp.emit("addOrder", {
            type: 'limit',
            side: 'buy',
            quantity: Math.floor(Math.random() * 10) + 1,
            price: price,
            username: "user1"
        });

        await timer(1);
    }
}


async function sell() {
    for (let i = 0; i < 10_000; i++) {
        let price = 100 + i / 10;
        nrp.emit("addOrder", {
            type: 'limit',
            side: 'sell',
            quantity: Math.floor(Math.random() * 10) + 1,
            price: price,
            username: "user1"
        });

        await timer(1);
    }
}

sell().then(r => console.log("sell"))
buy().then(r => console.log("buy"))

