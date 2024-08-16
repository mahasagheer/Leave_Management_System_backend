const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { user_email, pass, to, url } = require("./config");

async function mongodbConnection(url) {
  return mongoose.connect(url);
}
async function emailConnection() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.email",
    service: "gmail",
    port: 587,
    auth: {
      user: user_email,
      pass: pass,
    },
  });
  return transporter;
}
module.exports = { mongodbConnection, emailConnection };
