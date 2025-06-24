const crypto = require("crypto-js");
const { setUser } = require("../service/token");
const Setting = require("../modal/systemSetting");
const User = require("../modal/user");
const { encrypt_key } = require("../config");

async function userLogin(req, res) {
  try {
    const { email, password } = req.body;
    const data = await User.findOne({ email: email });

    console.log("🔍 Found user:", data);

    if (!data) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Decrypt stored password
    const decrypted = crypto.AES.decrypt(data.password, encrypt_key).toString(
      crypto.enc.Utf8
    );

    console.log("🔐 Decrypted password:", decrypted);
    console.log("🔑 Provided password:", password);

    if (decrypted !== password) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const token = setUser(data);
    const Theme = await Setting.findOne().sort({ _id: -1 });
    const logoPath = Theme?.keyValuePairs?.get("logo") || null;
    const color = Theme?.keyValuePairs?.get("color") || null;

    res.json({
      msg: "User Logged In",
      token: token,
      data: data,
      logoPath: logoPath,
      color: color,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  userLogin,
};
