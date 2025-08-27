const mongoose = require("mongoose");
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const Room = require("../models/roomSchema");

const seedRooms = [
    {roomNumber: 101 , roomType:"Single", pricePerNight: 1000 , status: "Available" , roomCapacity:2},
    {roomNumber: 102 , roomType:"Single", pricePerNight: 1000 , status: "Available" , roomCapacity:2},
    {roomNumber: 103 , roomType:"Double", pricePerNight: 1800 , status: "Available" , roomCapacity:4},
    {roomNumber: 104 , roomType:"Double", pricePerNight: 1800 , status: "Available" , roomCapacity:4},
    {roomNumber: 105 , roomType:"Family", pricePerNight: 3000 , status: "Available" , roomCapacity:6},
    {roomNumber: 106 , roomType:"Family", pricePerNight: 3000 , status: "Available" , roomCapacity:6}
]

const seedDB = async () => {
    try{   
        await mongoose.connect(process.env.CONNECTION_STRING);
        console.log("MongoDB connected for seeding");

        await Room.deleteMany({});
        console.log("Cleared all existing rooms");

        await Room.insertMany(seedRooms);
        console.log("Rooms seeded successfully!");
    }catch(error){
        console.error("error seeding the database ", error);
    }finally{
        await mongoose.connection.close();
        console.log("MongoDB connection is closed");
    }
}

seedDB();

