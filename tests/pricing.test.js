const { describe, test } = require("node:test");
const assert = require("node:assert");
const {
  OFFICIAL_WEBSITE_PRICING,
  getPricingForCategory,
  validateBudget,
  formatINR
} = require("../config/pricing.config");

describe("Server Pricing Engine Logic", () => {
  test("Official website matrix has baseline values for all 7 categories", () => {
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.business.min, 15000);
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.ecommerce.min, 30000);
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.portfolio.min, 10000);
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.blog.min, 10000);
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.education.min, 20000);
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.booking.min, 20000);
    assert.strictEqual(OFFICIAL_WEBSITE_PRICING.custom.min, 50000);
  });

  test("Server budget validation rejects underspecified budgets", () => {
    // E-commerce minimum = 30,000
    const res1 = validateBudget("E-commerce", 20000);
    assert.strictEqual(res1.isValid, false);
    assert.ok(res1.message.includes("minimum development price"));

    const res2 = validateBudget("E-commerce", 30000);
    assert.strictEqual(res2.isValid, true);

    // Business Website minimum = 15,000
    const res3 = validateBudget("Business Website", 14999);
    assert.strictEqual(res3.isValid, false);

    const res4 = validateBudget("Business Website", 15000);
    assert.strictEqual(res4.isValid, true);
  });

  test("Indian Rupee formatting works as expected", () => {
    assert.strictEqual(formatINR(15000), "₹15,000");
    assert.strictEqual(formatINR(75000), "₹75,000");
  });
});
