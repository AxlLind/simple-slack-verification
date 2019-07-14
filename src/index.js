var crypto = require('crypto');
var qs = require('qs');

function slackAuth(options) {
  var opts = options || {};
  if (opts.disabled) {
    return function(req, res, next) { next(); };
  }

  var maxSecondsOld = opts.maxSecondsOld || 300;
  var unauthorizedResponse = opts.unauthorizedResponse;
  var secret = opts.secret || process.env.SLACK_SIGNING_SECRET;
  if (!secret) {
    throw new Error("simple-slack-verification: No secret given.");
  }
  var response = unauthorizedResponse
    ? function(res) { res.status(403).send(unauthorizedResponse); }
    : function(res) { res.sendStatus(403); }

  return function(req, res, next) {
    var timestamp = req.headers['x-slack-request-timestamp'];
    var givenSignature = req.headers['x-slack-signature'];

    if (
      !timestamp ||
      !givenSignature ||
      Math.floor(new Date() / 1000) - timestamp > maxSecondsOld
    ) {
      return response(res);
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
      return response(res);
    }

    next();
  };
};

module.exports = slackAuth;
