import { useEffect, useState } from "react";

import { Box, Tab, Tabs } from "@mui/material";
import { ChatBubble } from "@mui/icons-material";

import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
// import { io } from "socket.io-client";
import UserIcon from "../../assets/mdi_account-online.svg";
import Header from "./Components/Header";
import Messages from "./Components/Messages";
import { Ai } from "./Components/AI";
// import { BASE_URLS, ENVIRONMENT_MODE } from "../../config/constants";

// const baseUrl = BASE_URLS[ENVIRONMENT_MODE].REACT_APP_API_BASE_URL;
// const channelId = BASE_URLS[ENVIRONMENT_MODE].CHANNEL_ID;

// const socket = io(baseUrl, {
//   path: "/public-socket/",
//   transports: ["websocket"],
// });

function OnlyChat() {
  const [connectedUsersCount, setConnectedUsersCount] = useState(null);
  const [value, setValue] = useState(1);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
      </div>
    );
  }

  return (
    <Box
      className="only-chat-ui"
      sx={{ backgroundColor: "#262825", position: "relative", height: "100vh" }}
    >
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
        <Header />
        <TabContext value={value} className="tab-context">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <div
              style={{
                backgroundColor: "#2c3136",
                width: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "5px 5px 5px 20px",
                height: "40px",
              }}
            >
              <TabList
                onChange={handleChange}
                aria-label="lab API tabs example"
                className="simple_tabs_parent"
              >
                <Tab
                  label=" دردشة"
                  id="simple-tab-0"
                  aria-controls="simple-tabpanel-0"
                  icon={<ChatBubble />}
                  className="simple_tabs"
                  value={1}
                />
                <Tab
                  label="منظمة العفو الدولية"
                  id="simple-tab-1"
                  aria-controls="simple-tabpanel-1"
                  className="simple_tabs"
                  value={2}
                />
              </TabList>

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
          </Box>

          <TabPanel value={1} index={0} keepMounted className="simple_tabs_panel">
            <Messages setConnectedUsersCount={setConnectedUsersCount} />
          </TabPanel>

          <TabPanel value={2} index={1} className="simple_tabs_panel">
            <Ai />
          </TabPanel>
        </TabContext>
      </Box>
    </Box>
  );
}

export default OnlyChat;
