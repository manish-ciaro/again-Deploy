export const baseURL = process.env.REACT_APP_BASE_URL;

export const RegExp =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/;
export const regex = {
  uppercase: /(?=.*[A-Z])/,
  lowercase: /(?=.*[a-z])/,
  number: /(?=.*[0-9])/,
  specialChar: /(?=.*[!@#$%^&*(),.?":{}|<>])/,
};
export const EmailRegExp =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
