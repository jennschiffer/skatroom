window.onload = function() {
  
  var userInfo,
    messageContainer,
    submitButton,
    activeUsers,
    textInput,
    socket,
    banter;
    
  var copy = {
    enteredTheRoom: 'has entered the bathroom in stall',
    disconnected: 'You have been disconnected.',
  };
  
  var loginForm = document.forms[0];

  /*** INIT SOCKETS AND CHAT ***/

  var initSkatroom = function() {
    
    /*** scatroom and its events ***/
    document.getElementById('skatroom').style.display = 'block';
    messageContainer = document.getElementById('skatroom-messages');
    submitButton = document.getElementById('submit-message');
    activeUsersList = document.getElementById('active-users');
    textInput = document.forms[0].message;
    banter = [];
    activeUsers = [];

    // add button event          
    submitButton.onclick = function(e){
      sendMessage( userInfo.nickname, userInfo.stall, textInput.value );
      textInput.value = "";
    };
    
    // submit form event
    document.forms[0].onsubmit = function() {
      return false;
    };

  };
  
  /*** initialize socket and its events ***/
  var initSocket = function() {
    
    socket = io.connect(system.io);
    
    socket.on('connect',function() {
      initSkatroom();
      
      // send user to room list
      socket.emit('send', { activeUser: userInfo.nickname, userStall: userInfo.stall });
      
      // send message that userInfo.nickname has entered bathroom stall
      system.message = userInfo.nickname + ' ' + copy.enteredTheRoom + ' ' + userInfo.stall;
      sendMessage(system.name, system.color, system.message);
    });

    socket.on('history', function(data) {
      console.log(data);
      data.forEach(function(message) {
        console.log(message);
        updateMessageWindow(message);
      });
    });
    
    socket.on('message',function(data) {
      if ( data.chat ) {
        updateMessageWindow(data.chat);
      }
      else if ( data.updateRoom ) {
        // get all users in array
        activeUsers = [];
        for (var key in data.updateRoom) {
           var obj = data.updateRoom[key];
           
           if ( activeUsers.indexOf(obj.nickname) == -1 ) {
             activeUsers.push(obj.nickname);
           }
        }
        
        // print active users list
        activeUsersList.innerHTML = '';
        for ( var i = 0; i < activeUsers.length; i++) {
          activeUsersList.innerHTML += '<li>' + activeUsers[i] + '</li>';
        }
      }
          
    });
    
    socket.on('disconnect',function() {
      textInput.style.display = 'none';
      window.open('/logoff','_self');
    });
  };
  
  
  /*** HELPERS ***/
  
  var updateMessageWindow = function(chatData) {
    banter.push(chatData);
    var banterHTML = '';
    
    if ( chatData.nick == system.name ) {
      banterHTML += '<li class="system"><span class="text">' + processMessage(chatData.text) + '</span></li>';
    }
    else {
      banterHTML += '<li><span class="nick" style="color:' +
          stripHTML(chatData.color) + '">' +
          stripHTML(chatData.nick) +
          ' (' + getTheTime(chatData.timestamp) + '):</span> <span class="text">' +
          processMessage(chatData.text) + '</span></li>';
    }
    messageContainer.innerHTML += banterHTML;
    messageContainer.scrollTop = messageContainer.scrollHeight;
  };
  
  var getCookies = function() {
    var cookies = {};
    var documentCookies = document.cookie;
    if (documentCookies === "")
      return cookies;
    var cookiesArray = documentCookies.split("; ");
    for(var i = 0; i < cookiesArray.length; i++) {
      var cookie = cookiesArray[i];
      var endOfName = cookie.indexOf("=");
      var name = cookie.substring(0, endOfName);
      var value = cookie.substring(endOfName + 1);
      value = decodeURIComponent(value);
      cookies[name] = value;
    }
    return cookies;
  };
  
  var sendMessage = function( nick, stall, messageText ) {
    var message = {
      nick: nick,
      stall: stall,
      text: messageText,
      timestamp: Date.now()
    };
    socket.emit('send', { chat: message });
  };
  
  var stripHTML = function(html) {
    if ( html ) {
      return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, '');
    } else {
      return false;
    }
  };
  
  var getTheTime = function(unix) {
    var date = new Date(unix);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var amOrPm = "am";
  
    if ( hours >= 12 ) {
      amOrPm = "pm";
      if ( hours != 12 ) {
        hours = hours - 12;
      }
    }
    if ( hours === 0 ) {
      hours = 12;
    }
    
    if ( minutes < 10 ) {
      minutes = '0' + minutes;
    }
    return hours + ':' + minutes + ' ' + amOrPm;
  };
  
  var processMessage = function(message) {
    
    // urls within text
    var regExURL = /(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/g;
    message = stripHTML(message);
    message = message.replace(regExURL, function(url) {
      return '<a href="' + url + '">' + url + '</a>';
    });
    
    // :emoji: within text - add emoji gif files in /public/assets/emoji
    var regExEmoji = /\:[a-zA-Z0-9\-\.]+\:?/g;
    
    message = message.replace(regExEmoji, function(emojiName) {
      return '<img class="emoji" src="/assets/emoji/' + emojiName.replace(/:/g, '') + '.gif" alt=":' + emojiName + '" + title="' + emojiName + '" />'; 
    });

    return message;
  };
  
  /*** INIT ***/
  
  var init = (function() {
  
    // check for skatroom cookies    
    var cookies = getCookies();
    
    // get stall name from url
    var stallName = window.location.search.replace('?','');
    
    if ( cookies.skatroom) {
      initSocket();
      userInfo = JSON.parse( cookies.skatroom );
    }
    else {
      // if no cookies, redirect to login
      document.location = '/login/?' + stallName;
    }

  }());
  
};