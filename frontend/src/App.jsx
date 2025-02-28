import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { SiteHeader } from "./components/Header";
import { SiteFooter } from "./components/Footer";

function App() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
