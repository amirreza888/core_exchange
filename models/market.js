const {Schema, model} = require('mongoose');


const marketSchema = new Schema({


}, {timestamps: true});


module.exports = model('market', marketSchema, 'markets');