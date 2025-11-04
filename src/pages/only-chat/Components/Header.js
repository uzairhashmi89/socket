import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  Fragment,
} from "react";
// import { io } from "socket.io-client";
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
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Send as SendIcon,
  ChatBubble,
  Verified as VerifiedIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import HideImageOutlinedIcon from "@mui/icons-material/HideImageOutlined";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import { GiphyModal } from "../../../Components/GiphyModal";
import logo from "../../../assets/logo.png";
import {
  BASE_URLS,
  ENVIRONMENT_MODE,
  scrollToBottom,
} from "../../../config/constants";
import axios from "../../../config/axiosInterceptor";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;
// const channelId = BASE_URLS[ENVIRONMENT_MODE].CHANNEL_ID;

// const socket = io(baseUrl, {
//   path: "/public-socket/",
//   transports: ["websocket"],
// });

defaultTheme.emojiSuggestions += " emojiSuggestions";
defaultTheme.emojiSuggestionsEntry += " emojiSuggestionsEntry";
defaultTheme.emojiSuggestionsEntryFocused += " emojiSuggestionsEntryFocused";
defaultTheme.emojiSuggestionsEntryText += " emojiSuggestionsEntryText";
defaultTheme.emojiSelect += " emojiSelect";
defaultTheme.emojiSelectButton += " emojiSelectButton";
defaultTheme.emojiSelectButtonPressed += " emojiSelectButtonPressed";
defaultTheme.emojiSelectPopover += " emojiSelectPopover";

