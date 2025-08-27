const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const User = require('../models/userSchema');

(async () => {
    try {
        const uri = process.env.CONNECTION_STRING;
        if (!uri) throw new Error('CONNECTION_STRING missing in .env (include /dbName)');

        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        const email = process.argv[2] || 'admin@example.com';
        const plainPassword = process.argv[3] || 'AdminPass123';

        // create or update admin user
        const hash = await bcrypt.hash(plainPassword, 10);
        const update = {
            userName: 'admin',
            email,
            password: hash,
            role: 'admin',
            updatedAt: new Date()
        };
        const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
        const admin = await User.findOneAndUpdate({ email }, update, opts);

        console.log('Admin ensured:', email, '\npassword:', plainPassword);
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err.message || err);
        process.exit(1);
    }
})();