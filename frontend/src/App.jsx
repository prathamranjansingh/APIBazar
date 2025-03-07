import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Home from "./pages/Home";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ApiProvider } from "./contexts/api-context";
import { UserProvider, UserContext } from "./contexts/user-context";

import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import ApisList from "./pages/apis-list";
import CreateApi from "./pages/create-api";
import ApiDetail from "./pages/api-detail";
import Analytics from "./pages/analytics";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(UserContext);
  
  console.log("🔹 ProtectedRoute - User:", user);
  console.log("🔹 ProtectedRoute - Loading:", loading);

  if (loading) return <div className="simple-spinner"><span></span></div>;

  if (!user) {
    console.log("🚨 Redirecting to home");
    return <Navigate to="/" replace />;
  }

  return children;
}



function App() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ThemeProvider defaultTheme="system" storageKey="api-marketplace-theme">
        <UserProvider>
          <ApiProvider>
            <main className="flex-grow">
              
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/lay" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="apis" element={<ApisList />} />
                  <Route path="apis/create" element={<CreateApi />} />
                  <Route path="apis/:id" element={<ApiDetail />} />
                  <Route path="analytics" element={<Analytics />} />
                </Route>
              </Routes>
              
            </main>
            <Toaster />
          </ApiProvider>
        </UserProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
