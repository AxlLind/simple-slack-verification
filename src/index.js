var crypto = require('crypto');
var qs = require('qs');

var DEFAULT_RESPONSE = {
  code: 'unauthorized',
  response_type: 'ephemeral',
  text: 'Not an authorized Slack request.'
};

function noopMiddleware(_req, _res, next) {
  next();
}

function slackAuth(options) {
  options = options || {};
  if (options.disabled) {
    return noopMiddleware;
  }
  var secret = options.secret || process.env.SLACK_SIGNING_SECRET;
  var unauthorizedResponse = options.unauthorizedResponse || DEFAULT_RESPONSE;
  var maxSecondsOld = options.maxSecondsOld || 300;

  return function slackAuth(req, res, next) {
    var timestamp = req.headers['x-slack-request-timestamp'];
    var givenSignature = req.headers['x-slack-signature'];

    if (
      !timestamp ||
      !givenSignature ||
      Math.floor(new Date() / 1000) - timestamp > maxSecondsOld
    ) {
      return res.send(401).send(unauthorizedResponse);
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
      return res.send(401).send(unauthorizedResponse);
    }

    next();
  };
};

module.exports = slackAuth;
