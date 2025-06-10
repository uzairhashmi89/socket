import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ContentState, convertToRaw, EditorState } from "draft-js";
import { Box } from "@mui/material";
import { ChatBubble } from "@mui/icons-material";
import RadioPlayer from "./Component/RadioPlayer";
import QrCode from "../../Components/QrCode";
import UserIcon from "../../assets/mdi_account-online.svg";
import VerifiedIcon from "@mui/icons-material/Verified";
import TvcIcon from "../../assets/tvc-news.svg";
import { BASE_URLS, ENVIRONMENT_MODE, scrollToBottom } from "../../config/constants";
import axios from "../../config/axiosInterceptor";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;
const channelId = BASE_URLS[ENVIRONMENT_MODE].CHANNEL_ID;

const socket = io(baseUrl, {
  path: "/public-socket/",
  transports: ["websocket"],
});

function Immersive({VideoUrl='https://api-ott.lightsoutsportstv.com/loggingmediaurlpassthrough/a.m3u8?version=12&id=8090&partner=boltplus'}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [connectedUsersCount, setConnectedUsersCount] = useState(null);

  useEffect(() => {
    socket.on("viewer", (data) => {
      if (Array.isArray(data) && data[0]?.viewers !== undefined) {
        setConnectedUsersCount(data[0].viewers);
      }

      else if (data?.viewers !== undefined) {
        setConnectedUsersCount(data.viewers);
      }
    });

    return () => {
      socket.off("viewer");
    };
  }, []);
  
  useEffect(() => {
    socket.on("disconnect", () => {
      console.log("Disconnected");
    });
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("[Client] Connected:", socket.id);
      if (localStorage.getItem("userName")) {
        emitJoin(localStorage.getItem("userName"));
      } else {
        emitJoin("Guest");
      }
    });

    socket.on("message", (message) => {
      setMessages((prev) => [message, ...prev]);
    });

    socket.on("connect_error", (err) => {
      console.error("[Client] Connection error:", err.message);
    });
    socket.on("pong", () => {
      console.log("PONG received");
    });
    socket.emit("ping");
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/messages/open/channel/${channelId}`
        );

        if (response.data) {
          const data = await response.data;
          setMessages(data);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
    };

    fetchMessages();
  }, []);

  const getInitial = (name) => {
    if (!name) return "";
    return name.trim()[0].toUpperCase();
  };

  // Utility: Get color from name
  const getColorFromName = (name) => {
    const colors = ["#F44336", "#2196F3", "#FF9800", "#4CAF50", "#9C27B0"];
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const emitJoin = (currentUsername) => {
    const userPayload = {
      username: currentUsername,
    };

    const payload = {
      channelId: channelId, // Use your actual channel ID
      channelType: "channel",
      user: userPayload,
    };
    console.log("Joining channel with payload:", payload);
    socket.emit("join", payload);
  };
  const scrollableContainerRef = useRef(null);
  const firstMessageRef = useRef(null);

  useEffect(() => {
      if (messages?.length > 0) {
        const timeout = setTimeout(
          scrollToBottom(scrollableContainerRef, firstMessageRef),
          1000
        );
        return () => clearTimeout(timeout);
      }
    }, [messages]);

  useEffect(() => {
    const newState = EditorState.push(
      editorState,
      ContentState.createFromText(""),
      "insert-characters"
    );
    setEditorState(EditorState.moveFocusToEnd(newState));
  }, []);

  const updateChatState = (payload) => {
    setInput((prev) => ({ ...prev, ...payload }));
  };

  const onChangeText = (message) => {
    updateChatState({ message });
  };

  const onChangeDraftContent = (draftContent) => {
    updateChatState({ draftContent });
  };
  const onChangeEditorState = (editorState) => {
    updateChatState({ editorState });
  };

  useEffect(() => {
    onChangeEditorState(editorState);
    const editorData = convertToRaw(editorState.getCurrentContent());
    onChangeDraftContent(JSON.stringify(editorData));
    onChangeText(editorData?.blocks?.map((item) => item.text)?.join("\n"));
  }, [editorState]);

  const TestVideo = VideoUrl; 
  //"https://api-ott.lightsoutsportstv.com/loggingmediaurlpassthrough/a.m3u8?version=12&id=8090&partner=boltplus";
  //     "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";
  // "https://api-ott.motorvision.tv/loggingmediaurlpassthrough/a.m3u8?version=12&id=2459&partner=boltplus";

  return (
    <Box className="chat-ui">
      <RadioPlayer url={TestVideo} width="100%" />
      <Box
        className="main-chat main-chat-inner"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          pt: {
//            md: 2,
            sm: 0,
          },
          pb: 1.2,
          pl: 0,
          right: {
            lg: 60,
            md: 60,
            sm: 0,
            xs: 0,
          },
          color: "white",
          opacity: 1,
          position: "",
          background: {
            sm: "#2c3035",
            xs: "#2c3035",
          },
        }}
      >
        <div
          style={{
            backgroundColor: "#2c3136",
            width: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            padding: "5px 20px 5px 5px",
            height: "40px",
          }}
        >
          <button className="static-chat-button">
            <ChatBubble /> Chat
          </button>
          <div
            className="connected-users-count"
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <img
              src={UserIcon}
              alt="Bolt Logo"
              style={{ width: "20px", height: "20px" }}
            />
            <span style={{ color: "white", fontSize: "12px" }}>
              {connectedUsersCount}
            </span>
          </div>
        </div>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "#181818",
            padding: "8px 13px 8px 13px",
            borderTop: "1px solid #818181",
            borderBottom: "1px solid #818181",
          }}
        >
          <Box
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "capitalize",
              textWrap: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0 5px",
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: "red",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "500",
                fontSize: "1rem",
                textTransform: "uppercase",
              }}
            >
              <img
                src={TvcIcon}
                alt="Bolt Logo"
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
            TVC News{" "}
            <VerifiedIcon
              sx={{
                fontSize: "12px",
                color: "#6FCF97",
                marginLeft: "5px",
                color: "#43A2F2",
              }}
            />
          </Box>
          <Box
            sx={{
              fontSize: "14px",
              pl: "2px",
              pr: "5px",
              lineHeight: "21px",
              fontWeight: "400",
              textTransform: "capitalize",
            }}
          >
            🔴 LIVE: TVC News – Breaking Updates & Discussion
          </Box>
        </Box>
        <Box
          ref={scrollableContainerRef}
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            overflowY: "auto",
            mt: "auto",
            p: "0px 10px 15px",
            scrollBehavior: "smooth",
            gap: "0",
          }}
          className="message-container"
        >
          {messages?.map((item, index) => {
            const name = item?.sender || "User";
            const avatarUrl = item?.profileImage || null;
            const initial = getInitial(name);
            const isFirstMessage = index === 0;
            const userColor = getColorFromName(name);
            return (
              <Box
                className="message"
                key={index}
                ref={isFirstMessage ? firstMessageRef : null}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px 0",
                  mb: 1,
                }}
                style={{
                  marginBottom: "5px",
                }}
              >
                <Box
                  style={{
                    width: "99%",
                    display: "flex",
                    flexDirection: item?.type === "text" ? "row" : "column", // ← key line
                    alignItems: item?.type === "text" ? "center" : "flex-start", // for better vertical alignment
                    gap: "5px", // optional spacing
                    padding: "5px 10px 5px 10px",
                  }}
                >
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
                          display: "block",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          backgroundColor: userColor,
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
                        color: userColor,
                        fontWeight: 600,
                        fontSize: "13.5px",
                        textTransform: "capitalize",
                      }}
                    >
                      {name}
                    </Box>
                  </Box>

                  {item?.type === "text" ? (
                    <Box
                      sx={{
                        fontSize: "13.5px",
                        pl: "2px",
                        pr: "1.5px",
                        lineHeight: "20px",
                        fontWeight: "400",
                        textTransform: "capitalize",
                      }}
                    >
                      {item?.message}
                    </Box>
                  ) : (
                    <Box
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={
                          "https://media.giphy.com/media/" +
                          (item.giphy && item.giphy.id) +
                          "/giphy.gif"
                        }
                        width={250}
                        style={{ borderRadius: "8px" }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}

          <div ref={messagesEndRef} />
        </Box>
        <Box className="qr-code-wrapper">
          <QrCode />
        </Box>
      </Box>
    </Box>
  );
}

export default Immersive;
