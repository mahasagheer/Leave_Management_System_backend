const express = require("express");
const router = express.Router();
const {
  sendLeave,
  leaveReply,
  inviteEmployee,
  updateMsgStatus,
  sendReminder,
  hrApproveLeave,
  managerApproveLeave,
  hrRejectLeave,
  managerRejectLeave,
  AdminApproveLeave,
  AdminRejectLeave,
} = require("../controller/email");


router
.put("/hr_approve",hrApproveLeave)
.put("/manager_approve",managerApproveLeave)
.put("/hr_reject", hrRejectLeave)
.put("/admin_approve",AdminApproveLeave)
.put("/admin_reject", AdminRejectLeave)
.put("/manager_reject", managerRejectLeave)
  .post("/", sendLeave)
  .post("/leave_reply", leaveReply)
  .post("/invite_employee", inviteEmployee)
  .patch("/update_message_status", updateMsgStatus)
  .post("/leave/reminder", sendReminder);
module.exports = router;
