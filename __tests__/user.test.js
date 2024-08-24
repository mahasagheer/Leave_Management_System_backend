const request = require("supertest");
const app = require("../app");
const User = require("../modal/user");
const crypto = require("crypto-js");
const EmployeeLeaves = require("../modal/receive_leaves");
const Leave = require("../modal/leave_balance");

jest.mock("../modal/user");
jest.mock("crypto-js");
jest.mock("../modal/receive_leaves");
jest.mock("../modal/leave_balance");

// GET ALL USERS
describe("GET /users", () => {
  it("should return all users with status 200", async () => {
    const mockUsers = [
      { _id: "1", name: "User One", email: "userone@example.com" },
      { _id: "2", name: "User Two", email: "usertwo@example.com" },
    ];

    User.find.mockResolvedValue(mockUsers);

    const res = await request(app).get("/users");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockUsers);
  });

  it("should return a 500 error if users cannot be retrieved", async () => {
    User.find.mockRejectedValue(new Error("Database error"));

    const res = await request(app).get("/users");

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("msg", "Users can't find");
  });
  it("should return an empty array if no users are found", async () => {
    User.find.mockResolvedValue([]);

    const res = await request(app).get("/users");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
  it("should return the correct JSON format for users", async () => {
    const mockUsers = [
      { _id: "1", name: "User One", email: "userone@example.com" },
    ];

    User.find.mockResolvedValue(mockUsers);

    const res = await request(app).get("/users");

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0]).toHaveProperty("_id");
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("email");
  });
});
// POST A USER IN DB
describe("POST /users", () => {
  it("should return 400 if user with the email already exists", async () => {
    User.findOne.mockResolvedValue({ _id: "12345", email: "john@example.com" });

    const res = await request(app).post("/users").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "msg",
      "User with this email already exists"
    );
  });
  it("should successfully add a new user", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "123",
      name: "John Doe",
      email: "johndoe@example.com",
    });

    crypto.AES.encrypt.mockImplementation(() => ({
      toString: jest.fn(() => "encryptedPassword"),
    }));

    const res = await request(app).post("/users").send({
      name: "John Doe",
      salary: 50000,
      age: 30,
      exit_date: null,
      Job_title: "Developer",
      gender: "Male",
      hire_date: "2023-01-01",
      department: "IT",
      city: "New York",
      email: "johndoe@example.com",
      password: "password123",
      role: "User",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("msg", "success");
    expect(res.body).toHaveProperty("user", "123");
  });
  it("should correctly encrypt the password before saving the user", async () => {
    User.findOne.mockResolvedValue(null);

    User.create.mockResolvedValue({
      _id: "123",
      name: "John Doe",
      email: "johndoe@example.com",
      password: "encryptedPassword",
    });

    crypto.AES.encrypt.mockImplementation((password, key) => ({
      toString: jest.fn(() => "encryptedPassword"),
    }));

    const userData = {
      name: "John Doe",
      salary: 50000,
      age: 30,
      exit_date: null,
      Job_title: "Developer",
      gender: "Male",
      hire_date: "2023-01-01",
      department: "IT",
      city: "New York",
      email: "johndoe@example.com",
      password: "password123",
      role: "User",
      phone: "123-456-7890",
    };

    const res = await request(app).post("/users").send(userData);

    expect(crypto.AES.encrypt).toHaveBeenCalledWith(
      "password123",
      process.env.ENCRYPT_KEY
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("msg", "success");
    expect(res.body).toHaveProperty("user", "123");
  });
  it("should return a 500 error if encryption fails", async () => {
    User.findOne.mockResolvedValue(null);
    crypto.AES.encrypt.mockImplementation(() => {
      throw new Error("Encryption error");
    });

    const res = await request(app).post("/users").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("msg", "Users can't find");
  });
});

