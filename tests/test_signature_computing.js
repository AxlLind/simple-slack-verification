var slackVerification = require('../src');
var verifySignature = slackVerification.verifySignature;

// Simple test to verify that signature computing works

var secret = '11111111111111111111111111111111';
var signature = 'v0=417a3e79cbe924f18ed4d0fd108449df28ed7a7f5191dc278ace4a8d4d939140';
var timestamp = '1234567890';
var body = {
  text: "test",
  param: "hello",
};

if (!verifySignature(secret, signature, timestamp, body)) {
  console.log("Test failed!");
  process.exit(1);
}

console.log("Test passed");
