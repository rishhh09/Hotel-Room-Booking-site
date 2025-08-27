const express = require("express");
const validateToken = require("../middlewares/validateTokenHandler");
const router = express.Router();
const {
        createBooking, 
        getBookings , 
        getBookingById, 
        cancelBooking, 
        updateBooking
} = require("../controllers/bookingController");

router.route('/')
    .post(validateToken , createBooking)
    .get(validateToken , getBookings);
    
router.route('/:id')
    .get(validateToken , getBookingById)
    .delete(validateToken , cancelBooking)
    .patch( validateToken , updateBooking);

module.exports = router;