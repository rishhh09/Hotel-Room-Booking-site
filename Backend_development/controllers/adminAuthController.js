const Admin = require('../models/userSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const payload = { user: { id: admin._id.toString(), email: admin.email, role: admin.role } };
        const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });

        res.json({ token, userName: admin.email, role: admin.role });
    } catch (err) {
        console.error('Admin login error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { loginAdmin };