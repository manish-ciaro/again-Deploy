import { Box, styled } from "@mui/material";

const bgColors = {
  lightBlue: "#A4ECDA",
  darkgreen: "#008C87",
  skyBlue: "#00D9D2",
  brightCyan: '#01D9D1'
};
const colors = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#FF0000",
  borderLinear:
    "linear-gradient(180deg, rgba(0,140,135,1) 0%, rgba(0,140,135,1) 0%, rgba(0,212,255,1) 100%)",
};
const fontSize = {
  h2: "3rem",
  h3: "2.25rem", //36pxs
  heading3_4: "1.8rem",//28px 
  h4: "1.25rem", //20px
  h5: "1rem", //16px
  h6: "0.9rem", //14px
  h7: "0.8rem", //12px
  p: "0.75rem",
};
const fontWeight = {
  extrabold: 800,
  bold: 700,
  semibold: 600,
  medium: 500,
  p1: 400,
};

const GlobleStyle = styled(Box)({
  "& .main-container": {
    width: "95%",
    margin: "auto",
    marginTop: "2%",
    border: "1px solid black",
    borderRadius:'20px',
    // height: "80vh",
    overflow: "hidden",
  },
  "& .grid-box": {
    gridTemplateColumns: "repeat(auto-fit,minmax(3, 1fr) )",
    gridTemplateRows: "auto",
  },
  "& img": {
    loading: "lazy",
  },
  "& .centered-box": {
    backgroundColor: "#FFFFFF",
    width: "80%",
    borderRadius: "5%",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
  },
  "& .box-align-center": {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  "& .eclipse-style": {
    backgroundColor: "white",
    width: "100%",
    height: "100vh",
    borderRight: "1px inset #008C87",
    borderRadius: "0 50% 50% 0",
    boxShadow: " 25px -4px 0px 0px #008C87",
    transform: "scaleY(1.2)",
    position: " relative",
    right: "20%",
  },

  "& .error-msg": {
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.h7,
    color: "red",
  },
  "& .label-text": {
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.h6,
    textAlign: 'left',
    marginBottom: '2%'
  },

  "& .welcome-text": {
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.heading3_4,
    color: "black",
    display: "flex",
    // justifyContent: "center",
    alignItems: "center",
  },
  "& .centered-box-container": {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "537px",
    height: "100vh",
  },
  "& .welcome-img": {
    position: "absolute",
    zIndex: 1,
    height: "60%",
    width: "40%",
    margin: "auto",
    top: "28vh",
  },
  "& .password-toggle-style": {
    cursor: "pointer",
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 10,
    right: "4.5rem",
    top: "38%",
  },
});

export { bgColors, colors, fontSize, fontWeight, GlobleStyle };
