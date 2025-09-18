import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import axios from "../../config/axiosInterceptor";
import BoltLogo from "../../assets/bolt.png";
import { BASE_URLS, ENVIRONMENT_MODE } from "../../config/constants";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;

function Scan() {
  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      window.location.replace("https://www.google.com/");
    }, 7000);

    return () => clearTimeout(redirectTimer);
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/advertisements/get?limit=10&page=1&skip=0`
        );

        if (response.data) {
          const data = await response?.data?.data;
          setChatAds(data.filter((ad) => ad.placement === "chat"));
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChatAdIndex((prevIndex) => (prevIndex + 1) % chatAds.length);
    }, 5000); // 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [chatAds]);

  const renderChatAd = (index) => {
    if (chatAds.length === 0) return null; // No ads available

    // if ((index + 1) % 8 === 0) {
      return (
        <div>
          {chatAds[chatAdIndex] && (
            <img
              src={chatAds[chatAdIndex].assetUrl}
              alt="Chat Ad"
              style={{ borderRadius: 12, maxHeight: "170px", width: "100%" }}
            />
          )}
        </div>
      );
    // }
    return null;
  };
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
      {renderChatAd(chatAdIndex)}
      <div
        className="qr-code-main"
        style={{
          marginTop: "auto",
          backgroundColor: "#262825",
          color: "white",
          padding: "20px 0",
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
