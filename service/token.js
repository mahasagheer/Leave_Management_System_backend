const jwt = require("jsonwebtoken");
const { secret_key } = require("../config");

function setUser(user) {
  return jwt.sign(
    {
      _id: user.id,
      email: user.email,
    },
    secret_key,
    { expiresIn: "24hr" }
  );
}
function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret_key);
  } catch {
    return null;
  }
}

module.exports = {
  setUser,
  getUser,
};
