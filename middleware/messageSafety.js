const MAX_MESSAGE_LENGTH = 1000;

const safetyRules = [
  {
    category: "threatening content",
    pattern: /\b(?:i(?:'m| am)? going to|i will)\s+(?:kill|hurt|harm|attack)\s+(?:you|him|her|them)\b/i
  },
  {
    category: "self-harm encouragement",
    pattern: /\b(?:kill|hurt|harm)\s+yourself\b/i
  },
  {
    category: "suspicious payment request",
    pattern: /\b(?:send|share|give)\s+(?:me\s+)?(?:your\s+)?(?:password|otp|one[- ]time password|verification code|bank details|card details)\b/i
  },
  {
    category: "suspicious link",
    pattern: /(?:javascript:|data:text\/html)/i
  }
];

function checkMessageSafety(message) {
  if (typeof message !== "string") {
    return { allowed: false, reason: "Messages must be plain text." };
  }

  const text = message.trim();

  if (!text) {
    return { allowed: false, reason: "Messages cannot be empty." };
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      reason: `Messages cannot exceed ${MAX_MESSAGE_LENGTH} characters.`
    };
  }

  const matchedRule = safetyRules.find((rule) => rule.pattern.test(text));

  if (matchedRule) {
    return {
      allowed: false,
      reason: `Message blocked by the safety layer: ${matchedRule.category}.`
    };
  }

  return { allowed: true, message: text };
}

module.exports = { checkMessageSafety, MAX_MESSAGE_LENGTH };
