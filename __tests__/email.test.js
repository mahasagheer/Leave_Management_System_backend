const request = require("supertest");
const app = require("../app");
const { emailConnection } = require("../connection.js");
const nodemailer = require("nodemailer");

jest.mock("../connection.js");
jest.mock("nodemailer");

describe("POST /send_email", () => {
  it("should send leave application successfully", async () => {
    const mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "12345" }),
    };
    emailConnection.mockResolvedValue(mockTransporter);

    const res = await request(app).post("/send_email").send({
      name: "John Doe",
      email: "johndoe@example.com",
      leave_type: "Sick Leave",
      days: 3,
      to_date: "2024-09-15",
      from_date: "2024-09-12",
      leave_application: "I am sick and unable to attend work.",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Leave send successfully");
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app).post("/send_email").send({
      name: "John Doe",
      email: "johndoe@example.com",
      leave_type: "Sick Leave",
      days: 3,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("msg", "Missing required fields");
  });

  it("should return 500 if email sending fails", async () => {
    const mockTransporter = {
      sendMail: jest.fn().mockRejectedValue(new Error("Email sending failed")),
    };
    emailConnection.mockResolvedValue(mockTransporter);

    const res = await request(app).post("/send_email").send({
      name: "John Doe",
      email: "johndoe@example.com",
      leave_type: "Sick Leave",
      days: 3,
      to_date: "2024-09-15",
      from_date: "2024-09-12",
      leave_application: "I am sick and unable to attend work.",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("msg", "Internal server error");
  });

  it("should return 500 if an internal error occurs", async () => {
    emailConnection.mockRejectedValue(new Error("Unexpected error"));

    const res = await request(app).post("/send_email").send({
      name: "John Doe",
      email: "johndoe@example.com",
      leave_type: "Sick Leave",
      days: 3,
      to_date: "2024-09-15",
      from_date: "2024-09-12",
      leave_application: "I am sick and unable to attend work.",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("msg", "Internal server error");
  });
});

describe("POST /send_email/invite_employee", () => {
  it("should return 500 if email sending fails", async () => {
    const mockTransporter = {
      sendMail: jest.fn().mockRejectedValue(new Error("Failed to send email")),
    };
    emailConnection.mockResolvedValue(mockTransporter);

    const res = await request(app).post("/send_email/invite_employee").send({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toBe("Unable to send employee credentials");
  });
});
