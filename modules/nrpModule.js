var NRP    = require('node-redis-pubsub');
var config = {
    port  : 6379  , // Port of your locally running Redis server
    scope : 'demo'  // Use a scope to prevent two NRPs from sharing messages
};

var nrp = new NRP(config); // This is the NRP client

// nrp.on("are",(data)=>console.log("are"))
module.exports = nrp;