Paypal Express Checkout (Forked and Maintained by Ryan Copley)
=======================
This NodeJS module is a library for working with the Paypal Express Checkout API.

I (RyanCopley @ GitHub) found this project and it does not seem to be maintained and it does not fully wrap the Paypal Express Checkout API. I plan on doing both of those tasks. Please feel free to fork and send pull requests :)

## Using PaypalExpress (RyanCopley Fork)

### Initialization (Going to add to npm later, sorry.)

    var PaypalExpress = require('./paypal-express').PaypalExpress;

    var paypal = new PaypalExpress(<API username>, <API password>, <API signature>);

### Switch to sandbox

    paypal.useSandbox(true);

### Set your stores name

    paypal.setBrandName("Paypal Express Store, Llc");

### Instant payment

    paypal.beginInstantPayment( < price > , < invoiceID > , {
        'RETURNURL': '',
        'CANCELURL': '',
        'PAYMENTREQUEST_0_AMT': 1, //Payment amount
        //More request parameters
    }, function (err, token, redirectUrl) {
        if (err) {
            console.error(err);
        }
        //Perhaps do something to save token to your DBMS for later... You need it to authorize the payment later
        res.redirect(redirectUrl); //Or whatever your system uses to redirect
    });
    
### On the "Return" page after they accept the order ... ("Final checkout") | Based on Express.JS Implementation

    exports.finish = function (req, res) {
        //Extract the values that PayPal returns as GET parameters.
        var token = req.query.token;
        var payerId = req.query.PayerID;
        
        //Fetch order details
        paypal.getExpressCheckoutDetails(token, function (err, payerId, invoiceNumber, response) {
            if (!err) {
                //Display the order to the customer one last time... then have an "Accept" button
            }
        });
    }

### The "Accept" button

    exports.finish = function (req, res) {
        paypal.doExpressCheckoutPayment(<price>, <token>, <payerId>, "IPN_URL", function (err, response) {
            console.log("Executing Paypal Order, the money will now be moved to your account");
            res.redirect("<Your Thank You page>"); //Redirect out
        });
    }


### IPN (Completing the order automatically)

    exports.ipn = function (req, res) {
        if (req.body.payment_status === 'Completed') {
            //Lookup invoice via req.body.invoice and complete the order.
            //I would include information in the IPN url that you can use to safeguard you against a guessing attack.
            //(i.e. something that you only share with PayPal that can identify the order)
        }
    }


[List of allowed parameters for paypal.beginInstantPayment](https://cms.paypal.com/uk/cgi-bin/?cmd=_render-content&content_ID=developer/e_howto_api_nvp_r_SetExpressCheckout)


