const express = require("express");
const router = express.Router();
const {
  AddEmployeeLeaveDetail,
  updateLeaveDetail,
  UserMessages,
} = require("../controller/receive_leaves");
router
  .post("/", AddEmployeeLeaveDetail)
  .patch("/", updateLeaveDetail)
  .get("/:id", UserMessages);
module.exports = router;
