    // Setup Socket.IO 
    var configuration_handler = require('../handlers/configuration-handler')
        , config = configuration_handler.initializeConfiguration()
        , remotePort = parseInt(config.remotePort) || 3001
        , io = require('socket.io').listen(remotePort);
    
    exports.io = io;