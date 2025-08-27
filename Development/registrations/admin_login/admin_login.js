const form = document.getElementById('admin-login-form');
const emailEl = document.getElementById('admin-username');
const passEl = document.getElementById('admin-password');
const msg = document.getElementById('message-box');
const API = 'http://localhost:5001/api/admin';
const TOKEN_KEY = 'admin_token';

function showMessage(text, err = true) {
    msg.textContent = text;
    msg.className = err ? 'error' : 'message';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('Logging in...', false);
    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailEl.value.trim(), password: passEl.value })
        });
        const data = await res.json();
        if (!res.ok) return showMessage(data.message || 'Login failed');
        if (!data.token || data.role !== 'admin') return showMessage('Not authorized as admin');
        localStorage.setItem(TOKEN_KEY, data.token);
        window.location.href = '../../Admin_dashboard/dashboard.html';
    } catch (err) {
        console.error(err);
        showMessage('Network error');
    }
});

// If already logged in redirect
if (localStorage.getItem(TOKEN_KEY)) {
    window.location.href = '../../Admin_dashboard/dashboard.html';
}