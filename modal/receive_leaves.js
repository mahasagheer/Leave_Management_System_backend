const mongoose = require("mongoose");
const { type } = require("os");

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  leave_type: { type: String, required: true },
  days: { type: Number, required: true },
  to_date: { type: Date, required: true },
  from_date: { type: Date, required: true },
  leave_application: { type: String, required: true },
  status: { type: String, required: true },
  viewed: { type: Boolean, default: false },
  reminder: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now } 

});
const EmployeeLeaveSchema = new mongoose.Schema(
  {
    employee_id: {
      type: String,
      required: true,
      unique: true,
    },
    messages: {
      type: [messageSchema],
    },
    notification: {
      hr: { type: Boolean, default: false },  // Notification for HR/Admin
      employee: { type: Boolean, default: false } // Notification for Employee
    }
  },
  { timestamps: true }
);

const EmployeeLeaves = mongoose.model("emp_leave_detail", EmployeeLeaveSchema);
module.exports = EmployeeLeaves;
