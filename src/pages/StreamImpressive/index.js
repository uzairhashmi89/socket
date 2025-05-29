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

function LiveChatImmersive() {
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
      console.log("message-----", message);
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

  const [showGiphyModal, setShowGiphyModal] = useState(false);

  return (
    <Box className="chat-ui" sx={{ backgroundColor: "#555" }}>
      <div className="gradient-bg"></div>
         <Box
         className="main-chat"
         sx={{
           display: "flex",
           flexDirection: "column",
           flex: 1,
           p: 2,
           backgroundColor: "#555",
           color: "white",
           opacity: 1,
           position: "",
           width: "auto",
           height: {
             lg: "96dvh !important",
             md: "98dvh !important",
             sm: "100% !important",
             xs: "100% !important",
           },
         }}
       >
         <Box
           style={{
             position: "fixed",
             top: 0,
             left: 0,
             background: "#555",
             width: "100%",
             display: "flex",
             alignItems: "baseline",
             gap: "20px",
             padding: "5px",
             justifyContent: "space-around",
           }}
           sx={{
             marginTop:{
               lg:'5px',
               md:'5px',
               sm:'0px',
               xs:'0px',
             },
             height:{
               lg: "41px",
               md: "41px",
               sm: "50px",
               xs: "50px",
             }
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
         </Box>
         <Box sx={{ marginTop: {lg: '40px',md: '40px',sm:'58px',xs: '58px'}, display: "flex", alignItems: "baseline", gap: 1, background: '#000', padding: '10px 10px 10px 20px', borderRadius: "4px", width: 'fit-content', position:{lg:'static',md: 'static',sm: 'fixed',xs:'fixed'}, }}>
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
         {/* tvs news end */}
         <Box
           ref={scrollableContainerRef}
           sx={{
             display: "flex",
             flexDirection: "column-reverse",
             overflowY: "auto",
             mt: "auto",
             p: "5px 10px 10px",
             scrollBehavior: "smooth",
           }}
           className="message-container"
         >
           {messages?.map((item, index) => {
             const name = item?.sender || "User";
             const avatarUrl = item?.sender?.photoUrl;
             const initial = getInitial(name);
             const isFirstMessage = index === 0;

             // --- START: Use the new consistent color logic ---
             const senderColor = getConsistentSenderColor(name);
             // --- END: Use the new consistent color logic ---

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
                     alignItems: item?.type === "text" ? "center" : "flex-start", // for better vertical alignment
                     gap: "5px", // optional spacing
                     padding: "5px 0px 5px 10px",
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
                           backgroundColor: getColorFromName(senderColor), // Use the assigned senderColor
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
                         color: senderColor, // Use the assigned senderColor
                         fontWeight: 500,
                         fontSize: "13.5px",
                         textTransform: "capitalize",
                       }}
                     >
                       {name}
                     </Box>
                   </Box>

                   {/* Message or Giphy */}
                   {item?.type === "text" ? (
                     <Box sx={{ fontSize: "13.5px", pl: "2px", textTransform: "capitalize" }}>{item?.message}</Box>
                   ) : (
                     <Box style={{ width: "100%", display: "flex", justifyContent: "flex-start" }} sx={{pt:'5px'}}>
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
         <Box className="qr-code-wrapper" sx={{width:{lg: '30%',md: '30%',sm: '50%',xs: '84.2%'},marginLeft:{lg: 0,md:0,sm: '10px !important',xs: '10px !important'},zIndex:{lg:'2',md:'2',xs:'0',sm:'0'},marginBottom:{lg:'20px',md: '20px',sm:'10px',xs:'10px'}}} style={{ background: "#000", marginLeft: '0', marginRight: '0' }}>
           <QrCode />
         </Box>
         {/* <Box
           sx={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             padding: "1rem 10px",
             // backgroundColor: "#0b0c2a",
             borderTop: "1px solid rgba(255, 255, 255, 0.1)",
             position: "fixed",
             bottom: 0,
             right: 0,
             width: "100%",
             opacity: 1,
           }}
           className="send-message-input editor"
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
               borderColor: "white",
               borderWidth: 1,
               color: "white",
               fontSize: 12,
               position: "absolute",
               right: 105,
               top: 32,
             }}
           >
             GIF
           </Button>
         </Box> */}
       </Box>

       {/* <GiphyModal
         open={showGiphyModal}
         inputPlaceholder="Type something..."
         initialEditorState={editorState}
         onClose={() => setShowGiphyModal(false)}
         onSelectItem={(data) => {
           sendGiphy(data);
         }}
       /> */}
     </Box>
   );
 }

 export default LiveChatImmersive;