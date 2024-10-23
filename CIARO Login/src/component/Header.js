import { Box, styled, Typography } from "@mui/material";
import React from "react";
import logo from "../assest/logo.svg";

export default function Header() {
  return (
    <HeaderStyle>
      <Box className="header-box">
        <Box className="header-container">
          <img src={logo} className="img-container" />
        </Box>
      </Box>
    </HeaderStyle>
  );
}

const HeaderStyle = styled(Box)({
  "& .header-box": {
    width: '100vw',
    height: '12vh',
    boxShadow: ' 0 2px 2px 0 rgba(0, 0, 0, 0.2)',
  },
  "& .header-container": {
    width: '98%',
    margin:'auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center'
  },
  "& .img-container": {
    objectFit: 'cover'
  },
});
