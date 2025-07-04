// helpers/leaveReply.helper.js
const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const { emailConnection } = require("../connection");
const { user_email } = require("../config");
const User=require("../modal/user")

async function sendLeaveReply(leaveMessage, employee_id) {
  const {
    name,
    email,
    comment,
    status,
    days,
    leave_type,
    to_date,
    from_date,
_id,
  } = leaveMessage;
  const transporter = await emailConnection();

  try {
    if (status === "HR Approved" || status === "Admin Approved") {
      const user = await EmployeeLeaves.findOne(
        {
          employee_id: employee_id,
          "messages._id": _id,
        },
        {
          "messages.$": 1,
        }
      );

      const leaveType = leave_type || "";

      if (leaveType === "unpaid-leave") {
        await Leave.updateOne(
          { employee_id: employee_id },
          {
            $inc: {
              pending_leave: -1,
              used_unpaid_leaves: -days,
              remaining_unpaid_leave: -days,
            },
          }
        );
        sendMail(email, name, comment, status);
      } else if(leave_type === "paid-leave") {
        await Leave.updateOne(
          { employee_id: employee_id },
          {
            $inc: {
              remaining_paid_leave: -days,
              used_paid_leaves: -1,
            },
          }
        );
      }
      sendMail(email, name, comment, status);

    } else if (status === "HR Rejected" || status === "Admin Rejected" || status ==="Manager Rejected") {
      await Leave.updateOne(
        { employee_id: employee_id },
        {
          $inc: {
            pending_leave: -1,
            rejected_leave: +1,
          },
        }
      );
      sendMail(email, name, comment, status);
    }else if (status === "Manager Approved") {
      // Step 1: Find all users with role 'HR'
      const HRs = await User.find({ role: "HR" });
      const HR_Emails = HRs.map((hr) => hr.email);
      for (const mail of HR_Emails) {

      const token = jwt.sign(
        {
          leaveId: _id,
          approverEmail: mail,
          approverRole: role,
          action: "approve-reject",
        },
        secret_key,
        { expiresIn: "1h" }
      );
      const secureLink = `${url}/leave-action/${token}`;

      await transporter.sendMail({
        from: `<${email}>`,
        to: mail,
        subject: `Leave Application from ${name}`,
        html: `
          <p><strong>Leave Type:</strong> ${leave_type}</p>
          <p><strong>From:</strong> ${from_date}</p>
          <p><strong>To:</strong> ${to_date}</p>
          <p><strong>Days:</strong> ${days}</p>
          <p><strong>Leave Application:</strong><br/> ${leave_application}</p>
          <p><a href="${secureLink}" target="_blank">👉 Approve/Reject Leave Request</a></p>
        `,
      });
    }     
    }

    return { success: true, message: "Leave reply sent successfully." };
  } catch (error) {
    console.error("Error sending leave reply:", error);
    return { success: false, message: "Unable to send leave response." };
  }
}

async function sendMail(email, name, comment, status) {
  const transporter = await emailConnection();

  if (
    status === "HR Approved" ||
    status === "Admin Approved" 
  ) {
    let approvalMessage = "";
    let subjectLine = "";

    if (status === "HR Approved" || status === "Admin Approved") {
      approvalMessage =
        "Your leave request has been fully approved. You are now free to take the requested days off.";
      subjectLine = "Leave Status: Fully Approved ✅";
    }

    await transporter.sendMail({
      from: `<${user_email}>`,
      to: `${email}`,
      subject: subjectLine,
      text: `Hello ${name},
    
    Hope you are doing well.
    
    ${approvalMessage}
    ${comment ? `\n\nComment from reviewer: ${comment}` : ""}
    
    Please let us know if you need any further clarification, and feel free to reach out if you have any concerns.
    
    Best Regards,  
    Codace Solutions`,
    });
  } else if (
    status === "HR Rejected" ||
    status === "Admin Rejected" || status === "Mananger Rejected"
  ) {
    let rejectionBy = "";

    if (status === "Manager Rejected") {
      rejectionBy = "Manager";
    } else if (status === "HR Rejected") {
      rejectionBy = "HR Department";
    } else if (status === "Admin Rejected") {
      rejectionBy = "Admin";
    }

    await transporter.sendMail({
      from: `<${user_email}>`,
      to: `${email}`,
      subject: `Leave Request Rejected by ${rejectionBy}`,
      text: `Hello ${name},

Hope you are doing well.

Your recent leave request has been reviewed and unfortunately, it has been rejected by the ${rejectionBy} due to current operational needs.
${comment ? `\n\nComment from reviewer: ${comment}` : ""}

We understand this may be disappointing. Please feel free to reach out if you need any clarification or wish to discuss this further.

Best Regards,  
Codace Solutions`,
    });
  }
}
module.exports = sendLeaveReply;
