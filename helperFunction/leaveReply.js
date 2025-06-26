// helpers/leaveReply.helper.js
const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const { emailConnection } = require("../connection");

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
    leave_id: _id,
  } = leaveMessage;

  try {
    if (status === "HR Approved" || status === "Admin Approved") {
      const user = await EmployeeLeaves.findOne(
        {
          employee_id: employee_id,
          "messages._id": leave_id,
        },
        {
          "messages.$": 1,
        }
      );

      const leaveType = leave_type || "";

      if (leaveType === "Sick Leave") {
        await Leave.updateOne(
          { employee_id: employee_id },
          {
            $inc: {
              pending_leave: -1,
              sick_leave: -days,
            },
          }
        );
      } else {
        await Leave.updateOne(
          { employee_id: employee_id },
          {
            $inc: {
              remaining_leave: -days,
              pending_leave: -1,
            },
          }
        );
      }
    } else if (status === "HR Rejected" || status === "Admin Rejected") {
      await Leave.updateOne(
        { employee_id: employee_id },
        {
          $inc: {
            pending_leave: -1,
            rejected_leave: 1,
          },
        }
      );
    }
    sendMail(email, name, comment, status);
    if (status === "Manager Approved") {
      // Step 1: Find all users with role 'HR'
      const HRs = await User.find({ role: "HR" });
      const HR_Emails = HRs.map((hr) => hr.email);

      // Step 2: Send email to each HR
      for (const mail of HR_Emails) {
        await transporter.sendMail({
          from: `<${user_email}>`,
          to: mail,
          subject: `Leave Awaiting HR Approval`,
          text: `Dear HR Team,
      
      This is to inform you that the leave request submitted by ${name} has been approved by the Manager and is now pending your review.
      
      Leave Details:
      - Type: ${leave_type}
      - From: ${from_date}
      - To: ${to_date}
      - Days: ${days}
      - Applicant Email: ${email}
      
      Kindly log in to the system to review and take necessary action.
      
      Best Regards,  
      Codace Solutions`,
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
    status === "Admin Approved" ||
    status === "Manager Approved"
  ) {
    let approvalMessage = "";
    let subjectLine = "";

    if (status === "Manager Approved") {
      approvalMessage =
        "Your leave has been approved by the Manager and is now pending HR approval.";
      subjectLine = "Leave Status: Manager Approved (Pending HR)";
    } else if (status === "HR Approved" || status === "Admin Approved") {
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
    status === "Admin Rejected" ||
    status === "Manager Rejected"
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
