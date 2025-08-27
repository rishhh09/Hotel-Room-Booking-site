// <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

// Create a custom Axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5001/api', // IMPORTANT: Replace with your actual backend API base URL
    timeout: 10000, // Request will timeout after 10 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT token to every outgoing request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken'); 

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle common errors (e.g., token expiration)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Example: If token is expired or invalid (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            console.error('Authentication error: Token expired or invalid. Redirecting to login.');
            // Clear localStorage and redirect to login page
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole'); // Clear user role as well
            window.location.href = 'sign_in.html'; // Adjust to your login page path
        }
        return Promise.reject(error);
    }
);
