const jwt = require('jsonwebtoken');

const tokenValidation = (req, res, next, providedUserId) => {
  const token = req.cookies.token;
  if (token) {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    if (userId === providedUserId) {
      next();
    } else {
      res.status(401).json({ message: 'Invalid token was provided' });
    }
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
};

module.exports = tokenValidation;
