import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const register = async (username, address, signedMessage, signature) => {
  return axios.post(`${API_URL}/register`, { username, address, signedMessage, signature });
};

export const login = async (address, signature, message) => {
  return axios.post(`${API_URL}/login`, { address, signature, message });
};

export const updateAddress = async (username, address) => {
  return axios.post(`${API_URL}/update-address`, { username, address });
};
