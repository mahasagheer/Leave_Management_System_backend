const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema(
  {
    employee_id: {
      type: String,
      required: true,
      unique: true,
    },

    used_paid_leaves: {
      type: Number,
      default: 0,
      min: 0,
    },

    used_unpaid_leaves: {
      type: Number,
      default: 0,
      min: 0,
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
     leave_year: {
      type: Number,
      default: new Date().getFullYear(), // to track yearly resets
    }
  },
  { timestamps: true }
);

const Leave = mongoose.model("leave_detail", LeaveSchema);
module.exports = Leave;
