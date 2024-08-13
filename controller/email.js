const nodemailer = require("nodemailer");
const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");

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
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.email",
      service: "gmail",
      port: 587,
      auth: {
        user: "mahasagheer960@gmail.com",
        pass: "qyiy geur nspl zgrb",
      },
    });

    const info = await transporter.sendMail({
      from: `${name} <${email}>`, // sender address
      to: "iqrasaghir360@gmail.com", // list of receivers
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
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.email",
      service: "gmail",
      port: 587,
      auth: {
        user: "mahasagheer960@gmail.com",
        pass: "qyiy geur nspl zgrb",
      },
    });
    if (status === "Approved") {
      console.log(employee_id);
      const leave = await Leave.updateOne(
        { employee_id: employee_id },
        { $inc: { remaining_leave: -1, pending_leave: -1 } }
      );

      const info = await transporter.sendMail({
        from: `${name} <mahasagheer960@gmail.com>`, // sender address
        to: "iqrasaghir360@gmail.com", // list of receivers
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
        from: `${name} <mahasagheer960@gmail.com>`, // sender address
        to: "iqrasaghir360@gmail.com", // list of receivers
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
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.email",
      service: "gmail",
      port: 587,
      auth: {
        user: "mahasagheer960@gmail.com",
        pass: "qyiy geur nspl zgrb",
      },
    });
    const info = await transporter.sendMail({
      from: `${name} <mahasagheer960@gmail.com>`, // sender address
      to: "iqrasaghir360@gmail.com", // list of receivers
      subject: `Welcome to the Team! `, // Subject line
      text: `Dear ${name},

Welcome aboard! We are thrilled to have you as a part of our team.

To get started, please log in to your account using the following credentials:

Email: ${email}
Password: ${password}

You can access the portal using this URL: http://localhost:5173/login

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

    const employeeMessage = await EmployeeLeaves.updateOne(
      {
        "messages._id": employee_id, // Find the specific message by its ID
      },
      {
        $set: {
          "messages.$.status": status, // Update only the status of the matched message
        },
      }
    );
    res.status(200).json({ data: employeeMessage });
  } catch (err) {
    res.status(500).json({ msg: "unable to update status" });
  }
}
module.exports = { sendLeave, leaveReply, inviteEmployee, updateMsgStatus };
