const EmployeeLeaves = require("../modal/receive_leaves");
const Leave = require("../modal/leave_balance");
const User = require("../modal/user");

async function AddEmployeeLeaveDetail(req, res) {
  try {
    const { employee_id, message } = req.body;
    const leaveDetail = await EmployeeLeaves.create({
      employee_id: employee_id,
      messages: [{ ...message, viewed: false }], // Message initially marked as not viewed
      notification: { hr: true, employee: false } // Notify HR/Admin
    });

    res.status(200).json({
      msg: "LeaveDetail & message Added Successfully",
      data: leaveDetail,
    });
  } catch (err) {
    res.status(500).json("Unable to add leave msg");
  }
}

async function updateLeaveDetail(req, res) {
  try {
    const { employee_id, message } = req.body;

    let updateEmployee = await EmployeeLeaves.updateOne(
      { employee_id: employee_id },
      {
        $push: { messages: { ...message, viewed: false } },
        $set: { "notification.employee": true } 
      },
      { new: true, useFindAndModify: false }
    );
    const leave = await Leave.updateOne(
      { employee_id: employee_id },
      { $inc: { pending_leave: 1 } }
    );
    if (!updateEmployee) {
      return res.status(404).json({ message: "Leave record not found" });
    }
  
    return res.status(200).json(updateEmployee);
  } catch (err) {
    console.error("Error updating leave detail:", err);
    res.status(500).json({
      msg: "Unable to update",
    });
  }
}

async function UserMessages(req, res) {
  try {
    const getUser = await EmployeeLeaves.findOne({
      employee_id: req.params.id,
    });
    res.status(200).json(getUser);
  } catch (err) {
    res.status(500).json({ msg: "Unable to get single ser messages" });
  }
}
async function UserMessagesForHR(req, res) {
  try {
    const matchStage = req.params.status !== "All" 
      ? { $match: { "messages.status": req.params.status } } 
      : {}; 

    const pipeline = [
      { $unwind: "$messages" },
      ...(req.params.status !== "All" ? [matchStage] : []),
      { $sort: { "messages.timestamp": -1 } } 
    ];

    const messages = await EmployeeLeaves.aggregate(pipeline).exec();
    res.status(200).json(messages);
    
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send("Error fetching messages");
  }
}


module.exports = { AddEmployeeLeaveDetail, updateLeaveDetail, UserMessages , UserMessagesForHR };
