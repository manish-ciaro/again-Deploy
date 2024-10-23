import React, { useContext, useState } from "react";
import {
  bgColors,
  colors,
  fontSize,
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid, Typography, Link } from "@mui/material";
import secondImg from "../../assest/image02.png";

import CustomeButton from "../../component/CustomeButton";
import UserContext from "../../context/UserContext";
import { useNavigate } from "react-router";

export default function QRScreen() {
  const { genrateQR } = useContext(UserContext);
  const navigate = useNavigate();
  const getMfaOtp = async () => {
    navigate("/verify_mfa_otp")
  };
  const handleNavigateEmail = () =>{
    navigate("/verify_email_mfa")
  }
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
              <Box className="centered-box ">
                <Box style={{ padding: "2%" }}>
                  <Box>
                    <Typography
                      style={{
                        fontWeight: fontWeight.bold,
                        fontSize: fontSize.h4,
                      }}
                    >
                      Steps to follow:
                    </Typography>
                  </Box>
                  <Box style={{ width: "90%", marginLeft: "5%" }}>
                    <ul>
                      <li>Step 1: Open your Microsoft Authenticator app.</li>
                      <li>Step 2: Use the app to scan the QR code below.</li>
                      <li>
                        Step 3: After scanning the QR code, click the Continue
                        button to proceed to enter OTP.
                      </li>
                    </ul>
                  </Box>
                </Box>
                <img src={genrateQR} style={{ width: "80%", margin: "auto" }} />
                <CustomeButton label="Continue" onClick={getMfaOtp} />
                <Box>
                  <Typography style={{fontSize:fontSize.h6, fontWeight:fontWeight.medium, cursor:'pointer', color:bgColors.darkgreen}} onClick={handleNavigateEmail} >Try Another Way </Typography>
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
