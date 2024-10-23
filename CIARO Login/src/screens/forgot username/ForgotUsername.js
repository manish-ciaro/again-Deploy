import React from "react";
import {
  bgColors,
  fontSize,
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid, Typography, Link } from "@mui/material";
import Input from "../../component/CustomeInput";
import CustomeButton from "../../component/CustomeButton";
import forgotPasswordImg from "../../assest/forgot-password.png";
import { useNavigate } from "react-router";

export default function ForgotUsername() {
  const navigate = useNavigate();
  return (
    <GlobleStyle>
      <ForgotUserNameStyle>
        <Box className="main-container">
          <Grid container style={{ backgroundColor: bgColors.lightBlue }}>
            <Grid item md={6} xl={6} lg={6}>
              <Box className="eclipse-style"></Box>
              <img
                src={forgotPasswordImg}
                alt="forgotPasswordImg"
                className="absolute top-3 w-[36vw] h-auto translate-y-1/4 flex justify-center "
              />
            </Grid>
            <Grid item md={5} xl={5} lg={5} className="centered-box-container">
              <Box className="centered-box h-4/6 2xl:h-2/3 xl:ml-6 ">
                <Box className="h-4/5 flex flex-col justify-around ">
                  <Box className="">
                    <Typography className="forgot-pass-text p-5">
                      FORGOT USERNAME?
                    </Typography>
                    <Typography className="p-5 pt-0 sub-heading-text">
                      No worries, Verify your username for password link{" "}
                    </Typography>
                  </Box>
                  <Input placeholder="Enter your email" />
                  <Box className="link-box">
                    <Link href="/forgot_password/sa" className="link-tag">
                      <Typography className="link-text">
                        Resend link after 60 seconds
                      </Typography>
                    </Link>
                    <Link className="link-tag">
                      <Typography className="link-text">
                        Forgot your email id?
                      </Typography>
                    </Link>
                  </Box>
                  <CustomeButton
                    label="Get Link"
                    className="get-link-btn"
                    onClick={() => {
                      navigate("/verify_otp/sa");
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </ForgotUserNameStyle>
    </GlobleStyle>
  );
}

const ForgotUserNameStyle = styled(Box)({
  "& .link-tag": {
    textDecoration: "none",
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
