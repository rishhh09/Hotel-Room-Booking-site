const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    userName:{
        type: String , 
        required : [true , "Enter your user name.."] 
    },

    email: {
        type: String , 
        required: [true , "Enter your email address"], 
        unique: [true, "This email is already taken"]
    },

    password: {
        type: String , 
        required: [true , "Please enter the user Password"]
    },
    
    role: {
        type: String , 
        enum: ["admin" , "user"],
        default: "user"
    }
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User" , userSchema);