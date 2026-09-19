const test = require("node:test");
const assert = require("node:assert/strict");
const { checkMessageSafety, MAX_MESSAGE_LENGTH } = require("../middleware/messageSafety");

test("allows a normal chat message", () => {
  const result = checkMessageSafety("Hello, everyone!");
  assert.equal(result.allowed, true);
  assert.equal(result.message, "Hello, everyone!");
});

test("blocks threatening messages", () => {
  const result = checkMessageSafety("I will hurt you");
  assert.equal(result.allowed, false);
  assert.match(result.reason, /threatening content/);
});

test("blocks suspicious credential requests", () => {
  const result = checkMessageSafety("Please send your OTP now");
  assert.equal(result.allowed, false);
  assert.match(result.reason, /suspicious payment request/);
});

test("blocks oversized messages", () => {
  const result = checkMessageSafety("a".repeat(MAX_MESSAGE_LENGTH + 1));
  assert.equal(result.allowed, false);
  assert.match(result.reason, /cannot exceed/);
});
