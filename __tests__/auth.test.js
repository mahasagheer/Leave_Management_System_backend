const request = require("supertest");
const app = require("../app");
const User = require("../modal/user");
const crypto = require("crypto-js");
const { setUser } = require("../service/token");

jest.mock("../modal/user");
jest.mock("crypto-js");
jest.mock("../service/token");

describe("POST /login", () => {
  it("should log in a user with correct credentials", async () => {
    const mockUser = {
      email: "johndoe@example.com",
      password: "encrypted_password",
    };

    User.findOne.mockResolvedValue(mockUser);
    crypto.AES.decrypt.mockReturnValue({ toString: () => "correct_password" });
    setUser.mockReturnValue("mock_token");

    const res = await request(app).post("/login").send({
      email: "johndoe@example.com",
      password: "correct_password",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "User Logged In");
    expect(res.body).toHaveProperty("token", "mock_token");
    expect(res.body).toHaveProperty("data", mockUser);
  });
});
