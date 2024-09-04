const cron = require("node-cron");
const EmployeeLeaves = require("../modal/receive_leaves");

// Function to toggle 'reminder' every 6 hours
const startReminderCron = () => {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const employees = await EmployeeLeaves.find();
      for (const employee of employees) {
        employee.messages.forEach((message) => {
          message.reminder = true;
        });
        await employee.save();
      }
      console.log("Reminder fields updated successfully.");
    } catch (err) {
      console.error("Error updating reminder fields:", err);
    }
  });
};

module.exports = startReminderCron;
