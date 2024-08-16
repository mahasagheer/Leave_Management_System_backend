const express = require("express");
const router = express.Router();
const {
  AddEmployeeLeaveDetail,
  updateLeaveDetail,
  UserMessages,
  UserMessagesForHR,
} = require("../controller/receive_leaves");
router
  .post("/", AddEmployeeLeaveDetail)
  .patch("/", updateLeaveDetail)
  .get("/:id", UserMessages)
  .get("/all_leaves/:status" , UserMessagesForHR);
module.exports = router;
