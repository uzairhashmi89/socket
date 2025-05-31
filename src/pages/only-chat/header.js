import axios from "axios";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { ContentState, EditorState, convertToRaw } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createEmojiPlugin, { defaultTheme } from "@draft-js-plugins/emoji";
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
import {
  Send as SendIcon,
  ChatBubble,
  Verified as VerifiedIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import HideImageOutlinedIcon from "@mui/icons-material/HideImageOutlined";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import { GiphyModal } from "../../Components/GiphyModal";
import UserIcon from "../../assets/mdi_account-online.svg";
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
  const [openSnackbar, setOpenSnackbar] = useState(false);

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
        emitJoin(
          localStorage.getItem("userName"),
          localStorage.getItem("profileImage")
        );
      } else {
        emitJoin("Guest");
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

  const [username, setUsername] = useState(
    localStorage.getItem("userName") || ""
  );

  const [isSettingUsername, setIsSettingUsername] = useState(
    !localStorage.getItem("userName")
  );

  const [profilePhoto, setProfilePhoto] = useState(
    localStorage.getItem("profileImage") || null
  );

  const emitJoin = (currentUsername, profileImage) => {
    const userPayload = {
      username: currentUsername,
      profileImage: profileImage,
    };

    const payload = {
      channelId: "68090b895880466655dc6a17", // Use your actual channel ID
      channelType: "channel",
      user: userPayload,
    };

    socket.emit("join", payload);
  };
  const scrollableContainerRef = useRef(null);
  const firstMessageRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollableContainerRef.current) {
        const scrollableElement = scrollableContainerRef.current;
        // Check if user is near the top (newest messages, scrollTop close to 0)
        const isNearBottom = scrollableElement.scrollTop < 100; // Adjust threshold as needed

        if (isNearBottom) {
          if (firstMessageRef.current) {
            firstMessageRef.current.scrollIntoView({ behavior: "smooth" });
          } else {
            // Fallback to scrollTop = 0 if ref isn't set yet
            scrollableElement.scrollTop = 0;
          }
        }
      }
    };

    // Debounce to handle rapid message updates
    if (messages?.length > 0) {
      const timeout = setTimeout(scrollToBottom, 1000);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  const { EmojiSuggestions, EmojiSelect, plugins } = useMemo(() => {
    const emojiPlugin = createEmojiPlugin({
      useNativeArt: true,
      theme: defaultTheme,
    });
    const { EmojiSuggestions, EmojiSelect } = emojiPlugin;

    const plugins = [emojiPlugin];
    return { plugins, EmojiSuggestions, EmojiSelect };
  }, []);

  useEffect(() => {
    const newState = EditorState.push(
      editorState,
      ContentState.createFromText(""),
      "insert-characters"
    );
    setEditorState(EditorState.moveFocusToEnd(newState));
  }, []);

  const handleKeyCommand = (command) => {
    if (command === "split-block" && !!sendMessage) {
      sendMessage();
      return "handled";
    }
    return "not-handled";
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

  const [showGiphyModal, setShowGiphyModal] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const uploadProfileImage = async (file) => {
    const UPLOAD_API_BASE_URL = "https://api.staging-new.boltplus.tv";
    const UPLOAD_ENDPOINT = "/upload/public-profile";

    const maxSizeMB = 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setOpenSnackbar(true);
      return;
    }
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;

      const apiHeaders = {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
        Origin: "https://staging-new.boltplus.tv",
        Referer: "https://staging-new.boltplus.tv/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        boltsrc: "boltplus-webapp/microsoft_windows/0.1.0",
        session: "1748527326242",
      };

      const {
        data: { fields, url }, // 'fields' and 'url' are from the API response for S3 upload
      } = await axios.post(
        `${UPLOAD_API_BASE_URL}${UPLOAD_ENDPOINT}`,
        {
          // Request body
          type: file.type,
          name: fileName,
          folder: "avatar",
        },
        { headers: apiHeaders } // Pass the headers here
      );

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
          dispatchCallback({
            type: "UPLOAD_PROGRESS",
            payload: { uploadId: "profileImage", progress },
          });
        },
      });

      const publicImageUrl = `${url}/${fields.key}`; // This might need adjustment based on how S3 URL is constructed
      console.log("Image uploaded successfully:", publicImageUrl);
      if (publicImageUrl) {
        localStorage.setItem("profileImage", publicImageUrl); // Store the URL in localStorage
        setProfilePhoto(publicImageUrl); // Update state with the public URL
      }
      return publicImageUrl;
    } catch (error) {
      console.error(
        "Error uploading profile image:",
        error.response ? error.response.data : error.message
      );
      return null;
    }
  };
  const handleSaveProfile = useCallback(() => {
    const trimmedUsername = username.trim();
    let usernameToEmit = "guest";

    if (trimmedUsername) {
      localStorage.setItem("userName", trimmedUsername);
      setUsername(trimmedUsername);
      usernameToEmit = trimmedUsername;
    } else {
      localStorage.removeItem("userName");
      setUsername("");
    }

    if (profilePhoto) {
      localStorage.setItem("profileImage", profilePhoto);
    } else {
      localStorage.removeItem("profileImage");
    }

    setIsSettingUsername(false);
    if (socket.connected) {
      emitJoin(usernameToEmit, profilePhoto);
    } else {
      console.warn(
        "Socket not connected. Profile will be saved locally but not emitted."
      );
    }
  }, [username, profilePhoto]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const imageUrl = await uploadProfileImage(file);
        if (imageUrl) {
          setProfilePhoto(imageUrl);
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSnackClose = () => {
    setOpenSnackbar(false);
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
          {profilePhoto ? (
            <Avatar
              src={profilePhoto}
              alt="Profile Image"
              sx={{ width: 30, height: 30 }}
            />
          ) : (
            <Avatar sx={{ bgcolor: "white" }}>
              <AccountCircleIcon sx={{ color: "#333" }} />
            </Avatar>
          )}
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
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setIsSettingUsername(true);
            }}
          >
            {username ? "Edit Profile" : "Set Profile"}
          </MenuItem>
        </Menu>
      </Box>

      {/* --- Profile Setting Modal --- */}
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999999999, // Higher zIndex for modal
          backgroundColor: "rgba(0,0,0,1)", // Darker overlay
          padding: 3,
          borderRadius: 2,
          display: isSettingUsername ? "flex" : "none",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
          width: { xs: "90%", sm: "400px" }, // Responsive width
          maxWidth: "400px",
        }}
      >
        <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
          Set Profile
        </Typography>

        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            overflow: "hidden",
            mb: 1,
            border: "1px solid rgba(255,255,255,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
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
            width: "100%",
          }}
        />

        <Button
          variant="contained"
          onClick={handleSaveProfile}
          disabled={isUploading}
          sx={{ width: "100%" }}
        >
          Save
        </Button>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={openSnackbar}
        message="Profile image is greater than 2MB, please upload a smaller image."
        autoHideDuration={4000}
        onClose={handleSnackClose}
      />
    </>
  );
}

export default Header;
