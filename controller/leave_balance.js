const Leave = require("../modal/leave_balance");
const LeaveLimit = require("../modal/leave_limit");
const User = require("../modal/user");
const mongoose = require("mongoose")

async function addUser(req, res) {
  try {
    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ msg: "employee_id is required" });
    }
    const empObjectId = new mongoose.Types.ObjectId(employee_id);

    // Step 1: Get the user to determine their staff_type (intern/probation/permanent)
    const user = await User.findOne({_id: empObjectId});
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const staffType = user.staff_type || "permanent"; // fallback if not provided

    // Step 2: Fetch leave limits based on staff_type and current year
    const currentYear = new Date().getFullYear();

    const leaveLimit = await LeaveLimit.findOne({
      staff_type: staffType,
      applicable_year: currentYear,
    });

    if (!leaveLimit) {
      return res.status(404).json({
        msg: `Leave limit not set for ${staffType} (${currentYear})`,
      });
    }

    // Step 3: Create the leave balance record for this employee
    const leaveData = {
      employee_id,
      used_paid_leaves: 0,
      used_unpaid_leaves: 0,
      rejected_leave: 0,
      pending_leave: 0,
      remaining_leave: leaveLimit.paid_leave_limit,
      leave_year: currentYear,
    };

    const newUserLeave = await Leave.create(leaveData);

    res.status(201).json({
      msg: "Employee leave record created successfully",
      leave: newUserLeave,
    });

  } catch (err) {
    console.error("❌ addUser error:", err);
    res.status(500).json("Unable to add employee leave detail");
  }
}


async function SingleUser(req, res) {
  try {
    const user = await Leave.findOne({ employee_id: req.params.id });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json("Unable to get Single user leave detail");
  }
}
module.exports = { addUser, SingleUser };
