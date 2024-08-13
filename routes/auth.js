const express = require("express");
const router = express.Router();
const { userLogin } = require("../controller/auth");
router.post("/", userLogin);
module.exports = router;
