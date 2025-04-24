import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./pages/chat";
import OnlyChat from "./pages/only-chat";
import StreamImpressive from "./pages/StreamImpressive";
import Immersive from "./pages/Immersive";
import './App.css';
import ChatNew from "./pages/chat/new";

function App() {
  

  return (
    <BrowserRouter>
  <Routes>
    <Route strict path="/" element={<Chat />}> {/* Parent route with the layout */}</Route>
    <Route strict path="/only-chat" element={<OnlyChat />}></Route>
      <Route strict path="/stream-impressive" element={<StreamImpressive />} /> {/* Relative path */}
      <Route strict path="/immersive" element={<Immersive />} /> {/* Relative path */}
      <Route strict path="/new" element={<ChatNew />} /> {/* Relative path */}
    
    {/* Other top-level routes if needed */}
  </Routes>
</BrowserRouter>
  );
}

export default App;
