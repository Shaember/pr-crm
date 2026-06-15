const request = require("supertest");
const app = require("../server");
const pool = require("../db");

let token;


beforeAll(async () => {
  await request(app).post("/api/auth/register").send({
    username: "client_test",
    email: "client@test.com",
    password: "123456"
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email: "client@test.com",
      password: "123456"
    });

  token = res.body.token;
});


afterAll(async () => {
  await pool.end();
});

describe("Clients API", () => {

 
  it("should deny access without token", async () => {
    const res = await request(app)
      .get("/api/clients");

    expect(res.statusCode).toBe(401);
  });

  
  it("should get all clients", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });


  it("should create client", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Client",
        email: "client@mail.com",
        phone: "123456789"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Test Client");
  });

});