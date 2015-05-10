'use strict';

angular.module('mean.users').factory('MeanUser', [ '$rootScope', '$http', '$location', '$stateParams',
  function($rootScope, $http, $location, $stateParams) {

    function escape(html) {
      return String(html)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function b64_to_utf8( str ) {
      return decodeURIComponent(escape(window.atob( str )));
    }

    /*function url_base64_decode(str) {
      var output = str.replace('-', '+').replace('_', '/');
      switch (output.length % 4) {
      case 0:
      break;
      case 2:
      output += '==';
      break;
      case 3:
      output += '=';
      break;
      default:
      throw 'Illegal base64url string!';
      }
      return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
    }*/

    function MeanUserKlass(){
      this.name = 'users';
      this.user = {};
      this.registerForm = false;
      this.loggedin = false;
      this.isAdmin = false;
      this.loginError = 0;
      this.usernameError = null;
      this.registerError = null;
      this.resetpassworderror = null;
      this.validationError = null;
      $http.get('/api/users/me').success(this.onIdentity.bind(this));
    }

    MeanUserKlass.prototype.onIdentity = function(response) {
      this.loginError = 0;
      this.loggedin = true;
      this.registerError = 0;
      if (response === null) {
        this.user = {};
        this.loggedin = false;
        this.isAdmin = false;
      } else if(angular.isDefined(response.token)) {
        localStorage.setItem('JWT', response.token);
        var encodedProfile = decodeURI(b64_to_utf8(response.token.split('.')[1]));
        var payload = JSON.parse(encodedProfile);
        this.user = payload;
        var destination = payload.redirect;
        if (this.user.roles.indexOf('admin') !== -1) this.isAdmin = true;
        $rootScope.$emit('loggedin');
        if (destination) {
            $location.path(destination);
        } else {
            $location.url('/');
        }
      } else {
        this.user = response;
        this.loggedin = true;
        if (this.user.roles.indexOf('admin') !== -1) this.isAdmin = true;
        $rootScope.$emit('loggedin');
      }
    };

    MeanUserKlass.prototype.onIdFail = function (response) {
      $location.path(response.redirect);
      this.loginError = 'Authentication failed.';
      this.registerError = response.msg;
      this.validationError = response.msg;
      this.resetpassworderror = response.msg;
      $rootScope.$emit('loginfail');
    };

    var MeanUser = new MeanUserKlass();

    MeanUserKlass.prototype.login = function (user) {
      // this is an ugly hack due to mean-admin needs
      var destination = $location.path().indexOf('/login') === -1 ? $location.absUrl() : false;
      $http.post('/api/login', {
          email: user.email,
          password: user.password,
          redirect: destination
        })
        .success(function() {
		      window.location.reload();
	      })
        .error(this.onIdFail.bind(this));
    };

    MeanUserKlass.prototype.register = function(user) {
      $http.post('/api/register', {
        email: user.email,
        password: user.password,
        confirmPassword: user.confirmPassword,
        username: user.username,
        name: user.name
      })
        .success(function() {
		      window.location.reload();
	      })
        .error(this.onIdFail.bind(this));
    };

    MeanUserKlass.prototype.resetpassword = function(user) {
        $http.post('/api/reset/' + $stateParams.tokenId, {
          password: user.password,
          confirmPassword: user.confirmPassword
        })
          .success(function() {
		        window.location.reload();
	        })
          .error(this.onIdFail.bind(this));
      };

    MeanUserKlass.prototype.forgotpassword = function(user) {
        $http.post('/api/forgot-password', {
          text: user.email
        })
          .success(function() {
		        window.location.reload();
	        })
          .error(this.onIdFail.bind(this));
      };

    MeanUserKlass.prototype.logout = function(){
      this.user = {};
      this.loggedin = false;
      this.isAdmin = false;
      localStorage.removeItem('JWT');
      $rootScope.$emit('logout');
      $http.get('/api/logout');
    };


    return MeanUser;
  }
]);
