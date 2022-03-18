let arr = []

for (let i = 0; i < 10_000_000; i++) {
    let data = {
        name : makeid(10),
        price : Math.random()*i,
        price2 : Math.random()*i,
        name2 :makeid(10),
    }
    arr.push(data)
    console.log(i)
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
