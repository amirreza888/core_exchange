
const socket = io();

var openOrdersData=[]
var orderHistoresData= []
    
// Query DOM
const
        Buy = document.getElementById('Buy'),
        Sell = document.getElementById('Sell');

Buy.addEventListener('click', async () => {
    const buyPrice = document.getElementById('buyPrice');
    const buyAmount = document.getElementById('buyAmount');
    socket.emit('Buy', {
        price: buyPrice,
        quantity : buyAmount
    });
        
});


Sell.addEventListener('click', async () => {
    const sellPrice = document.getElementById('sellPrice');
    const sellAmount = document.getElementById('sellAmount');
    socket.emit('Sell', {
        price: sellPrice,
        quantity : sellAmount
    });
});



// Listen for events






// socket.on('orderHistories',  (data) => {
//     orderHistoresData = []
//     order_history.innerHTML = '';
//     console.log("orderHistories",data)
//     data.forEach((item, i) => {
//         orderHistoresData.push(item)
//         order_history.innerHTML += `<p>${item.pairedSymbol} , ${item.type} , ${item.side} , ${item.baseAmount} , ${item.binanceStatus}</p><br>`;
//     })
//
// });




socket.on('newOrder', (data) => {
    open_order.innerHTML += `<p> ${data.price} , ${data.quantity} </p><br>`;
});



socket.on('orderHistory', (data) => {
    order_history.innerHTML += `<p>${data.price} , ${data.quantity}`</p><br>`;
});







