var crypto = require('crypto');
var qs = require('qs');

function slackVerification(options) {
  var opts = options || {};
  var maxSecondsOld = opts.maxSecondsOld || 300;
  var unauthorizedResponse = opts.unauthorizedResponse || {
    code: 'unauthorized',
    text: 'Unable to verify Slack request'
  };
  var secret = opts.secret || process.env.SLACK_SIGNING_SECRET;
  if (!secret) {
    throw new Error("simple-slack-verification: No secret given.");
  }

  return function(req, res, next) {
    var timestamp = req.headers['x-slack-request-timestamp'];
    var slackSignature = req.headers['x-slack-signature'];
    if (
      !timestamp ||
      !slackSignature ||
      slackSignature.length !== 67 ||
      Math.floor(new Date() / 1000) - timestamp > maxSecondsOld
    ) {
      return res.status(403).send(unauthorizedResponse);
    }

    var givenSignature = Buffer.from(slackSignature);
    var rawBody = qs.stringify(req.body, { format: 'RFC1738' });
    var signature = Buffer.from('v0=' + crypto
      .createHmac('sha256', secret)
      .update('v0:' + timestamp + ':' + rawBody)
      .digest('hex')
    );
    if (!crypto.timingSafeEqual(signature, givenSignature)) {
      return res.status(403).send(unauthorizedResponse);
    }

    next();
  };
};

module.exports = slackVerification;
