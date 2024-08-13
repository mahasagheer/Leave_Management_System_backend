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
    let newUser = await Leave.create({
      employee_id: employee_id,
      annual_leave: annual_leave,
      sick_leave: sick_leave,
      rejected_leave: rejected_leave,
      pending_leave: pending_leave,
      remaining_leave: remaining_leave,
    });
    res.status(201).json("Employee leave detail added successfully");
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
