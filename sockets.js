module.exports = function(io) {

    io.sockets.on('connection', function (socket) {
        socket.on('message', function(data) {
            io.sockets.emit('message',data); 
        });
    });
};