var express = require("express");
var router = express.Router();
const {
  addUser,
  allUsers,
  deleteUser,
  updateUser,
  singleUser,
} = require("../controller/user");

/* CURD users  */
router
  .post("/", addUser)
  .get("/", allUsers)
  .get("/:id", singleUser)
  .put("/:id", updateUser)
  .delete("/:id", deleteUser);
module.exports = router;
