// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api/auth"
// });

// api.interceptors.request.use((config) => {

//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;




// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api/auth"
// });

// // attach token automatically
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;








// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api"
// });

// // attach token automatically
// api.interceptors.request.use((config) => {

//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;




// src/api/axios.js

// src/api/axios.js

// import axios from "axios";

// const api = axios.create({

//   baseURL: "http://localhost:5000/api"

// });

// api.interceptors.request.use((config) => {

//   const token = localStorage.getItem("token");

//   if (token) {

//     config.headers.Authorization =
//       `Bearer ${token}`;

//   }

//   return config;

// });

// export default api;



// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
//   timeout: 30000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor
// api.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;




// api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📌 Request: ${config.method.toUpperCase()} ${config.url} - Token attached`);
    } else {
      console.log(`📌 Request: ${config.method.toUpperCase()} ${config.url} - No token`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log(`📌 Response: ${response.status} - ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data);
    
    // If 401 Unauthorized, redirect to login
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - Redirecting to login');
      
      // Clear stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;