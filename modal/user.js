const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      unique: false,
    },
    salary: {
      type: Number,
      required: true,
      unique: false,
    },
    age: {
      type: Number,
      required: true,
      unique: false,
    },
    exit_date: {
      type: String,
      required: true,
      unique: false,
    },
    Job_title: {
      type: String,
      required: true,
      unique: false,
    },
    gender: {
      type: String,
      required: true,
      unique: false,
    },
    hire_date: {
      type: Date,
      required: true,
      unique: false,
    },
    department: {
      type: String,
      required: true,
      unique: false,
    },
    city: {
      type: String,
      required: true,
      unique: false,
    },
    phone: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User_detail", UserSchema);
module.exports = User;
