import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Box, Button, TextField, Typography, Avatar } from "@mui/material"; // Using TextField and Typography from MUI
import SendIcon from "@mui/icons-material/Send";
import RadioPlayer from "./RadioPlayer.js"; // Keep if needed

// const socket = io('https://api.staging-new.boltplus.tv/public_chat');
// Use the same options as in the original code
const socket = io("https://api.staging-new.boltplus.tv", {
  path: "/public-socket/",
  transports: ["websocket"], // optionally add 'polling' if needed
});

function ChatNew() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef(null); // Ref for the scrollable container

  const [username, setUsername] = useState(
    localStorage.getItem("userName") || ""
  );
  const [isSettingUsername, setIsSettingUsername] = useState(
    !localStorage.getItem("userName")
  ); // Show input if username is not set
  // Ad state and logic

  const [chatAds, setChatAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0); // --- Socket.IO Effects ---

  useEffect(() => {
    socket.on("connect", () => {
      console.log("[Client] Connected:", socket.id);
      if (localStorage.getItem("userName")) {
        emitJoin(localStorage.getItem("userName"));
      }
    });

    socket.on("message", (message) => {
      // Add new messages to the end of the array for standard chat flow (scroll down)
      setMessages((prev) => [...prev, message]);
    });

    socket.on("connect_error", (err) => {
      console.error("[Client] Connection error:", err.message);
    });

    socket.on("pong", () => {
      console.log("PONG received");
    }); // Clean up listeners and socket connection on component unmount

    return () => {
      socket.off("connect");
      socket.off("message");
      socket.off("connect_error");
      socket.off("pong");
      socket.disconnect();
    };
  }, []); // Empty dependency array: runs only on mount and unmount
  // Effect to emit 'join' when a new username is saved and connected

  useEffect(() => {
    // If username is set and socket is connected, and we are not in the process of setting username
    if (username && socket.connected && !isSettingUsername) {
      emitJoin(username);
    }
  }, [username, isSettingUsername, socket.connected]); // Re-run when username or connection status changes
  // Helper function to emit the 'join' event

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
  }; // --- API Fetch Effects ---
  // Fetch initial messages

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          "https://api.staging-new.boltplus.tv/messages/open/channel/68090b895880466655dc6a17", // Use your actual channel ID
          {
            method: "POST", // Assuming an empty body is needed for this endpoint
            body: JSON.stringify({}),
            headers: {
              "Content-Type": "application/json", // Specify content type if sending a body
              // Keep other necessary headers based on API requirements, but remove unnecessary browser-specific ones
              // e.g., 'product-token', 'device', 'session' might be needed if they identify the client
            },
          }
        );

        if (!response.ok) {
          console.error("Fetch messages error:", response.status);
          return;
        }

        const data = await response.json(); // Assuming data is an array of messages, set them in state
        // Sort messages by createdAt if they are not guaranteed to be in order
        data.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, []); // Empty dependency array: runs only on mount
  // Fetch ads

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(
          "https://api.staging-new.boltplus.tv/advertisements/get?limit=10&page=1&skip=0&forFrontend=true",
          {
            method: "GET",
            headers: {
              Accept: "application/json", // Simple Accept header
              // Include only necessary custom headers required by the API
              // e.g., 'product-token', 'device', 'session' if they identify the client
              boltsrc: "boltplus-webapp/microsoft_windows/0.1.0", // Example - keep if required
              device: "d520c7a8-421b-4563-b955-f5abc56b97ec", // Example - keep if required
              "product-token": "330dbc49a5872166f13049629596fc088b26d885", // Example - keep if required
              session: "1744790058433", // Example - keep if required
            },
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const responseData = await response.json(); // Renamed to avoid shadowing
        // Assuming ads are in responseData.data and have a 'placement' property
        setChatAds(
          responseData?.data?.filter((ad) => ad.placement === "chat") || []
        ); // Ensure chatAds is always an array
      } catch (e) {
        console.error("Error fetching ads:", e);
      }
    };

    fetchAds();
  }, []); // Empty dependency array: runs only on mount
  // Rotate ads every 5 seconds

  useEffect(() => {
    // Only start the interval if there are ads to show
    if (chatAds.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % chatAds.length);
      }, 5000);

      return () => clearInterval(interval); // Cleanup interval
    }
    return undefined; // No cleanup needed if no interval started
  }, [chatAds]); // Re-run when chatAds change
  // Effect to scroll to the bottom when new messages arrive

  useEffect(() => {
    // Scroll to the bottom whenever messages update
    if (messagesContainerRef.current) {
      // Use setTimeout to ensure scrolling happens after render
      setTimeout(() => {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }, 0); // Or a small delay like 50ms
    }
  }, [messages]); // Re-run when messages array changes
  // --- Event Handlers ---

  const sendMessage = () => {
    if (input?.trim() && username) {
      // Ensure username is set before sending
      const payload = {
        message: input.trim(), // Trim whitespace
        // draftContent: "", // Include if needed by API
        type: "text", // poll: '', // Include if needed
        // giphy: '', // Include if needed
        // Assuming the server adds sender/username based on the 'join' user or socket connection
      };
      socket.emit("sendMessage", payload);
      setInput(""); // Clear input after sending
    } else if (!username) {
      console.warn("Username not set. Cannot send message."); // Optionally show a message to the user to set their username
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission or newline
      sendMessage();
    }
  };

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
  }; // --- Utility Functions ---

  const getInitial = (name) => {
    if (!name || typeof name !== "string") return "";
    return name.trim().charAt(0).toUpperCase();
  };

  const getColorFromName = (name) => {
    // Ensure name is a string before splitting
    const stringName = typeof name === "string" ? name : String(name);
    const colors = ["#F44336", "#2196F3", "#FF9800", "#4CAF50", "#9C27B0"]; // Use a more robust hashing algorithm or simply charCodeAt
    const hash = stringName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }; // Render ads every 8th message

  const renderChatAd = (index) => {
    // Render ad below the message at the specified index + 1 position
    if (chatAds.length === 0) return null;
    if ((index + 1) % 8 === 0) {
      // Check if this is the 8th, 16th, etc. message index + 1
      const currentAd = chatAds[currentAdIndex]; // Use the current ad index state
      return (
        // Added key for list rendering
        <Box
          key={`ad-${index}`}
          mt={1}
          sx={{ width: "97%", borderRadius: 8, padding: "0px" }}
        >
                   
          {currentAd &&
            currentAd.assetUrl && ( // Ensure ad and assetUrl exist
              <Box
                component="img"
                src={currentAd.assetUrl}
                alt="Chat Ad"
                sx={{ width: "100%", borderRadius: 8 }}
              />
            )}
                 
        </Box>
      );
    }
    return null;
  };
  const TestVideo =
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";

  return (
    <Box className="chat-ui">
      {/* Added basic layout styles */}
            <RadioPlayer url={TestVideo} /> {/* Keep if needed */}     
      {/* Main chat area */}     
      <Box
        ref={messagesContainerRef} // Attach ref to the scrollable container
        className="main-chat"
        sx={{
          display: "flex",
          flexDirection: "column", // Standard chat flow (scroll down)
          flex: 1,
          p: 2,
          backgroundColor: "#0b0c2a",
          color: "white",
          opacity: 0.9,
          position: "absolute", // Enable vertical scrolling
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            overflowY: "auto",
            mt: "auto",
            pb: "80px",
          }}
        >
                 
          {messages?.map((item, index) => {
            const name = item?.sender || "Guest"; // Access username from sender object
            const avatarUrl = item?.sender?.photoUrl; // Access photoUrl from sender object
            const initial = getInitial(name);

            return (
              <Box
                className="message"
                key={item.id || index} // Use a unique ID from the message if available, otherwise index (less ideal)
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mb: 2,
                }}
              >
                             
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                 
                  {avatarUrl ? (
                    <Avatar
                      src={avatarUrl}
                      alt={name}
                      sx={{ width: 36, height: 36 }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: getColorFromName(name),
                        fontWeight: "bold",
                        fontSize: "1rem",
                        textTransform: "uppercase",
                      }}
                    >
                                          {initial}                 
                    </Avatar>
                  )}
                                 
                  <Typography
                    sx={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: 400,
                      fontSize: "18px",
                    }}
                  >
                                      {name}               
                  </Typography>
                               
                </Box>
                             
                <Box sx={{ pl: "44px" }}>
                                 
                  {item.type === "text" && (
                    <Typography variant="body1">{item?.message}</Typography>
                  )}
                               
                </Box>
                              {renderChatAd(index)}           
              </Box>
            );
          })}
               
        </Box>
             
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "1rem",
            backgroundColor: "#0b0c2a",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            position: "absolute",
            bottom: 0, // Position at the bottom
            left: 0, // Take full width (adjust if sidebar)
            right: 0, // Take full width (adjust if sidebar)
            width: "auto", // Let flex children control width
            opacity: 0.95,
            gap: "1rem", // Add gap between input and button
          }}
        >
                  {/* Message Input */}
                 
          <TextField
            fullWidth // Allow TextField to take available width
            variant="outlined" // Or 'standard', 'filled'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            InputProps={{
              // Style the internal input element
              style: {
                height: "50px",
                padding: "0 10px",
                color: "white",
              },
            }}
            sx={{
              // Style the MUI TextField component wrapper
              backgroundColor: "rgb(55, 57, 71)",
              borderRadius: "8px",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" }, // Remove default outline
              "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
                  {/* Send Button */}       
          <Button
            variant="contained" // Use MUI contained button style
            onClick={sendMessage}
            sx={{
              minWidth: "50px", // Ensure button has fixed width
              height: "50px",
              background:
                "linear-gradient(93.56deg, rgb(101, 53, 233) 4.6%, rgb(78, 51, 233) 96.96%)",
              border: "1px solid rgb(101, 53, 233)",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0, // Remove default button padding
            }}
          >
                      <SendIcon />       
          </Button>
               
        </Box>
              {/* Username Setting Area */}     
        {/* Position this outside the main chat and input boxes if it's a separate overlay */}
             
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
              {/* Edit Username Button Area */}     
        {/* Position this where you want the Edit button to appear */}     
        {!isSettingUsername &&
          username && ( // Only show if username is set and not currently setting
            <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
              {/* Example position */}         
              <Button
                variant="outlined"
                onClick={() => setIsSettingUsername(true)}
              >
                Edit Username
              </Button>
                     
            </Box>
          )}
        {/* Handle case where username is not set initially and the setting box is hidden */}
        {!isSettingUsername && !username && (
          <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
            <Button
              variant="outlined"
              onClick={() => setIsSettingUsername(true)}
            >
              Set Username
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ChatNew;
