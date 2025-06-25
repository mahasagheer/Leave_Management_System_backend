const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const User = require("../modal/user");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

async function hrLeaveInbox(req,res){
    try {
          const status = req.params.status;
          const pipeline = [
            {
              $addFields: {
                employeeObjId: {
                  $cond: {
                    if: { $eq: [{ $type: "$employee_id" }, "string"] },
                    then: { $toObjectId: "$employee_id" },
                    else: "$employee_id",
                  },
                },
              },
            },
            {
              $lookup: {
                from: "user_details",
                localField: "employeeObjId",
                foreignField: "_id",
                as: "employee_info",
              },
            },
            { $unwind: "$employee_info" },
            { $match: { "employee_info.role": ["user","Manager"] } },
            // { $unwind: "$messages" },
            // ...(status !== "All" ? [{ $match: { "messages.status": status } }] : []),
            // { $sort: { "messages.timestamp": -1 } },
          ];
    
        const messages = await EmployeeLeaves.aggregate(pipeline).exec();
        
        res.status(200).json(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Error fetching messages");
      }
}


async function AdminLeaveInbox(req,res){
  try {
        const status = req.params.status;
        const matchStage =
      req.params.status !== "All"
        ? { $match: { "messages.status": req.params.status } }
        : {};

    const pipeline = [
      { $unwind: "$messages" },
      ...(req.params.status !== "All" ? [matchStage] : []),
      { $sort: { "messages.timestamp": -1 } },
    ];

      const messages = await EmployeeLeaves.aggregate(pipeline).exec();
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Error fetching messages");
    }
}


async function managerLeaveInbox(req, res) {
  try {
    const status = req.params.status;

    const pipeline = [
      {
        $addFields: {
          employeeObjId: {
            $cond: {
              if: { $eq: [{ $type: "$employee_id" }, "string"] },
              then: { $toObjectId: "$employee_id" },
              else: "$employee_id",
            },
          },
        },
      },
      {
        $lookup: {
          from: "user_details",
          localField: "employeeObjId",
          foreignField: "_id",
          as: "employee_info",
        },
      },
      { $unwind: "$employee_info" },
      { $match: { "employee_info.role": "user" } },
      { $unwind: "$messages" },
      ...(status !== "All" ? [{ $match: { "messages.status": status } }] : []),
      { $sort: { "messages.timestamp": -1 } },
    ];

    const messages = await EmployeeLeaves.aggregate(pipeline).exec();
  
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching manager leave inbox:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}



module.exports = { hrLeaveInbox, managerLeaveInbox,AdminLeaveInbox };
