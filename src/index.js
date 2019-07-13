const crypto = require("crypto");
const qs = require("qs");

const DEFAULT_RESPONSE = {
  code: "unauthorized",
  response_type: "ephemeral",
  text: "Not an authorized Slack request."
};

const noopMiddleware = (_req, _res, next) => next();

const slackAuth = ({
  secret = process.env.SLACK_SIGNING_SECRET,
  unauthorizedResponse = DEFAULT_RESPONSE,
  maxSecondsOld = 300,
  disabled
}) => {
  if (disabled) {
    return noopMiddleware;
  }
  return (req, res, next) => {
    const timestamp = req.headers["x-slack-request-timestamp"];
    const givenSignature = req.headers["x-slack-signature"];

    if (
      !timestamp ||
      !givenSignature ||
      Math.floor(new Date() / 1000) - timestamp > maxSecondsOld
    ) {
      return res.send(401).send(unauthorizedResponse);
    }

    const rawBody = qs.stringify(req.body, { format: "RFC1738" });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`v0:${timestamp}:${rawBody}`)
      .digest("hex");
    if (
      !crypto.timingSafeEqual(
        Buffer.from(`v0=${signature}`, "utf8"),
        Buffer.from(givenSignature, "utf8")
      )
    ) {
      return res.send(401).send(unauthorizedResponse);
    }
    next();
  };
};

module.exports = slackAuth;
