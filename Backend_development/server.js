const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const connectDB = require("./config/dbConnection");
const port = process.env.PORT || 5000;
const cors = require("cors");
const path = require('path');
connectDB();

app.use(express.json());
app.use(cors());

// serve uploaded images (fix path & add debug log)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
console.log('Serving uploads from:', path.join(__dirname, 'public', 'uploads'));

app.use("/api/user/", require("./routes/userRoutes"));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use("/api/booking/", require("./routes/bookingRoutes"));
app.use("/api/room/", require("./routes/roomRoutes"));

app.listen(port, () => { console.log(`app is listening on port ${port}`); })
