# simple-slack-verification
A simple express middleware for Slack signed secret authentication. See Slack's documentation [on signing verification](https://api.slack.com/docs/verifying-requests-from-slack). This package also exposes a function for signature verification `verifySignature` for use outside of express.

If the request did not come from your Slack the middleware does not pass the request forward. On unauthorized requests it returns status 403 and the `unauthorizedResponse` object (see below).

## Installation
```
npm i simple-slack-verification
yarn add simple-slack-verification
```

## Usage
Since the protocol uses the body when generating the signature it is important that the body of the request is not modified at all before running this middleware.

```js
// with no options
var express = require('express');
var slackVerification = require('simple-slack-verification');

// uses process.env.SLACK_SIGNING_SECRET
var app = express();
app.use( slackVerification() );
```

```js
// with options
var express = require('express');
var slackVerification = require('simple-slack-verification');

var app = express();
app.use(
  slackVerification({
    secret: "YOUR SLACK SECRET, PLEASE STORE SAFELY",
    unauthorizedResponse: {
      code: 'unauthorized',
      message: 'Unauthorized request'
    },
    status: 200,
    maxSecondsOld: 60
  })
);
```

### Options
Passed in as an object to the `slackVerification` function with the following fields. All of them are optional and if omitted defaults to what's documented below:
- `secret`: Your personal [Slack secret](https://api.slack.com/docs/verifying-requests-from-slack#signing_secrets_admin_page). You can either give it in this parameter or just set it as the environment variable `SLACK_SIGNING_SECRET`. If this option is given the environment variable is not used.
  - Default: `process.env.SLACK_SIGNING_SECRET`.
  - Type: `String`
- `unauthorizedResponse`: Sent in the response when unable to verify signature.
  - Default: `{ code: 'unauthorized', text: 'Unable to verify Slack request' }`
  - Type: Anything [`res.send()` allows](https://expressjs.com/en/api.html#res.send).
- `status`: The status code of the response when unable to verify signature.
  - Default: `403`
  - Type: `Number`
- `maxSecondsOld`: The max age of the message you allow, in seconds.
  - Default: `300`, as per Slacks recommendation from their documentation.
  - Type: `Number`

## Usage of `verifySignature` function
Note that this function does not verify the age of the timestamp.

```js
var slackVerification = require('simple-slack-verification');
var verifySignature = slackVerification.verifySignature;

// ...

if (verifySignature(secret, signature, timestamp, body)) {
  // valid request, do something with it
} else {
  // request did not come from your slack
}
```

### Parameters
Returns `true` if the signature is valid, `false` otherwise.
- `secret`: Your personal [Slack secret](https://api.slack.com/docs/verifying-requests-from-slack#signing_secrets_admin_page).
  - Type: `String`
- `signature`: The signature to verify.
  - Type: `String`
- `timestamp`: The given timestamp of the request.
  - Type: `String | Number`
- `body`: The body of the request, in express `req.body`.
  - Type: `Object`

## Security
Since this is a security-sensitive package here are some things done to increase security:
- A maximum age on requests to avoid replay attacks. This is a recommended step from Slacks documentation.
- Timing-safe comparisons of the signatures to avoid timing attacks. Also from Slacks documentation.
- See more from [Slack's documentation](https://api.slack.com/docs/verifying-requests-from-slack) on the security of the protocol.

If you want please review the code yourself and open an issue if you think something is questionable.
