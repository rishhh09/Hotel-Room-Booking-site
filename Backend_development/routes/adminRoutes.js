const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/adminAuthController');
const validateToken = require('../middlewares/validateTokenHandler');
const { protectAdmin } = require('../middlewares/adminMiddleware');

const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');

router.post('/login', loginAdmin);

// PUBLIC: list rooms (anyone can view)
router.get('/rooms', roomController.getRooms);

// protected admin endpoints
router.use(validateToken);
router.use(protectAdmin);

// admin-only room status change
router.put('/rooms/:id/status', roomController.updateRoomStatus);

// admin-only bookings endpoints
// -> use getAllBookings for admin view
router.get('/bookings', bookingController.getAllBookings);
router.put('/bookings/:id/status', async (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;
    try {
        const Booking = require('../models/bookingSchema');
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        booking.status = status;
        await booking.save();
        return res.json({ booking });
    } catch (err) {
        console.error('admin update booking status', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;