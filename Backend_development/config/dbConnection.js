const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async() => {
    try{
        console.log("Attempting to connect to the database...")
        const connect = await mongoose.connect(process.env.CONNECTION_STRING);
        console.log("Database connected:", 
            connect.connection.host , 
            connect.connection.name
        );
    }catch(err){
        console.error("error conneting database : " , err.message);
        process.exit(1);
    }
}

module.exports = connectDB;

