const mongoose = require("mongoose");

const LeaveLimitSchema = new mongoose.Schema(
    {
      paid_leave_limit: {
        type: Number,
        min: 0,
      },
      unpaid_leave_limit: {
        type: Number,
        min: 0,
      },
      applicable_year: {
        type: Number,
        default: new Date().getFullYear(),
      },
      staff_type: { type: String, required: true, enum: ["probation", "intern", "permanent"] },

    },
    { timestamps: true }
  );
  LeaveLimitSchema.index({ staff_type: 1, applicable_year: 1 }, { unique: true });

  
  module.exports = mongoose.model("LeaveLimit", LeaveLimitSchema);
  