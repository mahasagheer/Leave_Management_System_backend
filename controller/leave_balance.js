const Leave = require("../modal/leave_balance");

async function addUser(req, res) {
  try {
    const {
      employee_id,
      annual_leave,
      sick_leave,
      rejected_leave,
      pending_leave,
      remaining_leave,
    } = req.body;

    // Organize and set defaults
    const leaveData = {
      employee_id: employee_id,
      annual_leave: Number(annual_leave),
      sick_leave: sick_leave !== undefined ? Number(sick_leave) : 8, // default 8
      rejected_leave: rejected_leave !== undefined ? Number(rejected_leave) : 0,
      pending_leave: pending_leave !== undefined ? Number(pending_leave) : 0,
      remaining_leave: remaining_leave !== undefined ? Number(remaining_leave) : Number(annual_leave), // default to annual_leave
    };

    let newUser = await Leave.create(leaveData);
    res.status(201).json({ msg: "Employee leave detail added successfully", leave: newUser });
  } catch (err) {
    console.error(err);
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
