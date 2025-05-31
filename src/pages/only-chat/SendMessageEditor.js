import { useEffect, useMemo } from "react";
import { ContentState, EditorState, convertToRaw } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createEmojiPlugin, { defaultTheme } from "@draft-js-plugins/emoji";
import { Box, Button, Avatar } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { GiphyModal } from "../../Components/GiphyModal";

defaultTheme.emojiSuggestions += " emojiSuggestions";
defaultTheme.emojiSuggestionsEntry += " emojiSuggestionsEntry";
defaultTheme.emojiSuggestionsEntryFocused += " emojiSuggestionsEntryFocused";
defaultTheme.emojiSuggestionsEntryText += " emojiSuggestionsEntryText";
defaultTheme.emojiSelect += " emojiSelect";
defaultTheme.emojiSelectButton += " emojiSelectButton";
defaultTheme.emojiSelectButtonPressed += " emojiSelectButtonPressed";
defaultTheme.emojiSelectPopover += " emojiSelectPopover";

function SendMessageEditor(props) {
  const {
    sendMessage,
    socket,
    setInput,
    setEditorState,
    editorState,
    setShowGiphyModal,
    showGiphyModal,
  } = props;

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

  return (
    <>
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

      <GiphyModal
        open={showGiphyModal}
        inputPlaceholder="Type something..."
        initialEditorState={editorState}
        onClose={() => setShowGiphyModal(false)}
        onSelectItem={(data) => {
          sendGiphy(data);
        }}
      />
    </>
  );
}

export default SendMessageEditor;
