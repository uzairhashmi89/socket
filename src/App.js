import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./pages/chat";
import OnlyChat from "./pages/only-chat";
import StreamImpressive from "./pages/StreamImpressive";
import Immersive from "./pages/Immersive/index";
import Immersive2 from "./pages/Immersive/Immersive2";
import "./App.css";
import "@draft-js-plugins/emoji/lib/plugin.css";
import ChatNew from "./pages/chat/new";

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
        {/* <Route strict path="/immersive" element={<Immersive />} /> */}
        <Route strict path="/immersive" element={<Immersive2 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
