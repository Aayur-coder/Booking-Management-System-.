const API_URL = 'https://booking-management-system-wt5j.onrender.com/api';  

const formatDate = (dateStr) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
};

const UI = {
    authSection: document.getElementById('auth-section'),
    appSection: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    bookingForm: document.getElementById('booking-form'),
    bookingsList: document.getElementById('bookings-list'),
    bookingsLoader: document.getElementById('bookings-loader'),
    noBookings: document.getElementById('no-bookings'),
    toastContainer: document.getElementById('toast-container'),

    showApp() {
        this.authSection.classList.add('hidden');
        this.authSection.classList.remove('active');
        this.appSection.classList.remove('hidden');
        void this.appSection.offsetWidth;
        this.appSection.classList.add('active');
        API.fetchBookings();
    },

    showAuth() {
        this.appSection.classList.add('hidden');
        this.appSection.classList.remove('active');
        this.authSection.classList.remove('hidden');
        this.authSection.classList.add('active');
    },

    toggleBtnLoader(btn, isLoading) {
        const span = btn.querySelector('span');
        const loader = btn.querySelector('.loader');
        if (isLoading) {
            span.classList.add('hidden');
            loader.classList.remove('hidden');
            btn.disabled = true;
        } else {
            span.classList.remove('hidden');
            loader.classList.add('hidden');
            btn.disabled = false;
        }
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = type === 'success' 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

        toast.innerHTML = `${icon} <span>${message}</span>`;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s forwards ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    renderBookings(bookings) {
        this.bookingsLoader.classList.add('hidden');
        
        if (!bookings || bookings.length === 0) {
            this.bookingsList.classList.add('hidden');
            this.noBookings.classList.remove('hidden');
            return;
        }

        this.noBookings.classList.add('hidden');
        this.bookingsList.classList.remove('hidden');
        this.bookingsList.innerHTML = bookings.map(booking => `
            <li class="booking-item">
                <div class="booking-info">
                    <h3>${booking.resource}</h3>
                    <p>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${booking.userId}
                    </p>
                </div>
                <div class="booking-date-badge">
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 500">${formatDate(booking.date)}</div>
                    <div>${booking.time}</div>
                </div>
            </li>
        `).join('');
    }
};

const API = {
    getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    },

    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok && data.token) {
                localStorage.setItem('userId', data.userId);
                UI.showToast('Successfully logged in');
                UI.showApp();
            } else {
                UI.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            UI.showToast('Unable to connect to server', 'error');
            console.error(error);
        }
    },

    async createBooking(bookingData) {
        try {
            const res = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(bookingData)
            });
            
            if (res.ok) {
                UI.showToast('Booking created successfully!');
                UI.bookingForm.reset();
                this.fetchBookings();
            } else {
                const data = await res.json();
                UI.showToast(data.message || 'Failed to create booking', 'error');
            }
        } catch (error) {
            UI.showToast('Network error while booking', 'error');
            console.error(error);
        }
    },

    async fetchBookings() {
        UI.bookingsLoader.classList.remove('hidden');
        UI.bookingsList.classList.add('hidden');
        UI.noBookings.classList.add('hidden');

        try {
            const res = await fetch(`${API_URL}/bookings`, {
                headers: this.getHeaders()
            });
            
            if (res.ok) {
                const data = await res.json();
                const bookings = Array.isArray(data) ? data : (data.bookings || data.data || []);
                UI.renderBookings(bookings);
            } else if (res.status === 401 || res.status === 403) {
                UI.showToast('Session expired. Please log in again.', 'error');
                logout();
            } else {
                UI.renderBookings([]);
                UI.showToast('Failed to load bookings', 'error');
            }
        } catch (error) {
            UI.renderBookings([]);
            UI.showToast('Network error checking bookings', 'error');
            console.error(error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        UI.showApp();
    } else {
        UI.showAuth();
    }
});

UI.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = UI.loginForm.querySelector('button');

    UI.toggleBtnLoader(btn, true);
    await API.login(email, password);
    UI.toggleBtnLoader(btn, false);
});

UI.bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookingData = {
        userId: localStorage.getItem("userId"),
        resource: document.getElementById('resource').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value
    };
    const btn = UI.bookingForm.querySelector('button');

    UI.toggleBtnLoader(btn, true);
    await API.createBooking(bookingData);
    UI.toggleBtnLoader(btn, false);
});

document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('refresh-bookings-btn').addEventListener('click', () => {
    API.fetchBookings();
});

function logout() {
    localStorage.removeItem('token');
    UI.showAuth();
    UI.loginForm.reset();
}
