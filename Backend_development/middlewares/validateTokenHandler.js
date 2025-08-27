const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const validateToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // debug log (remove in production)
    console.log(`validateToken: ${req.method} ${req.originalUrl} Authorization=${!!authHeader}`);

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        // respond and return instead of throwing
        return res.status(401).json({ message: "user is not Authorized" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "user is not Authorized" });
        }

        req.user = decoded.user || decoded;
        next();
    });
});

module.exports = validateToken;