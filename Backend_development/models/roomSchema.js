const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: Number,
        unique: [true, "room number is required"],
        required: true,
        index: true,
        trim: true
    },
    roomType: {
        type: String,
        required: true,
        enum: ["Single", "Double", "Family"],
        trim: true
    },
    pricePerNight: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"]
    },
    status: {
        type: String,
        enum: ["Available", "Disabled", "Under Maintenance"],
        default: "Available",
        index: true
    },
    roomCapacity: {
        type: Number,
        required: [true, "capacity is required"],
        min: [1, "capacity must be atleast one"]
    },
    image: { type: String }, // optional single image (backwards compat)
    images: [{ type: String }] // <-- add this
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);