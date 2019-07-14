var crypto = require('crypto');
var qs = require('qs');

var DEFAULT_RESPONSE = {
  code: 'unauthorized',
  text: 'Unable to verify Slack request'
};

function slackVerification(options) {
  var opts = options || {};
  if (opts.disabled) {
    return function(_req, _res, next) { next(); };
  }

  var maxSecondsOld = opts.maxSecondsOld || 300;
  var unauthorizedResponse = opts.unauthorizedResponse || DEFAULT_RESPONSE;
  var secret = opts.secret || process.env.SLACK_SIGNING_SECRET;
  if (!secret) {
    throw new Error("simple-slack-verification: No secret given.");
  }

  return function(req, res, next) {
    var timestamp = req.headers['x-slack-request-timestamp'];
    var givenSignature = req.headers['x-slack-signature'];

    if (
      !timestamp ||
      !givenSignature ||
      Math.floor(new Date() / 1000) - timestamp > maxSecondsOld
    ) {
      return res.status(403).send(unauthorizedResponse);
    }

    var rawBody = qs.stringify(req.body, { format: 'RFC1738' });
    var signature = crypto
      .createHmac('sha256', secret)
      .update('v0:' + timestamp + ':' + rawBody)
      .digest('hex');
    if (
      !crypto.timingSafeEqual(
        Buffer.from('v0=' + signature, 'utf8'),
        Buffer.from(givenSignature, 'utf8')
      )
    ) {
      return res.status(403).send(unauthorizedResponse);
    }

    next();
  };
};

module.exports = slackVerification;
