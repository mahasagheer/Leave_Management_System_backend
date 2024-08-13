const express = require("express");
const router = express.Router();
const { addUser, SingleUser } = require("../controller/leave_balance");
router.post("/", addUser).get("/:id", SingleUser);
module.exports = router;
