const EmployeeLeaves = require("../modal/receive_leaves");
const User = require("../modal/user");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const { secret_key } = require("../config");
const jwt = require("jsonwebtoken");

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
            { $match: { "employee_info.role": { $in: ["user", "Manager"] } } },
            { $unwind: "$messages" },
            ...(status !== "All" ? [{ $match: { "messages.status": status } }] : []),
            { $sort: { "messages.timestamp": -1 } },
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
    const {managerId, status } = req.params;

    if (!managerId) {
      return res.status(400).json({ error: "Missing manager ID" });
    }

    // 🔍 Step 1: Get associated employee IDs of this manager
    const manager = await User.findById(managerId).lean();

    if (!manager || manager.role !== "Manager") {
      return res.status(403).json({ error: "Access denied" });
    }

    const associatedIds = (manager.associatedEmployees || []).map((id) =>
      typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
    );

    // 🔍 Step 2: Build aggregation pipeline
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

      // ✅ Filter: only show if role is "user"
      { $match: { "employee_info.role": "user" } },

      // ✅ Filter: employee must be in manager.associatedEmployees
      {
        $match: {
          employeeObjId: { $in: associatedIds },
        },
      },

      // ✅ Unwind messages to get latest status per record
      { $unwind: "$messages" },

      ...(status !== "All"
        ? [{ $match: { "messages.status": status } }]
        : []),

      { $sort: { "messages.timestamp": -1 } },
    ];

    const messages = await EmployeeLeaves.aggregate(pipeline).exec();

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching manager leave inbox:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}


async function verifyTokenforLeave(req, res) {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, secret_key);
    const { leaveId, approverEmail, approverRole } = decoded;

    // Find the parent document that contains this message._id
    const leaveDoc = await EmployeeLeaves.findOne({ "messages._id": leaveId });

    if (!leaveDoc) {
      return res.status(404).json({ msg: "Leave not found" });
    }

    // Extract the exact message
    const message = leaveDoc.messages.id(leaveId); // this is a Mongoose subdocument accessor

    if (!message) {
      return res.status(404).json({ msg: "Leave message not found" });
    }

    return res.status(200).json({
      msg: "Token verified successfully",
      employee_id: leaveDoc.employee_id,
      message,
      approverEmail,
      approverRole,
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}




module.exports = { hrLeaveInbox, managerLeaveInbox,AdminLeaveInbox,verifyTokenforLeave };
