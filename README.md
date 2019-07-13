# simple-slack-verification
A simple express middleware for Slack signed secret authentication. See Slack's documentation [here](https://api.slack.com/docs/verifying-requests-from-slack).

If the request did not come from your Slack the middleware does not pass the request forward. It returns with status 401 and sends the `unauthorizedResponse` object (see below).

## Installation
```
npm i simple-slack-verification
yarn add simple-slack-verification
```

## Usage
```js
var express = require('express');
var slackVerification = require('simple-slack-verification');

// with no options given
var app = express();
app.use( slackVerification() );
```

```js
var express = require('express');
var slackVerification = require('simple-slack-verification');

// with options
var options = {
  secret: "SLACK SECRET, PLEASE STORE SAFELY",
  unauthorizedResponse: { code: 'unauthorized', message: 'Custom message' },
  maxSecondsOld: 60,
  disabled: process.env.DEVELOPMENT === 'true'
}
var app = express();
app.use( slackVerification(options) );
```

### Options
Passed in as an object to the `slackVerification` function with the following fields. All of them are optional and if omitted defaults to what's documented below:
- `secret`: Your personal [Slack secret](https://api.slack.com/docs/verifying-requests-from-slack#signing_secrets_admin_page).
  - Default: `process.env.SLACK_SIGNING_SECRET`.
- `unauthorizedResponse`: Whatever is sent to the user when unable to verify signing.
  - Default: `{ code: 'unauthorized', response_type: 'ephemeral', text: 'Not an authorized Slack request.' }`
- `maxSecondsOld`: The max age of the message you allow, in seconds.
  - Default: `300`, as per Slacks recommendation from the documentation.
- `disabled`: **WARNING** If truthy value it completely disables the middleware. Useful for development but please be careful with this flag. Never set to true in production.
  - Default: `false`
