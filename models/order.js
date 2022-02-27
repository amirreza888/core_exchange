const {Schema, model} = require('mongoose');


const orderSchema = new Schema({
    internalId: {type: String, required: true, unique: true},
    type: {
        type: String,
        required: true,
        enum: ['limit', 'market']
    },
    side: {
        type: String,
        required: true,
        enum: ['buy', 'sell']
    },
    quantity: {type: Schema.Types.Decimal128, required: true,},
    user: {type: Schema.Types.String, required: true , ref: 'users'},
    unFilled: {type: Schema.Types.Decimal128, required: true,},
    price: {type: Schema.Types.Decimal128, required: false,},
    market: {type: Schema.Types.String, required: true,},
}, {timestamps: true});


module.exports = model('order', orderSchema, 'orders');