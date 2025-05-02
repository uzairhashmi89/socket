import React from "react";
import { Box } from "@mui/material";

export const FlexRow = React.forwardRef(({ children, sx, ...rest }, ref) => {
  return (
    <Box
      ref={ref}
      {...rest}
      sx={{ display: "flex", flexDirection: "row", ...sx }}
    >
      {children}
    </Box>
  );
});
