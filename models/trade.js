const {Schema, model} = require('mongoose');


const tradeSchema = new Schema({
    price: {type: Schema.Types.Decimal128, required: true,},
    quantity: {type: Schema.Types.Decimal128, required: true,},
    maker: {type: Schema.Types.String, required: true,},
    makerOrder: {type: Schema.Types.ObjectId, required: true, ref: 'orders'},
    tackerOrder: {type: Schema.Types.ObjectId, required: true, ref: 'orders'},
}, {timestamps: true});


module.exports = model('order', tradeSchema, 'orders');