const cron = require("node-cron");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const hbs = require("handlebars");
const EmployeeLeaves = require("../modal/receive_leaves");
const User = require("../modal/user");
const { emailConnection } = require("../connection");
const { user_email } = require("../config");

const pdf_report = () => {
  const compile = async function (templateName, data) {
    const filepath = path.join(
      process.cwd(),
      "templates",
      `${templateName}.hbs`
    );
    try {
      const html = await fs.readFile(filepath, "utf-8");
      return hbs.compile(html)(data);
    } catch (err) {
      throw new Error(`Error reading template file: ${err.message}`);
    }
  };

  const generatePDF = async () => {
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
      await page.pdf({
        path: "output.pdf",
        format: "A4",
        printBackground: true,
      });
      await browser.close();

      console.log("PDF generated successfully!");
      const pdfPath = path.join(process.cwd(), "output.pdf");
      const transporter = await emailConnection();
      const HR = await User.find({ role: { $in: ["HR", "admin"] } });

      if (HR.length === 0) {
        console.error("No HR users found");
        return;
      }

      const HRemails = HR.map((hr) => hr.email);

      for (const mail of HRemails) {
        try {
          const info = await transporter.sendMail({
            from: `admin <${user_email}>`,
            to: mail,
            subject: "Leave History Report",
            text: "Please find the attached leave history report.",
            attachments: [
              {
                filename: "Leave_History_Report.pdf",
                path: pdfPath,
              },
            ],
          });
          console.log("Message sent: %s", info.messageId);
        } catch (sendError) {
          console.error(`Error sending email to ${mail}:`, sendError);
        }
      }
    } catch (err) {
      console.error(
        "Error generating PDF report or sending email:",
        err.message
      );
    }
  };

  cron.schedule("0 0 1 * *", async () => {
    console.log("Cron job running at", new Date());
    await generatePDF();
  });
};

module.exports = pdf_report;
