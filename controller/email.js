const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const User = require("../modal/user");
const { user_email, to, url } = require("../config");
const { emailConnection } = require("../connection");
const { default: mongoose } = require("mongoose");
const startReminderCron = require("../crons/reminderCron");
const sendLeaveReply=require("../helperFunction/leaveReply")
const jwt = require("jsonwebtoken");
const { secret_key } = require("../config");const jwt = require("jsonwebtoken");

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
      _id
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

    // Step 1: Find sender
    const sender = await User.findOne({ email });
    if (!sender) {
      return res.status(404).json({ msg: "Sender not found in system" });
    }
    const senderId = sender._id;
    let recipientEmails = [];

    if (sender.role === "user") {
      // Step 2: Find the exact manager linked to this user
      const manager = await User.findOne({
        role: "Manager",
        associatedEmployees: senderId,
      });

      if (!manager) {
        return res.status(404).json({
          msg: "No manager associated with this employee",
        });
      }

      recipientEmails.push(manager.email);

      // Optional: Also send to admin
      const admins = await User.find({ role: "admin" });
      recipientEmails.push(...admins.map((a) => a.email));
    }

    else if (sender.role === "Manager") {
      const hrAndAdmin = await User.find({
        role: { $in: ["HR", "admin"] },
      });
      recipientEmails = hrAndAdmin.map((u) => u.email);
    }

    else if (sender.role === "HR") {
      const admins = await User.find({ role: "admin" });
      recipientEmails = admins.map((a) => a.email);
    }

    else {
      return res
        .status(403)
        .json({ msg: "You are not allowed to send leave request" });
    }
// const messageLink = `${url}/inbox_messages/${_id}`
    // Step 3: Send emails
//     for (const mail of recipientEmails) {
//       await transporter.sendMail({
//         from: `<${email}>`,
//         to: mail,
//         subject: `Leave Application from ${name}`,
//         text: `Leave Type: ${leave_type}
// From: ${from_date}
// To: ${to_date}
// Days: ${days}
// Leave Application: ${leave_application}

// View this leave message here: ${messageLink}`,
//         html: `<p><strong>Leave Type:</strong> ${leave_type}</p>
// <p><strong>From:</strong> ${from_date}</p>
// <p><strong>To:</strong> ${to_date}</p>
// <p><strong>Days:</strong> ${days}</p>
// <p><strong>Leave Application:</strong><br/> ${leave_application}</p>
// <p><a href="${messageLink}" target="_blank">👉 View Leave Message</a></p>`,
//       });
//     }

