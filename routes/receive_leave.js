const express = require("express");
const router = express.Router();
const {
  AddEmployeeLeaveDetail,
  updateLeaveDetail,
  UserMessages,
  UserMessagesForHR,
  generatePDF,
} = require("../controller/receive_leaves");
router
  .get("/all_leaves/pdf_report", generatePDF)
  .post("/", AddEmployeeLeaveDetail)
  .patch("/", updateLeaveDetail)
  .get("/:id", UserMessages)
  .get("/all_leaves/:status", UserMessagesForHR);

module.exports = router;
