import React, { useContext, useEffect, useState } from "react";
import {
  bgColors,
  fontSize,
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid, Typography } from "@mui/material";
import Input from "../../component/CustomeInput";
import CustomeButton from "../../component/CustomeButton";
import secondImg from "../../assest/image02.png";
import hide from "../../assest/hide.png";
import show from "../../assest/view.png";
import { useLocation, useNavigate } from "react-router";
import UserContext from "../../context/UserContext";
import { SAResetPasswordAPI } from "../../services/SAResetPassword";
import { regex } from "../../utils/constants/constants";
import { EmpResetPasswordAPI } from "../../services/EmpResetPasswordAPI";
import { EmpResetPassApiCalled } from "../../services/EmpResetPassword";

export default function EmpResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [validPass, setValidPass] = useState(false);
  const [validLength, setValidLength] = useState(false);
  const [confirmPass, setConfirmPass] = useState();
  const [passSame, setPassSame] = useState(false);
  const [resetPassError, setResetPassError] = useState(false);
  const { empEmail, setEmpEmail } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validPassConditions, setValidPassConditions] = useState({
    includeUppercase: false,
    includeLowercase: false,
    includeNumber: false,
    includeSpecialCharacter: false,
    passwordMaxLength: "",
    passwordMinLength: "",
  });
  const [isUpperCase, setIsUpperCase] = useState(false);
  const [isLowerCase, setIsLowerCase] = useState(false);
  const [isNumber, setIsNuber] = useState(false);
  const [isSpecialChar, setSpecialChar] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  useEffect(() => {
    isValidPassword();
  }, [newPassword, confirmPass]);

  useEffect(() => {
    if (token) {
      getOrgPasswordPolicy();
    } else return;
  }, []);

  //Fetch the password policy of Org on the basis of token
  const getOrgPasswordPolicy = async () => {
    if (token) {
      const response = await EmpResetPasswordAPI(token);
      if (response?.error) {
        setResetPassError(response?.error);
      } else {
        const {
          includeNumber,
          includeSpecialCharacter,
          includeUppercase,
          passwordMaxLength,
          passwordMinLength,
          includeLowercase,
        } = response?.passwordComplexity;

        setValidPassConditions({
          includeUppercase: includeUppercase,
          includeLowercase: includeLowercase,
          includeNumber: includeNumber,
          includeSpecialCharacter: includeSpecialCharacter,
          passwordMaxLength: passwordMaxLength,
          passwordMinLength: passwordMinLength,
        });
      }
    } else {
      return;
    }
  };

  const SAUsername = sessionStorage.getItem("username");
  //function to check the password is following conditions or not
  const validatePass = (value) => {
    value.length >= 8 && value.length <= 16
      ? setValidLength(true)
      : setValidLength(false);
    value.match(regex.uppercase) ? setIsUpperCase(true) : setIsUpperCase(false);
    value.match(regex.lowercase) ? setIsLowerCase(true) : setIsLowerCase(false);
    value.match(regex.number) ? setIsNuber(true) : setIsNuber(false);
    value.match(regex.specialChar)
      ? setSpecialChar(true)
      : setSpecialChar(false);
  };

  //fuction called on change in Password input field
  const handleNewPassword = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    validatePass(value);
    checkSamePassword(value, confirmPass);
  };

  //fuction to Check if Password & Confirm Password are same
  const checkSamePassword = (password, confirmPass) => {
    if (password === confirmPass) {
      setPassSame(true);
    } else {
      setPassSame(false);
    }
  };

  // Fuction call when Confirm Password Input change
  const onCPassChange = (e) => {
    setConfirmPass(e.target.value);
    checkSamePassword(e.target.value, newPassword);
  };
  // Password input field toggle function
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // confirm password input field toggle function
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // function to check is password follows all the conditions then button will be enable
  const isValidPassword = () => {
    if (
      validLength &&
      isUpperCase &&
      isLowerCase &&
      isNumber &&
      isSpecialChar &&
      passSame
    ) {
      setValidPass(!validPass);
    } else {
      setValidPass(false);
    }
  };
  //function call when reset password link clicked
  const handleResetPassClick = async () => {
    const resetPassResponse = await EmpResetPassApiCalled(newPassword, token);
    if (resetPassResponse.error) {
      setResetPassError(resetPassResponse.error);
      sessionStorage.setItem("adminLogin", false);
    } else {
      sessionStorage.setItem("adminLogin", true);
      navigate("/password_changed_sucessfully");
      setResetPassError("");
    }
  };

  return (
    <GlobleStyle>
      <ResetPasswordBoxStyle>
        <Box className="main-container">
          <Grid container style={{ backgroundColor: bgColors.lightBlue }}>
            <Grid item sm={6} xs={6} md={6} xl={6} lg={6}>
              <Box className="eclipse-style"></Box>
              <img
                src={secondImg}
                alt="second-img"
                className="absolute w-[36vw] top-1/2 left-2 -translate-y-1/2"
              />
            </Grid>
            <Grid
              item
              sm={5}
              xs={5}
              md={5}
              xl={5}
              lg={5}
              className="centered-box-container"
            >
              <Box className="centered-box h-4/6 w-[90%] 2xl:h-2/3 xl:ml-6 ">
                <Box className="h-[100%] flex flex-col justify-around ">
                  <Box className="pl-7 pt-2 pb-2">
                    <Typography
                      style={{
                        fontWeight: fontWeight.semibold,
                        fontSize: fontSize.h4,
                      }}
                    >
                      Welcome {empEmail}
                    </Typography>
                    <Typography
                      style={{
                        fontWeight: fontWeight.semibold,
                        fontSize: fontSize.h6,
                      }}
                    >
                      Enter a new password below to change your password
                    </Typography>
                  </Box>

                  <Box style={{ display: "flex", position: "relative" }}>
                    <Box style={{ width: "100%" }}>
                      <Input
                        placeholder="Enter password"
                        value={newPassword}
                        changeHandler={handleNewPassword}
                        type={showPassword ? "text" : "password"}
                        max="16"
                        min="8"
                      />
                    </Box>
                    <Box
                      className="password-toggle-style"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <img src={hide} /> : <img src={show} />}
                    </Box>
                  </Box>
                  <Box className="pl-7 pt-2 pb-2">
                    {validPassConditions.passwordMaxLength &&
                    validPassConditions.passwordMinLength ? (
                      <Typography className="condition-text">
                        {validLength ? <> 🟢 </> : <>🔴</>} Password must be
                        between {validPassConditions.passwordMinLength} and{" "}
                        {validPassConditions.passwordMaxLength} characters
                      </Typography>
                    ) : null}
                    {validPassConditions.includeUppercase ? (
                      <Box>
                        <Typography className="condition-text">
                          {isUpperCase ? <> 🟢 </> : <>🔴</>} Password must
                          contain atleast one uppercase character
                        </Typography>
                      </Box>
                    ) : null}
                    {validPassConditions.includeLowercase ? (
                      <Box>
                        <Typography className="condition-text">
                          {isLowerCase ? <> 🟢 </> : <>🔴</>} Password must
                          contain atleat one lowercase character
                        </Typography>
                      </Box>
                    ) : null}
                    {validPassConditions.includeNumber ? (
                      <Box>
                        <Typography className="condition-text">
                          {isNumber ? <> 🟢 </> : <>🔴</>} Password must contain
                          a number
                        </Typography>
                      </Box>
                    ) : null}
                    {validPassConditions.includeSpecialCharacter ? (
                      <Box>
                        <Typography className="condition-text">
                          {isSpecialChar ? <> 🟢 </> : <>🔴</>} Password must
                          contain a special character
                        </Typography>
                      </Box>
                    ) : null}
                    <Box>
                      <Typography className="condition-text">
                        {passSame ? <> 🟢 </> : <>🔴</>} Password and confirm
                        password should be same
                      </Typography>
                    </Box>
                  </Box>
                  <Input
                    placeholder="Re-enter password"
                    value={confirmPass}
                    changeHandler={onCPassChange}
                    type={showConfirmPassword ? "text" : "password"}
                  />
                  <Box
                    className="repass-toggle-style"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <img src={hide} />
                    ) : (
                      <img src={show} />
                    )}
                  </Box>
                  {resetPassError ? (
                    <Typography className="error-msg pl-12 pt-2">
                      {resetPassError}
                    </Typography>
                  ) : null}
                  <CustomeButton
                    label="Update"
                    className="update-btn"
                    disable={!validPass}
                    onClick={handleResetPassClick}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </ResetPasswordBoxStyle>
    </GlobleStyle>
  );
}

const ResetPasswordBoxStyle = styled(Box)({
  "& .update-btn": {
    height: "45px",
    width: "30%",
    textTransform: "none",
  },
  "& .condition-text": {
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.h7,
  },

  "& .repass-toggle-style": {
    cursor: "pointer",
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 10,
    right: "13.5rem",
    bottom: "30%",
  },
  "& .password-hide-box": {
    cursor: "pointer",
    position: "relative",
    display: "flex",
    justifyContent: "flex-end",
    maxWidth: "content",
  },
});
