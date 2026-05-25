import api from '../../services/api';

/**
 * Normalizes user data to ensure consistent ID fields before saving to local storage.
 * 
 * @param {Object} user - The user object to save
 */
const saveUser = (user) => {
  if (!user) return;
  const normalizedUser = {
    ...user,
    _id: user.id || user._id,
    id: user.id || user._id
  };
  localStorage.setItem('user', JSON.stringify(normalizedUser));
};

/**
 * Authenticates a user with email and password.
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} The API response data containing token and user info
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { data } = response.data; // Backend response structure: { success, data: { token, user }, message }
  
  if (data && data.token) {
    localStorage.setItem('token', data.token);
    saveUser(data.user);
  }
  return response.data;
};

/**
 * Registers a new user.
 * 
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's chosen password
 * @returns {Promise<Object>} The API response data
 */
export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  const { data } = response.data;
  
  if (data && data.token) {
    localStorage.setItem('token', data.token);
    saveUser(data.user);
  }
  return response.data;
};

/**
 * Verifies the One-Time Password (OTP) sent to the user's email.
 * 
 * @param {string} email - User's email address
 * @param {string} otp - The OTP code to verify
 * @returns {Promise<Object>} The API response data
 */
export const verifyOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  const { data } = response.data;
  
  if (data && data.token) {
    localStorage.setItem('token', data.token);
    saveUser(data.user);
  }
  return response.data;
};

/**
 * Requests a new OTP to be sent to the user's email.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object>} The API response data
 */
export const resendOtp = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

/**
 * Initiates the password recovery process by sending a reset link to the email.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object>} The API response data
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Resets the user's password using a valid recovery token.
 * 
 * @param {string} token - The password reset token
 * @param {string} password - The new password
 * @returns {Promise<Object>} The API response data
 */
export const resetPassword = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  return response.data;
};

/**
 * Clears the user session by removing tokens and user data from local storage,
 * and reloads the application.
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
};

/**
 * Checks if the user is currently authenticated based on the presence of a token.
 * 
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
