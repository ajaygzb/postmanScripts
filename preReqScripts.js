// These are pre-req scripts that run before the request is executed.
// These are handy for generating values to pass to the request, or to verify against
// These can be added per method, or at the folder or collection level (sort of as a beforeEach)


// Creates a text string that is 15 characters long, starting with a capital letter
function garbageName() {
    var uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var lowercase = "abcdefghijklmnopqrstuvwxyz";
    var returnStr = "";
    var firstLetter = uppercase.charAt(Math.floor(Math.random() * uppercase.length));

    for (var i = 0; i < 14; i++) {
        returnStr += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    }
    return firstLetter + returnStr;
}

pm.variables.set("randomName", garbageName());
console.log("E2E Step 1 POST Valid User Fake Name Value: " + pm.variables.get("randomName"));


// Generates a random Int between 10000-25000
function generateValue() {
    var min = Math.ceil(10000);
    var max = Math.floor(25000);

    return String((Math.random() * (max - min) + min).toFixed(0));
}

pm.variables.set("randomInt", generateValue());
console.log("E2E Step 1 POST Valid User Email Random Int Value: " + pm.variables.get("randomInt"));


// The below sends a POST to ensure that at least ONE allocation exists.
// It then passes the allocation ID to the GET request.
pm.sendRequest({
    url: pm.environment.get("api_host") + '/api/v2/fundAllocations',
    method: 'POST',
    header: [
        'Content-Type:application/vnd.api+json',
        'Accept:application/vnd.api+json',
        'Authorization:' + pm.environment.get("company_api_key")
    ],
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            "data": {
                "type": "fundAllocations",
                "attributes": {
                    "amount": "5.00",
                    "noteToRecipient": "UI Note to Recipient",
                    "noteToSelf": "UI Note to Self",
                    "email": "nelson.gill@chimp.net",
                    "suppressEmail": true
                }
            }
        })
    }
}, function (err, res) {
    if (res.json().error) {
        console.log("### ALERT! There was a problem with the Pre-request. Check console for details.");
    } else {
        pm.environment.set("fundAllocationId", res.json().data.id);
    }
});


// The below sends a GET request as part of the Pre-req:
pm.sendRequest({
    url: 'https://postman-echo.com/get',
    method: 'GET',
    header: [
        'Content-Type:application/vnd.api+json',
        'Accept:application/vnd.api+json'
    ],
}, function (err, res) {
    if (res.json().error) {
        console.log("### ALERT! There was a problem with the Pre-request. Check console for details.");
    } else {
        // Sets an environment variable of getReturnedId based on the response:
        pm.environment.set("getReturnedId", res.json().data.id);
    }
});


// The below sends a POST to stripe and stores the response in a variable called stripe_token
// The {{stripe_pub_key}} is stored in an environment variable, as well as the {{stripe_token}}
const expYear = (new Date()).getFullYear() + 2;
pm.sendRequest({
    url: 'https://api.stripe.com/v1/tokens',
    method: 'POST',
    header: [
        'Authorization: Bearer ' + pm.environment.get("stripe_pub_key"),
        'Content-Type: application/x-www-form-urlencoded'
    ],
    body: {
        mode: 'urlencoded',
        urlencoded: [
            {key: "card[number]", value: "4242424242424242", disabled: false},
            {key: "card[exp_month]", value: "12", disabled: false},
            {key: "card[exp_year]", value: expYear, disabled: false},
            {key: "card[cvc]", value: "123", disabled: false}
        ]
    }
}, function (err, res) {
    if (res.json().error) {
        console.log("### ALERT! There was a problem getting the stripe token. Check console for details.");
    } else {
        pm.variables.set("stripe_token", res.json().id);
        console.log("Token returned: " + pm.variables.get("stripe_token"));
    }
});


// The below sends a POST request to get a login token for the user
// The account needs to have been logged into at least once or else it will fail (to create user link in separated DBs)

const username = pm.envrionment.get("username");
const password = pm.envrionment.get("auth_password");
const client_id = pm.environment.get("client_id");
const client_secret = pm.environment.get("client_secret");

pm.sendRequest({
    url: pm.environment.get("auth0_url") + '/oauth/token',
    method: 'POST',
    header: [
        'Accept:application/json',
        'Content-Type:application/x-www-form-urlencoded',
    ],
    body: {
        mode: 'urlencoded',
        urlencoded: [
            {key: "username", value: username, disabled: false},
            {key: "password", value: password, disabled: false},
            {key: "client_id", value: client_id, disabled: false},
            {key: "client_secret", value: client_secret, disabled: false},
            {key: "grant_type", value: "password", disabled: false}
        ]
    }
}, function (err, res) {
    if (res.json().error) {
        console.log("### ALERT! There was a problem with the Pre-request. Check console for details.");
    } else {
        pm.environment.set("auth_token", res.json().id_token);
    }
});

// The below code logs a user in via a Pre-Request. It has to be used in conjuction with the Auth0 Token generation above.
pm.sendRequest({
    url: pm.environment.get("api_host") + '/api/v2/users/login',
    method: 'POST',
    header: [
        'Content-Type:application/vnd.api+json',
        'Authorization: Bearer ' + pm.environment.get("auth_token")
    ],
}, function (err, res) {
    if (res.json().error) {
        console.log("### ALERT! There was a problem with the Pre-request. Check console for details.");
    }
});
