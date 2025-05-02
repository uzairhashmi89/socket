import React from "react";
import {  Modal } from "@mui/material";

export const BaseModal = ({ children, sx, ...rest }) => {
  return (
    <Modal
      {...rest}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(7px)",
        ...sx,
      }}
    >
      {children}
    </Modal>
  );
};
