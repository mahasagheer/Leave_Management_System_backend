const LeaveLimit = require("../modal/leave_limit");

// Create or Update leave limits by staff_type and year
exports.setLeaveLimits = async (req, res) => {
  try {
    const { paid_leave_limit, unpaid_leave_limit, staff_type } = req.body;
    const currentYear = new Date().getFullYear();

    if (!staff_type) {
      return res.status(400).json({ error: "Staff type is required" });
    }

    // Check if a limit already exists for this staff_type and year
    const existingLimit = await LeaveLimit.findOne({
      applicable_year: currentYear,
      staff_type,
    });

    if (existingLimit) {
      existingLimit.paid_leave_limit = paid_leave_limit;
      existingLimit.unpaid_leave_limit = unpaid_leave_limit;
      await existingLimit.save();

      return res.status(200).json({
        message: "Leave limits updated successfully",
        data: existingLimit,
      });
    }

    // Create new limit
    const newLimit = await LeaveLimit.create({
      paid_leave_limit,
      unpaid_leave_limit,
      applicable_year: currentYear,
      staff_type,
    });

    res.status(201).json({
      message: "Leave limits set successfully",
      data: newLimit,
    });
  } catch (error) {
    console.error("Error setting leave limits:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Get leave limits (optional for UI)
exports.getLeaveLimits = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    console.log("🎯 Fetching leave limits for year:", currentYear);

    const limits = await LeaveLimit.findOne({ applicable_year: currentYear });

    if (!limits) {
      console.log("⚠️ No limits found for year:", currentYear);
      return res.status(404).json({ message: "Leave limits not set for this year" });
    }

    console.log("✅ Leave limits found:", limits);
    res.status(200).json({ data: limits });
  } catch (error) {
    console.error("❌ Error fetching leave limits:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getAllLeaveLimits = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const limits = await LeaveLimit.find({ applicable_year: currentYear });
    res.status(200).json({ data: limits });
  } catch (err) {
    console.error("Error fetching leave limits:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
