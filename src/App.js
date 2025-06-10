import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./pages/chat";
import OnlyChat from "./pages/only-chat";
import StreamImpressive from "./pages/StreamImpressive";
import Immersive from "./pages/Immersive";
import "@draft-js-plugins/emoji/lib/plugin.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route strict path="/" element={<Chat />} />
        <Route strict path="/only-chat" element={<OnlyChat />} />
        <Route
          strict
          path="/stream-impressive"
          element={<StreamImpressive />}
        />
        <Route strict path="/immersive" element={<Immersive />} />
        <Route strict path="/demo1" element={<Immersive VideoUrl="https://api-ott.motorvision.tv/loggingmediaurlpassthrough/a.m3u8?version=12&id=2459&partner=boltplus" />} />
        <Route strict path="/demo2" element={<Immersive VideoUrl="https://api-ott.lightsoutsportstv.com/loggingmediaurlpassthrough/a.m3u8?version=12&id=8090&partner=boltplus" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
