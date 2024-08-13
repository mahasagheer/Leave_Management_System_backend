const jwt = require("jsonwebtoken");
const secretKey = "67%$jam%$76";

function setUser(user) {
  return jwt.sign(
    {
      _id: user.id,
      email: user.email,
    },
    secretKey,
    { expiresIn: "24hr" }
  );
}
function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secretKey);
  } catch {
    return null;
  }
}

module.exports = {
  setUser,
  getUser,
};
