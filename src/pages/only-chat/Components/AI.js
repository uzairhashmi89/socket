import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Paper,
  Typography,
  useTheme,
  alpha,
  Popover,
  Fade,
} from "@mui/material";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import { AutoAwesome, Send, Mic, Close } from "@mui/icons-material";
import LinkIcon from "@mui/icons-material/LinkRounded";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { VoiceAssistantButton } from "../../../Components/VoiceAssistantButton";
import { ElevenLabsConversation } from "../../../Components/ElevenLabsConversation";

const AI_API_URL = "https://api.staging-new.boltplus.tv/ai";

const azureKey = process.env.REACT_APP_AZURE_SPEECH_KEY;

export const LoadingDots = React.memo(() => (
  <Box sx={{ display: "flex", gap: 1, py: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: "#6535E9",
          animation: `bounce 1s ease-in-out ${i * 0.18}s infinite`,
          "@keyframes bounce": {
            "0%, 80%, 100%": { transform: "translateY(0)", opacity: 0.3 },
            "40%": { transform: "translateY(-6px)", opacity: 1 },
          },
        }}
      />
    ))}
  </Box>
));

/* ----- Chat bubble (unchanged markup, just wrapped in memo) -- */
export const AnswerBubble = React.memo(
  ({ question, answer, isLoading, citations, index }) => (
    /* ⤵ paste the JSX you already had here, unchanged */
    <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
      <Box sx={{ mb: 2.5 }}>
        {/* USER MESSAGE */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
              maxWidth: "80%",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.25,
                background: "linear-gradient(135deg, #6535E9 0%, #4E33E9 100%)",
                color: "#fff",
                borderRadius: 2.5,
                borderBottomRightRadius: 0.5,
                boxShadow: "0 2px 12px rgba(101, 53, 233, 0.3)",
                position: "relative",
                overflow: "hidden",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                  pointerEvents: "none",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {question}
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* AI RESPONSE */}
        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              maxWidth: "80%",
            }}
          >
            {/* AI Avatar */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(101, 53, 233, 0.2) 0%, rgba(78, 51, 233, 0.1) 100%)",
                border: "1px solid",
                borderColor: alpha("#6535E9", 0.3),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: -2,
                  background:
                    "conic-gradient(from 180deg, transparent, #6535E9, transparent 60%)",
                  animation: isLoading ? "spin 2s linear infinite" : "none",
                  "@keyframes spin": {
                    to: { transform: "rotate(360deg)" },
                  },
                },
              }}
            >
              <AutoAwesome
                sx={{
                  fontSize: 16,
                  color: "#6535E9",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            </Box>

            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: alpha("#fff", 0.03),
                borderRadius: 2.5,
                borderTopLeftRadius: 0.5,
                border: "1px solid",
                borderColor: alpha("#fff", 0.06),
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                flex: 1,
              }}
            >
              {isLoading ? (
                <LoadingDots />
              ) : (
                <>
                  <Box
                    sx={{
                      "& p": {
                        margin: 0,
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        color: alpha("#fff", 0.9),
                      },
                      "& a": {
                        color: "#6535E9",
                        textDecoration: "none",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          textDecoration: "underline",
                          opacity: 0.8,
                        },
                      },
                      "& code": {
                        bgcolor: alpha("#6535E9", 0.1),
                        color: "#a78bfa",
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: "0.8125rem",
                        fontFamily: "monospace",
                      },
                    }}
                  >
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </Box>
                  <CitationDropdown citations={citations} />
                </>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Fade>
  )
);

AnswerBubble.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  citations: PropTypes.arrayOf(PropTypes.string.isRequired),
  index: PropTypes.number.isRequired,
};

