const roomsListElement = document.getElementById('roomsList');
const messageBox = document.getElementById('message-box');
const logoutBtn = document.getElementById('logoutBtn');

const bookingModal = document.getElementById('bookingModal');
const closeButton = document.querySelector('.close-button');
const modalRoomNumber = document.getElementById('modalRoomNumber');
const bookingRoomIdInput = document.getElementById('bookingRoomId');
const bookingForm = document.getElementById('bookingForm');
const bookingMessage = document.getElementById('bookingMessage');

// --- Helper Functions ---
function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.remove('success', 'error', 'show');
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

function openModal(room) {
    modalRoomNumber.textContent = room.roomNumber;
    bookingRoomIdInput.value = room._id;

    // helper to pick image URL for public page
    function getRoomImagePublic(r) {
            const baseURL = "http://localhost:5001"; // adjust if your backend host changes

            if (r.image) {
                return `${baseURL}${r.image}`;
            }
            if (Array.isArray(r.images) && r.images[0]) {
                return `${baseURL}${r.images[0]}`;
            }
            return `${baseURL}/uploads/placeholder.jpg`;
        }

    // set an image inside the modal if desired
    // example: create an <img> and insert before form
    const existing = document.getElementById('modalRoomImage');
    if (existing) existing.remove();
    const img = document.createElement('img');
    img.id = 'modalRoomImage';
    img.src = getRoomImagePublic(room);
    img.style.width = '100%';
    img.style.maxHeight = '220px';
    img.style.objectFit = 'cover';
    img.style.marginBottom = '12px';
    const modalContent = bookingModal.querySelector('.modal-content');
    modalContent.insertBefore(img, modalContent.querySelector('h2').nextSibling);

    bookingModal.style.display = 'flex'; // Use flex to center
    clearMessage(bookingMessage); // Clear any old messages in the modal
}

function closeModal() {
    bookingModal.style.display = 'none';
    bookingForm.reset(); // Reset the form fields
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication on page load
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = "http://127.0.0.1:3000/Development/registrations/Sign_in_Page/sign_in.html"; // Redirect to your user sign-in page
        return;
    }
    fetchRooms();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole'); // Clear user role too
    window.location.href = "http://127.0.0.1:3000/Development/registrations/Sign_in_Page/sign_in.html"; // Redirect to user sign-in page
});

closeButton.addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
    if (event.target === bookingModal) {
        closeModal();
    }
});

bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(bookingMessage);

    const guestName = document.getElementById('guestName').value;
    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;
    const roomId = bookingRoomIdInput.value; // Get from hidden input

    if (!guestName || !checkInDate || !checkOutDate || !roomId) {
        showMessage(bookingMessage, 'Please fill in all booking details.', true);
        return;
    }

    // Basic date validation (check-in not after check-out)
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
        showMessage(bookingMessage, 'Check-in date must be before check-out date.', true);
        return;
    }

    try {
        const response = await axiosInstance.post('/booking', {
            guestName,
            checkInDate,
            checkOutDate,
            roomId
        });
        showMessage(bookingMessage, response.data.message || 'Booking successful!', false);
        // Optionally, close modal after a short delay or refresh room list if status changes
        setTimeout(() => {
            closeModal();
            fetchRooms(); // Refresh rooms to reflect potential availability changes
        }, 1500);

    } catch (error) {
        console.error('Booking error:', error.response ? error.response.data : error.message);
        showMessage(bookingMessage, error.response?.data?.message || 'Booking failed. Please try again.', true);
    }
});

// --- Fetch & Render Rooms ---
async function fetchRooms() {
    clearMessage(messageBox);
    roomsListElement.innerHTML = '<p>Loading rooms...</p>'; // Show loading state

    try {
        const response = await axiosInstance.get('/room'); // Assuming this endpoint exists
        // Accept either { rooms: [...] } or [...] responses
        const rooms = Array.isArray(response.data) ? response.data : (response.data.rooms || response.data);

        if (!Array.isArray(rooms) || rooms.length === 0) {
            roomsListElement.innerHTML = '<p>No rooms currently available.</p>';
            return;
        }

        roomsListElement.innerHTML = ''; // Clear loading message

        // helper to pick image URL for public page
        function getRoomImagePublic(r) {
            const baseURL = "http://localhost:5001"; // adjust if your backend host changes

            if (r.image) {
                return `${baseURL}${r.image}`;
            }
            if (Array.isArray(r.images) && r.images[0]) {
                return `${baseURL}${r.images[0]}`;
            }
            return `${baseURL}/uploads/placeholder.jpg`;
        }

        rooms.forEach(room => {
            console.log("Room image raw:", room.image);
            console.log("Room image normalized:", getRoomImagePublic(room));
            const roomCard = document.createElement('div');
            roomCard.classList.add('card', 'room-card');
            roomCard.innerHTML = `
                <div style="width:100%;height:180px;overflow:hidden;border-radius:8px">
                  <img src="${getRoomImagePublic(room)}" alt="Room ${room.roomNumber}" style="width:100%;height:100%;object-fit:cover" loading="lazy" />
                </div>
                <h3>Room ${room.roomNumber} (${room.roomType})</h3>
                <p><strong>Price:</strong> $${room.pricePerNight ?? '-'} / night</p>
                <p><strong>Capacity:</strong> ${room.roomCapacity ?? room.capacity ?? '-'}</p>
                <p><strong>Status:</strong> ${room.status}</p>
            `;

            // create actions container and button explicitly so we can attach handler with the room object
            const actions = document.createElement('div');
            actions.className = 'actions';
            const btn = document.createElement('button');
            btn.className = 'book-now-btn';
            btn.type = 'button';
            btn.dataset.roomId = room._id;
            btn.dataset.roomNumber = room.roomNumber;
            btn.textContent = room.status === 'Available' ? 'Book Now' : 'Not Available';
            if (room.status !== 'Available') btn.disabled = true;

            actions.appendChild(btn);
            roomCard.appendChild(actions);
            roomsListElement.appendChild(roomCard);

            // attach click handler using closure so we pass the full room object
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent card click
                    openModal(room);     // pass full room object (so modal can show image, data)
                });
            }
        });

    } catch (error) {
        console.error('Failed to fetch rooms:', error.response ? error.response.data : error.message);
        showMessage(messageBox, error.response?.data?.message || 'Failed to load rooms. Please try again.', true);
        roomsListElement.innerHTML = '<p>Could not load rooms.</p>';
    }
}