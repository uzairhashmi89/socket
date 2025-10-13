import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./pages/chat";
import OnlyChat from "./pages/only-chat";
import Scan from "./pages/Scan";
import StreamImpressive from "./pages/StreamImpressive";
import Immersive from "./pages/Immersive";
import "@draft-js-plugins/emoji/lib/plugin.css";
import "./App.css";
import { Button } from "@mui/material";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you are looking for does not exist.</p>
              {/* <Button variant="contained" onClick={() => window.location.href = "/"} style={{ marginTop: "16px", padding: "8px 16px" }}>
                Go to Home Page
              </Button> */}
            </div>
          }
        />
        <Route strict path="/" element={<Chat />} />
        {/* <Route strict path="/only-chat" element={<OnlyChat />} /> */}
        <Route strict path="/chat/:id" element={<OnlyChat />} />
        <Route strict path="/scan/:id" element={<Scan />} />
        {/* <Route
          strict
          path="/stream-impressive"
          element={<StreamImpressive />}
        /> */}
        <Route
          strict
          path="/stream/:id"
          element={<StreamImpressive />}
        />
        <Route strict path="/immersive" element={<Immersive />} />
        <Route strict path="/demo1" element={<Immersive VideoUrl="https://api-ott.motorvision.tv/loggingmediaurlpassthrough/a.m3u8?version=12&id=2459&partner=boltplus" />} />
        <Route strict path="/demo2" element={<Immersive VideoUrl="https://api-ott.lightsoutsportstv.com/loggingmediaurlpassthrough/a.m3u8?version=12&id=8090&partner=boltplus" />} />
        <Route strict path="/demo3" element={<Immersive leftAlignBox VideoUrl="https://api-ott-adnet-oan.ottera.tv/loggingmediaurlpassthrough/a.m3u8?version=12&id=266&partner=boltplus" />} />
        <Route strict path="/demo4" element={<Immersive leftAlignQR VideoUrl="https://api-ott-adnet-oan.ottera.tv/loggingmediaurlpassthrough/a.m3u8?version=12&id=266&partner=boltplus" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
