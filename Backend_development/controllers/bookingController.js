const User = require("../models/userSchema");
const Room = require("../models/roomSchema");
const Booking = require("../models/bookingSchema");
const { sendBookingConfirmationEmail } = require("../utils/emailService");

const createBooking = async (req, res) => {
    try {
        // Extract Request Data
        const { guestName, checkInDate, checkOutDate, roomId } = req.body;
        const userId = req.user.id;

        // Basic Input Validation (Presence Check)
        if (!guestName || !checkInDate || !checkOutDate || !roomId) {
            res.status(400);
            throw new Error("All fields are Mandatory...");
        }

        // Date Conversion
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Date Validation (Order Check)
        if (checkIn > checkOut) {
            return res.status(400).json({ message: "error: checkIn date must be before checkOut date" });
        }

        // Room Availability Check
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'Available') {
            return res.status(400).json({ message: "room not found or is currently Unavailable" });
        }

        // Check for Conflicting Bookings
        const conflictingBooking = await Booking.findOne({
            roomId: roomId,
            status: { $in: ['Confirmed', 'Pending'] },
            $or: [
                { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
            ]
        });

        if (conflictingBooking) {
            return res.status(409).json({ message: "Sorry , the rooms are already booked for the selected dates" });
        }

        // Create New Booking Document (In Memory)
        const newBooking = new Booking({
            userId,
            roomId,
            guestName,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            // status defaults based on schema
        });

        // Save New Booking to Database
        const savedBooking = await newBooking.save();

        sendBookingConfirmationEmail(userId, savedBooking, room);

        // Send Success Response
        res.status(201).json({
            message: 'Booking successful!',
            booking: savedBooking,
        });

    } catch (error) {
        console.error('Booking Controller error ', error);
        // Handle specific Mongoose validation errors if not caught by pre-save
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during booking process.' });
    }
};


const getBookings = async (req, res) => {
    try {
        if (!req.user && !req.user.id) {
            res.status(400);
            throw new Error("User is not Authenticated");
        }

        const bookings = await Booking.find({ userId: req.user.id })
            .populate('roomId', 'roomNumber roomType pricePerNight')
            .populate('userId', 'userName email')
            .sort({ checkInDate: -1 });

        res.status(200).json({ bookings });

    } catch (error) {
        console.error('Error in getBookings: ', error);
        res.status(500).json({ message: 'server error fetching bookings.' });
    }
};

const getBookingById = async (req, res) => {
    try {
        // 1. Extract Booking ID from parameters
        const bookingId = req.params.id;

        // 2. Basic validation: Check if ID is provided
        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required." });
        }

        // --- Authentication/Authorization Check---
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized." }); // Or 403 Forbidden
        }

        // 3. Query Database for Booking by _id
        const booking = await Booking.findById(bookingId)
            .populate('roomId', 'roomNumber roomType pricePerNight')
            .populate('userId', 'userName email');

        // --- Authorization Check (check ownership AFTER fetching) ---
        if (booking && booking.userId && booking.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have permission to view this booking." });
        }

        // 4. Check if Booking Was Found 0r n0t
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // 6. Handle Booking Found (Send 200 Success)
        res.status(200).json({ booking });

    } catch (err) {
        console.error("Error in getBookingById:", err);

        // Handle specific Mongoose CastError for invalid ID format
        // This happens if req.params.id is not a valid MongoDB ObjectId
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid Booking ID format." });
        }
        // Handle other server errors
        res.status(500).json({ message: 'Server error fetching booking.' });
    }
};


// cancel booking (only before one day from the booking date)
const cancelBooking = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'user is not Authenticated!!!' });
        }

        const bookingId = req.params.id;
        if (!bookingId) {
            return res.status(404).json({ message: 'missing parameter: Booking Id is Required!!!' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking Not Found!!! " })
        }

        if (booking && booking.userId && booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have Permissions to Cancel this booking. " })
        }

        if (booking.status === "CheckedIn" || booking.status === "CheckedOut" || booking.status === "Cancelled") {
            return res.status(400).json({ message: `Cannot cancel a booking that is already ${booking.status}` });
        }

        const checkInDate = new Date(booking.checkInDate);
        const now = new Date();

        const fortyEightHrsInMs = 48 * 60 * 60 * 1000;
        const CancellationCutoffTime = new Date(checkInDate - fortyEightHrsInMs);

        if (now >= CancellationCutoffTime) {
            return res.status(400).json({ message: "Cancellation must be made atleast 48 hours before the Check-in Date. " });
        }

        booking.status = "Cancelled";
        const updatedBooking = await booking.save();

        res.status(200).json({
            message: 'Successfully Cancelled the booking!!!',
            booking: updatedBooking
        });

    } catch (err) {
        console.error("Error in cancelBooking: ", err);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid Booking or Room ID format." });
        }
        res.status(500).json({ message: 'Server Error Canceling booking' });
    }
}

// update booking 
const updateBooking = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'user is not Authenticated!!!' });
        }

        const bookingId = req.params.id;
        if (!bookingId) {
            return res.status(404).json({ message: 'missing parameter: Booking Id is Required!!!' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking Not Found!!! " })
        }

        if (booking && booking.userId && booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have Permissions to Update this booking. " })
        }

        if (booking.status === "CheckedIn" || booking.status === "CheckedOut" || booking.status === "Cancelled") {
            return res.status(400).json({ message: `Cannot Update a booking that is already ${booking.status}` });
        }

        const { guestName, checkInDate, checkOutDate, roomId } = req.body;
        if (!guestName && !checkInDate && !checkOutDate && !roomId) {
            return res.status(400).json({ message: "No valid fields provided for update." })
        }

        if (guestName) {
            booking.guestName = guestName;
        }

        if (checkInDate) {
            booking.checkInDate = new Date(checkInDate);
        }
        if (checkOutDate) {
            booking.checkOutDate = new Date(checkOutDate);
        }
        if (booking.checkInDate && booking.checkOutDate && booking.checkInDate > booking.checkOutDate) {
            return res.status(400).json({ message: "Check-in date must be before Check-out date" });
        }

        if (roomId) {
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(400).json({ message: "Room not found" });
            }
            if (room.status !== 'Available') {
                return res.status(400).json("Room is currently Unavailable");
            }
            booking.roomId = roomId;
        }

        const updatedBooking = await booking.save();
        res.status(200).json({
            message: "Booking Updated Successfully. ",
            booking: updatedBooking
        });


    } catch (err) {
        console.error("Error in updateBooking: ", err);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid Booking or Room ID format." });
        }
        res.status(500).json({ message: 'Server Error Updating booking' });
    }
}

const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('roomId', 'roomNumber roomType pricePerNight')
            .populate('userId', 'userName email')
            .sort({ checkInDate: -1 })
            .lean();
        console.log('admin getAllBookings -> found bookings:', Array.isArray(bookings) ? bookings.length : 0);
        return res.status(200).json({ bookings });
    } catch (err) {
        console.error('getAllBookings error', err);
        return res.status(500).json({ message: 'Server error fetching all bookings' });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    cancelBooking,
    updateBooking,
    getAllBookings
};








