import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ContentState, convertToRaw, EditorState } from "draft-js";
import { Box } from "@mui/material";
import { ChatBubble } from "@mui/icons-material";
import QrCode from "../../Components/QrCode";
import UserIcon from "../../assets/mdi_account-online.svg";
import TvcIcon from "../../assets/tvc-news.svg";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  BASE_URLS,
  ENVIRONMENT_MODE,
  scrollToBottom,
} from "../../config/constants";
import axios from "../../config/axiosInterceptor";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;
const channelId = BASE_URLS[ENVIRONMENT_MODE].CHANNEL_ID;

const socket = io(baseUrl, {
  path: "/public-socket/",
  transports: ["websocket"], // optionally add 'polling' if needed
});

function StreamImpressive() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [connectedUsersCount, setConnectedUsersCount] = useState(null);

  useEffect(() => {
    socket.on("viewer", (data) => {
      console.log("Viewer event received:", data);

      // If data is an array like [{ viewers: 3 }]
      if (Array.isArray(data) && data[0]?.viewers !== undefined) {
        setConnectedUsersCount(data[0].viewers);
      }

      // If data is just { viewers: 3 }
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
  // Aimal code end

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
      console.log("message", message.sender);
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

  // Fetch messages
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

  // Utility: Get first letter of name
  const getInitial = (name) => {
    if (!name) return "";
    return name.trim()[0].toUpperCase();
  };

  // Utility: Get color from name
  function getColorFromName(name) {
    const colors = [
      "#6FCF97",
      "#219653",
      "#F2C94C",
      "#F2994A",
      "#00FF00",
      "#EB5757",
    ];

    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 33) ^ name.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  }

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

  return (
    <Box className="stream-impressive-page">
      <Box
        className="main-chat"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          color: "white",
          width: "100%",
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
            padding: "15px",
          }}
        >
          <button className="static-chat-button-stream">
            <ChatBubble style={{ fontSize: "35px" }} /> Chat
          </button>
          <div
            className="connected-users-count"
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <img
              src={UserIcon}
              alt="Bolt Logo"
              style={{ width: "35px", height: "35px" }}
            />
            <span style={{ color: "white", fontSize: "25px" }}>
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
              fontSize: "20px",
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
                fontSize: "18px",
                color: "#6FCF97",
                marginLeft: "5px",
                color: "#43A2F2",
              }}
            />
          </Box>
          <Box
            sx={{
              fontSize: "19px",
              pl: "2px",
              pr: "5px",
              lineHeight: "30px",
              fontWeight: "600",
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
                    flexDirection: item?.type === "text" ? "row" : "row", // ← key line
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
                          fontWeight: "1000",
                          fontSize: "20px",
                          textTransform: "uppercase",
                        }}
                      >
                        {initial}
                      </Box>
                    )}
                    <Box
                      sx={{
                        color: userColor,
                        fontWeight: 1000,
                        fontSize: "20px",
                        textTransform: "capitalize",
                        letterSpacing: "1px",
                      }}
                    >
                      {name}
                    </Box>
                  </Box>

                  {item?.type === "text" ? (
                    <Box
                      sx={{
                        fontSize: "20px",
                        pl: "2px",
                        pr: "1.5px",
                        lineHeight: "20px",
                        fontWeight: "800",
                        textTransform: "capitalize",
                        letterSpacing: "1px",
                      }}
                    >
                      {item?.message}
                    </Box>
                  ) : (
                    <Box
                      style={{
                        width: "100%",
                        display: "flex",
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
        <Box className="qr-code-wrapper_stream">&nbsp;</Box>
      </Box>
    </Box>
  );
}

export default StreamImpressive;
