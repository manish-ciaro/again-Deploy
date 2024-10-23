import { Box, Button, styled } from "@mui/material";
import React from "react";
import { bgColors, colors, fontSize, fontWeight } from "../styles/Theme";

export default function CustomeButton(props) {
  const { label, className, onClick, disable } = props;
  return (
    <CustomeBtnStyle>
      <Box className="btn-container">
        <Button className={className} onClick={onClick} disabled={disable}>
          {label}
        </Button>
      </Box>
    </CustomeBtnStyle>  
  );
}

const CustomeBtnStyle = styled(Box)({
  "& ": {
    width: '100%'
  },
  "& .btn-container": {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "8%",
  },
  "& .btn-style": {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "8%",
  },
  "& Button": {
    borderRadius: "20px",
    backgroundColor: bgColors.brightCyan,
    color: colors.white,
    textTransform: 'none',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.h6,
    fontFamily: "Poppins",
    "&:disabled": {
      opacity:'80%',
      textTransform: 'none'
    },
    "&:hover": {
      backgroundColor: bgColors.darkgreen,
    },
  },
});
