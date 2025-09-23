import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import axios from "../../config/axiosInterceptor";
import BoltLogo from "../../assets/bolt.png";
import { BASE_URLS, ENVIRONMENT_MODE } from "../../config/constants";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;
const QR_TRACK_INFO = `${baseUrl}/open/qrCodeTrack/`;
const ADDS_URL = `${baseUrl}/advertisements/get?limit=10&page=1&skip=0`;
const ERROR_MESSAGE = 'Scan failed — please re-scan the QR code.';

function Scan() {
  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);
  const [qrRedirectUrl, setQrRedirectUrl] = useState();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = window.location.pathname;
  const pathSegments = location.split("/");
  const qrId = pathSegments[pathSegments.length - 1];

  useEffect(() => {
    fetchAds();
    getQrAndPostTrackInfo(qrId);
  }, []);

  useEffect(() => {
    if (qrRedirectUrl) {
      const redirectTimer = setTimeout(() => {
        window.location.replace(qrRedirectUrl);
      }, 7000);
      return () => clearTimeout(redirectTimer);
    }
  }, [qrRedirectUrl])

  useEffect(() => {
    const interval = setInterval(() => {
      setChatAdIndex((prevIndex) => (prevIndex + 1) % chatAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [chatAds]);

  const fetchAds = async () => {
    try {
      const response = await axios.get(ADDS_URL);

      if (response.data) {
        const data = await response?.data?.data;
        setChatAds(data.filter((ad) => ad.placement === "chat"));
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  const getQrAndPostTrackInfo = async (id) => {
    setLoading(true);
    const url = QR_TRACK_INFO + id;
    try {
      const response = await axios.get(url);
      setLoading(false);
      if (response.data && response.data?.redirectUrl) {
        setQrRedirectUrl(response.data?.redirectUrl);
      } else {
        setError(true);
      }
    } catch (err) {
      setLoading(false);
      setError(true);
      console.log(`Failed to call qrCode track: ${err.message}`);
    }
  };

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
        {
          loading || !error ?
            <Typography>Redirecting...</Typography> :
            <Typography>{ERROR_MESSAGE}</Typography>
        }
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
