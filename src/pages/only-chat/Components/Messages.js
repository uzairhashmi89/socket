import { useEffect, useRef, useState, useMemo, Fragment } from "react";
import { io } from "socket.io-client";
import { ContentState, EditorState, convertToRaw } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createEmojiPlugin, { defaultTheme } from "@draft-js-plugins/emoji";
import { Box, Button, Typography, Avatar } from "@mui/material";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Send as SendIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import axios from "../../../config/axiosInterceptor";
import { BASE_URLS, ENVIRONMENT_MODE } from "../../../config/constants";
import { GiphyModal } from "../../../Components/GiphyModal";

const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;
// const channelId = BASE_URLS[ENVIRONMENT_MODE].CHANNEL_ID;

defaultTheme.emojiSuggestions += " emojiSuggestions";
defaultTheme.emojiSuggestionsEntry += " emojiSuggestionsEntry";
defaultTheme.emojiSuggestionsEntryFocused += " emojiSuggestionsEntryFocused";
defaultTheme.emojiSuggestionsEntryText += " emojiSuggestionsEntryText";
defaultTheme.emojiSelect += " emojiSelect";
defaultTheme.emojiSelectButton += " emojiSelectButton";
defaultTheme.emojiSelectButtonPressed += " emojiSelectButtonPressed";
defaultTheme.emojiSelectPopover += " emojiSelectPopover";

const socket = io(baseUrl, {
  path: "/public-socket/",
  transports: ["websocket"],
});

function Messages(props) {
  const { setConnectedUsersCount } = props;
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const location = window.location.pathname;
  const pathSegments = location.split("/");
  const channelId = pathSegments[pathSegments.length - 1];
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  // const socket = useMemo(
  //   () =>
  //     io(baseUrl, {
  //       path: "/public-socket/",
  //       transports: ["websocket"],
  //     }),
  //   []
  // );

  const [channelDetails, setChannelDetails] = useState({});
  useEffect(() => {
    socket.on("viewer", (data) => {
      if (Array.isArray(data) && data[0]?.viewers !== undefined) {
        setConnectedUsersCount(data[0].viewers);
      } else if (data?.viewers !== undefined) {
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

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server--");
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
      console.log("Connected to message--");
      fetchMessages();
    });

    socket.on("messageDeleted", () => {
      fetchMessages();
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
      // console.log("Sending message payload:", payload);
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

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/messages/open/channel/${channelId}?page=1&pageSize=30`
      );

      if (response.data) {
        const data = await response.data;
        setMessages(data);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const getInitial = (name) => {
    if (!name) return "";
    return name.trim()[0].toUpperCase();
  };

  const getColorFromName = (name) => {
    const colors = ["#F44336", "#2196F3", "#FF9800", "#4CAF50", "#9C27B0"];
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const emitJoin = (currentUsername, profileImage) => {
    const userPayload = {
      username: currentUsername,
      profileImage: profileImage,
    };

    const payload = {
      channelId: channelId,
      channelType: "channel",
      user: userPayload,
    };

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

  const [chatAds, setChatAds] = useState([]);
  const [chatAdIndex, setChatAdIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/advertisements/get?limit=10&page=1&skip=0`
        );

        if (response.data) {
          const data = await response?.data?.data;
          setChatAds(data.filter((ad) => ad.placement === "chat"));
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChatAdIndex((prevIndex) => (prevIndex + 1) % chatAds.length);
    }, 5000); // 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [chatAds]);

  const renderChatAd = (index) => {
    if (chatAds.length === 0) return null; // No ads available

    if ((index + 1) % 8 === 0) {
      return (
        <div>
          {chatAds[chatAdIndex] && (
            <img
              src={chatAds[chatAdIndex].assetUrl}
              alt="Chat Ad"
              style={{ borderRadius: 12, maxHeight: "250px", width: "100%" }}
            />
          )}
        </div>
      );
    }
    return null;
  };

  const fetchMoreData = async () => {
    console.log("Fetching more data...", messages.pagination);
    if (messages?.pagination?.hasMore) {
      try {
        const response = await axios.get(
          `${baseUrl}/admin/channels/open/messages/${channelId}?page=${messages.pagination.page + 1}&pageSize=${messages.pagination.pageSize}`
        );
        if (response.data) {
          const newData = await response.data;
          setMessages((prev) => ({
            ...prev,
            data: [...prev.data, ...newData.data],
            pagination: newData.pagination,
          }));
        }
      } catch (error) {
        console.error("Error fetching more messages:", error);
      }
    }
  };

  useEffect(() => {
    const fetchChannelDetails = async () => {
      const url = `${baseUrl}/channels/open/${channelId}`;
      try {
        const response = await axios.get(url);

        if (response.data) {
          setChannelDetails({
            title: response.data.title || "",
            channelId: response.data.channelId || "",
            url: response.data.url || "",
            description: response.data.description || "",
            enableChat: response.data.enableChat || false,
            enableShop: response.data.enableShop || false,
            enableAI: response.data.enableAI || false,
            enableRead: response.data.enableRead || false,
            enableRewards: response.data.enableRewards || false,
            status: response.data.status || "active",
            thumbnail: response.data.thumbnail || "",
          });
        }
      } catch (err) {
        console.log(`Failed to load channel details: ${err.message}`);
      }
    };

    if (channelId && channelId !== "channels") {
      fetchChannelDetails();
    }
  }, [channelId]);

  return (
    <>
      <Box>
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
              <img
                src={channelDetails?.thumbnail}
                alt="Bolt Logo"
                style={{ width: "100%", height: "100%", borderRadius: "100%" }}
              />
            </Box>
            أخبار تلفزيو سي إن سي
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
            <span>🔴</span> مباشر: أخبار تلفزيون سي إن سي – تحديثات عاجلة ونقاش
          </Box>
        </Box>
        <div
          id="scrollableDiv"
          style={{
            overflow: "auto",
            display: "flex",
            flexDirection: "column-reverse",
            height: "calc(100vh - 250px)",
            minHeight: "auto",
          }}
        >
          <InfiniteScroll
            dataLength={messages?.pagination?.total || 0} //This is important field to render the next data
            next={fetchMoreData}
            style={{ display: "flex", flexDirection: "column-reverse" }} //To put endMessage and loader to the top.
            inverse={true} //
            hasMore={messages?.pagination?.hasMore || false}
            loader={<h4 style={{ textAlign: "center" }}>Loading...</h4>}
            scrollableTarget="scrollableDiv"
          >
            {messages?.data?.map((item, index) => {
              const name = item?.sender || "User";
              const avatarUrl = item?.profileImage || null;
              const initial = getInitial(name);
              const isFirstMessage = index === 0;
              const userColor = getColorFromName(name);
              return (
                <Fragment key={index}>
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
                        width: "92%",
                        display: "flex",
                        flexDirection: item?.type === "text" ? "row" : "column", // ← key line
                        alignItems:
                          item?.type === "text" ? "center" : "flex-start", // for better vertical alignment
                        gap: "5px", // optional spacing
                        padding: "5px 10px 5px 10px",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
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
                              display: "block",
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
                  {renderChatAd(index)}
                </Fragment>
              );
            })}
          </InfiniteScroll>
        </div>
        {channelDetails?.enableChat && (
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
                left: 113,
                top: 27,
                zIndex: 99, // Ensure it's above chat content
              }}
            >
              GIF
            </Button>
          </Box>
        )}
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

      {channelDetails?.enableChat === false && (
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
      )}
    </>
  );
}

export default Messages;
