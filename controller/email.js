const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const User = require("../modal/user");
const { user_email, to, url } = require("../config");
const { emailConnection } = require("../connection");
const { default: mongoose } = require("mongoose");
const startReminderCron = require("../crons/reminderCron");
const pdf_report = require("../crons/pdfReportCron");
const path = require("path");

async function sendLeave(req, res) {
  try {
    const {
      name,
      email,
      leave_type,
      days,
      to_date,
      from_date,
      leave_application,
    } = req.body;
    const transporter = await emailConnection();
    if (
      !name ||
      !email ||
      !leave_type ||
      !days ||
      !to_date ||
      !from_date ||
      !leave_application
    ) {
      return res.status(400).json({ msg: "Missing required fields" });
    }
    const HR = await User.find({ role: ["HR", "admin"] });
    const HRemail = HR.map((hr) => hr.email);

    HRemail.map(async (mail) => {
      const info = await transporter.sendMail({
        from: `${name} <${email}>`, // sender address
        to: `${mail}`, // list of receivers
        subject: `Leave Application from ${name} `, // Subject line
        text: `Leave Type : ${leave_type}
       From: ${from_date}
       To: ${to_date}
       Days:${days}
       Leave Application: ${leave_application}`, // plain text body
      });
    });

    startReminderCron();
    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ msg: "Leave send successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
  }
}

async function sendReminder(req, res) {
  try {
    const { name, email } = req.body;
    const transporter = await emailConnection();

    // Check for required fields
    if (!name || !email) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Fetch HR users
    const HR = await User.find({ role: { $in: ["HR", "admin"] } });
    if (HR.length === 0) {
      return res.status(404).json({ msg: "No HR users found" });
    }

    // Prepare HR emails
    const HRemails = HR.map((hr) => hr.email);

    // Send emails to HR
    const emailPromises = HRemails.map(async (mail) => {
      try {
        const info = await transporter.sendMail({
          from: `${name} <${email}>`,
          to: mail,
          subject: "Pending Leave Request Reminder",
          text: `Reminder: The leave request from ${name} has been pending for over 6 hours. Please review and respond to the request.
          Name: ${name}
          Email: ${email} `,
        });
        console.log("Message sent: %s", info.messageId);
        const employees = await EmployeeLeaves.find();
        for (const employee of employees) {
          employee?.messages?.forEach((message) => {
            if (message?.email === email) {
              message.reminder = false;
            }
          });

          await employee.save();
        }
        startReminderCron();
      } catch (sendError) {
        console.error(`Error sending email to ${mail}:`, sendError);
        return { success: false, email: mail, error: sendError.message };
      }
    });

    const results = await Promise.all(emailPromises);

    // Check if all emails were sent successfully
    const failedEmails = results.filter((result) => result && !result.success);

    if (failedEmails.length > 0) {
      return res.status(500).json({
        msg: "Some emails could not be sent",
        failedEmails,
      });
    }

    // Success response
    res.status(200).json({ msg: "Reminder emails sent successfully" });
  } catch (err) {
    console.error("Internal server error:", err);
    res.status(500).json({ msg: "Internal server error", error: err.message });
  }
}

async function leaveReply(req, res) {
  try {
    const { name, email, comment, employee_id, status, leave_id } = req.body;
    const transporter = await emailConnection();

    if (status === "Approved") {
      console.log(employee_id);
      console.log(leave_id);
      const user = await EmployeeLeaves.findOne(
        {
          employee_id: employee_id,
          "messages._id": leave_id,
        },
        {
          "messages.$": 1,
        }
      );

      const days = user.messages.map((message) => message.days);
      const leaveType = user.messages.map((message) => message.leave_type);

      if (leaveType == "Sick Leave") {
        const leave = await Leave.updateOne(
          { employee_id: employee_id },
          {
            $inc: {
              pending_leave: -1,
              sick_leave: -days,
            },
          }
        );
      } else {
        const leave = await Leave.updateOne(
          { employee_id: employee_id },
          { $inc: { remaining_leave: -days, pending_leave: -1 } }
        );
      }
      const info = await transporter.sendMail({
        from: `${name} <${user_email}>`, // sender address
        to: `${to}`, // list of receivers
        subject: `Leave ${status} `, // Subject line
        text: `Hello ${name}!

         Hope you are doing well.

         Your recent leave request has been reviewed, and after careful consideration, it has been approved, and you are free to take the requested days off.${comment}
         Please let us know if you require any further clarification, and feel free to reach out if you have any other concerns. Thank you for your understanding.
     
         Best Regards,
         Iqra Sagheer`, // plain text body
      });
      console.log("Message sent: %s", info.messageId);
    }
    if (status === "Declined") {
      const leave = await Leave.updateOne(
        { employee_id: employee_id },
        { $inc: { pending_leave: -1, rejected_leave: 1 } }
      );
      const info = await transporter.sendMail({
        from: `${name} <${user_email}>`, // sender address
        to: `${to}`, // list of receivers
        subject: `Leave ${status} `, // Subject line
        text: `Hello ${name}!

         Hope you are doing well.

         Your recent leave request has been reviewed, and after careful consideration. Unfortunately, it has been declined due to current operational needs.${comment}
      
         Please let us know if you require any further clarification, and feel free to reach out if you have any other concerns. Thank you for your understanding.
     
         Best Regards,
         Iqra Sagheer`, // plain text body
      });
      console.log("Message sent: %s", info.messageId);
    }
    res.status(200).json("Leave Reply send successfully");
  } catch (err) {
    res.status(500).json("Unable to send Leave response");
  }
}

async function inviteEmployee(req, res) {
  try {
    const { name, email, password } = req.body;
    const transporter = await emailConnection();
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const info = await transporter.sendMail({
      from: `${name} <${user_email}>`, // sender address
      to: `${to}`, // list of receivers
      subject: `Welcome to the Team! `, // Subject line
      text: `Dear ${name},

      Welcome aboard! We are thrilled to have you as a part of our team.

      To get started, please log in to your account using the following credentials:

      Email: ${email}
      Password: ${password}

      You can access the portal using this URL: ${url}

      If you have any questions or need assistance, feel free to reach out. We look forward to working with you!
      Best Regards,`,
    });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ msg: "Invitation email send successfully" });
  } catch (err) {
    res.status(500).json("Unable to send employee credentials");
  }
}

async function updateMsgStatus(req, res) {
  const { employee_id, leave_id, status } = req.body;

  if (!employee_id || !leave_id || !status) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const leaveObjectId = mongoose.Types.ObjectId.createFromHexString(leave_id);
    const query = {
      employee_id: employee_id,
      "messages._id": leaveObjectId, // Ensure this matches the structure
    };

    const updatedDocument = await EmployeeLeaves.findOneAndUpdate(
      query,
      {
        $set: {
          "messages.$.status": status,
        },
      },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "No document found" });
    }

    return res
      .status(200)
      .json({ message: "Status updated successfully", updatedDocument });
  } catch (error) {
    console.error("Error updating message status:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  sendLeave,
  leaveReply,
  inviteEmployee,
  updateMsgStatus,
  sendReminder,
};
