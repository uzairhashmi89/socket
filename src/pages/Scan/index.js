import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import BoltLogo from "../../assets/bolt.png";

function Scan() {
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      window.location.replace("https://www.google.com/");
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, []);
  return (
    <Box style={{ height: "100vh" }} className="centered-box">
      <div
        style={{
          display: "flex",
          display: "flex",
          textAlign: "center",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100vh - 80px)",
        }}
      >
        <Typography>Redirecting...</Typography>
      </div>
      <div
        className="qr-code-main"
        style={{
          marginTop: "auto",
          backgroundColor: "#262825",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "15px",
          flexDirection: "row",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 200, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "13px" }}>Powered by</span>
            <img src={BoltLogo} alt="Bolt Logo" />
          </div>
        </div>
      </div>
    </Box>
  );
}

export default Scan;