/* ---------- Enhanced Citation dropdown component -------------------------- */
const CitationDropdown = ({ citations = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  if (!citations.length) return null;

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        size="small"
        startIcon={<LinkIcon sx={{ fontSize: 12 }} />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          mt: 0.75,
          textTransform: "none",
          fontSize: "0.75rem",
          color: alpha("#6535E9", 0.8),
          bgcolor: alpha("#6535E9", 0.08),
          border: "1px solid",
          borderColor: alpha("#6535E9", 0.2),
          borderRadius: 10,
          px: 1.5,
          py: 0.25,
          minWidth: 0,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: alpha("#6535E9", 0.12),
            borderColor: alpha("#6535E9", 0.3),
            transform: "translateY(-1px)",
          },
        }}
      >
        {citations.length} source{citations.length > 1 ? "s" : ""}
      </Button>

      <Popover
        disableScrollLock
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        TransitionComponent={Fade}
        transitionDuration={200}
        PaperProps={{
          sx: {
            bgcolor: "#0f0f1e",
            border: "1px solid",
            borderColor: alpha("#6535E9", 0.2),
            borderRadius: 2,
            maxWidth: 320,
            p: 0,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: alpha("#fff", 0.05),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#fff",
            }}
          >
            Sources
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ p: 0.5 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Box
          sx={{
            maxHeight: 180,
            overflowY: "auto",
            p: 1,
            // Custom scrollbar
            "&::-webkit-scrollbar": {
              width: 4,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: alpha("#fff", 0.02),
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha("#6535E9", 0.3),
              borderRadius: 2,
              "&:hover": {
                bgcolor: alpha("#6535E9", 0.5),
              },
            },
          }}
        >
          {citations.map((c, i) => (
            <Button
              key={i}
              href={c}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              sx={{
                justifyContent: "flex-start",
                fontSize: "0.75rem",
                color: alpha("#fff", 0.7),
                whiteSpace: "normal",
                textAlign: "left",
                py: 0.75,
                px: 1,
                borderRadius: 1,
                textTransform: "none",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: alpha("#6535E9", 0.08),
                  color: "#fff",
                  transform: "translateX(2px)",
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: alpha("#6535E9", 0.6),
                  mr: 1,
                  flexShrink: 0,
                }}
              />
              {c}
            </Button>
          ))}
        </Box>
      </Popover>
    </>
  );
};

