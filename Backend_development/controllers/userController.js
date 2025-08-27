const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
        res.status(400);
        throw new Error("all fields are mandatory");
    }

    const userAvailable = await User.findOne({ email });
    if (userAvailable) {
        res.status(400);
        throw new Error("this email is already taken");
    }

    // password hashing 
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log("hashed password : " , hashedPassword);

    const user = await User.create({
        userName,
        email,
        password: hashedPassword
    });

    console.log(`user is created : ${user}`);

    if (user) {
        res.status(201).json({ _id: user.id, email: user.email });
    } else {
        res.status(400);
        throw new Error("User data is not valid");
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("all fields are mandatory");
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // ONLY include non-sensitive data needed for authentication/authorization
        const payload = { user: { id: user._id.toString(), email: user.email, role: user.role } };
        const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
        return res.status(200).json({ token, userName: user.userName, role: user.role });
    } else {
        res.status(401);
        throw new Error("email and password are not valid");
    }
};

const userInfo = async (req, res) => {
    if (!req.user) {
        res.status(400).json({ message: "user is not authorized" });
    }
    res.status(200).json(req.user);
}

module.exports = { registerUser, loginUser, userInfo };
