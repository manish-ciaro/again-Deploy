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
import { useNavigate } from "react-router";
import UserContext from "../../context/UserContext";
import { SAFirstTimeSetPass } from "../../services/SAFirstTimeSetPass";
import { RegExp } from "../../utils/constants/constants";

export default function SAFirstTimeSetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [validPass, setValidPass] = useState(false);
  const [validLength, setValidLength] = useState(false);
  const [passFormated, setPassFormated] = useState(false);
  const [isSpace, setIsSpace] = useState(false);
  const [confirmPass, setConfirmPass] = useState();
  const [passSame, setPassSame] = useState(false);
  const [resetPassError, setResetPassError] = useState(false);
  const { superAdminUsername } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    isValidPassword();
  }, [newPassword, confirmPass]);

  const validatePass = (value) => {
    value.length > 8 && value.length < 16
      ? setValidLength(true)
      : setValidLength(false);
    value.match(RegExp) ? setPassFormated(true) : setPassFormated(false);
    !value.match(/\s/) ? setIsSpace(true) : setIsSpace(false);
  };

  const handleNewPassword = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    validatePass(value);
    checkSamePassword(value, confirmPass);
  };

  const checkSamePassword = (password, confirmPass) => {
    if (password === confirmPass) {
      setPassSame(true);
    } else {
      setPassSame(false);
    }
  };

  const onCPassChange = (e) => {
    setConfirmPass(e.target.value);
    checkSamePassword(e.target.value, newPassword);
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const isValidPassword = () => {
    if (
      validLength &&
      passFormated &&
      confirmPass &&
      passSame &&
      isSpace === true
    ) {
      setValidPass(!validPass);
    } else {
      setValidPass(false);
    }
  };
  const handleResetPassClick = async () => {
    const resetPassResponse = await SAFirstTimeSetPass(
      superAdminUsername,
      newPassword
    );
    if (resetPassResponse?.error) {
      setResetPassError(resetPassResponse.error);
      sessionStorage.setItem("SALogin", false);
    } else {
      setResetPassError("");
      sessionStorage.setItem("SALogin", true);
      navigate("/password_changed_sucessfully");
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
                      Welcome {superAdminUsername}
                    </Typography>
                    <Typography
                      style={{
                        fontWeight: fontWeight.semibold,
                        fontSize: fontSize.h6,
                      }}
                    >
                      We are happy to onboard you to CIARO360, please change
                      your password for first time login
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
                      onClick={togglePasswordVisibility}
                      className="password-toggle-style"
                    >
                      {showPassword ? <img src={hide} /> : <img src={show} />}
                    </Box>
                  </Box>
                  <Box className="pl-7 pt-2 pb-2">
                    <Box>
                      <Typography className="condition-text">
                        {validLength ? <> 🟢 </> : <>🔴</>} Must have 8-16
                        characters
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="condition-text">
                        {passFormated ? <> 🟢 </> : <>🔴</>} Password must
                        contain uppercase, lowercase, number, special character
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="condition-text">
                        {isSpace ? <> 🟢 </> : <>🔴</>} Password does not
                        contain spaces
                      </Typography>
                    </Box>
                    <Box>
                      <Typography className="condition-text">
                        {passSame ? <> 🟢 </> : <>🔴</>} Password and confirm
                        password should be same
                      </Typography>
                    </Box>
                  </Box>
                  <Box style={{ display: "flex", position: "relative" }}>
                    <Box style={{ width: "100%" }}>
                      <Input
                        placeholder="Re-enter password"
                        value={confirmPass}
                        changeHandler={onCPassChange}
                        type={showConfirmPassword ? "text" : "password"}
                      />
                    </Box>
                    <Box
                      onClick={toggleConfirmPasswordVisibility}
                      className="password-toggle-style"
                    >
                      {showConfirmPassword ? (
                        <img src={hide} />
                      ) : (
                        <img src={show} />
                      )}{" "}
                    </Box>
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
});
