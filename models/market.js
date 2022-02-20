const {Schema, model} = require('mongoose');


const blockchainSchema = new Schema({


}, {timestamps: true});


module.exports = model('blockchain', blockchainSchema, 'blockchains');