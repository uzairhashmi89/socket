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

function OnlyChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
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

  const [username, setUsername] = useState(
    localStorage.getItem("userName") || ""
  );

  const [isSettingUsername, setIsSettingUsername] = useState(
    !localStorage.getItem("userName")
  );

  const emitJoin = (currentUsername) => {
    const userPayload = {
      username: currentUsername,
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
    if (chatAds?.length > 0 && messages?.length > 0) {
      const timeout = setTimeout(scrollToBottom, 1000);
      return () => clearTimeout(timeout);
    }
  }, [messages, chatAds]);

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
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("profileImage") || null
  );

  const uploadProfileImage = async (file, dispatchCallback = () => {}) => {
    const UPLOAD_API_BASE_URL = "https://api.staging-new.boltplus.tv";
    const UPLOAD_ENDPOINT = "/upload/public-profile";

    const maxSizeMB = 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setOpenSnackbar(true);
      return;
    }

    console.log("Uploading file:", file);
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
      emitJoin(usernameToEmit); // Emit the URL
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

  const handleSnackClose = () => {
    setOpenSnackbar(false);
  };

  console.log('username', username)

  return (
    <Box className="only-chat-ui" sx={{ backgroundColor: "#262825" }}>
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
          {/* Replace this with your actual logo */}
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
            <MenuItem onClick={() => {
              setAnchorEl(null);
              setIsSettingUsername(true);
            }}>
              {username ? "Edit Profile" : "Set Profile"}
            </MenuItem>
          </Menu>
        </Box>
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
            background: "#818181",
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
              T
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
            const avatarUrl = item?.sender?.photoUrl;
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
                    alignItems:
                      item?.type === "text" ? "baseline" : "flex-start", // for better vertical alignment
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "0 10px",
            justifyContent: "space-between",
            padding: "1rem 10px",
            backgroundColor: "#262825 !important",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "100%",
            opacity: 0.95,
            borderRadius: "0 !important",
          }}
          className="send-message-input editor with_video"
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              backgroundColor: "#fff",
              color: "#000",
              fontSize: "1rem",
              textTransform: "uppercase",
            }}
          />
          <Box
            sx={{
              background: "#F0F0F11A",
              padding: "10px",
              width: "93%",
              borderRadius: "8px",
            }}
          >
            <Editor
              editorState={editorState}
              onChange={setEditorState}
              plugins={plugins}
              handleKeyCommand={handleKeyCommand}
              placeholder="Type something..."
            />
            <EmojiSuggestions />
            <EmojiSelect closeOnEmojiSelect />
          </Box>
          <button
            onClick={sendMessage}
            style={{
              width: "50px",
              height: "40px",
              // background:
              //   "linear-gradient(93.56deg, rgb(101, 53, 233) 4.6%, rgb(78, 51, 233) 96.96%)",
              backgroundColor: "#E0032C",
              border: "1px solid #E0032C",
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

          <Button
            className="chat-gif-icon"
            size="small"
            onClick={() => setShowGiphyModal(true)}
            sx={{
              borderStyle: "solid",
              height: 18,
              minWidth: 40,
              pl: 0,
              pr: 0,
              borderColor: "#818181",
              borderWidth: 1,
              color: "#818181",
              fontSize: 12,
              position: "absolute",
              right: 113,
              top: 27,
              zIndex: 99, // Ensure it's above chat content
            }}
          >
            GIF
          </Button>
        </Box>
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

        {/* Profile Image Display in Modal */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            overflow: "hidden",
            mb: 1,
            border: "1px solid rgba(255,255,255,0.3)",
            display: "flex", // For centering fallback content
            justifyContent: "center",
            alignItems: "center",
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
            width: "100%", // Full width in modal
          }}
        />

        <Button
          variant="contained"
          onClick={handleSaveProfile}
          disabled={isUploading}
          sx={{ width: "100%" }} // Full width in modal
        >
          Save
        </Button>
      </Box>

      {/* --- Profile Edit/Set Buttons (outside modal) --- */}

      <GiphyModal
        open={showGiphyModal}
        inputPlaceholder="Type something..."
        initialEditorState={editorState}
        onClose={() => setShowGiphyModal(false)}
        onSelectItem={(data) => {
          sendGiphy(data);
        }}
      />

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={openSnackbar}
        message="Profile image is greater than 2MB, please upload a smaller image."
        autoHideDuration={4000}
        onClose={handleSnackClose}
      />
    </Box>
  );
}

export default OnlyChat;
