import { Box, styled } from "@mui/material";
import React from "react";
import { fontSize, fontWeight } from "../styles/Theme";

export default function Input(props) {
  const { name, value, changeHandler, label, type, placeholder, max, min, labelClassName } =
    props;
  return (
    <InputStyle >
      <Box style={{ width: "100%", display: "flex", flexDirection: 'column' }}>
        <label htmlFor={name} className={labelClassName}>{label}</label>
        <input
          name={name}
          className="input-style text-sm font-medium md:text-sm sm:text-sm"
          value={value}
          onChange={changeHandler}
          type={type}
          placeholder={placeholder}
          max={max}
          min={min}
        />
      </Box>
    </InputStyle>
  );
}

const InputStyle = styled(Box)({
  "& ": {
    width: "100%",
  },
  "& .input-style": {
    width: "100%",
    // marginLeft: "8%",
    height: "8vh",
    borderRadius: "10px",
    border: "2px inset black",
    padding: "5%",
  },
  "& .input-style::placeholder": {
    color: "rgba(0, 0, 0, 0.5)",
  },
});
