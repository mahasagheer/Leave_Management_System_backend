const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const { user_email, to, url } = require("../config");
const { emailConnection } = require("../connection");

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
    const info = await transporter.sendMail({
      from: `${name} <${user_email}>`, // sender address
      to: `${to}`, // list of receivers
      subject: `Leave Application from ${name} `, // Subject line
      text: `Leave Type : ${leave_type}
       From: ${from_date}
       To: ${to_date}
       Days:${days}
       Leave Application: ${leave_application}`, // plain text body
    });
    console.log("Message sent: %s", info.messageId);

    res.status(200).json({ msg: "Leave send successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
  }
}

async function leaveReply(req, res) {
  try {
    const { name, email, comment, employee_id, status } = req.body;
    const transporter = await emailConnection();

    if (status === "Approved") {
      console.log(employee_id);
      const leave = await Leave.updateOne(
        { employee_id: employee_id },
        { $inc: { remaining_leave: -1, pending_leave: -1 } }
      );

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
      Best Regards,
      Iqra Sagheer`, // plain text body
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    res.status(500).json("Unable to send employee credentials");
  }
}

async function updateMsgStatus(req, res) {
  try {
    const { employee_id, status } = req.body;

    // Find the document that contains the message and update its status
    const employeeMessage = await EmployeeLeaves.findOneAndUpdate(
      { "messages._id": employee_id }, // Find the specific message by its ID
      { 
        $set: { "messages.$.status": status } // Update only the status of the matched message
      },
      { new: true } // Return the modified document after the update
    );

    if (!employeeMessage) {
      return res.status(404).json({ msg: "Message not found" });
    }

    res.status(200).json({ msg: "Status updated successfully", data: employeeMessage });
  } catch (err) {
    console.error("Error updating message status:", err);
    res.status(500).json({ msg: "Unable to update status" });
  }
}


module.exports = { sendLeave, leaveReply, inviteEmployee, updateMsgStatus };
