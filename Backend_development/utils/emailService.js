const nodemailer = require('nodemailer');
const User = require('../models/userSchema');

// Configure your email transporter
// IMPORTANT: For production, use a dedicated email service (SendGrid, Mailgun, AWS SES, Postmark)
// For development/testing, you can use Gmail, but you'll need to set up an "App password"
// if you have 2FA enabled, or enable "Less secure app access" (less recommended).
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  
    }
});

/**
 * Sends a booking confirmation email.
 * @param {string} userId - The ID of the user who made the booking.
 * @param {object} bookingDetails - The saved booking object from Mongoose.
 * @param {object} roomDetails - The room object associated with the booking.
 */
const sendBookingConfirmationEmail = async (userId, bookingDetails, roomDetails) => {
    try {
        // Fetch user details to get their email address
        const user = await User.findById(userId);
        if (!user) {
            console.error('Error sending email: User not found for ID:', userId);
            return;
        }

        const userEmail = user.email;
        const userName = user.userName;

        const mailOptions = {
            from: process.env.EMAIL_FROM, 
            to: userEmail,
            subject: 'Booking Confirmed! Your Stay at Our Hotel',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #0056b3;">Thank You for Your Booking, ${userName}!</h2>
                    <p>Your reservation at Our Hotel has been successfully confirmed.</p>
                    <p>We're excited to welcome you!</p>

                    <h3 style="color: #0056b3;">Booking Details:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Booking ID:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${bookingDetails._id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Room Number:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${roomDetails.roomNumber || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Room Type:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${roomDetails.roomType || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Guest Name:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${bookingDetails.guestName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Check-in Date:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${bookingDetails.checkInDate.toDateString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Check-out Date:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${bookingDetails.checkOutDate.toDateString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Booking Status:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${bookingDetails.status}</td>
                        </tr>
                    </table>

                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>Best regards,<br>The Hotel Management Team</p>
                </div>
            `,
            // Optional: A plain text version for email clients that don't render HTML
            text: `Thank You for Your Booking, ${userName}!\n\nYour reservation at Our Hotel has been successfully confirmed.\n\nBooking Details:\nBooking ID: ${bookingDetails._id}\nRoom Number: ${roomDetails.roomNumber || 'N/A'}\nRoom Type: ${roomDetails.roomType || 'N/A'}\nGuest Name: ${bookingDetails.guestName}\nCheck-in Date: ${bookingDetails.checkInDate.toDateString()}\nCheck-out Date: ${bookingDetails.checkOutDate.toDateString()}\nBooking Status: ${bookingDetails.status}\n\nWe look forward to welcoming you!\n\nBest regards,\nThe Hotel Management Team`
        };

        await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent to:', userEmail);
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        // In a production app, you might want to log this error to a monitoring service
        // or implement a retry mechanism.
    }
};

module.exports = { sendBookingConfirmationEmail };