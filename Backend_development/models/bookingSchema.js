const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId ,
        ref: "User",
        required: true , 
    },

    roomId: {
        type: mongoose.Schema.Types.ObjectId ,
        ref: "Room",
        required: true ,
    },

    guestName: {
        type: String, 
        required: true,
        trim: true
    },

    checkInDate: {
        type: Date , 
        required: true
    },

    checkOutDate: {
        type: Date , 
        required: true
    },

    status: {
        type: String ,  
        enum: ["Confirmed" , "Pending" , "Cancelled" , "checkedIn" , "checkedOut"] ,
        default: "Confirmed" ,
        index: true  
    }
} , {timestamps: true});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
