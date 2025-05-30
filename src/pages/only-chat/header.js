import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import {
  ContentState,
  convertToRaw,
  DraftHandleValue,
  EditorState,
} from "draft-js";
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  IconButton,
  MenuItem,
  Menu,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Editor, { PluginEditorProps } from "@draft-js-plugins/editor";
import createEmojiPlugin, { defaultTheme } from "@draft-js-plugins/emoji";
import { ChatBubble } from "@mui/icons-material";
import { GiphyModal } from "../../Components/GiphyModal";
import QrCode from "../../Components/QrCode";
import UserIcon from "../../assets/user-icon.png";
import VerifiedIcon from "@mui/icons-material/Verified";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import logo from "../../assets/logo.png";

const socket = io("https://api.staging-new.boltplus.tv", {
  path: "/public-socket/",
  transports: ["websocket"], // optionally add 'polling' if needed
});

defaultTheme.emojiSuggestions += " emojiSuggestions";
defaultTheme.emojiSuggestionsEntry += " emojiSuggestionsEntry";
defaultTheme.emojiSuggestionsEntryFocused += " emojiSuggestionsEntryFocused";
defaultTheme.emojiSuggestionsEntryText += " emojiSuggestionsEntryText";
defaultTheme.emojiSelect += " emojiSelect";
defaultTheme.emojiSelectButton += " emojiSelectButton";
defaultTheme.emojiSelectButtonPressed += " emojiSelectButtonPressed";
defaultTheme.emojiSelectPopover += " emojiSelectPopover";

function Header() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  // Drop start
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  // Drop end
  // Aimal code start
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
      }
    });

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
  console.log("input", input);
  const sendMessage = () => {
    if (input?.message) {
      const payload = {
        message: input?.message,
        draftContent: "",
        type: "text",
      };
      socket.emit("sendMessage", payload);
      setInput("");
      setEditorState(EditorState.createEmpty());
    }
  };

  const sendGiphy = (data) => {
    if (data?.giphy) {
      const payload = {
        message: "",
        giphy: data?.giphy,
        draftContent: "",
        type: "giphy",
      };
      socket.emit("sendMessage", payload);
      setInput("");
      setShowGiphyModal(false);
      setEditorState(EditorState.createEmpty());
    }
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


  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("profileImage") || null
  );

  const uploadProfileImage = async (file, dispatchCallback = () => {}) => {
    const UPLOAD_API_BASE_URL = "https://api.staging-new.boltplus.tv";
    const UPLOAD_ENDPOINT = "/upload/public-profile";

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;
      const {
        data: { fields, url },
      } = await axios.post(`${UPLOAD_API_BASE_URL}${UPLOAD_ENDPOINT}`, {
        type: file.type,
        name: fileName,
        folder: "avatar",
      });

      const formData = new FormData();
      formData.append("key", fields.key);
      formData.append("Content-Type", file.type);
      formData.append("acl", "public-read");

      Object.entries(fields).forEach(([key, value]) => {
        if (key !== "key") {
          formData.append(key, value);
        }
      });
      formData.append("file", file);

      await axios.post(url, formData, {
        onUploadProgress: (event) => {
          const progress = Math.floor((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${progress}%`);
          // If you had a Redux action for progress, you'd call it here:
          // dispatchCallback({ type: 'UPLOAD_PROGRESS', payload: { uploadId: 'profileImage', progress } });
        },
      });

      const publicImageUrl = `${url}/${fields.key}`;
      console.log("Image uploaded successfully:", publicImageUrl);
      return publicImageUrl;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      return null;
    }
  };
  const handleSaveProfile = useCallback(() => {
    // Renamed from handleSaveUsername
    const trimmedUsername = username.trim();
    let usernameToEmit = "guest";
    let imageToEmit = profileImage; // Use the URL directly

    if (trimmedUsername) {
      localStorage.setItem("userName", trimmedUsername);
      setUsername(trimmedUsername);
      usernameToEmit = trimmedUsername;
    } else {
      localStorage.removeItem("userName");
      setUsername(""); // Ensure state is cleared
    }

    if (profileImage) {
      localStorage.setItem("profileImage", profileImage); // Store the URL
    } else {
      localStorage.removeItem("profileImage");
    }

    setIsSettingUsername(false); // Close the settings modal

    // Emit the combined data via socket if connected
    if (socket.connected) {
      emitJoin(usernameToEmit, imageToEmit); // Emit the URL
    } else {
      console.warn(
        "Socket not connected. Profile will be saved locally but not emitted."
      );
    }
  }, [username, profileImage]); // Added dependencies
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true); // Set uploading state
      try {
        const imageUrl = await uploadProfileImage(file); // Call the utility function
        if (imageUrl) {
          setProfileImage(imageUrl); // Update state with the public URL
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        // Handle error, e.g., show a toast message
      } finally {
        setIsUploading(false); // Reset uploading state
      }
    }
  };
  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          background: "#000",
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          height: "50px",
          justifyContent: "space-between",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="View Media Logo"
          sx={{ height: 32 }}
        />

        <IconButton
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          color="inherit"
          size="large"
        >
          <Avatar sx={{ bgcolor: "white" }}>
            <AccountCircleIcon sx={{ color: "#333" }} />
          </Avatar>
        </IconButton>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          <MenuItem onClick={() => setIsSettingUsername(true)}>
            {username ? "Edit Profile" : "Set Profile"}
          </MenuItem>
        </Menu>
      </Box>

      <Box
        sx={{
          position: "fixed", // Example positioning
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999999999, // Ensure it's above chat content
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: 3,
          borderRadius: 2,
          display: isSettingUsername ? "flex" : "none", // Show/hide based on state
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
          Set Profile
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              mb: 1,
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.5rem",
                }}
              >
                {username ? (
                  username.charAt(0).toUpperCase()
                ) : (
                  <HideImageOutlinedIcon />
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Button
          component="label"
          variant="outlined"
          sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", mb: 1 }}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
        </Button>

        <TextField
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputLabelProps={{ style: { color: "rgba(255,255,255,0.7)" } }}
          InputProps={{ style: { color: "white" } }}
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
            mb: 2,
          }}
        />

        <Button
          variant="contained"
          onClick={handleSaveProfile}
          disabled={isUploading}
        >
          {" "}
          {/* Renamed function */}
          Save
        </Button>
      </Box>
    </>
  );
}

export default Header;
