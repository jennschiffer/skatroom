window.onload = function() {
  
    var loginForm = document.forms[0];
    var loginAlert = document.getElementById('login-alert');
    
    /*** INIT LOGIN ***/
    
    var init = (function() {
        
        // login event
        loginForm.onsubmit = function() {

			var user = {
				nickname : loginForm.nickname.value,
				password : loginForm.password.value
			};
			var userRequest = 'nickname=' + user.nickname + '&password=' + user.password;
            
            if ( !user.nickname || !user.password ) {
                loginAlert.innerHTML = '<p>you must enter a username and password</p>';
                return false;
            }
    
        }

    }());
    
};