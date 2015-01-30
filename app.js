/*** jsChat app.js ***/

var jsChatAuthenticatedUsers = [];


/* sqlite */
var fs = require('fs');
var dbFile = 'jschat.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

// if db does not exist, create it with a root user
db.serialize(function(){
    if(!exists) {
        db.run('CREATE TABLE Users (nickname TEXT, password TEXT, color TEXT, role TEXT)');
        db.run('INSERT INTO Users (nickname, password, color, role) VALUES ("root","root","red","rootabega")');
    }
});



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
	resp.clearCookie('jschat');
	resp.sendfile(__dirname + '/views/login.html');
});

// receive login post data
app.post('/', function(req, resp) {
	db.all('SELECT * FROM Users WHERE nickname="' + req.body.nickname + '" AND password="' + req.body.password + '"', 
	  function(err, rows) {
	  	        
        if ( err) throw err;
        if ( rows.length == 1 ) {
       	    var data = {
	       	    nickname : req.body.nickname,
	            color : rows[0].color,
	            authentic : true
       	    };
       	    dataJSON = JSON.stringify(data);
       	    resp.cookie('jschat', dataJSON);
        } else {
	        resp.clearCookie('jschat');
        }
        resp.sendfile(__dirname + '/views/index.html');
   });
});



/* socket.io */
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var connectedUsers = [];

server.listen(3000);

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
	   		nick: 'jschat',
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
