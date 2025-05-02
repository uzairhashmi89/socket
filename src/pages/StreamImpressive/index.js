import { useEffect, useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import { Box } from "@mui/material";
export default function LiveChatImmersive() {
  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);
  const [messages, setMessages] = useState([]);

  const storedFontSize = localStorage?.getItem("chatFontSize");
  const [fontSize, setFontSize] = useState(() => {
    return storedFontSize ? parseInt(storedFontSize, 10) : 12;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://api.staging-new.boltplus.tv/messages/open/channel/68090b895880466655dc6a17",
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          console.error("Fetch error:", response.status);
          return;
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error during fetch:", error);
      }
    };

    // Call fetchData immediately when the component mounts
    fetchData();

    // Set up an interval to call fetchData every 10 seconds (10000 milliseconds)
    const intervalId = setInterval(fetchData, 10000);

    // Clean up the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
      const fetchAds = async () => {
        try {
          const response = await fetch(
            "https://api.staging-new.boltplus.tv/advertisements/get?limit=10&page=1&skip=0&forFrontend=true",
            {
              method: "GET",
              headers: {
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                Connection: "keep-alive",
                Origin: "https://staging-new.boltplus.tv",
                Referer: "https://staging-new.boltplus.tv/",
                "User-Agent": "Mozilla/5.0",
                boltsrc: "boltplus-webapp/microsoft_windows/0.1.0",
                device: "d520c7a8-421b-4563-b955-f5abc56b97ec",
                "product-token": "330dbc49a5872166f13049629596fc088b26d885",
                session: "1744790058433",
                "Cache-Control": "no-cache",
              },
            }
          );
  
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
  
          const data = await response.json();
          setChatAds(data?.data?.filter((ad) => ad.placement === "chat"));
        } catch (e) {
          console.error("Error fetching ads:", e);
        }
      };
  
      fetchAds();
    }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChatAdIndex((prevIndex) => (prevIndex + 1) % chatAds?.length);
    }, 5000); // 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [chatAds]);

  const renderChatAd = (index) => {
    if (chatAds?.length === 0) return null; // No ads available

    if ((index + 1) % 8 === 0) {
      return (
        <div>
          {chatAds?.[chatAdIndex] && (
            <img
              src={chatAds[chatAdIndex].assetUrl}
              alt="Chat Ad"
              height={135}
              width={466}
            />
          )}
        </div>
      );
    }
    return null;
  };

  const stringToColor = (string) => {
    if (!string) return null;
    let hash = 0;
    /* eslint-disable no-bitwise */
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  };

  const [showQR, setShowQR] = useState(false);

  const handleClick = () => {
    setShowQR(!showQR);
    setTimeout(() => {
      setShowQR(false);
    }, 30000);
  };

  const { ref, focused } = useFocusable({
    onEnterPress: handleClick,
    onArrowPress: (direction) => {
      return !(direction === "left" || direction === "right");
    },
  });

  const getInitial = (name) => {
    if (!name) return "";
    return name.trim()[0].toUpperCase();
  };

  const getColorFromName = (name) => {
    const colors = ["#F44336", "#2196F3", "#FF9800", "#4CAF50", "#9C27B0"];
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="stream-impressive font-poppins flex-1 flex flex-col w-[100%] overflow-auto no-scrollbar mt-6">
      <div className="self-center">
        {showQR && (
          <div className=" mt-[18px] mb-[34px] flex flex-col items-center space-y-[33px]">
            <p className="show-qr font-medium text-2xl leading-[30px] text-white-85 text-center">
              Scan the QR code with Bolt+ app
              <br /> to connect your mobile
            </p>
            <div className="qr-code rounded-[25px] overflow-hidden">
              <QRCode
                removeQrCodeBehindLogo
                size={250}
                quietZone={25}
                eyeRadius={15}
                logoPadding={10}
                fgColor="#4449e3"
                value="https://tvcnews.boltplus.tv/only-chat"
              />
            </div>
            <button
              className="cancel-btn"
              ref={ref}
              onClick={handleClick}
              // className={clsx(
              //   "bg-white-12 py-[10px] pl-7 pr-5 rounded-lg flex items-center hover:bg-white-base/30",
              //   focused && "bg-white-85",
              //   focused && "text-primary-gray",
              //   !focused && "text-white-base"
              // )}
            >
              Cancel
            </button>
          </div>
        )}
        {!showQR && (
          <button
            className="scan-qr font-medium text-white-85"
            ref={ref}
            onClick={handleClick}
            // className={clsx(
            //   "bg-white-12 py-[10px] pl-7 pr-5 rounded-lg flex items-center space-x-[18px] hover:bg-white-base/30",
            //   focused && "bg-white-base/30"
            // )}
          >
            <PhoneAndroidIcon /> Scan Qr to start chatting
          </button>
        )}
      </div>
      <hr className="hr" />
      <Box
        className=" flex-1 overflow-auto no-scrollbar pb-80"
        style={{
          padding: "0px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages?.map((item, index) => {
          const name = item?.sender || "User";
          const avatarUrl = item?.sender?.photoUrl;
          const initial = getInitial(name);

          return (
            <Box
              className="message"
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                mb: 2,
              }}
              style={{
                marginBottom: "10px",
              }}
            >
              <Box
                style={{
                  width: "99%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Top row: Avatar + Username */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {avatarUrl ? (
                    <Box
                      component="img"
                      src={avatarUrl}
                      alt={name}
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        backgroundColor: getColorFromName(name),
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "500",
                        fontSize: "1rem",
                        textTransform: "uppercase",
                      }}
                    >
                      {initial}
                    </Box>
                  )}
                  <Box
                    sx={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: 600,
                      fontSize: "16px",
                    }}
                  >
                    {name}
                  </Box>
                </Box>

                {/* Message line */}
                {item?.type === "text" ? (
                    <Box sx={{ pl: "5px" }}>{item?.message}</Box>
                  ) : (
                    <Box sx={{ pl: "5px" }}>
                      <img
                        src={
                          "https://media.giphy.com/media/" +
                          (item?.giphy && item?.giphy.id) +
                          "/giphy.gif"
                        }
                      />
                    </Box>
                  )}
              </Box>
              {/* Optional Ad */}
              {/* {renderChatAd(index)} */}
            </Box>
          );
        })}
      </Box>
    </div>
  );
}
