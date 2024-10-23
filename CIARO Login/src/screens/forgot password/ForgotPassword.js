import React, { useEffect, useState } from "react";
import {
  bgColors,
  fontSize,
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid, Typography, Link, Button } from "@mui/material";
import Input from "../../component/CustomeInput";
import CustomeButton from "../../component/CustomeButton";
import forgotPasswordImg from "../../assest/forgot-password.png";
import { SAForgotPassword } from "../../services/SAForgotPassword";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isResendLinkDisabled, setIsResendLinkDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(60);
  const [isGetLinkDisabled, setIsGetLinkDisabled] = useState(true);
  const [startTimer, setStartTimer] = useState(false);

  useEffect(() => {
    setIsGetLinkDisabled(username.trim() === "");
  }, [username]);

  useEffect(() => {
    if (startTimer && isResendLinkDisabled && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (resendTimer === 0) {
      setIsResendLinkDisabled(false);
      setStartTimer(false); 
    }
  }, [resendTimer, isResendLinkDisabled, startTimer]);

  const onInputChange = (e) => {
    setUsername(e.target.value);
  };

  const onGetLinkClicked = async () => {
    setIsGetLinkDisabled(true);
    setIsResendLinkDisabled(true);
    setResendTimer(60);
    setStartTimer(true);

    const response = await SAForgotPassword(username);
    if (response?.error) {
      setError(response?.error);
      setMessage("");
    } else {
      setMessage(response?.msg);
      setError("");
    }
  };

  const handleResendForgotPassLink = async () => {
    setIsResendLinkDisabled(true);
    setResendTimer(60);
    setStartTimer(true);

    const response = await SAForgotPassword(username);
    if (response?.error) {
      setError(response?.error);
      setMessage("");
    } else {
      setMessage(response?.msg);
      setError("");
    }
  };

  return (
    <GlobleStyle>
      <ForgotPassStyle>
        <Box className="main-container">
          <Grid container style={{ backgroundColor: bgColors.lightBlue }}>
            <Grid item sm={6} xs={6} md={6} xl={6} lg={6}>
              <Box className="eclipse-style"></Box>
              <img
                src={forgotPasswordImg}
                alt="forgotPasswordImg"
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
                  <Box className="">
                    <Typography className="forgot-pass-text p-5">
                      FORGOT PASSWORD?
                    </Typography>
                    <Typography className="p-5 pt-0 sub-heading-text">
                      No worries, we’ll send you reset link to email
                    </Typography>
                  </Box>
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    changeHandler={onInputChange}
                    type="text"
                  />
                  {error ? (
                    <Typography className="error-msg pl-10 pt-2">
                      {error}
                    </Typography>
                  ) : null}
                  {message ? (
                    <Typography className="pl-10 pt-2 text-green-600	">
                      {message}
                    </Typography>
                  ) : null}
                  <Box className="link-box">
                    <Link
                      className="link-tag "
                      component={Button}
                      disabled={isResendLinkDisabled}
                      onClick={handleResendForgotPassLink}
                    >
                      <Typography className="link-text resend-code px-1"></Typography>
                      <Typography className="link-text">
                        {isResendLinkDisabled
                          ? `Resend link after ${resendTimer} seconds`
                          : "Resend Link"}
                      </Typography>
                    </Link>
                    <Link className="link-tag" href="/forgot_username">
                      <Typography className="link-text">
                        Forgot your email id?
                      </Typography>
                    </Link>
                  </Box>
                  <CustomeButton
                    label="Get Link"
                    className="get-link-btn"
                    disable={isGetLinkDisabled}
                    onClick={onGetLinkClicked}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </ForgotPassStyle>
    </GlobleStyle>
  );
}

const ForgotPassStyle = styled(Box)({
  "& .link-tag": {
    textDecoration: "none",
    cursor: "pointer",
    textTransform: "none",
    width: "fit-content",
  },
  "& input::-webkit-inner-spin-button": {
    webkitAppearance: "none",
    margin: 0,
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
  "& .get-link-btn": {
    height: "45px",
    width: "35%",
    fontSize: fontSize.h6,
    fontWeight: fontWeight.semibold,
    textTransform: "none",
  },
  "& .sub-heading-text": {
    fontWeight: fontWeight.medium,
  },
  "& .forgot-pass-text": {
    fontWeight: fontWeight.bold,
    fontSize: fontSize.h4,
  },
});
