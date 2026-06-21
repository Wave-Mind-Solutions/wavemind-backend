const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../app");

test("Express App Integration Tests", async (t) => {
  // Mock DB Connection prior to tests if necessary, or let app handle it if pre-connected.
  // We will run these against the routes with light mocks or basic checks.

  await t.test("GET / - Health Check", async () => {
    const res = await request(app)
      .get("/")
      .expect("Content-Type", /json/)
      .expect(200);

    assert.strictEqual(res.body.status, "ok");
    assert.strictEqual(res.body.service, "WaveMind API");
  });

  await t.test("GET /api/health - Health Endpoint", async () => {
    const res = await request(app)
      .get("/api/health")
      .expect(200);

    assert.strictEqual(res.body.status, "ok");
  });

  await t.test("POST /api/auth/register - Validation Failure", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "invalid-email",
        password: "123", // too short
      })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /fullName|email|password/i);
  });

  await t.test("POST /api/auth/login - Empty Credentials Failure", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({})
      .expect(400);

    assert.strictEqual(res.body.success, false);
  });

  await t.test("POST /api/ai/analyze-project - Unauthenticated Block", async () => {
    const res = await request(app)
      .post("/api/ai/analyze-project")
      .send({
        description: "Build an e-commerce platform",
      })
      .expect(401);

    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /access denied|no token/i);
  });

  await t.test("POST /api/auth/reset-password/:token - Invalid Token Failure", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/invalid_token_xyz")
      .send({
        password: "newsecurepassword123",
      })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /token is invalid/i);
  });
});
