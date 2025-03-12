// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "./contexts/user-context";
import ProtectedRoute from "./components/auth/protected-route";
import LoadingScreen from "./components/ui/loading-screen";
import PurchasePage from "./pages/purchase";

// Lazy-loaded components for code splitting
const Layout = lazy(() => import("./components/layout"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const ApisList = lazy(() => import("./pages/apis-list"));
const CreateApi = lazy(() => import("./pages/create-api"));
const ApiDetail = lazy(() => import("./pages/api-detail"));
const Analytics = lazy(() => import("./pages/analytics"));
// const Profile = lazy(() => import("./pages/profile"));
// const Marketplace = lazy(() => import("./pages/marketplace"));
// const Keys = lazy(() => import("./pages/keys"));
const Purchased = lazy(() => import("./pages/purchase"));
// const NotFound = lazy(() => import("./pages/not-found"));

function App() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ThemeProvider defaultTheme="system" storageKey="api-marketplace-theme">
        <UserProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public route */}
              <Route path="/" element={<Home />} />
              {/* Protected dashboard routes */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/apis" element={<ApisList />} />
                <Route path="/apis/create" element={<CreateApi />} />
                <Route path="/apis/:id" element={<ApiDetail />} />
                <Route path="/analytics" element={<Analytics />} />
                {/* <Route path="/marketplace" element={<Marketplace />} /> */}
                {/* <Route path="/keys" element={<Keys />} /> */}
                <Route path="/purchased" element={<PurchasePage />} />
                {/* <Route path="/profile" element={<Profile />} /> */}
              </Route>
              {/* Fallback routes */}
              {/* <Route path="/404" element={<NotFound />} /> */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
          <Toaster />
        </UserProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;