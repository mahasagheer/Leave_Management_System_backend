const crypto = require("crypto-js");

const User = require("../modal/user");

const Leave = require("../modal/leave_balance");
const EmployeeLeaves = require("../modal/receive_leaves");
const key = "sikfm%$90is";

const { encrypt_key } = require("../config");

async function addUser(req, res) {
  try {
    const {
      name,
      salary,
      age,
      exit_date,
      Job_title,
      gender,
      hire_date,
      department,
      city,
      email,
      password,
      role,
      phone,
    } = req.body;
    let existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "User with this email already exists" });
    }

    const encrypted = crypto.AES.encrypt(password, encrypt_key).toString();

    let newUser = await User.create({
      name,
      salary,
      age,
      exit_date,
      Job_title,
      gender,
      hire_date,
      department,
      city,
      email,
      password: encrypted,
      role,
      phone,
    });

    res.status(201).json({ msg: "success", user: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Users can't find" });
  }
}

async function allUsers(req, res) {
  try {
    const getUsers = await User.find({});
    res.status(200).json(getUsers);
  } catch (err) {
    res.status(500).json({ msg: "Users can't find" });
  }
}
async function singleUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        msg: "Unable to get single product",
      });
    }
    const User_LeaveDetail = await EmployeeLeaves.find(
      {
        employee_id: req.params.id,
      },
      {
        messages: 1,
        _id: 0,
      }
    );

    return res.json({ data: user, leaves: User_LeaveDetail });
  } catch {
    res.status(404).json({
      msg: "Unable to get single product",
    });
  }
}

async function updateUser(req, res) {
  try {
    const {
      name,
      salary,
      age,
      exit_date,
      Job_title,
      gender,
      hire_date,
      department,
      city,
      email,
      password,
    } = req.body;
    const encrypted = crypto.AES.encrypt(password, encrypt_key).toString();

    const update = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!update) {
      return res.status(404).json({
        msg: "Unable to update user",
      });
    }
    return res.status(200).json(update);
  } catch {
    res.status(404).json({
      msg: "Unable to update",
    });
  }
}

async function deleteUser(req, res) {
  try {
    const delete_User = await User.findByIdAndDelete(req.params.id);
    if (!delete_User) {
      return res.status(404).json({
        msg: "Unable to delete user",
      });
    }
    const delete_User_LeaveDetail = await Leave.find({
      employee_id: req.params.id,
    });
    const delete_User_Messages = await EmployeeLeaves.find({
      employee_id: req.params.id,
    });

    if (delete_User_LeaveDetail?.length > 0) {
      await Leave.findByIdAndDelete(delete_User_LeaveDetail?._id);
    }
    if (delete_User_Messages?.length > 0) {
      await EmployeeLeaves.findByIdAndDelete(delete_User_Messages?._id);
    }
    res.json({
      msg: "Deleted SuccessFully",
      data: delete_User_LeaveDetail,
    });
  } catch (e) {
    console.log("3434", e);
    return res.status(404).json({
      msg: "Unable to delete product",
    });
  }
}
async function resetpassword(req, res) {
  try {
    const { email, password } = req.body;
    const encrypted = crypto.AES.encrypt(password, encrypt_key).toString();
    const updatePassword = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: encrypted } },
      { new: true }
    );
    if (updatePassword) {
      res
        .status(200)
        .json({ msg: "Updated password Successfully", data: updatePassword });
    }
    if (!updatePassword) {
      res.status(400).json({ msg: "Unable to update password" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Unable to update password" });
  }
}
module.exports = {
  addUser,
  allUsers,
  singleUser,
  deleteUser,
  updateUser,
  resetpassword,
};
