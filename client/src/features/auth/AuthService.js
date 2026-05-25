import api from '../../services/api';

const saveUser = (user) => {
  if (!user) return;
  const normalizedUser = {
    ...user,
    _id: user.id || user._id,
    id: user.id || user._id
  };
  localStorage.setItem('user', JSON.stringify(normalizedUser));
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { data } = response.data; // Backend response structure: { success, data: { token, user }, message }
  
  if (data && data.token) {
    localStorage.setItem('token', data.token);
    saveUser(data.user);
  }
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  const { data } = response.data;
  
  if (data && data.token) {
    localStorage.setItem('token', data.token);
    saveUser(data.user);
  }
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  const { data } = response.data;
  
  if (data && data.token) {
    localStorage.setItem('token', data.token);
    saveUser(data.user);
  }
  return response.data;
};

export const resendOtp = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
