const crypto = require("crypto-js");
const { setUser } = require("../service/token");

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

        res.json({
          msg: "User Logged In",
          token: token,
          data: data,
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
