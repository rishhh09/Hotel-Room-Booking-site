const Room = require("../models/roomSchema");
const Booking = require("../models/bookingSchema");
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const createRoom = async (req, res) => {

    try {
        const { roomNumber, roomType, pricePerNight, status, roomCapacity } = req.body;

        if (!roomNumber && !roomType && !pricePerNight && !roomCapacity) {
            return res.status(400).json({ message: "All fields are Mandatory!!!" });
        }

        const roomExist = await Room.findOne({ roomNumber });
        if (roomExist) {
            return res.status(400).json({ message: `Room Number ${roomNumber} already exists!!!` });
        }

        const newRoom = new Room({
            roomNumber,
            roomType,
            pricePerNight,
            status,
            roomCapacity
        });

        const savedRoom = await newRoom.save();
        res.status(200).json({
            message: "Room created successfully!!!",
            savedRoom: savedRoom
        });
    } catch (err) {
        console.error("Error creating Room: ", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Server Error creating Room" });
    }
}

const getRooms = async (req, res) => {
    try {
        console.log('getRooms called, req.user=', req.user);
        const rooms = await Room.find().lean();
        return res.status(200).json({ rooms });
    } catch (err) {
        console.error('roomController.getRooms error:', err);
        return res.status(500).json({ message: 'Server error fetching rooms' });
    }
};

const getRoomById = async (req, res) => {
    try {
        const roomId = req.params.id;

        // Pre-validate ObjectId format (good practice)
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid room ID format." });
        }

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        res.status(200).json(room);
    } catch (err) {
        console.error("Error in getRoomById: ", err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Invalid room ID format (caught as CastError)." });
        }
        res.status(500).json({ message: "Server Error in getRoomById." });
    }
};

// --- Added handlers ---
const updateRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const updates = req.body;
        const room = await Room.findByIdAndUpdate(roomId, updates, { new: true });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        return res.status(200).json(room);
    } catch (err) {
        console.error('updateRoom error', err);
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid Room ID' });
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateRoomStatus = async (req, res) => {
    try {
        const roomId = req.params.id;
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Status is required' });

        // Prevent setting unavailable status if future bookings exist
        if (['Under Maintenance', 'Disabled'].includes(status)) {
            const futureBooking = await Booking.findOne({
                roomId,
                checkInDate: { $gte: new Date() }
            });
            if (futureBooking) {
                return res.status(409).json({ message: 'Cannot set room to unavailable status; future bookings exist.' });
            }
        }

        const room = await Room.findByIdAndUpdate(roomId, { status }, { new: true });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        return res.status(200).json(room);
    } catch (err) {
        console.error('updateRoomStatus error', err);
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid Room ID' });
        return res.status(500).json({ message: 'Server error' });
    }
};

// multer setup (store in public/uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    }
});
const upload = multer({ storage });

// export upload middleware so routes can use it
module.exports.upload = upload;

// new handler: upload multiple images for a room
const uploadRoomImages = async (req, res) => {
    try {
        const roomId = req.params.id;
        if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files uploaded' });

        const urls = req.files.map(f => `/uploads/${f.filename}`); // saved relative URL
        const room = await Room.findByIdAndUpdate(roomId, { $push: { images: { $each: urls } } }, { new: true });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        return res.status(200).json({ room });
    } catch (err) {
        console.error('uploadRoomImages error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    updateRoomStatus,
    uploadRoomImages,
    upload // multer middleware export
};