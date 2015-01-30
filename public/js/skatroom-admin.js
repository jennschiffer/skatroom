window.onload = function() {
  
  var loginForm = document.forms[0];
  var loginAlert = document.getElementById('login-alert');
  
  /*** INIT LOGIN ***/
  
  var init = (function() {
    
    // login event
    loginForm.onsubmit = function() {

			var user = {
				nickname : loginForm.nickname.value,
				stall : loginForm.stall.value
			};
			var userRequest = 'nickname=' + user.nickname + '&stall=' + user.stall;
      
      if ( !user.nickname ) {
        loginAlert.innerHTML = '<p>you must enter a nickname</p>';
        return false;
      }
  
    }

  }());
  
};