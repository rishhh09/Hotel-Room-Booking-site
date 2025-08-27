// js/my-bookings.js
const bookingsListElement = document.getElementById('bookingsList');
const messageBox = document.getElementById('message-box');
const logoutBtn = document.getElementById('logoutBtn');

// Update Modal Elements
const updateBookingModal = document.getElementById('updateBookingModal');
const updateCloseButton = updateBookingModal.querySelector('.close-button');
const updateBookingForm = document.getElementById('updateBookingForm');
const updateBookingIdInput = document.getElementById('updateBookingId');
const updateOriginalRoomIdInput = document.getElementById('updateOriginalRoomId');
const updateGuestNameInput = document.getElementById('updateGuestName');
const updateCheckInDateInput = document.getElementById('updateCheckInDate');
const updateCheckOutDateInput = document.getElementById('updateCheckOutDate');
const updateRoomIdSelect = document.getElementById('updateRoomId');
const updateBookingMessage = document.getElementById('updateBookingMessage');

// --- Helper Functions ---
function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.remove('success', 'error', 'show'); // Clear previous
    element.classList.add('show');
    if (isError) {
        element.classList.add('error');
    } else {
        element.classList.add('success');
    }
}

function clearMessage(element) {
    element.textContent = '';
    element.classList.remove('success', 'error', 'show');
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatInputDate(dateString) {
    // Format to YYYY-MM-DD for input type="date"
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = "http://127.0.0.1:3000/Development/registrations/Sign_in_Page/sign_in.html"
        return;
    }
    fetchBookings();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.href = 'http://127.0.0.1:3000/Development/registrations/Sign_in_Page/sign_in.html'; // Redirect to user sign-in page
});

// Update Modal Close
updateCloseButton.addEventListener('click', () => updateBookingModal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target === updateBookingModal) {
        updateBookingModal.style.display = 'none';
    }
});

// Update Booking Form Submission
updateBookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(updateBookingMessage);

    const bookingId = updateBookingIdInput.value;
    const guestName = updateGuestNameInput.value;
    const checkInDate = updateCheckInDateInput.value;
    const checkOutDate = updateCheckOutDateInput.value;
    const newRoomId = updateRoomIdSelect.value;
    const originalRoomId = updateOriginalRoomIdInput.value;

    const updateData = {};
    if (guestName) updateData.guestName = guestName;
    if (checkInDate) updateData.checkInDate = checkInDate;
    if (checkOutDate) updateData.checkOutDate = checkOutDate;

    // Only include roomId if a new room was selected, otherwise it remains unchanged on backend
    if (newRoomId && newRoomId !== originalRoomId) {
        updateData.roomId = newRoomId;
    }

    if (Object.keys(updateData).length === 0) {
        showMessage(updateBookingMessage, 'No changes provided for update.', true);
        return;
    }

    // Basic date validation
    if (checkInDate && checkOutDate && new Date(checkInDate) >= new Date(checkOutDate)) {
        showMessage(updateBookingMessage, 'Check-in date must be before check-out date.', true);
        return;
    }

    try {
        const response = await axiosInstance.patch(`/booking/${bookingId}`, updateData);
        showMessage(updateBookingMessage, response.data.message || 'Booking updated successfully!', false);
        setTimeout(() => {
            updateBookingModal.style.display = 'none';
            fetchBookings(); // Refresh the list
        }, 1500);
    } catch (error) {
        console.error('Update booking error:', error.response ? error.response.data : error.message);
        showMessage(updateBookingMessage, error.response?.data?.message || 'Failed to update booking.', true);
    }
});

