import React, { useContext, useState } from "react";
import {
  bgColors,
  fontSize, 
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid2 as Grid, Typography, Paper } from "@mui/material";
import Input from "../../component/CustomeInput";
import CustomeButton from "../../component/CustomeButton";
import welcomeImage from "../../assest/welcome.png";
import { useLocation, useNavigate } from "react-router";
import UserContext from "../../context/UserContext";
import { superAdminPostUserName } from "../../services/CheckSuperAdmin";
import { checkToken } from "../../services/CheckToken";
import { superAdminSendOTP } from "../../services/SendOTP";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { setFirstName, setSuperAdminEmail, setSuperAdminUsername, setIsSA } =
    useContext(UserContext);
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const checkTokenData = {
    username: username,
    token: token,
  };

  // Super Admin First Time Login User Process
  const firstTimeSALogin = async () => {
    const response = await checkToken(checkTokenData);
    if (response?.error) {
      setErrorMessage(response.error);
    } else {
      setErrorMessage(null);
      setSuperAdminUsername(username);
      const otpSendResponse = await superAdminSendOTP(username);
      await setSuperAdminEmail(otpSendResponse?.data?.data?.email);
      navigate("/verify_otp/sa");
    }
  };

  // Function Call on input chage
  const handleChange = (event) => {
    const value = event.target.value;
    setUsername(value);
    setIsEmpty(value.trim() === "");
    setErrorMessage("");
  };

  //Call when Continue Button clicked
  const handleClick = async () => {
    const response = await superAdminPostUserName(username);
    if (response?.error) {
      setErrorMessage(response.error);
    } else {
      console.log("response", response);
      setSuperAdminUsername(username);
      setErrorMessage(null);
      await setFirstName(response?.data?.name);
      await setIsSA(response?.data?.isSuperAdmin);
      navigate("/password");
    }
  };

  return (
    <GlobleStyle>
      <ContainerStyle>
        <Box className="main-container" style={{}}>
          <Grid
            container
            spacing={1}
            style={{ height: "auto", marginTop: "8%", marginLeft: '8%' }}
          >
            <Grid size={{ xs: 12, sm: 5, md: 5 }}>
              <Item
                style={{
                  width: "65%",
                  margin: "auto",
                  alignItems: "center",
                  height: "50vh",
                }}
              >
                <Box style={{ width: "100%", height: "100%" }}>
                  <Typography className="welcome-text">Login</Typography>
                  <Box
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      flexDirection: "column",
                      width: "100%",
                      marginTop: "10%",
                    }}
                  >
                    <Input
                      labelClassName="label-text"
                      label="Username"
                      placeholder="Enter your username"
                      value={username}
                      changeHandler={handleChange}
                    />
                    {errorMessage ? (
                      <Typography className="error-msg pl-10 pt-2">
                        {errorMessage}
                      </Typography>
                    ) : null}
                    <CustomeButton
                      label="Continue"
                      className="continue-btn"
                      disable={isEmpty}
                      onClick={token ? firstTimeSALogin : handleClick}
                    />
                  </Box>
                </Box>  
              </Item>
            </Grid>
            <Box style={{borderLeft: '1px solid black'}} />
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <Item                 style={{
                  width: "80%",
                  margin: "auto",
                  alignItems: "center",
                  height: "60vh",
                }}>
                <Box>
                  <img
                    src={welcomeImage}
                    alt="welcomeImage"
                    className="w-[80%] m-auto object-contain"
                  />
                </Box>
              </Item>
            </Grid>
          </Grid>
        </Box>

        {/* <Box className="main-container">
          <Grid container style={{ backgroundColor: bgColors.lightBlue }}>
            <Grid item sm={6} xs={6} md={6} xl={6} lg={6}>
              <Box className="eclipse-style"></Box>
              <img
                src={welcomeImage}
                alt="welcomeImage"
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
              <Box className="centered-box h-2/3 2xl:h-2/3 xl:ml-6">
                <Box className="h-4/5 flex flex-col justify-around ">
                  <Box className="welcome-text">
                    <Typography className="welcome-text p-5">
                      Welcome!!
                    </Typography>
                  </Box>
                  <Input
                    placeholder="Enter your username"
                    value={username}
                    changeHandler={handleChange}
                  />
                  {errorMessage ? (
                    <Typography className="error-msg pl-10 pt-2">
                      {errorMessage}
                    </Typography>
                  ) : null}
                  <CustomeButton
                    label="CONTINUE"
                    className="continue-btn"
                    disable={isEmpty}
                    onClick={token ? firstTimeSALogin : handleClick}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box> */}
      </ContainerStyle>
    </GlobleStyle>
  );
}
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

const ContainerStyle = styled(Box)({
  "& .border-or-box": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "70%",
    margin: "5% auto",
  },
  "& .logo-container": {
    display: "flex",
    justifyContent: "space-evenly",
    alignProperty: "center",
    width: "60%",
    margin: "0 auto",
  },
  "& .continue-btn": {
    width: "100%",
    height: "45px",
  },

  "& .or-text": {
    fontSize: fontSize.p,
    fontWeight: fontWeight.semibold,
  },
  "& .or-text-border": {
    borderBottom: "1px solid black",
    width: "40%",
  },
});
