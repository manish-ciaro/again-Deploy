import { SSOAPIEndPoint } from "../utils/config/config";
import { baseURL } from "../utils/constants/constants";

export const SSOLoginApi = () => {
  try {
    const url = `${baseURL}${SSOAPIEndPoint}`
    const response =  window.open(url)
    console.log(response)
    return response
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
