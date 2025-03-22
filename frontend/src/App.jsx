import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "./contexts/user-context";
import ProtectedRoute from "./components/auth/protected-route";
import LoadingScreen from "./components/ui/loading-screen";
import PurchasePage from "./pages/purchase";
import { ApiServiceProvider } from "./contexts/ApiServiceContext";

// Lazy-loaded components for code splitting
const Layout = lazy(() => import("./components/layout"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const ApisList = lazy(() => import("./pages/apis-list"));
const CreateApi = lazy(() => import("./pages/create-api"));
const ApiDetail = lazy(() => import("./pages/api-detail"));
const Analytics = lazy(() => import("./pages/analytics"));
const ApiWebhooks = lazy(() => import("./pages/ApiWebhooksPage"));

// Marketplace pages
const ApiMarketplace = lazy(() => import("./pages/marketplace/api-marketplace"));
const ApiMarketDetails = lazy(() => import("./pages/marketplace/api-market-details"));
const ApiTestingPage = lazy(() => import("./pages/ApiTestingPage"));
const ApiReviews = lazy(() => import("./pages/marketplace/api-reviews"));
const CreateReview = lazy(() => import("./pages/marketplace/create-review"));
const Purchased = lazy(() => import("./pages/purchase"));

// New Feature Pages
const UserSettings = lazy(() => import("./pages/settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ThemeProvider defaultTheme="system" storageKey="api-marketplace-theme">
        <UserProvider>
          <ApiServiceProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public route */}
                <Route path="/" element={<Home />} />
                {/* Protected dashboard routes */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/apis" element={<ApisList />} />
                  <Route path="/marketplace/:apiId/test" element={<ApiTestingPage />} />
                  <Route path="/apis/create" element={<CreateApi />} />
                  <Route path="/apis/:id" element={<ApiDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/purchased" element={<PurchasePage />} />

                  {/* Webhooks */}
                  <Route path="/apis/:apiId/webhooks" element={<ApiWebhooks />} />
                  {/* User Settings */}
                  <Route path="/settings" element={<UserSettings />} />
                  {/* Protected marketplace routes */}
                  <Route path="/reviews/create/:apiId" element={<CreateReview />} />
                </Route>
                {/* Public marketplace routes */}
                <Route path="/marketplace" element={<ApiMarketplace />} />
                <Route path="/marketplace/:apiId" element={<ApiMarketDetails />} />
                <Route path="/marketplace/:apiId/reviews" element={<ApiReviews />} />
                {/* Fallback routes */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
            <Toaster position="top-right" />
          </ApiServiceProvider>
        </UserProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;