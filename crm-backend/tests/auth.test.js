const request = require("supertest");
const app = require("../server");
const pool = require("../db");

describe("Auth API", () => {


  beforeEach(async () => {
    await pool.query("DELETE FROM users");
  });

  it("should reject empty register data", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it("should register user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test" + Date.now() + "@mail.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User created");
  });

});


afterAll(async () => {
  await pool.end();
});