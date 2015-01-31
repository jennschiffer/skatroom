/*** skatroom app.js ***/

/* express */
var express = require('express');
var app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser('secretskatroomwowowow'));
app.use(express.static(__dirname + '/public'));

/* stall number to stall name enum */
var STALL_NUMBER_TO_NAME = {
  1: 'chipotle',
  2: 'taco bell',
  3: 'arbys',
  4: 'country kitchen buffet',
  5: 'tgi fridays',
  6: 'Applebees'
};


// index
app.get('/', function(req, resp) {
  resp.sendfile(__dirname + '/views/index.html');
});

// log in
app.get('/login/', function(req, resp) {
	resp.sendfile(__dirname + '/views/login.html');
});

// log off
app.get('/logoff', function(req, resp) {
	resp.clearCookie('skatroom');
	resp.sendfile(__dirname + '/views/login.html');
});

// receive tp data - IF THIS DOESN'T WORK WITH MAX, TRY CHANGING APP.GET TO APP.POST ON NEXT LINE :-*
app.get('/post', function(req, resp) {
  var tpData = {
    stallNumber : req.param('stallNumber'),
    tpAmount : req.param('tpAmount')
  }
  console.log('tp data received: ', tpData);
  
  var stallName = STALL_NUMBER_TO_NAME[tpData.stallNumber];
  var username = "";
  connectedUsers.forEach(function(userData) {
    if (userData.stall === stallName) {
      username = userData.nickname;
    }
  });
  
  //<username> used <tpAmount> sheets of toilet paper in stall <stall_name>
  var message = {
      nick: 'skatroom',
      text: '<strong>' + username + '</strong> used ' + tpData.tpAmount + ' sheets of toilet paper in stall <strong>' + stallName + '</strong>',
      timestamp: Date.now()
  };

  io.sockets.emit('message', { chat: message });   
  addToChatHistory(message);

});

// send history
app.get('/history', function(req, resp) {
  console.log('history requested');
  resp.send(chatHistory);
})

// receive login post data
app.post('/', function(req, resp) {
  var data = {
    nickname : req.body.nickname,
    stall : req.body.stall.replace(/%20/g,' '),
    authentic : true
  };
  dataJSON = JSON.stringify(data);
  resp.cookie('skatroom', dataJSON);
  resp.sendfile(__dirname + '/views/index.html');
});


/* socket.io */
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
require('./sockets')(io);
var connectedUsers = [];
var chatHistory = [];
var CHAT_BACKLOG_LENGTH = 10;

server.listen(4321);

io.sockets.on('connection', function (socket) {
  io.sockets.emit('history', chatHistory);
  console.log('connection made');
  
  socket.on('send', function (data) { 
    console.log('data sent: ', data);
    if ( data.chat ) {
      // send messages or users
      io.sockets.emit('message',data);   
      addToChatHistory(data.chat);
    } 
    else if ( data.activeUser ) {
      connectedUsers.push({
     	  nickname: data.activeUser,
     	  clientID: socket.id,
        stall: data.userStall
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
    addToChatHistory(leaveMessage);
	  
    // send message that user left
    io.sockets.emit('message', { chat: leaveMessage }); 
    
    // send new user list
    connectedUsers.splice(removalIndex, 1);
    io.sockets.emit('message', { updateRoom: connectedUsers });
    
  });
});

/** helpers **/
function addToChatHistory(data) {
  if (chatHistory.length >= CHAT_BACKLOG_LENGTH) {
    chatHistory.splice(0,1);
  }
  chatHistory.push(data);
}
