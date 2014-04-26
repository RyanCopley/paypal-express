/*
 * Everything should follow this API:
 * https://developer.paypal.com/docs/classic/express-checkout/integration-guide/ECImmediatePayment/#id0983E0GJ07Q__id099PB4000Y4
 * The process for what to do can be found by this handy graph / flow chart
 * https://www.paypalobjects.com/webstatic/en_US/developer/docs/ec/RecurringPaymentsFlowUX.gif
 * Optionally, it can also be found in the Documents folder of this repository.
 */


var NVPRequest = require('./nvprequest');
var url = require('url');
var qs = require('querystring');

var SANDBOX_URL = 'www.sandbox.paypal.com';
var REGULAR_URL = 'www.paypal.com';

/*
 * Not yet documented
 */

var PaypalExpress = function (user, pass, sig) {
    this.nvpreq = new NVPRequest(user, pass, sig);
    this.sandbox = false;
    this.instantPaymentOnly = true;
};

/*
 * Set to true if you want to be in sandbox mode.
 * Default: false
 */

PaypalExpress.prototype.useSandbox = function (bool) {
    this.nvpreq.useSandbox(bool);
    this.sandbox = (bool === true);
};

/*
 * Set to false if you want to allow funding sources that are not instant.
 * Default: true
 */

PaypalExpress.prototype.setInstantPayOnly = function (bool) {
    this.instantPaymentOnly = (bool === true);
};

/*
 * Begin the paypal express checkout process for instant payments
 * Returns the timestamp, token, and payment url
 * Needs to fully wrap:
 * https://developer.paypal.com/webapps/developer/docs/classic/api/merchant/SetExpressCheckout_API_Operation_NVP/
 */

PaypalExpress.prototype.beginInstantPayment = function (options, callback) {
    //Set required request parameters
    options['METHOD'] = 'SetExpressCheckout';

    if (this.instantPaymentOnly === true) {
        options['PAYMENTREQUEST_0_ALLOWEDPAYMENTMETHOD'] = 'InstantPaymentOnly';
    }else{
        options['PAYMENTREQUEST_0_ALLOWEDPAYMENTMETHOD'] = 'Any';
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
                // // TODO: response.TIMESTAMP seems deprecated (Completely undocumented) ? ? ?
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

/*
 * Not yet documented
 */

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

/*
 * Needs to fully wrap:
 * https://developer.paypal.com/webapps/developer/docs/classic/api/merchant/GetExpressCheckoutDetails_API_Operation_NVP/
 */

PaypalExpress.prototype.getExpressCheckoutDetails = function (token, callback) {
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
                //TODO: I need to analyse this response eventually...
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

/*
 * Needs to fully wrap:
 * https://developer.paypal.com/webapps/developer/docs/classic/api/merchant/DoExpressCheckoutPayment_API_Operation_NVP/
 */

PaypalExpress.prototype.doExpressCheckoutPayment = function (token, callback) {
    if (typeof token !== 'undefined' && token !== '') {
        //Set required request parameters
        options['METHOD'] = 'DoExpressCheckoutPayment';
        options['TOKEN'] = token;

        var self = this;

        this.nvpreq.makeRequest(options, function (err, data) {
            if (err) {
                //Request failed
                callback(err);
            }

            var response = qs.parse(data.toString());

            if (response.ACK === 'Success') {
                //TODO: I need to analyse this response eventually...
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

/*
 * Needs to fully wrap:
 * https://developer.paypal.com/webapps/developer/docs/classic/api/merchant/CreateRecurringPaymentsProfile_API_Operation_NVP/
 */

PaypalExpress.prototype.createRecurringPaymentsProfile = function (token, callback) {
    if (typeof token !== 'undefined' && token !== '') {
        //Set required request parameters
        options['METHOD'] = 'CreateRecurringPaymentsProfile';
        options['TOKEN'] = token;

        var self = this;

        this.nvpreq.makeRequest(options, function (err, data) {
            if (err) {
                //Request failed
                callback(err);
            }

            var response = qs.parse(data.toString());

            if (response.ACK === 'Success') {
                //TODO: I need to analyse this response eventually...
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