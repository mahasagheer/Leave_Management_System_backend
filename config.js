// config.js
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  user_email: process.env.EMAIL,
  pass: process.env.PASS,
  to: process.env.TO_EMAIL,
  url: process.env.WEB_URL,
  encrypt_key: process.env.ENCRYPT_KEY,
  secret_key: process.env.SECRET_KEY,
  DB_URL: process.env.DB_URL,
};
