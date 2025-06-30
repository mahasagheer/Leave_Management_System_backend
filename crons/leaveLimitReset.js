const cron = require("node-cron");
const Leave = require("../modal/leave_balance"); // path to your Leave model

// Schedule the cron job to run at midnight on Jan 1st every year
cron.schedule("0 0 1 1 *", async () => {
  try {
    console.log("🔁 Running annual leave reset job...");

    const currentYear = new Date().getFullYear();

    // Reset used leaves and update the leave_year
    await Leave.updateMany({}, {
      $set: {
        used_paid_leaves: 0,
        used_unpaid_leaves: 0,
        leave_year: currentYear,
        rejected_leaves: 0,
        pending_leaves: 0,
      }
    });

    console.log("✅ Annual leave reset completed successfully.");
  } catch (error) {
    console.error("❌ Error running annual leave reset cron job:", error.message);
  }
});
