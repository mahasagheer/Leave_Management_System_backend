const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema(
  {
    employee_id: {
      type: String,
      required: true,
      unique: true,
    },
    annual_leave: {
      type: Number,
      required: true,
      max: 35,
      min: 5,
    },
    sick_leave: {
      type: Number,
      required: true,
      max: 25,
      min: 5,
    },
    rejected_leave: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending_leave: {
      type: Number,
      default: 0,
      min: 0,
    },
    remaining_leave: {
      type: Number,
      default: 0,
      min: 0,
      max: 55,
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model("leave_detail", LeaveSchema);
module.exports = Leave;
