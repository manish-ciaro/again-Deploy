import axios from 'axios';
import {baseURL} from '../constants/constants';

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  timeout:'300000'
});

export default axiosInstance