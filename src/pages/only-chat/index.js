import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Box, Button, TextField, Typography, Avatar } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import {
  ChatBubble,
} from "@mui/icons-material";

// const socket = io('https://api.staging-new.boltplus.tv/public_chat');
const socket = io("https://api.staging-new.boltplus.tv", {
  // const socket = io('http://localhost:5001', {
  path: "/public-socket/",
  transports: ["websocket"], // optionally add 'polling' if needed
});
function OnlyChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("[Client] Connected:", socket.id);
      if (localStorage.getItem("userName")) {
        emitJoin(localStorage.getItem("userName"));
      }
    });

    // const userPayload = {
    //   id: socket?.id,
    //   username: 'Owais',
    // }

    // const payload = {
    //   channelId: "68090b895880466655dc6a17",
    //   channelType: "channel",
    //   user: userPayload
    // }

    // socket.emit("join", payload);

    socket.on("message", (message) => {
      console.log("message", message);
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

  const sendMessage = () => {
    if (input.trim()) {
      const payload = {
        message: input,
        draftContent: "",
        type: "text",
        // poll:  '',
        // giphy: '',
      };
      socket.emit("sendMessage", payload);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // Fetch ads
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

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          "https://api.staging-new.boltplus.tv/messages/open/channel/68090b895880466655dc6a17",
          // 'http://localhost:5001/messages/open/channel/68090b895880466655dc6a17',
          {
            method: "POST",
            body: JSON.stringify({}),
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

    fetchMessages();
  }, []);

  // Rotate ads every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setChatAdIndex((prevIndex) => (prevIndex + 1) % chatAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [chatAds]);

  // Utility: Get first letter of name
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

  // Render ads every 8th message
  const renderChatAd = (index) => {
    if (chatAds.length === 0) return null;
    if ((index + 1) % 8 === 0) {
      return (
        <Box mt={1} style={{ width: "97%", borderRadius: 8, padding: "0px" }}>
          {chatAds[chatAdIndex] && (
            <img
              src={chatAds[chatAdIndex].assetUrl}
              alt="Chat Ad"
              style={{ width: "100%", borderRadius: 8 }}
            />
          )}
        </Box>
      );
    }
    return null;
  };
  const TestVideo =
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";

  const [username, setUsername] = useState(
    localStorage.getItem("userName") || ""
  );
  const [isSettingUsername, setIsSettingUsername] = useState(
    !localStorage.getItem("userName")
  );

  const handleSaveUsername = () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      localStorage.setItem("userName", trimmedUsername);
      setUsername(trimmedUsername); // Update state with trimmed value
      setIsSettingUsername(false); // Emit the join event with the new username immediately after saving
      // The useEffect listening to 'username' and 'socket.connected' will also trigger this
      // but emitting here ensures it happens right after saving.

      if (socket.connected) {
        emitJoin(trimmedUsername);
      }
    } else {
      console.warn("Username cannot be empty."); // Optionally provide feedback to the user
    }
  };

  const emitJoin = (currentUsername) => {
    const userPayload = {
      username: currentUsername,
    };

    const payload = {
      channelId: "68090b895880466655dc6a17", // Use your actual channel ID
      channelType: "channel",
      user: userPayload,
    };
    console.log("Joining channel with payload:", payload);
    socket.emit("join", payload);
  };

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  return (
    <Box className="chat-ui">
      <Box
        className="main-chat"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          p: 2,
          backgroundColor: "#0b0c2a",
          color: "white",
          opacity: 1,
          position: "",
          borderLeft: "1px solid gray",
        }}
      >
        <div>
          <button className="static-chat-button">
            <ChatBubble /> Chat
          </button>
        </div>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            overflowY: "auto",
            mt: "auto",
            pb: "0px",
          }}
          className="message-container"
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
                  <Box sx={{ pl: "5px" }}>{item?.message}</Box>
                </Box>
                {/* Optional Ad */}
                {renderChatAd(index)}
              </Box>
            );
          })}

          <div ref={messagesEndRef} />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 0",
            backgroundColor: "#0b0c2a",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            position: "static",
            bottom: 0,
            right: 0,
            width: "auto",
            opacity: 0.95,
          }}
          className="send-message-input"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            style={{
              width: "95%",
              marginRight: "1rem",
              backgroundColor: "rgb(55, 57, 71)",
              border: "1px solid rgb(55, 57, 71)",
              outline: 0,
              height: "50px",
              borderRadius: "8px",
              padding: "0 10px",
              color: "white",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              width: "50px",
              height: "50px",
              background:
                "linear-gradient(93.56deg, rgb(101, 53, 233) 4.6%, rgb(78, 51, 233) 96.96%)",
              border: "1px solid rgb(101, 53, 233)",
              outline: 0,
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SendIcon />
          </button>
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute", // Example positioning
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10, // Ensure it's above chat content
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 3,
          borderRadius: 2,
          display: isSettingUsername ? "flex" : "none", // Show/hide based on state
          flexDirection: "column",
          gap: 2,
        }}
      >
               
        <Typography variant="h6" sx={{ color: "white" }}>
          Set Username
        </Typography>
               
        <TextField
          label="Username"
          variant="outlined"
          value={username} // Use the username state
          onChange={(e) => setUsername(e.target.value)}
          InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }} // Style label
          InputProps={{ style: { color: "white" } }} // Style input text
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.7)",
            },
          }}
        />
               
        <Button variant="contained" onClick={handleSaveUsername}>
          Save
        </Button>
      </Box>
      
      {!isSettingUsername && username && (
        <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 5 }}>
          <Button variant="outlined" onClick={() => setIsSettingUsername(true)}>
            Edit Username
          </Button>
        </Box>
      )}
      {!isSettingUsername && !username && (
        <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
          <Button variant="outlined" onClick={() => setIsSettingUsername(true)}>
            Set Username
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default OnlyChat;
