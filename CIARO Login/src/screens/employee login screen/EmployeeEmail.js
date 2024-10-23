import React, { useContext, useState } from "react";
import {
  bgColors,
  fontSize,
  fontWeight,
  GlobleStyle,
} from "../../styles/Theme";
import { Box, styled, Grid, Typography } from "@mui/material";
import Input from "../../component/CustomeInput";
import CustomeButton from "../../component/CustomeButton";
import welcomeImage from "../../assest/welcome.png";
import googleLogo from "../../assest/google-logo.png";
import office365 from "../../assest/office-365.png";
import { useLocation, useNavigate } from "react-router";
import UserContext from "../../context/UserContext";
import { CheckEmployeeExist } from "../../services/CheckEmployeeExist";
import { EmailRegExp } from "../../utils/constants/constants";
import { SSOLoginApi } from "../../services/SSO";
import { EmployeeEmailExist } from "../../services/checkEmailExist";

export default function EmployeeEmail() {
  const navigate = useNavigate();
  const { setEmpEmail, setFirstName, setOrgID, setIsSA } = useContext(UserContext);

  const [empEmail, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  // Function Call If Employee is login for the first time
  const firstTimeEmpLogin = async () => {
    if (empEmail.match(EmailRegExp)) {
      const response = await CheckEmployeeExist(empEmail, token);
      if (response.error) {
        setErrorMessage(response.error);
      } else {
        setErrorMessage(null);
        await setOrgID(response?.organizationId);
        await setIsSA(response?.data?.isSuperAdmin)
        navigate("/set_password");
      }
    } else {
      return setErrorMessage("Invalid Email");
    }
  };

  // Function Call on input chage
  const handleChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    setEmpEmail(value);
    setIsEmpty(value.trim() === "");
    setErrorMessage("");
  };

  // function call after click on continue button
  const handleLogin = async () => {
    if (empEmail.match(EmailRegExp)) {
      const response = await EmployeeEmailExist(empEmail);
      if (response?.error) {
        setErrorMessage(response.error);
      } else {
        setErrorMessage(null);
        await setFirstName(response.data.name);
        navigate("/password");
      }
    } else {
      return setErrorMessage("Invalid Email");
    }
  };

  // function call after click on continue button
  const handleSSOClick = () => {
    SSOLoginApi()
  };

  return (
    <GlobleStyle>
      <ContainerStyle>
        <Box className="main-container">
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
                    placeholder="Enter your email"
                    value={empEmail}
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
                    onClick={token ? firstTimeEmpLogin : handleLogin}
                  />
                  <Box>
                    <Box className="logo-container">
                      <img alt="googleLogo" src={googleLogo} />
                      <img alt="office365" src={office365} />
                    </Box>
                    <Box className="border-or-box">
                      <Box className="or-text-border" />
                      <Typography className="or-text">OR</Typography>
                      <Box className="or-text-border" />
                    </Box>
                    <CustomeButton
                      label="SIGN IN WITH SSO"
                      className="sso-btn"
                      onClick={handleSSOClick}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </ContainerStyle>
    </GlobleStyle>
  );
}

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
    width: "38%",
    height: "45px",
  },
  "& .sso-btn": {
    width: "66%",
    height: "28px",
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
