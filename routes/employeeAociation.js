var express = require("express");
var router = express.Router();
const {GetAllEmployees, assignEmployees , GetAssociatedEmployees, UnassignEmployees } = require("../controller/EmployeeAssociation");


/* CURD users  */
router
  .get("/allemployees", GetAllEmployees)
  .put("/assignEmployees",assignEmployees)
  .put("/unassignEmployee", UnassignEmployees)
  .get("/associatedEmployees/:managerId", GetAssociatedEmployees)
module.exports = router;