describe("GET /users/:id", () => {
  it("should retrieve user and leave details successfully", async () => {
    User.findById.mockResolvedValue({
      _id: "123",
      name: "John Doe",
      email: "johndoe@example.com",
    });

    EmployeeLeaves.find.mockResolvedValue([
      { messages: [{ content: "Leave Request 1" }] },
      { messages: [{ content: "Leave Request 2" }] },
    ]);

    const res = await request(app).get("/users/123");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("leaves");
    expect(res.body.data).toHaveProperty("_id", "123");
    expect(res.body.leaves).toHaveLength(2);
    expect(res.body.leaves[0].messages[0]).toHaveProperty(
      "content",
      "Leave Request 1"
    );
  });
  it("should return a 404 error if there is an error retrieving the user", async () => {
    User.findById.mockRejectedValue(new Error("Database error"));

    const res = await request(app).get("/users/123");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to get single product");
  });
  it("should return 404 if there is an error fetching user or leave details", async () => {
    User.findById.mockImplementation(() => {
      throw new Error("Database Error");
    });

    const res = await request(app).get("/users/123");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to get single product");
  });
  it("should return 404 if user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app).get("/users/123");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to get single product");
  });
});

describe("PUT /users/:id", () => {
  it("should update user details successfully", async () => {
    const mockUser = {
      _id: "123",
      name: "John Doe",
      email: "johndoe@example.com",
      password: "encrypted_password",
    };

    crypto.AES.encrypt.mockReturnValue({
      toString: jest.fn().mockReturnValue("encrypted_password"),
    });

    User.findByIdAndUpdate.mockResolvedValue(mockUser);

    const res = await request(app).put("/users/123").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "new_password",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockUser);
  });
  it("should return 404 if user is not found", async () => {
    User.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app).put("/users/123").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "new_password",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to update user");
  });
  it("should return 404 if user ID is invalid", async () => {
    User.findByIdAndUpdate.mockRejectedValue(new Error("Invalid ID"));

    const res = await request(app).put("/users/invalid-id").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "new_password",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to update");
  });
  it("should return 404 if there is an error during update", async () => {
    User.findByIdAndUpdate.mockImplementation(() => {
      throw new Error("Database Error");
    });

    const res = await request(app).put("/users/123").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "new_password",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to update");
  });
});
describe("DELETE /users/:id", () => {
  it("should successfully delete the user and associated data", async () => {
    User.findByIdAndDelete.mockResolvedValue({ _id: "123", name: "John Doe" });
    Leave.find.mockResolvedValue([{ _id: "leave123" }]);
    EmployeeLeaves.find.mockResolvedValue([{ _id: "message123" }]);
    Leave.findByIdAndDelete.mockResolvedValue(true);
    EmployeeLeaves.findByIdAndDelete.mockResolvedValue(true);

    const res = await request(app).delete("/users/123");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Deleted SuccessFully");
    expect(res.body.data).toEqual([{ _id: "leave123" }]);
  });
  it("should return 404 if user is not found", async () => {
    User.findByIdAndDelete.mockResolvedValue(null);
    Leave.find.mockResolvedValue([]);
    EmployeeLeaves.find.mockResolvedValue([]);

    const res = await request(app).delete("/users/123");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to delete user");
  });
  it("should delete user even if no leave details are found", async () => {
    User.findByIdAndDelete.mockResolvedValue({ _id: "123", name: "John Doe" });
    Leave.find.mockResolvedValue([]);
    EmployeeLeaves.find.mockResolvedValue([{ _id: "message123" }]);
    EmployeeLeaves.findByIdAndDelete.mockResolvedValue(true);

    const res = await request(app).delete("/users/123");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Deleted SuccessFully");
    expect(res.body.data).toEqual([]);
  });
  it("should return 404 if an error occurs during deletion", async () => {
    User.findByIdAndDelete.mockRejectedValue(new Error("Deletion error"));

    const res = await request(app).delete("/users/123");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("msg", "Unable to delete product");
  });
});
