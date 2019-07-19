var crypto = require('crypto');
var qs = require('qs');

var DEFAULT_RESPONSE = {
  code: 'unauthorized',
  text: 'Unable to verify Slack request'
};

function verifySignature(secret, signature, timestamp, body) {
  if (signature.length !== 67) {
    return false;
  }
  var givenSignature = Buffer.from(signature);
  var computedSignature = Buffer.from('v0=' + crypto
    .createHmac('sha256', secret)
    .update('v0:' + timestamp + ':')
    .update(qs.stringify(body, { format: 'RFC1738' }))
    .digest('hex')
  );
  return crypto.timingSafeEqual(givenSignature, computedSignature);
}

function slackVerification(options) {
  var opts = options || {};
  var secret = opts.secret || process.env.SLACK_SIGNING_SECRET;
  var unauthorizedResponse = opts.unauthorizedResponse || DEFAULT_RESPONSE;
  var status = opts.status || 403;
  var maxSecondsOld = opts.maxSecondsOld || 300;
  if (!secret) {
    throw new Error("simple-slack-verification: No secret given.");
  }

  return function(req, res, next) {
    var timestamp = req.headers['x-slack-request-timestamp'];
    var signature = req.headers['x-slack-signature'];
    // missing headers
    if (!timestamp || !signature) {
      return res.status(status).send(unauthorizedResponse);
    }
    // old timestamp
    if (Math.floor(new Date() / 1000) - timestamp > maxSecondsOld) {
      return res.status(status).send(unauthorizedResponse);
    }
    // invalid signature
    if (!verifySignature(secret, signature, timestamp, req.body)) {
      return res.status(status).send(unauthorizedResponse);
    }
    next();
  };
};

module.exports = slackVerification;
module.exports.verifySignature = verifySignature;
