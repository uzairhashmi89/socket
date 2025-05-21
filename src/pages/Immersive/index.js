import React, { useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  ContentState,
  convertToRaw,
  DraftHandleValue,
  EditorState,
} from "draft-js";
import { Box, Button, TextField, Typography, Avatar } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Editor, { PluginEditorProps } from "@draft-js-plugins/editor";
import createEmojiPlugin, { defaultTheme } from "@draft-js-plugins/emoji";
import { ChatBubble } from "@mui/icons-material";
import { GiphyModal } from "../../Components/GiphyModal";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import { QRCode } from "react-qrcode-logo";
import RadioPlayer from "./Component/RadioPlayer";
import QrCode from "../../Components/QrCode";
import UserIcon from "../../assets/user-icon.png"
import VerifiedIcon from '@mui/icons-material/Verified';



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

function Immersive() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
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
    socket.on('disconnect', () => {
      console.log('Disconnected');

    })
  }, []);
  // Aimal code end

  // --- START: Changes for consistent colors ---
    // Use useRef to store a mapping of sender names to their assigned colors
    const userColorsMap = useRef({});
  
    // Define a set of appealing and distinct colors
    const nameColors = useMemo(() => [
      "#219653", // Darker Green
      "#F2C94C", // Yellow
      "#F2994A", // Orange
      "#6FCF97", // Green
      "#EB5757", // Red
      "#8C52FF", // Purple
      "#00BCD4", // Cyan
      "#FF7043", // Coral
      "#4DD0E1", // Light Blue
      "#FFD54F", // Amber
      "#C0CA33", // Lime
      "#7CB342", // Light Green
      "#9E9E9E", // Grey
    ], []); // Memoize this array so it doesn't change on every render
  
    // Function to get or assign a unique color for a given sender
    const getConsistentSenderColor = (senderName) => {
      // If the sender already has a color, return it
      if (userColorsMap.current[senderName]) {
        return userColorsMap.current[senderName];
      }
  
      // If not, assign a new unique color from the available pool
      const assignedColorsCount = Object.keys(userColorsMap.current).length;
      let newColor;
  
      if (assignedColorsCount < nameColors.length) {
        // Assign a unique color if available
        newColor = nameColors[assignedColorsCount];
      } else {
        // If all unique colors are used, start cycling through them again
        // This ensures we always have a color, even with many users,
        // but colors might repeat for different users after the initial pool is exhausted.
        newColor = nameColors[assignedColorsCount % nameColors.length];
      }
  
      // Store the new color for this sender
      userColorsMap.current[senderName] = newColor;
      return newColor;
    };
  
    // The getColorFromName utility function is no longer needed in this specific way
    // because getConsistentSenderColor directly returns the final color string.
    // We can simplify it or remove it if not used elsewhere.
    const getColorFromName = (color) => color; // Now it just returns the color passed to it
    // --- END: Changes for consistent colors ---

  useEffect(() => {
    socket.on("connect", () => {
      console.log("[Client] Connected:", socket.id);
      if (localStorage.getItem("userName")) {
        emitJoin(localStorage.getItem("userName"));
      }else {
        emitJoin("guest");
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

  const TestVideo =
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";

  return (
    <Box className="stream-impressive">
      <div className="gradient-bg" style={{ height: '100% !important' }}></div>
      <RadioPlayer url={TestVideo} width="100%" />
      <Box
        className="main-chat immersive_chat"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          p: 0,
          backgroundColor: "transparent",
          color: "white",
          opacity: 1,
          position: "absolute",
          right: "0",
          bottom: "0",
          height: {
            lg: '100dvh',
            md: '100dvh',
            sm: 'auto',
            xs: 'auto'
          },
          // borderLeft: "1px solid gray",
        }}
      >
        <Box
          // style={{ background: "rgb(18 16 49 / 50%)" }}
          className="stream-impressive font-poppins flex-1 flex flex-col w-[100%] overflow-auto no-scrollbar mt-6"
        sx={{height: { xs: '100dvh', md: '100dvh',sm:'auto',xs:'auto' }}}>
          {/* <div className="self-center">
            <div className=" mt-[18px] mb-[34px] flex flex-col items-center space-y-[33px]">
              <p className="show-qr font-medium text-2xl leading-[30px] text-white-85 text-center">
                Scan the QR code with Bolt+ app
                <br /> to connect your mobile
              </p>
              <div className="qr-code rounded-[25px] overflow-hidden">
                <QRCode
                  removeQrCodeBehindLogo
                  size={100}
                  quietZone={25}
                  eyeRadius={15}
                  logoPadding={10}
                  fgColor="#4449e3"
                  value="https://tvcnews.boltplus.tv/only-chat"
                />
              </div>
            </div>
          </div> */}

          {/* <hr className="hr" /> */}
          <Box
            className="main-chat scanQR"
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              p: 2,
              backgroundColor: "transparent",
              color: "white",
              opacity: 1,
              height: 'height: calc(100vh - 109px);',
              width: "95%",
            }}
          >
            <div
              style={{
                // position: "fixed",
                marginTop: "-10px",

                // background: "linear-gradient(to bottom, rgba(38, 40, 37, 1) 2%, rgba(38, 40, 37, 0) 95%)",
                width: "auto",
                height: "100px",
                display: "flex",
                alignItems: "baseline",
                gap: "0px",
                padding: "5px",
              }}
            >
              <button className="static-chat-button">
                <ChatBubble /> Chat
              </button>
              <div className="connected-users-count" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                {/* <SupervisorAccountIcon size="large"/> */}
                <img src={UserIcon} alt="Bolt Logo" style={{ width: "20px", height: "20px" }} />
                <span style={{ color: "white", fontSize: "12px" }}>
                  {connectedUsersCount}
                </span>
              </div>
            </div>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, background: 'rgba(240, 240, 241, 0.1)', padding: '5px 0 5px 10px', borderRadius: "4px" }}>
              <Box
                sx={{
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13.5px",
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
                {/* {name} */}
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
                  fontSize: "13.5px",
                  pl: "2px",
                  pr: "5px",
                  lineHeight: "20px",
                  fontWeight: "400",
                  textTransform: "capitalize",
                }}
              >
                {/* item?.message */}🔴 LIVE: TVC News – Breaking Updates &
                Discussion
              </Box>
            </Box>
            <Box
              ref={scrollableContainerRef}
              sx={{
                display: "flex",
                flexDirection: "column-reverse",
                overflowY: "auto",
                mt: "auto",
                p: "0",
                scrollBehavior: "smooth",
              }}
              className="message-container"
            >
              {messages?.map((item, index) => {
                const name = item?.sender || "User";
                const avatarUrl = item?.sender?.photoUrl;
                const initial = getInitial(name);
                const isFirstMessage = index === 0;
 const senderColor = getConsistentSenderColor(name);
                return (
                  <Box
                    className="message chat-input"
                    key={index}
                    ref={isFirstMessage ? firstMessageRef : null}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: '10px 0',
                      
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
                        alignItems: item?.type === "text" ? "baseline" : "flex-start", // for better vertical alignment
                        gap: "5px", // optional spacing
                        padding: "5px 10px 5px 10px",
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
                              backgroundColor: getColorFromName(senderColor),
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
                            color: senderColor,
                            fontWeight: 600,
                            fontSize: "13.5px",
                            textTransform: "capitalize"
                          }}
                        >
                          {name}
                        </Box>
                      </Box>

                      {/* Message or Giphy */}
                      {item?.type === "text" ? (
                        <Box sx={{ fontSize: "13.5px", pl: "2px", pr: '1.5px', lineHeight: '20px', fontWeight: '400', textTransform: "capitalize" }}>{item?.message}</Box>
                      ) : (
                        <Box style={{ width: "100%", display: "flex", justifyContent: "center" }}>
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

                    {/* Optional Ad */}
                    {/* {renderChatAd(index)} */}
                  </Box>
                );
              })}

              <div ref={messagesEndRef} />
            </Box>
            <Box className="qr-code-wrapper" style={{ background: "#333333", width: "89%", margin: '0' }} sx={{marginBottom:{xs: "0px", md: "0px"}}}>
              <QrCode />
            </Box>
          </Box>
        </Box>
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
              <Box
                sx={{ position: "fixed", top: 10, right: 10, zIndex: 99999999999 }}
              >
                <Button variant="outlined" onClick={() => setIsSettingUsername(true)}>
                  Edit Username
                </Button>
              </Box>
            )}
            {!isSettingUsername && !username && (
              <Box sx={{ position: "fixed", top: 10, right: 10, zIndex: 99999999999 }}>
                <Button variant="outlined" onClick={() => setIsSettingUsername(true)}>
                  Set Username
                </Button>
              </Box>
            )}
    </Box>
  );
}

export default Immersive;
