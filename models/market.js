const {Schema, model} = require('mongoose');


const marketSchema = new Schema({
    name: {type: String, required: true, unique: true},

}, {timestamps: true});


module.exports = model('market', marketSchema, 'markets');