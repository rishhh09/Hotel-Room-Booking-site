document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_API = 'http://localhost:5001/api/admin';
    const ROOM_API = 'http://localhost:5001/api/room';
    const TOKEN_KEY = 'admin_token';

    // elements
    const roomsGrid = document.getElementById('roomsGrid');
    const roomsEmpty = document.getElementById('roomsEmpty');
    const bookingsTbody = document.getElementById('bookingsTbody');
    const menuItems = document.querySelectorAll('.menu-item');
    const pageTitle = document.getElementById('pageTitle');
    const roomSearch = document.getElementById('roomSearch');
    const roomFilter = document.getElementById('roomFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');
    const toast = document.getElementById('toast');

    if (!roomsGrid || !roomsEmpty) return console.error('Missing dashboard DOM elements');

    function showToast(text, timeout = 2500) {
        if (!toast) return;
        toast.textContent = text; toast.classList.remove('hidden');
        clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.add('hidden'), timeout);
    }

    function getToken() { return localStorage.getItem(TOKEN_KEY); }

    async function authFetch(path, opts = {}) {
        const token = getToken();
        if (!token) throw new Error('no-token');
        opts.headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, opts.headers || {});
        const res = await fetch(ADMIN_API + path, opts);
        if (res.status === 401 || res.status === 403) { localStorage.removeItem(TOKEN_KEY); throw new Error('unauthorized'); }
        return res.json();
    }

    const getRoomImage = (r) => {
        const rel = r?.image || (Array.isArray(r?.images) && r.images[0]) || '/uploads/placeholder.jpg';
        if (/^https?:\/\//i.test(rel)) return rel;
        try { return new URL(ADMIN_API).origin + rel; } catch { return window.location.origin + rel; }
    };

    async function fetchRooms() {
        const q = (roomSearch?.value || '').trim().toLowerCase();
        const statusFilter = roomFilter?.value || '';
        roomsGrid.innerHTML = 'Loading...';
        try {
            const res = await fetch(ROOM_API);
            if (!res.ok) throw new Error('server');
            const json = await res.json();
            const rooms = Array.isArray(json) ? json : (json.rooms || []);
            const filtered = rooms.filter(r => {
                if (statusFilter && r.status !== statusFilter) return false;
                if (!q) return true;
                return `${r.roomNumber} ${r.roomType} ${r.roomCapacity || ''} ${r.status}`.toLowerCase().includes(q);
            });
            renderRooms(filtered);
        } catch (err) {
            console.error('fetchRooms err', err);
            roomsGrid.innerHTML = '';
            roomsEmpty.classList.remove('hidden');
            roomsEmpty.textContent = 'Failed to load rooms. Try refresh.';
        }
    }

    function renderRooms(rooms) {
        roomsGrid.innerHTML = '';
        roomsEmpty.classList.add('hidden');
        if (!rooms.length) { roomsEmpty.classList.remove('hidden'); roomsEmpty.textContent = 'No rooms found.'; return; }
        const template = document.getElementById('roomCardTemplate');
        rooms.forEach(r => {
            const node = template.content.cloneNode(true);
            const img = node.querySelector('.room-thumb');
            const title = node.querySelector('.room-title');
            const meta = node.querySelector('.room-meta');
            const statusBadge = node.querySelector('.room-status-badge');
            const desc = node.querySelector('.room-desc');
            const actions = node.querySelector('.actions');

            img.src = getRoomImage(r); img.alt = `Room ${r.roomNumber}`;
            title.textContent = `#${r.roomNumber} — ${r.roomType}`;
            meta.textContent = `Capacity: ${r.roomCapacity || '-'} · Price: ${r.pricePerNight || '-'}`;
            statusBadge.textContent = r.status;
            statusBadge.className = `status-badge status-${String(r.status).replace(/\s/g, '-')}`;
            desc.textContent = r.description || '';

            const card = node.querySelector('.room-card');
            card.addEventListener('click', (e) => {
                if (['select', 'button', 'a', 'input'].includes(e.target.tagName.toLowerCase())) return;
                openRoomModal(r);
            });

            // admin inline status control
            if (getToken()) {
                const select = document.createElement('select');
                select.className = 'room-status';
                ['Available', 'Booked', 'Under Maintenance', 'Disabled'].forEach(s => {
                    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
                    if (s === r.status) opt.selected = true;
                    select.appendChild(opt);
                });
                select.addEventListener('change', async (ev) => {
                    try { await authFetch(`/rooms/${r._id}/status`, { method: 'PUT', body: JSON.stringify({ status: ev.target.value }) }); showToast('Room status updated'); fetchRooms(); }
                    catch (err) { console.error('update status', err); showToast('Failed to update status', 3000); }
                });
                actions.appendChild(select);
            }

            roomsGrid.appendChild(node);
        });
    }

    function openRoomModal(room) {
        const imageUrl = getRoomImage(room);
        if (modalTitle) modalTitle.textContent = `Room #${room.roomNumber} • ${room.roomType}`;
        if (modalBody) modalBody.innerHTML = `
      <div style="display:flex;gap:12px;flex-direction:column">
        <img src="${imageUrl}" alt="Room ${room.roomNumber}" style="width:100%;height:auto;border-radius:8px;object-fit:cover" />
        <div>
          <p><strong>Capacity:</strong> ${room.roomCapacity || '-'}</p>
          <p><strong>Price:</strong> ${room.pricePerNight || '-'}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${String(room.status).replace(/\s/g, '-')}">${room.status}</span></p>
          <p>${room.description || ''}</p>
        </div>
      </div>
    `;
        if (modalOverlay) modalOverlay.classList.remove('hidden');
    }

    modalClose?.addEventListener('click', () => modalOverlay?.classList.add('hidden'));
    modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });

    async function fetchBookings() {
        if (!bookingsTbody) return;
        bookingsTbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        try {
            const json = await authFetch('/bookings');
            const bookings = json.bookings || [];
            renderBookings(bookings);
        } catch (err) { console.error('fetchBookings', err); bookingsTbody.innerHTML = '<tr><td colspan="5">Failed to load bookings.</td></tr>'; }
    }

    function renderBookings(bookings) {
        if (!bookingsTbody) return;
        if (!bookings.length) { bookingsTbody.innerHTML = '<tr><td colspan="5">No bookings found.</td></tr>'; return; }
        bookingsTbody.innerHTML = bookings.map(b => {
            const guest = (b.userId && (b.userId.userName || b.userId.email)) || b.guestName || 'Guest';
            const roomText = (b.roomId && (b.roomId.roomNumber || b.roomId)) || '-';
            const dates = `${new Date(b.checkInDate).toLocaleDateString()} → ${new Date(b.checkOutDate).toLocaleDateString()}`;
            return `<tr data-id="${b._id}">
        <td>${guest}</td>
        <td>${roomText}</td>
        <td>${dates}</td>
        <td><select class="booking-status">${['Confirmed', 'Cancelled', 'CheckedIn', 'CheckedOut', 'Pending'].map(s => `<option ${s === b.status ? 'selected' : ''} value="${s}">${s}</option>`).join('')}</select></td>
        <td class="booking-actions"><button class="btn" data-action="view">View</button><button class="btn ghost" data-action="refresh">Refresh</button></td>
      </tr>`;
        }).join('');
        // handlers
        document.querySelectorAll('.booking-status').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const tr = e.target.closest('tr'); const id = tr.dataset.id; const status = e.target.value;
                if (!confirm(`Set booking ${id} status to ${status}?`)) { fetchBookings(); return; }
                try { await authFetch(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); showToast('Booking updated'); fetchBookings(); }
                catch (err) { console.error(err); showToast('Failed to update booking', 3000); }
            });
        });

        document.querySelectorAll('.booking-actions button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const tr = e.currentTarget.closest('tr'); const id = tr.dataset.id;
                if (action === 'view') {
                    const booking = (window._lastBookings || []).find(x => String(x._id) === String(id));
                    if (booking) {
                        modalTitle.textContent = `Booking • ${booking._id}`;
                        modalBody.innerHTML = `<p><strong>Guest:</strong> ${(booking.userId && booking.userId.userName) || booking.guestName || 'Guest'}</p>
              <p><strong>Room:</strong> ${booking.roomId?.roomNumber || '-'}</p>
              <p><strong>Dates:</strong> ${new Date(booking.checkInDate).toLocaleDateString()} → ${new Date(booking.checkOutDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${booking.status}</p>`;
                        modalOverlay.classList.remove('hidden');
                    }
                } else if (action === 'refresh') fetchBookings();
            });
        });
        window._lastBookings = bookings;
    }

    // navigation
    menuItems.forEach(btn => btn.addEventListener('click', () => {
        menuItems.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('roomsTab').classList.toggle('hidden', tab !== 'rooms');
        document.getElementById('bookingsTab').classList.toggle('hidden', tab !== 'bookings');
        pageTitle.textContent = tab === 'rooms' ? 'Rooms' : 'Bookings';
    }));

    // events
    let searchTimer;
    roomSearch?.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(fetchRooms, 300); });
    roomFilter?.addEventListener('change', fetchRooms);
    refreshBtn?.addEventListener('click', () => { fetchRooms(); fetchBookings(); });

    document.getElementById('logoutBtn')?.addEventListener('click', () => { localStorage.removeItem(TOKEN_KEY); window.location.href = '../registrations/admin_login/admin_login.html'; });

    // init
    fetchRooms();
    fetchBookings();
});