for (const mail of recipientEmails) {
  const role = await User.findOne({ email: mail }).then((u) => u?.role || "unknown");
  const token = jwt.sign(
    {
      leaveId: _id,
      approverEmail: mail,
      approverRole: role,
      action: "approve-reject"
    },
    secret_key,
    { expiresIn: "1h" }
  );
  const secureLink = `${url}/leave-action/:token=${token}`;

  await transporter.sendMail({
    from: `<${email}>`,
    to: mail,
    subject: `Leave Application from ${name}`,
    html: `<p><strong>Leave Type:</strong> ${leave_type}</p>
<p><strong>From:</strong> ${from_date}</p>
<p><strong>To:</strong> ${to_date}</p>
<p><strong>Days:</strong> ${days}</p>
<p><strong>Leave Application:</strong><br/> ${leave_application}</p>
<p><a href="${secureLink}" target="_blank">👉 Approve/Reject Leave Request</a></p>`,
  });
}

    startReminderCron();

    res.status(200).json({ msg: "Leave sent successfully" });
  } catch (err) {
    console.log(err);
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
        from: `${name} <${email}>`, // sender address
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


async function managerApproveLeave(req, res) {
  console.log("header",req.header)
  const { employee_id, message_id , comment} = req.body;
  if (!employee_id || !message_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const empObjectId = new mongoose.Types.ObjectId(employee_id);

    // Step 1: Find employee leave document
    const leaveDoc = await EmployeeLeaves.findOne({ employee_id });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Employee leave doc not found" });
    }

    const msgIndex = leaveDoc.messages.findIndex(
      (msg) => msg._id.toString() === message_id
    );
    if (msgIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }
    const leaveMessage = leaveDoc.messages[msgIndex];
    leaveDoc.messages[msgIndex].status = "Manager Approved";
    leaveDoc.messages[msgIndex].comment= comment;
    leaveDoc.notification.employee = true;
    await leaveDoc.save();
    await sendLeaveReply(leaveMessage,employee_id);
    res.status(200).json({ message: "Leave approved by Manager " });
  } catch (err) {
    console.error("Manager Approval Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
}


async function hrApproveLeave(req, res) {
  console.log("header",req.header)
  const { employee_id, message_id , comment} = req.body;
  if (!employee_id || !message_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const empObjectId = new mongoose.Types.ObjectId(employee_id);

    // Step 1: Find employee leave document
    const leaveDoc = await EmployeeLeaves.findOne({ employee_id });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Employee leave doc not found" });
    }

    const getUser = await User.findOne({_id: empObjectId }); 

    const msgIndex = leaveDoc.messages.findIndex(
      (msg) => msg._id.toString() === message_id
    );
    if (msgIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }
    const leaveMessage = leaveDoc.messages[msgIndex];

    if( getUser.role ==="user"){
    if (leaveMessage.status !== "Manager Approved" ) {
      return res.status(400).json({ message: "Not approved by manager yet" });
    } 
    }

    // Step 2: Update message status
    leaveDoc.messages[msgIndex].status = "HR Approved";
    leaveDoc.messages[msgIndex].comment= comment;
    leaveDoc.notification.employee = true;
    await leaveDoc.save();

    // Step 3: Deduct 1 from annual leave
    if (leaveMessage.leave_type === "Annual") {
      await Leave.updateOne(
        { employee_id },
        { $inc: { remaining_leave : -1 } }
      );
    }

    await sendLeaveReply(leaveMessage,employee_id);
    res.status(200).json({ message: "Leave approved by HR & Annual Leaves updated" });
  } catch (err) {
    console.error("HR Approval Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
}

async function AdminApproveLeave(req, res) {
  const { employee_id, message_id , comment } = req.body;
  if (!employee_id || !message_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const empObjectId = new mongoose.Types.ObjectId(employee_id);

    // Step 1: Find employee leave document
    const leaveDoc = await EmployeeLeaves.findOne({ employee_id });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Employee leave doc not found" });
    }

    const getUser = await User.findOne({_id: empObjectId }); 

    const msgIndex = leaveDoc.messages.findIndex(
      (msg) => msg._id.toString() === message_id
    );
    if (msgIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }
    const leaveMessage = leaveDoc.messages[msgIndex];

    // if( getUser.role ==="user" ){
    // if (leaveMessage.status !== "Manager Approved" ) {
    //   return res.status(400).json({ message: "Not approved by manager yet" });
    // } 
    // }

    // Step 2: Update message status
    leaveDoc.messages[msgIndex].status = "Admin Approved";
    leaveDoc.messages[msgIndex].comment= comment;
    leaveDoc.notification.employee = true;
    await leaveDoc.save();
    await sendLeaveReply(leaveMessage,employee_id);

    // Step 3: Deduct 1 from annual leave
    if (leaveMessage.leave_type === "Annual") {
      await Leave.updateOne(
        { employee_id },
        { $inc: { remaining_leave : -1 } }
      );
    }

    res.status(200).json({ message: "Leave approved by Admin & Annual Leaves updated" });
  } catch (err) {
    console.error("Admin Approval Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
}

async function managerRejectLeave(req, res) {
  const { employee_id, message_id,  comment } = req.body;

  if (!employee_id || !message_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const msgObjectId = new mongoose.Types.ObjectId(message_id);

    const leaveDoc = await EmployeeLeaves.findOne({ employee_id });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Leave document not found" });
    }

    const msgIndex = leaveDoc.messages.findIndex(
      (msg) => msg._id.toString() === message_id
    );

    if (msgIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = leaveDoc.messages[msgIndex];

    if (message.status !== "Pending") {
      return res.status(400).json({ message: "Leave already processed" });
    }

    // Update status and add optional rejection note
    leaveDoc.messages[msgIndex].status = "Rejected by Manager";
     leaveDoc.messages[msgIndex].comment= comment;
    leaveDoc.notification.employee = true;

    await leaveDoc.save();
    await sendLeaveReply(leaveMessage,employee_id);

    res.status(200).json({ message: "Leave rejected by Manager" });
  } catch (err) {
    console.error("Manager rejection error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


async function hrRejectLeave(req, res) {
  const { employee_id, message_id,  comment } = req.body;

  if (!employee_id || !message_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const empObjectId = new mongoose.Types.ObjectId(employee_id);

    const leaveDoc = await EmployeeLeaves.findOne({ employee_id });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Leave document not found" });
    }

    const msgIndex = leaveDoc.messages.findIndex(
      (msg) => msg._id.toString() === message_id
    );

    if (msgIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }
    const getUser = await User.findOne({_id: empObjectId }); 

    const message = leaveDoc.messages[msgIndex];
if(getUser.role ==="user" )
    if (message.status !== "Manager Approved") {
      return res.status(400).json({ message: "Leave not yet approved by Manager" });
    }

    // Update status and optional reason
    leaveDoc.messages[msgIndex].status = "Rejected by HR";
    // if (reason) {
    //   leaveDoc.messages[msgIndex].rejection_reason = reason;
    // }
    leaveDoc.notification.employee = true;
    leaveDoc.messages[msgIndex].comment= comment;
    await leaveDoc.save();
    await sendLeaveReply(leaveMessage,employee_id);

    res.status(200).json({ message: "Leave rejected by HR" });
  } catch (err) {
    console.error("HR rejection error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function AdminRejectLeave(req, res) {
  const { employee_id, message_id,  comment } = req.body;

  if (!employee_id || !message_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const msgObjectId = new mongoose.Types.ObjectId(message_id);

    const leaveDoc = await EmployeeLeaves.findOne({ employee_id });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Leave document not found" });
    }

    const msgIndex = leaveDoc.messages.findIndex(
      (msg) => msg._id.toString() === message_id
    );

    if (msgIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = leaveDoc.messages[msgIndex];

    if (message.status !== "Manager Approved") {
      return res.status(400).json({ message: "Leave not yet approved by Admin" });
    }

    // Update status and optional reason
    leaveDoc.messages[msgIndex].status = "Rejected by Admin";
    // if (reason) {
    //   leaveDoc.messages[msgIndex].rejection_reason = reason;
    // }
    leaveDoc.notification.employee = true;
    leaveDoc.messages[msgIndex].comment= comment;
    await leaveDoc.save();
    await sendLeaveReply(leaveMessage,employee_id);

    res.status(200).json({ message: "Leave rejected by Admin" });
  } catch (err) {
    console.error("Admin rejection error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


async function sendInviteEmail({ name, email, password }) {
  const transporter = await emailConnection();
  if (!name || !email || !password) {
    throw new Error("Missing required fields");
  }
  const info = await transporter.sendMail({
    from: `<${user_email}>`,
    to: email,
    subject: `Welcome to the Team!`,
    text: `Dear ${name},

Welcome to the team! We’re excited to have you on board and look forward to the contributions you’ll bring to our organization.

To help you get started, please log in to your account using the credentials below:

Email: ${email}
Temporary Password: ${password}

You can access the portal using the following link:
🔗 ${url}/forgot_password
(Please update your password after logging in for the first time.)

If you have any questions or require assistance, don’t hesitate to reach out. We’re here to support you every step of the way.

Best regards,
The Team`,
  });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  console.log("Message sent: %s", info.messageId);
  return info;
}

module.exports = {
  sendLeave,
  leaveReply,
  inviteEmployee,
  updateMsgStatus,
  sendReminder,
  sendInviteEmail,
  managerApproveLeave,hrApproveLeave,managerRejectLeave,hrRejectLeave,AdminApproveLeave,AdminRejectLeave
};
