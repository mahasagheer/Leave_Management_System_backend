const EmployeeLeaves = require("../modal/receive_leaves");
const Leave = require("../modal/leave_balance");
const User = require("../modal/user");
const puppeteer = require("puppeteer");
const hbs = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const mongoose = require('mongoose');
const LeaveLimit = require("../modal/leave_limit"); // adjust path as needed


async function AddEmployeeLeaveDetail(req, res) {
  try {
    const { employee_id, message } = req.body;
    const leaveDetail = await EmployeeLeaves.create({
      employee_id: employee_id,
      messages: [], // Message initially marked as not viewed
      notification: { hr: true, employee: false }, // Notify HR/Admin
    });

    res.status(200).json({
      msg: "LeaveDetail & message Added Successfully",
      data: leaveDetail,
    });
  } catch (err) {
    res.status(500).json("Unable to add leave msg");
  }
}




async function updateLeaveDetail(req, res) {
  try {
    const { employee_id, message } = req.body;

    // Step 1: Fetch user to get staff_type
    const user = await User.findById(employee_id);
    if (!user || !user.staff_type) {
      return res.status(400).json({ message: "Invalid user or staff type missing" });
    }

    const currentYear = new Date().getFullYear();

    // Step 2: Fetch leave limit for staff_type and year
    const leaveLimit = await LeaveLimit.findOne({
      staff_type: user.staff_type,
      applicable_year: currentYear,
    });

    if (!leaveLimit) {
      return res.status(404).json({ message: "Leave limit not set for staff type" });
    }

    // Step 3: Fetch current leave usage
    const leaveRecord = await Leave.findOne({
      employee_id,
      leave_year: currentYear,
    });

    if (!leaveRecord) {
      return res.status(404).json({ message: "Leave balance record not found" });
    }

    // Step 4: Check leave type and compare with limits
    const leaveType = message.leave_type?.toLowerCase();
    const requestedDays = Number(message.days || 1);

    if (leaveType === "paid") {
      const totalUsed = leaveRecord.used_paid_leaves + leaveRecord.pending_leave + requestedDays;
      if (totalUsed > leaveLimit.paid_leave_limit) {
        return res.status(400).json({ message: "Paid leave limit exceeded" });
      }
    } else if (leaveType === "unpaid") {
      const totalUsed = leaveRecord.used_unpaid_leaves + leaveRecord.pending_leave + requestedDays;
      if (totalUsed > leaveLimit.unpaid_leave_limit) {
        return res.status(400).json({ message: "Unpaid leave limit exceeded" });
      }
    } else {
      return res.status(400).json({ message: "Invalid or missing leave type" });
    }

    // Step 5: Proceed to push message in EmployeeLeaves
    const messageWithId = {
      _id: new mongoose.Types.ObjectId(),
      ...message,
      viewed: false,
    };

    const updateEmployee = await EmployeeLeaves.updateOne(
      { employee_id },
      {
        $push: { messages: messageWithId },
        $set: { "notification.employee": true },
      },
      { new: true, useFindAndModify: false }
    );

    // Step 6: Increment pending leave in Leave record
    await Leave.updateOne(
      { employee_id },
      { $inc: { pending_leave: 1 } }
    );

    if (!updateEmployee || updateEmployee.modifiedCount === 0) {
      return res.status(404).json({ message: "Unable to update employee messages" });
    }

    return res.status(200).json({
      message: "Leave updated successfully",
      message: messageWithId,
    });

  } catch (err) {
    console.error("Error updating leave detail:", err);
    return res.status(500).json({ msg: "Unable to update leave record" });
  }
}




async function UserMessages(req, res) {
  try {
    const getUser = await EmployeeLeaves.findOne({
      employee_id: req.params.id,
    });
    res.status(200).json(getUser);
  } catch (err) {
    res.status(500).json({ msg: "Unable to get single ser messages" });
  }
}
async function UserMessagesForHR(req, res) {
  try {
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
const compile = async function (templateName, data) {
  const filepath = path.join(process.cwd(), "templates", `${templateName}.hbs`);
  const html = await fs.readFile(filepath, "utf-8");
  return hbs.compile(html)(data);
};
async function generatePDF(req, res) {
  try {
    const pipeline = [
      { $unwind: "$messages" },
      { $match: { "messages.status": "Approved" } },
      { $sort: { "messages.timestamp": -1 } },
    ];

    const approvedMessages = await EmployeeLeaves.aggregate(pipeline).exec();

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const data = {
      leaveHistory: approvedMessages.map((item) => ({
        leaveType: item.messages.leave_type,
        leaveDays: item.messages.days,
        from: new Date(item.messages.from_date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        to: new Date(item.messages.to_date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        reason: item.messages.leave_application,
        status: item.messages.status,
      })),
    };
    const content = await compile("index", data);
    await page.setContent(content);
    await page.pdf({ path: "output.pdf", format: "A3", printBackground: true });
    await browser.close();
    res.status(200).json(data);
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "unable to generate approved pdf report ", error: err });
  }
}
module.exports = {
  AddEmployeeLeaveDetail,
  updateLeaveDetail,
  UserMessages,
  UserMessagesForHR,
  generatePDF,
};