/** ----------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------- */
export const Ai = () => {
  const theme = useTheme();
  //   const { url: activeHlsUrl } = useSelector(streamDataSelector);
  // RecStatus is represented by string values 'idle' or 'recording'
  const [recStatus, setRecStatus] = useState("idle");
  const recognizer = useRef(null);
  const [inputValue, setInputValue] = useState("");

  const channelFromPath = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || ""; // "" if not present
  }, []);

  const [state, setState] = useState({
    url: "https://live-hls-web-aja-fa.getaj.net/AJA/master.m3u8",
    isProcessing: false,
    error: null,
    transcript: "",
    showTranscript: false,
    question: "",
    answers: [],
    streamSummary: "",
    showSummary: false,
    isRecording: false,
    isVoiceMode: false,
  });

  const handleVoiceClick = () => {
    updateState({ isVoiceMode: true });
  };

  const handleVoiceClose = () => {
    updateState({ isVoiceMode: false });
  };

  const updateState = (u) =>
    setState((prev) => ({
      ...prev,
      ...(typeof u === "function" ? u(prev) : u),
    }));

  const messagesEndRef = useRef(null);
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [state.answers]);

  const askQuestion = async () => {
    const q = inputValue.trim();
    if (!q || !state.url) return;

    const history = state.answers.map(({ question, answer }) => ({
      question,
      answer,
    }));

    updateState({
      answers: [...state.answers, { question: q, answer: "", isLoading: true }],
    });

    setInputValue(""); // Clear the input

    console.log(
      "Asking AI_API_URL:",
      JSON.stringify({
        question: q,
        hls_url: state.url,
        history,
        channel: channelFromPath,
        user_id: "",
      })
    );
    try {
      const res = await fetch(`${AI_API_URL}/ask-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          hls_url: state.url,
          history,
          channel: channelFromPath,
          user_id: "",
        }),
      });
      const data = await res.json();
      updateState((prev) => {
        const ans = [...prev.answers];
        ans[ans.length - 1] = {
          question: q,
          answer: data.answer ?? "(no answer)",
          citations: data.citations,
        };
        return { answers: ans };
      });
    } catch (err) {
      updateState((prev) => ({
        answers: prev.answers.slice(0, -1),
        error: "Failed to get answer",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion();
  };

  const startVoiceRecording = () => {
    if (recStatus === "recording") return;

    const AZURE_KEY =
      azureKey;
    const AZURE_REGION = "eastus";
    const speechKey = AZURE_KEY || "";
    const speechRegion = AZURE_REGION || "";

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    recognizer.current = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    recognizer.current.recognizing = (_, evt) => {
      setInputValue(evt.result.text);
    };

    recognizer.current.recognized = (_, evt) => {
      setInputValue(evt.result.text);
      recognizer.current?.stopContinuousRecognitionAsync(() => {
        setRecStatus("idle");
      });
    };

    recognizer.current.startContinuousRecognitionAsync(
      () => setRecStatus("recording"),
      (err) => {
        console.error("Speech SDK error:", err);
        setRecStatus("idle");
      }
    );
  };

  const stopVoiceRecording = () => {
    recognizer.current?.stopContinuousRecognitionAsync(() => {
      setRecStatus("idle");
    });
  };

  /** --------------------------------------------------------
   *  Enhanced JSX
   * ------------------------------------------------------- */
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chat messages area */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: { xs: 2, sm: 3 },
            py: 3,
            // Custom scrollbar
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha("#6535E9", 0.2),
              borderRadius: 3,
              "&:hover": {
                bgcolor: alpha("#6535E9", 0.3),
              },
            },
          }}
        >
          {state.isVoiceMode ? (
            <ElevenLabsConversation onClose={handleVoiceClose} embedded />
          ) : state.answers.length === 0 ? (
            <Fade in timeout={500}>
              <Box
                sx={{
                  display: "flex",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "calc(100vh - 250px)",
                }}
              >
                <Box sx={{ textAlign: "center", maxWidth: 400 }}>
                  {/* Animated AI icon */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 3,
                      borderRadius: 3,
                      background:
                        "linear-gradient(135deg, rgba(101, 53, 233, 0.15) 0%, rgba(78, 51, 233, 0.05) 100%)",
                      border: "1px solid",
                      borderColor: alpha("#6535E9", 0.2),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: -20,
                        background:
                          "radial-gradient(circle, rgba(101, 53, 233, 0.1) 0%, transparent 70%)",
                        animation: "glow 3s ease-in-out infinite",
                        "@keyframes glow": {
                          "0%, 100%": { opacity: 0.5 },
                          "50%": { opacity: 1 },
                        },
                      },
                    }}
                  >
                    <AutoAwesome
                      sx={{
                        fontSize: 36,
                        color: "#6535E9",
                        filter: "drop-shadow(0 0 12px rgba(101, 53, 233, 0.5))",
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: "1.125rem",
                      color: "#fff",
                      mb: 1,
                      fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                    }}
                  >
                    آيريس - رفيق البث الخاص بك
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha("#fff", 0.6),
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                    }}
                  >
                    اسأل عن أي شيء يتعلق بالبث المباشر، واحصل على رؤى في الوقت الفعلي، أو استكشف ما يحدث الآن

                  </Typography>

                  {/* Suggested prompts */}
                  {/* <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      justifyContent: "center",
                    }}
                  >
                    {[
                      "What's happening now?",
                      "Summarize the stream",
                      "Key moments",
                    ].map((prompt) => (
                      <Button
                        key={prompt}
                        size="small"
                        onClick={() => setInputValue(prompt)}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.75rem",
                          color: alpha("#fff", 0.7),
                          borderColor: alpha("#fff", 0.1),
                          borderRadius: 10,
                          px: 2,
                          py: 0.5,
                          "&:hover": {
                            borderColor: alpha("#6535E9", 0.3),
                            bgcolor: alpha("#6535E9", 0.05),
                          },
                        }}
                        variant="outlined"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </Box> */}

                  <Box
                    sx={{
                      mb: 2,
                      mt: 4,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <VoiceAssistantButton onClick={handleVoiceClick} />
                  </Box>
                </Box>
              </Box>
            </Fade>
          ) : (
            <>
              {state.answers.map((qa, idx) => (
                <AnswerBubble key={idx} index={idx} {...qa} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input area */}
        {!state.isVoiceMode && (
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              // borderTop: "1px solid",
              // borderColor: alpha("#fff", 0.05),
              // bgcolor: alpha("#0a0a0f", 0.8),
              // backdropFilter: "blur(20px)",
            }}
          >
            <Paper
              component="form"
              onSubmit={handleSubmit}
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 0.5,
                bgcolor: alpha("#fff", 0.02),
                border: "1px solid",
                borderColor: alpha("#fff", 0.06),
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:focus-within": {
                  borderColor: alpha("#6535E9", 0.3),
                  boxShadow: `0 0 0 3px ${alpha("#6535E9", 0.1)}`,
                },
              }}
            >
              <InputBase
                placeholder="اسأل أي شيء..."
                sx={{
                  ml: 2,
                  flex: 1,
                  color: "#fff",
                  fontSize: "0.9375rem",
                  fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                  "& ::placeholder": {
                    color: alpha("#fff", 0.4),
                    opacity: 1,
                  },
                }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion();
                  }
                }}
                multiline
                maxRows={4}
              />

              {/* Voice button */}
              <IconButton
                onClick={
                  recStatus === "recording"
                    ? stopVoiceRecording
                    : startVoiceRecording
                }
                sx={{
                  p: 1.25,
                  mx: 0.5,
                  color:
                    recStatus === "recording" ? "#ef4444" : alpha("#fff", 0.5),
                  bgcolor:
                    recStatus === "recording"
                      ? alpha("#ef4444", 0.1)
                      : "transparent",
                  border: "1px solid",
                  borderColor:
                    recStatus === "recording"
                      ? alpha("#ef4444", 0.3)
                      : "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha(
                      recStatus === "recording" ? "#ef4444" : "#fff",
                      0.05
                    ),
                    color:
                      recStatus === "recording"
                        ? "#ef4444"
                        : alpha("#fff", 0.7),
                  },
                }}
              >
                <Mic sx={{ fontSize: 20 }} />
              </IconButton>

              {/* Send button */}

              <IconButton
                type="submit"
                disabled={!inputValue.trim()}
                sx={{
                  p: 1.25,
                  mr: 0.5,
                  color: "#fff",
                  bgcolor: inputValue.trim() ? "#6535E9" : alpha("#fff", 0.05),
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: inputValue.trim()
                      ? "#5429d6"
                      : alpha("#fff", 0.05),
                    transform: inputValue.trim() ? "translateY(-1px)" : "none",
                    boxShadow: inputValue.trim()
                      ? "0 4px 12px rgba(101, 53, 233, 0.3)"
                      : "none",
                  },
                  "&:disabled": {
                    color: alpha("#fff", 0.3),
                  },
                }}
              >
                <Send sx={{ fontSize: 20 }} />
              </IconButton>
            </Paper>

            {/* Typing indicator */}
            {inputValue && (
              <Fade in>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.75,
                    ml: 2,
                    color: alpha("#fff", 0.4),
                    fontSize: "0.75rem",
                    fontFamily: "'Instrument Sans', 'Cairo', sans-serif",
                  }}
                >
                  لا تشارك المعلومات الشخصية أو الحساسة.
                </Typography>
              </Fade>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
