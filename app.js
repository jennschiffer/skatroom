/*** skatroom app.js ***/

/* express */
var express = require('express');
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser('my secret here'));
app.use(express.static(__dirname + '/public'));


// index
app.get('/', function(req, resp) {
    resp.sendfile(__dirname + '/views/index.html');
});

// log in
app.get('/login', function(req, resp) {
	resp.sendfile(__dirname + '/views/login.html');
});

// log off
app.get('/logoff', function(req, resp) {
	resp.clearCookie('skatroom');
	resp.sendfile(__dirname + '/views/login.html');
});

// receive login post data
app.post('/', function(req, resp) {
  var data = {
    nickname : req.body.nickname,
    stall : req.body.password,
    authentic : true
  };
  dataJSON = JSON.stringify(data);
  resp.cookie('skatroom', dataJSON);
  resp.sendfile(__dirname + '/views/index.html');
});



/* socket.io */
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var connectedUsers = [];

server.listen(4321);

io.sockets.on('connection', function (socket) {
  
    socket.on('send', function (data) { 
        if ( data.chat ) {
            // send messages or users
            io.sockets.emit('message',data);            
        } 
        else if ( data.activeUser ) {
	        connectedUsers.push({
	        	nickname: data.activeUser,
	        	clientID: socket.id
	        });
	        io.sockets.emit('message', { updateRoom: connectedUsers });
        }
    });
  
    socket.on('disconnect', function (data) { 
	   
	   // remove user from room list
	   var i = 0;
	   var removalIndex;
	   while ( i < connectedUsers.length ) {
		   if ( connectedUsers[i].clientID == socket.id ) {
			   removalIndex = i;
			   i = connectedUsers.length + 1;
		   }
		   else {
			   i++;
		   }
	   }
	   
	   var leaveMessage = {
	   		nick: 'skatroom',
	        color: 'gray',
	        text: connectedUsers[removalIndex].nickname + ' has left the room',
	        timestamp: Date.now()
	   };
	  
	   // send message that user left
	   io.sockets.emit('message', { chat: leaveMessage }); 
	   
	   // send new user list
	   connectedUsers.splice(removalIndex, 1);
	   io.sockets.emit('message', { updateRoom: connectedUsers });
	   
    });
});
