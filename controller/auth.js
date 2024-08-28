const crypto = require("crypto-js");
const { setUser } = require("../service/token");
const Setting = require("../modal/systemSetting");

const User = require("../modal/user");

const { encrypt_key } = require("../config");

async function userLogin(req, res) {
  try {
    const { email, password } = req.body;
    let data = await User.findOne({ email: email });
    if (data) {
      const decrypted = crypto.AES.decrypt(data.password, encrypt_key).toString(
        crypto.enc.Utf8
      );
      if (decrypted === password) {
        const token = setUser(data);
        const Theme = await Setting.findOne().sort({ _id: -1 });
        const logoPath = Theme.keyValuePairs.get("logo");
        const color = Theme.keyValuePairs.get("color");
        res.json({
          msg: "User Logged In",
          token: token,
          data: data,
          logoPath: logoPath,
          color: color,
        });
      }
    } else {
      res.json({
        msg: "User Not found",
      });
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
}
module.exports = {
  userLogin,
};
