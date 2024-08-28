const express = require("express");
const router = express.Router();
const { CreateTheme, getLogo } = require("../controller/customeTheme");
router.post("/", CreateTheme).get("/:id", getLogo);
module.exports = router;
