import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { SiteHeader } from "./components/Header";
import { SiteFooter } from "./components/Footer";

function App() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-10">
      <SiteHeader />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
  
      <SiteFooter />
    </div>
  );
}

export default App;