// --- Fetch & Render Bookings ---
async function fetchBookings() {
    clearMessage(messageBox);
    bookingsListElement.innerHTML = '<p>Loading your bookings...</p>';

    try {
        const response = await axiosInstance.get('/booking'); // Endpoint to get user's booking
        const bookings = response.data.bookings;

        if (bookings.length === 0) {
            bookingsListElement.innerHTML = '<p>You have no bookings yet.</p>';
            return;
        }

        bookingsListElement.innerHTML = ''; // Clear loading message

        bookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.classList.add('card', 'booking-card');
            bookingCard.innerHTML = `
                <h3>Booking for ${booking.guestName}</h3>
                <p>Room: ${booking.roomId.roomNumber} (${booking.roomId.roomType})</p>
                <p>Price: $${booking.roomId.pricePerNight} / night</p>
                <p>Check-in: ${formatDate(booking.checkInDate)}</p>
                <p>Check-out: ${formatDate(booking.checkOutDate)}</p>
                <p>Status: <span class="status ${booking.status}">${booking.status}</span></p>
                <div class="actions">
                    <button class="view-details-btn" data-booking-id="${booking._id}">View Details</button>
                    <button class="update-booking-btn" data-booking-id="${booking._id}"
                        ${booking.status === 'Cancelled' || booking.status === 'checkedIn' || booking.status === 'checkedOut' ? 'disabled' : ''}>
                        Update
                    </button>
                    <button class="cancel-booking-btn" data-booking-id="${booking._id}"
                        ${booking.status === 'Cancelled' || booking.status === 'checkedIn' || booking.status === 'checkedOut' ? 'disabled' : ''}>
                        Cancel
                    </button>
                </div>
            `;
            bookingsListElement.appendChild(bookingCard);
        });

        // Add event listeners for actions
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const bookingId = event.target.dataset.bookingId;
                // For simplicity, just log or show an alert. A full "details" page would be separate.
                alert(`Viewing details for Booking ID: ${bookingId}. Check console for full object.`);
                // You could fetch getBookingById here and display it in a modal
                // fetchBookingDetails(bookingId);
            });
        });

        document.querySelectorAll('.update-booking-btn').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', (event) => {
                    const bookingId = event.target.dataset.bookingId;
                    populateUpdateModal(bookingId);
                });
            }
        });

        document.querySelectorAll('.cancel-booking-btn').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', (event) => {
                    const bookingId = event.target.dataset.bookingId;
                    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
                        cancelBooking(bookingId);
                    }
                });
            }
        });

    } catch (error) {
        console.error('Failed to fetch bookings:', error.response ? error.response.data : error.message);
        showMessage(messageBox, error.response?.data?.message || 'Failed to load bookings. Please try again.', true);
        bookingsListElement.innerHTML = '<p>Could not load your bookings.</p>';
    }
}

// --- Update Booking Logic ---
async function populateUpdateModal(bookingId) {
    clearMessage(updateBookingMessage);
    try {
        // Fetch current booking details
        const response = await axiosInstance.get(`/booking/${bookingId}`);
        const booking = response.data.booking || response.data; // support both shapes

        updateBookingIdInput.value = booking._id;
        updateOriginalRoomIdInput.value = booking.roomId._id; // Store original room ID
        updateGuestNameInput.value = booking.guestName;
        updateCheckInDateInput.value = formatInputDate(booking.checkInDate);
        updateCheckOutDateInput.value = formatInputDate(booking.checkOutDate);

        // Fetch all rooms to populate the select dropdown for changing rooms
        const roomsResponse = await axiosInstance.get('/room');
        const allRooms = Array.isArray(roomsResponse.data) ? roomsResponse.data : (roomsResponse.data.rooms || roomsResponse.data);

        updateRoomIdSelect.innerHTML = '<option value="">Select a new room (leave unchanged for current)</option>';
        allRooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room._id;
            option.textContent = `Room ${room.roomNumber} (${room.roomType}) - $${room.pricePerNight ?? '-'}`;
            if (room._id === booking.roomId._id) {
                option.selected = true; // Select the current room
            }
            // Disable if not available and not the current room
            if (room.status !== 'Available' && room._id !== booking.roomId._id) {
                option.disabled = true;
            }
            updateRoomIdSelect.appendChild(option);
        });

        updateBookingModal.style.display = 'flex';
    } catch (error) {
        console.error('Error populating update modal:', error.response ? error.response.data : error.message);
        showMessage(messageBox, error.response?.data?.message || 'Failed to load booking details for update.', true);
    }
}

// --- Cancel Booking Logic ---
async function cancelBooking(bookingId) {
    clearMessage(messageBox); // Clear main page message box
    try {
        const response = await axiosInstance.delete(`/booking/${bookingId}`);
        showMessage(messageBox, response.data.message || 'Booking cancelled successfully!', false);
        fetchBookings(); // Refresh the list
    } catch (error) {
        console.error('Cancel booking error:', error.response ? error.response.data : error.message);
        showMessage(messageBox, error.response?.data?.message || 'Failed to cancel booking.', true);
    }
}