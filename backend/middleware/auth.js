const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Auth Error: No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(500).json({ message: 'Invalid Token' });
    }
};