import React from "react";
import { bgColors, GlobleStyle } from "../../styles/Theme";
import { Box, styled, Grid, Typography } from "@mui/material";
import secondImg from "../../assest/image02.png";
import CustomeButton from "../../component/CustomeButton";
import greencheck from "../../assest/green-check-icon.png";
import { useNavigate } from "react-router";

export default function PasswordChanged() {
  const handleNavigate = () => {
    if (sessionStorage.getItem("adminLogin") == "true") {
      navigate("/login");
    } else if (sessionStorage.getItem("SALogin") == "true") {
      navigate("/login/sa");
    }
  };

  const navigate = useNavigate();
  return (
    <GlobleStyle>
      <PasswordChangedStyle>
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
                  <Box className="p-7 flex justify-center align-middle flex-col pb-0">
                    <Box className="flex justify-center align-middle">
                      <img src={greencheck} alt="green-check" />
                    </Box>
                    <Typography className=" welcome-text text-center pt-5">
                      Your password has been updated successfully
                    </Typography>
                  </Box>
                  <CustomeButton
                    label="Login"
                    className="update-btn"
                    onClick={handleNavigate}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PasswordChangedStyle>
    </GlobleStyle>
  );
}
const PasswordChangedStyle = styled(Box)({
  "& .update-btn": {
    height: "45px",
    width: "30%",
    textTransform: "none",
  },
});
