const {Schema, model} = require('mongoose');


const tradeSchema = new Schema({
    price: {type: Schema.Types.Decimal128, required: true,},
    quantity: {type: Schema.Types.Decimal128, required: true,},
    maker: {type: Schema.Types.String, required: true,},
    makerInternalId: {type: Schema.Types.String, required: true, ref: 'orders'},
    takerInternalId: {type: Schema.Types.String, required: true, ref: 'orders'},
}, {timestamps: true});


module.exports = model('trade', tradeSchema, 'trades');