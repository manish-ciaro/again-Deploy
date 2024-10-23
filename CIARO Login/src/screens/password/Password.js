import React, { useContext, useState } from "react";
import {
  bgColors,
  fontSize,
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid, Typography, Link } from "@mui/material";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";

import secondImg from "../../assest/image02.png";

import Input from "../../component/CustomeInput";
import CustomeButton from "../../component/CustomeButton";

import { LoginPostData } from "../../services/LoginAPI";
import UserContext from "../../context/UserContext";
import { useNavigate } from "react-router";
import hide from "../../assest/hide.png";
import show from "../../assest/view.png";
import { setupMfa } from "../../services/setupMfa";

export default function Password() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const onPasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);
    setIsEmpty(value.trim() === "");
    setLoginError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLink = () => {
    isSA ? navigate("/forgot_password/sa") : navigate("/forgot_password");
  };

  const { superAdminUsername, firstName, empEmail, isSA, setGenrateQR } =
    useContext(UserContext);

  const handleDataSubmit = async () => {
    setLoading(true);
    if (superAdminUsername === null && empEmail) {
      const response = await LoginPostData(empEmail, password, isSA);
      const isMFAEnable = await response?.req3rdPartyMFA;
      if (response?.error) {
        setLoading(false);
        setLoginError(response.error);
      } else {
        setLoading(false);
        const uid = response.uId;
        sessionStorage.setItem("uId", uid);
        sessionStorage.setItem("verified", true);
        const cookies = document.cookie;
        // const sessionCookie = cookies.find((cookie) =>
        //   cookie.trim().startsWith("connect.sid=")
        // );
        console.log("cookie:  ", cookies);
        if (isMFAEnable) {
          const QRresponse = await setupMfa(empEmail, password);
          setGenrateQR(QRresponse?.data);
          navigate("/password/auth_mfa");
        }
      }
    } else if (superAdminUsername && empEmail === null) {
      const response = await LoginPostData(superAdminUsername, password, isSA);
      if (response?.error) {
        setLoading(false);
        setLoginError(response.error);
      } else {
        setLoading(false);
        response.isFirstLogin
          ? navigate("/org_onboarding")
          : navigate("/dashboard");
      }
    }
  };
  return (
    <GlobleStyle>
      <PasswordBoxStyle>
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
              <Box className="centered-box h-4/6 2xl:h-2/3 xl:ml-6 ">
                <Box className="h-4/5 flex flex-col justify-around ">
                  <Box className="welcome-text">
                    <Typography className="welcome-text p-5">
                      Welcome {firstName}
                    </Typography>
                  </Box>
                  <Box style={{ display: "flex", position: "relative" }}>
                    <Box style={{ width: "100%" }}>
                      <Input
                        placeholder="Enter your password"
                        value={password}
                        changeHandler={onPasswordChange}
                        type={showPassword ? "password" : "text"}
                      />
                    </Box>
                    <Box
                      onClick={togglePasswordVisibility}
                      className="password-toggle-style"
                    >
                      {showPassword ? (
                        <img alt="hide" src={hide} />
                      ) : (
                        <img alt="show" src={show} />
                      )}
                    </Box>
                  </Box>
                  {loginError ? (
                    <Typography className="error-msg pl-10 pt-2">
                      {loginError}
                    </Typography>
                  ) : null}

                  <Box className="link-box">
                    <Link onClick={handleLink} className="link-tag">
                      <Typography className="link-text">
                        Forgot your password?
                      </Typography>
                    </Link>
                    <Link className="link-tag">
                      <Typography className="link-text">
                        Login without using Email
                      </Typography>
                    </Link>
                  </Box>
                  <CustomeButton
                    label="LOGIN"
                    className="login-btn"
                    onClick={handleDataSubmit}
                    disable={isEmpty}
                  />
                  {loading ? (
                    <Box className="welcome-text">
                      <CircularProgress
                        variant="indeterminate"
                        disableShrink
                        sx={(theme) => ({
                          color: bgColors?.darkgreen,
                          animationDuration: "550ms",
                          position: "absolute",
                          [`& .${circularProgressClasses.circle}`]: {
                            strokeLinecap: "round",
                          },
                          ...theme.applyStyles("dark", {
                            color: "#308fe8",
                          }),
                        })}
                        size={40}
                        thickness={4}
                      />
                    </Box>
                  ) : (
                    <></>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PasswordBoxStyle>
    </GlobleStyle>
  );
}

const PasswordBoxStyle = styled(Box)({
  "& .link-tag": {
    textDecoration: "none",
    cursor: "pointer",
  },
  "& .link-text": {
    textDecoration: "none",
    color: bgColors.skyBlue,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.semibold,
  },
  "& .link-box": {
    display: "grid",
    gap: "15px",
    padding: "5% 8%",
  },
  "& .login-btn": {
    height: "45px",
    width: "30%",
  },
});
