var https = require('https');
var qs = require('querystring');


var SANDBOX_API = 'api-3t.sandbox.paypal.com';
var REGULAR_API = 'api-3t.paypal.com';
var API_VERSION = '72.0';


var NVPRequest = function (user, pass, sig) {
  this.username = user;
  this.password = pass;
  this.signature = sig;

  this.sandbox = false;
};


//Use paypal sandbox api
NVPRequest.prototype.useSandbox = function(bool) {
  this.sandbox = (bool === true);
};


//Make an NVP request
NVPRequest.prototype.makeRequest = function(options, callback) {
  options['USER'] = this.username;
  options['PWD'] = this.password;
  options['SIGNATURE'] = this.signature;
  options['VERSION'] = API_VERSION;

  var req_options = {
    host: (this.sandbox) ? SANDBOX_API : REGULAR_API,
    path: '/nvp?' + qs.stringify(options),
    method: 'GET'
  }

  var req = https.get(req_options, function(res) {
    var data = '';

    res.on('data', function(d) {
      data = data + d;
    });

    res.on('end', function() {
      callback(null, data);
    });
  });
  
  req.on('error', function(e) {
    callback(e);
  });
};

module.exports = NVPRequest;
