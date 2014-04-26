var NVPRequest = require('./nvprequest');
var url = require('url');
var qs = require('querystring');

var SANDBOX_URL = 'www.sandbox.paypal.com';
var REGULAR_URL = 'www.paypal.com';


var PaypalExpress = function (user, pass, sig) {
    this.nvpreq = new NVPRequest(user, pass, sig);
    this.sandbox = false;
    this.instantPaymentOnly = true;
};


//Use paypal sandbox
PaypalExpress.prototype.useSandbox = function (bool) {
    this.nvpreq.useSandbox(bool);
    this.sandbox = (bool === true);
};


PaypalExpress.prototype.setInstantPayOnly = function (bool) {
    this.instantPaymentOnly = (bool === true);
};


//Begin the paypal express checkout process for instant payments
//Returns the timestamp, token, and payment url
PaypalExpress.prototype.beginInstantPayment = function (options, callback) {
    //Set required request parameters
    options['METHOD'] = 'SetExpressCheckout';

    if (this.instantPaymentOnly === true) {
        options['PAYMENTREQUEST_0_ALLOWEDPAYMENTMETHOD'] = 'InstantPaymentOnly';
    }

    var self = this;

    this.nvpreq.makeRequest(options, function (err, data) {
        if (err) {
            //Request failed
            callback(err);
        }

        var response = qs.parse(data.toString());

        if (response.ACK === 'Success') {
            //Return the time, token, and payment url
            callback(null, {
                time: response.TIMESTAMP,
                token: response.TOKEN,
                payment_url: self.buildCheckoutUrl(response.TOKEN)
            });
        } else if (response.ACK === 'Failure') {
            //Request failed on Paypal end, return the error message given
            callback(response.L_LONGMESSAGE0);
        }
    });
};

PaypalExpress.prototype.buildCheckoutUrl = function (token, useraction) {
    var data = {
        protocol: 'https:',
        host: (this.sandbox) ? SANDBOX_URL : REGULAR_URL,
        pathname: '/cgi-bin/webscr',
        query: {
            cmd: '_express-checkout',
            token: token
        }
    };

    if (typeof useraction !== 'undefined') {
        data.query['useraction'] = useraction;
    }

    return url.format(data);
}

PaypalExpress.prototype.getCheckoutDetails = function (token, callback) {
    if (typeof token !== 'undefined' && token !== '') {
        //Set required request parameters
        options['METHOD'] = 'GetExpressCheckoutDetails';
        options['TOKEN'] = token;

        var self = this;

        this.nvpreq.makeRequest(options, function (err, data) {
            if (err) {
                //Request failed
                callback(err);
            }

            var response = qs.parse(data.toString());

            if (response.ACK === 'Success') {
                callback(null, response);
            } else if (response.ACK === 'Failure') {
                //Request failed on Paypal end, return the error message given
                callback(response.L_LONGMESSAGE0);
            }
        });
    } else {
        callback("Token is invalid.");
    }
};



module.exports = PaypalExpress;