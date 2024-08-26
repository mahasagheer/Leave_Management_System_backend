const express = require("express");
const router = express.Router();
const {
  sendLeave,
  leaveReply,
  inviteEmployee,
  updateMsgStatus,
  sendReminder
} = require("../controller/email");
router
  .post("/", sendLeave)
  .post("/leave_reply", leaveReply)
  .post("/invite_employee", inviteEmployee)
  .patch("/update_message_status", updateMsgStatus)
  .post("/leave/reminder" , sendReminder);
module.exports = router;
