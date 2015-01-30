window.onload = function() {
    
    var userInfo,
        muteSwitch,
        messageContainer,
        activeUsers,
        textInput,
        socket,
        banter;
        
    var copy = {
        enteredTheRoom: 'has entered the room',
        disconnected: 'You have been disconnected.',
        mute: 'mute',
        unmute: 'unmute'
    };
    
    var status = {
        mute: false
    };
        
    var loginForm = document.forms[0];
    var favicon = document.getElementsByTagName('link')[1];
    var alertSound = new Audio('/assets/alert.wav');

    /*** INIT SOCKETS AND CHAT ***/

    var initjsChat = function() {
        
        /*** jsChatroom and its events ***/
        document.getElementById('jsChat').style.display = 'block';
        messageContainer = document.getElementById('jsChat-messages');
        activeUsersList = document.getElementById('active-users');
        muteSwitch = document.getElementById('mute-switch');
        textInput = document.forms[0].message;
        banter = [];
        activeUsers = [];

        // add keyup event                    
        textInput.onkeyup = function(e){
            var key = e.keyCode;
            if ( key != '13' ) {
                return;
            }
            else {
                sendMessage( userInfo.nickname, userInfo.color, this.value );
                this.value = "";
            }
        };
        
        // submit form event
        document.forms[0].onsubmit = function() {
            return false;
        };
        
        // mute event
        muteSwitch.onclick = function(e) {
            e.preventDefault();
            if ( this.innerHTML == copy.mute ) {
                this.innerHTML = copy.unmute;
                status.mute = true;
            }
            else {
                this.innerHTML = copy.mute;
                status.mute = false;
            }
        };


    };
    
    /*** initialize socket and its events ***/
    var initSocket = function() {
        
        socket = io.connect(system.io);
        
        socket.on('connect',function() {
            initjsChat();
            
            // send user to room list
            socket.emit('send', { activeUser: userInfo.nickname });
            
            // send message that userInfo.nickname has entered room
            system.message = userInfo.nickname + ' ' + copy.enteredTheRoom;
            sendMessage(system.name, system.color, system.message);
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
                    
            if ( status.blur ) {
                favicon.href = "/assets/alert.ico";
                if ( !status.mute ) {
                    alertSound.play();
                }
            }
        });
        
        socket.on('disconnect',function() {
            document.forms[0].getElementsByTagName('label')[0].innerHTML = copy.disconnected;
            textInput.style.display = 'none';
        });
    };
    
    /*** alerts ***/
    
    document.onblur = function() {
        status.blur = true;
    };

    document.onfocus = function() {
        status.blur = false;
        favicon.href = "/assets/jschat.ico";
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
    
    var sendMessage = function( nick, color, messageText ) {
        var message = {
            nick: nick,
            color: color,
            text: messageText,
            timestamp: Date.now()
        };
        socket.emit('send', { chat: message });
    };
    
    var stripHTML = function(html) {
        return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi, '');
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
        
        return message;
    };
    
    /*** INIT ***/
    
    var init = (function() {
    
        // check for jschat cookies        
        var cookies = getCookies();
        
        if ( cookies.jschat) {
            initSocket();
            userInfo = JSON.parse( cookies.jschat );
        }
        else {
            // if no cookies, redirect to login
            document.location = '/login';
        }

    }());
    
};