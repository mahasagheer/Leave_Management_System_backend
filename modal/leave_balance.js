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
      max: 18,
      min: 3,
    },
    sick_leave: {
      type: Number,
      required: true,
      max: 18,
      min: 3,
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
      max: 18,
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model("leave_detail", LeaveSchema);
module.exports = Leave;
