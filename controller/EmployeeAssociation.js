const User = require("../modal/user")

async function GetAllEmployees(req,res){
    try {
        const employees = await User.find({ role: "user" }).select("_id name email Job_title");
        console.log(employees)
        res.status(200).json(employees);
      } catch (error) {
        res.status(500).json({ message: "Error fetching employees", error: error.message });
      }
}



// routes/user.js or manager.js
async function assignEmployees(req, res) {
  const { employeeIds, managerId } = req.body;

  try {
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== "Manager") {
      return res.status(404).json({ message: "Manager not found" });
    }

    // Merge old + new and remove duplicates using Set
    const merged = new Set([
      ...manager.associatedEmployees.map((id) => id.toString()),
      ...employeeIds.map((id) => id.toString()),
    ]);

    manager.associatedEmployees = Array.from(merged);
    await manager.save();

    res.status(200).json({ message: "Employees assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

  
async function GetAssociatedEmployees (req,res){
    const { managerId } = req.params;

    try {
      const manager = await User.findOne({ _id : managerId}).populate("associatedEmployees");
      if (!manager || manager.role !== "Manager") {
        return res.status(404).json({ message: "Manager not found" });
      }
  
      res.status(200).json(manager.associatedEmployees);
    } catch (err) {
      res.status(500).json({ message: "Error fetching employees", error: err.message });
    }
  
}  

async function UnassignEmployees(req,res){
    const { managerId, employeeId } = req.body;

    try {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "Manager") {
        return res.status(404).json({ message: "Manager not found" });
      }
  
      // Remove the employee from associatedEmployees array
      manager.associatedEmployees = manager.associatedEmployees.filter(
        (id) => id.toString() !== employeeId
      );
      await manager.save();
  
      res.status(200).json({ message: "Employee unassigned successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
}

module.exports={GetAllEmployees,assignEmployees,GetAssociatedEmployees, UnassignEmployees}