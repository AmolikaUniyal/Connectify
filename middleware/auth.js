const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authorization = req.header("Authorization");
  const token = authorization && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : authorization;

  if (!token) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next(); // go to next step (route)
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
