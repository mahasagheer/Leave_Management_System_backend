const express = require("express");
const router = express.Router();
const {setLeaveLimits,getLeaveLimits,getAllLeaveLimits} = require("../controller/leaveLimit");

router.get("/get", getLeaveLimits);
router.post("/set", setLeaveLimits);
router.get("/getAll",getAllLeaveLimits)


module.exports = router;
