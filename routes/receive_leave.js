const express = require("express");
const router = express.Router();
const {
  AddEmployeeLeaveDetail,
  updateLeaveDetail,
  UserMessages,
  UserMessagesForHR,
  generatePDF,
} = require("../controller/receive_leaves");
const { hrLeaveInbox,managerLeaveInbox, AdminLeaveInbox, verifyTokenforLeave } = require("../controller/displayLeave");
 


router
  .get("/all_leaves/pdf_report", generatePDF)
  .post("/", AddEmployeeLeaveDetail)
  .post("/leave/verify_token",verifyTokenforLeave)
  .patch("/", updateLeaveDetail)
  .get("/:id", UserMessages)
  .get("/all_leaves/:status", AdminLeaveInbox)
  .get("/hr_leave/:status", hrLeaveInbox)
  .get("/manager_leave/:managerId/:status",managerLeaveInbox);

module.exports = router;
