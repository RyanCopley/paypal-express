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
    this.brandName = "Please set your brand name using .setBrandName(...)";
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
 * Set to false if you want to allow funding sources that are not instant.
 * Default: true
 */

PaypalExpress.prototype.setBrandName = function (name) {
    this.brandName = name;
};

/*
 * Begin the paypal express checkout process for instant payments
 * Returns the timestamp, token, and payment url
 * Needs to fully wrap:
 * https://developer.paypal.com/webapps/developer/docs/classic/api/merchant/SetExpressCheckout_API_Operation_NVP/
 */

PaypalExpress.prototype.beginInstantPayment = function (price, invoiceNumber, options, callback) {
    //Set required request parameters
    options['METHOD'] = 'SetExpressCheckout';
    options['PAYMENTREQUEST_0_INVNUM'] = invoiceNumber;
    options['PAYMENTREQUEST_0_AMT'] = price; //Payment amount
    options['PAYMENTREQUEST_0_ITEMAMT'] = price;
    options['PAYMENTREQUEST_0_CURRENCYCODE'] = "USD";
    options['BRANDNAME'] =  this.brandName;
    
    //Required for IPN
    options['MAXAMT'] = price; //Max Payment amount
    
    if (this.instantPaymentOnly === true) {
        options['PAYMENTREQUEST_0_ALLOWEDPAYMENTMETHOD'] = 'InstantPaymentOnly';
    }else{
        options['PAYMENTREQUEST_0_ALLOWEDPAYMENTMETHOD'] = 'Any';
    }
    
    //These are all "Digital Good" required parameters...
    options['PAYMENTREQUEST_0_PAYMENTACTION'] = "Sale";
    options['NOSHIPPING'] = 1; // This needs refactored
    options['REQCONFIRMSHIPPING'] = 0; // This needs refactored
    options['L_PAYMENTREQUEST_0_ITEMCATEGORY0'] = "Digital";
    
    options['L_PAYMENTREQUEST_0_NAME0'] = "Ampache Subscription";
    options['L_PAYMENTREQUEST_0_AMT0'] = price;
    options['L_PAYMENTREQUEST_0_NUMBER0'] = 0;
    options['L_PAYMENTREQUEST_0_QTY0'] = 1;

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
        var options = {};
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
                callback(null, response.PAYERID, response.INVNUM, response);
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

/*
{
    TOKEN: 'EC-1DB58058DD7922313',
    SUCCESSPAGEREDIRECTREQUESTED: 'false',
    TIMESTAMP: '2014-04-26T22:22:41Z',
    CORRELATIONID: '64c65739650b',
    ACK: 'Success',
    VERSION: '98.0',
    BUILD: '10775543',
    INSURANCEOPTIONSELECTED: 'false',
    SHIPPINGOPTIONISDEFAULT: 'false',
    PAYMENTINFO_0_TRANSACTIONID: '83A228961H409954P',
    PAYMENTINFO_0_TRANSACTIONTYPE: 'cart',
    PAYMENTINFO_0_PAYMENTTYPE: 'instant',
    PAYMENTINFO_0_ORDERTIME: '2014-04-26T22:22:41Z',
    PAYMENTINFO_0_AMT: '9.99',
    PAYMENTINFO_0_FEEAMT: '0.59',
    PAYMENTINFO_0_TAXAMT: '0.00',
    PAYMENTINFO_0_CURRENCYCODE: 'USD',
    PAYMENTINFO_0_PAYMENTSTATUS: 'Completed',
    PAYMENTINFO_0_PENDINGREASON: 'None',
    PAYMENTINFO_0_REASONCODE: 'None',
    PAYMENTINFO_0_PROTECTIONELIGIBILITY: 'Ineligible',
    PAYMENTINFO_0_PROTECTIONELIGIBILITYTYPE: 'None',
    PAYMENTINFO_0_SECUREMERCHANTACCOUNTID: 'PZKG7M8Y2AP5W',
    PAYMENTINFO_0_ERRORCODE: '0',
    PAYMENTINFO_0_ACK: 'Success'
}
 
*/
PaypalExpress.prototype.doExpressCheckoutPayment = function (price, token, payerId, ipnURL, callback) {

    if (typeof token !== 'undefined' && token !== '') {
        var options = {};
        //Set required request parameters
        options['METHOD'] = 'DoExpressCheckoutPayment';
        options['TOKEN'] = token;
        options['PAYERID'] = payerId;
        
        
        options['PAYMENTREQUEST_0_AMT'] = price;
        options['PAYMENTREQUEST_0_ITEMAMT'] = price;
        options['PAYMENTREQUEST_0_PAYMENTACTION'] = "Sale";
        options['PAYMENTREQUEST_0_NOTIFYURL'] = ipnURL;
        options['PAYMENTREQUEST_0_CURRENCYCODE'] = "USD";
        
        
        options['L_PAYMENTREQUEST_0_NAME0'] = "Ampache Subscription";
        options['L_PAYMENTREQUEST_0_AMT0'] = price;
        options['L_PAYMENTREQUEST_0_NUMBER0'] = 0;
        options['L_PAYMENTREQUEST_0_QTY0'] = 1;
        
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
                callback(response);
            }else{
                callback(response);
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
        var options = {};
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