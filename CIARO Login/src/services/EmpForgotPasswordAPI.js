import { EmployeeForgotPassAPIEndPoint } from "../utils/config/config";
import axiosInstance from "../utils/axios config/axiosConfig";

export const EmpForgotPasswordAPI = async (superAdminUsername) => {
  const body = {
    email: superAdminUsername,
  };
  try {
    const response = await axiosInstance.post(EmployeeForgotPassAPIEndPoint, body);
    if (response?.status === 200) {
      return response?.data;
    }
  } catch (error) {
    if (error?.response && error?.response?.data) {
      const statusCode = error?.response?.status;
      switch (statusCode) {
        case 404:
          return { error: error.response?.data?.msg};
        case 500:
          return { error: error.response?.data?.msg};
      }
    } else if (
      error.code === "ECONNABORTED" ||
      error.message === "Network Error"
    ) {
      return { error: "Connection timed out. Please try again later." };
    }
  }
};