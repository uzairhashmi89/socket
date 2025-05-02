import React from "react";
import { Box, IconButton, ModalProps } from "@mui/material";
import { SearchContextManager } from "@giphy/react-components";
import { EditorState } from "draft-js";
import { FlexRow } from "./FlexRow.js";
import { BaseModal } from "./BaseModal.js";
import { GiphyComponent } from "./GiphyComponent.js";
import SendIcon from "@mui/icons-material/Send";
import { FeedGiphyContent } from "./FeedGiphyContent.js";
// import { ReactComponent as SendIcon } from "../../../assets/svgs/send.svg";

export const GiphyModal = ({
  inputPlaceholder,
  initialEditorState,
  onSelectItem = () => {},
  ...props
}) => {
  const [selectedGiphy, setSelectedGiphy] = React.useState();
  const [text, setText] = React.useState("");
  const [draftContent, setDraftContent] = React.useState("");
  const [resetCreator, setResetCreator] = React.useState(0);

  React.useEffect(() => {
    if (props.open) {
      setSelectedGiphy(undefined);
    }
  }, [props.open]);

  return (
    <BaseModal {...props}>
      <Box>
        {!selectedGiphy && (
          <Box>
            <SearchContextManager
              apiKey="AIXHdn1pkImFhwXod1c5kQvfGNviJ1NT"
              theme={{ darkMode: true }}
            >
              <GiphyComponent onSelectItem={setSelectedGiphy} />
            </SearchContextManager>
          </Box>
        )}
        {!!selectedGiphy && (
          <Box sx={{ minWidth: 400, minHeight: 200, backgroundColor: "black" }}>
            <FeedGiphyContent data={selectedGiphy} />
            <FlexRow
              sx={{
                flex: 1,
                gap: 0.625,
                alignItems: "flex-end",
                backgroundColor: "#6535e9",
                borderRadius: 1,
                width: 1,
              }}
              className="comment-input"
            >
              <IconButton
                onClick={() => {
                  onSelectItem({ text, draftContent, giphy: selectedGiphy });
                  setResetCreator(Date.now());
                }}
                sx={{ p: "10px", width: "100%" }}
              >
                <SendIcon />
              </IconButton>
            </FlexRow>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
};
