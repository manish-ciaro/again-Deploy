import { superAdminLogin } from "../utils/config/config";
import axiosInstance from "../utils/axios config/axiosConfig";

export const LoginPostData = async (superAdminUsername, password, isSuperAdmin) => {
  const body = {
    email: superAdminUsername,
    password: password,
    isSuperAdmin: isSuperAdmin
  };
  
  try {
    const response = await axiosInstance.post(superAdminLogin, body, {withCredentials:true});
    if (response?.status === 200) {
      console.log("Login Api Sucess response :", response)
      return response?.data; 
    }
  } catch (error) {
    if (error?.response && error?.response?.data) {
      const statusCode = error?.response?.status;
      switch (statusCode) {
        case 404:
          return { error: error.response?.data?.msg };
        case 500:
          return { error: error.response?.data?.msg };
      }
    } else if (
      error.code === "ECONNABORTED" ||
      error.message === "Network Error"
    ) {
      return { error: "Connection timed out. Please try again later." };
    }
  }
};