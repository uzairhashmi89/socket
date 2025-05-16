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
      <div className="gradient-bg"></div>
      <RadioPlayer url={TestVideo} width="100%"/>
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
          height: '100vh',
          // borderLeft: "1px solid gray",
        }}
      >
        <div
          // style={{ background: "rgb(18 16 49 / 50%)" }}
          className="stream-impressive font-poppins flex-1 flex flex-col w-[100%] overflow-auto no-scrollbar mt-6"
        >
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
            marginTop:"-10px",
            
            background: "linear-gradient(to bottom, rgba(38, 40, 37, 1) 2%, rgba(38, 40, 37, 0) 95%)",
            width: "auto",
            height: "100px",
            display: "flex",
            alignItems: "baseline",
            gap: "0px",
            padding: "5px",
            justifyContent: "space-around",
          }}
        >
          <button className="static-chat-button">
            <ChatBubble /> Chat
          </button>
          <div className="connected-users-count" style={{ display: "flex", alignItems: "center",gap:"5px" }}>
            {/* <SupervisorAccountIcon size="large"/> */}
            <img src={UserIcon} alt="Bolt Logo" style={{ width: "20px", height: "20px" }} />
              <span style={{ color: "white",fontSize:"12px" }}>
                 {connectedUsersCount}
              </span>
            </div>
              </div>
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
                 const nameColors = ["#6FCF97", "#219653", "#F2C94C","#F2994A","#F0F0F1","#EB5757"];
            // Pick a random color for each message render
             const randomColor = nameColors[Math.floor(Math.random() * nameColors.length)];

                return (
                  <Box
                    className="message chat-input"
                    key={index}
                    ref={isFirstMessage ? firstMessageRef : null}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: '10px 0',
                      mb: 2,
                    }}
                    style={{
                      marginBottom: "7px",
                    }}
                  >
                    {/* For channel Heading */}
                  <Box
                  style={{
                    width: "fit-content",
                    display: "flex",
                    flexDirection: item?.type === "text" ? "row" : "column", // ← key line
                    alignItems: item?.type === "text" ? "baseline" : "flex-start", // for better vertical alignment
                    gap: "5px", // optional spacing
                    background: 'rgba(240, 240, 241, 0.1)',
                    padding: "10px 0 5px 10px",
                    borderRadius: "4px",

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
                      backgroundColor: 'red',
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
                )}
                <Box
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: "13.5px",
                    textTransform:"capitalize",
                    textWrap: 'nowrap'
                  }}
                >
                  {/* {name} */}
                  TVC News <VerifiedIcon sx={{ fontSize: "12px", color: "#6FCF97", marginLeft: "5px", color: '#43A2F2' }} />
                </Box>
              </Box>
              
              {/* Message or Giphy */}
              {item?.type === "text" ? (
                <Box sx={{ fontSize: "13.5px", pl: "2px",pr:'9px', lineHeight: '20px', fontWeight:'400', textTransform:"capitalize" }}>{/* item?.message */}🔴 LIVE: TVC News – Breaking Updates & Discussion</Box>
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
                {/* for channle heading end */}
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
                                          backgroundColor: getColorFromName(randomColor),
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
                                        color: randomColor,
                                        fontWeight: 600,
                                        fontSize: "13.5px",
                                        textTransform:"capitalize"
                                      }}
                                    >
                                      {name}
                                    </Box>
                                  </Box>
                                  
                                  {/* Message or Giphy */}
                                  {item?.type === "text" ? (
                                    <Box sx={{ fontSize: "13.5px", pl: "2px",pr: '1.5px', lineHeight: '20px', fontWeight:'400', textTransform:"capitalize" }}>{item?.message}</Box>
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
            <Box className="qr-code-wrapper" style={{background: "#F0F0F11A",width: "89%",margin: '0'}}>
              <QrCode />
            </Box>
          </Box>
        </div>
      </Box>
    </Box>
  );
}

export default Immersive;
