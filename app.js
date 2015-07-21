var server = require('./www/server');

server.startCluster(2, function ( err ) {
    console.log('Server started ' + process.pid);
});