function Header() {
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const location = window.location.pathname;
  const pathSegments = location.split("/");
  const channelId = pathSegments[pathSegments.length - 1];

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // const [channelDetails, setChannelDetails] = useState({});
  // useEffect(() => {
  //   socket.on("viewer", (data) => {
  //     if (Array.isArray(data) && data[0]?.viewers !== undefined) {
  //       setConnectedUsersCount(data[0].viewers);
  //     } else if (data?.viewers !== undefined) {
  //       setConnectedUsersCount(data.viewers);
  //     }
  //   });

  //   return () => {
  //     socket.off("viewer");
  //   };
  // }, []);

  // useEffect(() => {
  //   socket.on("disconnect", () => {
  //     console.log("Disconnected");
  //   });
  // }, []);

  // useEffect(() => {
  //   socket.on("connect", () => {
  //     if (localStorage.getItem("userName")) {
  //       emitJoin(
  //         localStorage.getItem("userName"),
  //         localStorage.getItem("profileImage")
  //       );
  //     } else {
  //       emitJoin("Guest");
  //     }
  //   });

  //   socket.on("message", (message) => {
  //     fetchMessages();
  //   });

  //   socket.on("messageDeleted", () => {
  //     fetchMessages();
  //   });

  //   socket.on("connect_error", (err) => {
  //     console.error("[Client] Connection error:", err.message);
  //   });
  //   socket.on("pong", () => {
  //     console.log("PONG received");
  //   });
  //   socket.emit("ping");
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  // const sendMessage = () => {
  //   if (input?.message) {
  //     const payload = {
  //       message: input?.message,
  //       draftContent: "",
  //       type: "text",
  //     };
  //     socket.emit("sendMessage", payload);
  //     setInput("");
  //     setEditorState(EditorState.createEmpty());
  //   }
  // };



  // const fetchMessages = async () => {
  //   try {
  //     const response = await axios.get(
  //       `${baseUrl}/messages/open/channel/${channelId}?page=1&pageSize=30`
  //     );

  //     if (response.data) {
  //       const data = await response.data;
  //       setMessages(data);
  //     }
  //   } catch (error) {
  //     console.error("Error during fetch:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchMessages();
  // }, []);



  const [username, setUsername] = useState(
    localStorage.getItem("userName") || ""
  );

  const [isSettingUsername, setIsSettingUsername] = useState(
    !localStorage.getItem("userName")
  );

  const [profilePhoto, setProfilePhoto] = useState(
    localStorage.getItem("profileImage") || null
  );

  // const emitJoin = (currentUsername, profileImage) => {
  //   const userPayload = {
  //     username: currentUsername,
  //     profileImage: profileImage,
  //   };

  //   const payload = {
  //     channelId: channelId,
  //     channelType: "channel",
  //     user: userPayload,
  //   };

  //   socket.emit("join", payload);
  // };
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


  const [isUploading, setIsUploading] = useState(false);

  const uploadProfileImage = async (file, dispatchCallback = () => {}) => {
    const maxSizeMB = 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setOpenSnackbar(true);
      return;
    }

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;

      const {
        data: { fields, url },
      } = await axios.post(`${baseUrl}/upload/public-profile`, {
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

          dispatchCallback({
            type: "UPLOAD_PROGRESS",
            payload: { uploadId: "profileImage", progress },
          });
        },
      });

      const publicImageUrl = `${url}/${fields.key}`;

      if (publicImageUrl) {
        localStorage.setItem("profileImage", publicImageUrl);
        setProfilePhoto(publicImageUrl);
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

    // if (socket.connected) {
    //   emitJoin(usernameToEmit, profilePhoto);
    // } else {
    //   console.warn(
    //     "Socket not connected. Profile will be saved locally but not emitted."
    //   );
    // }
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

  // const [chatAds, setChatAds] = useState([]);
  // const [chatAdIndex, setChatAdIndex] = useState(0);

  // useEffect(() => {
  //   const fetchAds = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${baseUrl}/advertisements/get?limit=10&page=1&skip=0`
  //       );

  //       if (response.data) {
  //         const data = await response?.data?.data;
  //         setChatAds(data.filter((ad) => ad.placement === "chat"));
  //       }
  //     } catch (error) {
  //       console.error("Error during fetch:", error);
  //     }
  //   };

  //   fetchAds();
  // }, []);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setChatAdIndex((prevIndex) => (prevIndex + 1) % chatAds.length);
  //   }, 5000); // 3 seconds

  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, [chatAds]);

  // const renderChatAd = (index) => {
  //   if (chatAds.length === 0) return null; // No ads available

  //   if ((index + 1) % 8 === 0) {
  //     return (
  //       <div>
  //         {chatAds[chatAdIndex] && (
  //           <img
  //             src={chatAds[chatAdIndex].assetUrl}
  //             alt="Chat Ad"
  //             style={{ borderRadius: 12, maxHeight: "250px", width: "100%" }}
  //           />
  //         )}
  //       </div>
  //     );
  //   }
  //   return null;
  // };

  // const fetchMoreData = async () => {
  //   console.log("Fetching more data...", messages.pagination);
  //   if (messages?.pagination?.hasMore) {
  //     try {
  //       const response = await axios.get(
  //         `${baseUrl}/admin/channels/open/messages/${channelId}?page=${messages.pagination.page + 1}&pageSize=${messages.pagination.pageSize}`
  //       );
  //       if (response.data) {
  //         const newData = await response.data;
  //         setMessages((prev) => ({
  //           ...prev,
  //           data: [...prev.data, ...newData.data],
  //           pagination: newData.pagination,
  //         }));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching more messages:", error);
  //     }
  //   }
  // };

  // useEffect(() => {
  //   const fetchChannelDetails = async () => {
  //     const url = `${baseUrl}/channels/open/${channelId}`;
  //     try {
  //       const response = await axios.get(url);

  //       if (response.data) {
  //         setChannelDetails({
  //           title: response.data.title || "",
  //           channelId: response.data.channelId || "",
  //           url: response.data.url || "",
  //           description: response.data.description || "",
  //           enableChat: response.data.enableChat || false,
  //           enableShop: response.data.enableShop || false,
  //           enableAI: response.data.enableAI || false,
  //           enableRead: response.data.enableRead || false,
  //           enableRewards: response.data.enableRewards || false,
  //           status: response.data.status || "active",
  //           thumbnail: response.data.thumbnail || "",
  //         });
  //       }
  //     } catch (err) {
  //       console.log(`Failed to load channel details: ${err.message}`);
  //     }
  //   };

  //   if (channelId && channelId !== "channels") {
  //     fetchChannelDetails();
  //   }
  // }, [channelId]);

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
            padding: "4px 0",
            height: "50px",
            justifyContent: "space-between",
          }}
        >
          {/* Replace this with your actual logo */}
          <Box
            component="img"
            src={logo}
            alt="View Media Logo"
            sx={{ height: 32, paddingRight: 2 }}
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


      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={openSnackbar}
        message="Profile image is greater than 2MB, please upload a smaller image."
        autoHideDuration={4000}
        onClose={handleSnackClose}
      />

      {/* {channelDetails?.enableChat === false && (
        <Typography
          sx={{
            pt: 2,
            pb: 2,
            zIndex: 9,
            textAlign: "center",
            color: "white",
            position: "absolute",
            bottom: "0px",
            textAlign: "center",
            backgroundColor: "#000",
            width: "100%",
          }}
        >
          Chat is disabled for this channel.
        </Typography>
      )} */}
    </>
  );
}

export default Header;
