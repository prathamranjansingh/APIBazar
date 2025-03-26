import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "./contexts/user-context";
import ProtectedRoute from "./components/auth/protected-route";
import LoadingScreen from "./components/ui/loading-screen";
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
const PurchasePage = lazy(() => import("./pages/purchase"));

// Marketplace pages
const ApiMarketplace = lazy(() => import("./pages/marketplace/api-marketplace"));
const ApiMarketDetails = lazy(() => import("./pages/marketplace/api-market-details"));
const ApiTestingPage = lazy(() => import("./pages/ApiTestingPage"));
const ApiReviews = lazy(() => import("./pages/marketplace/api-reviews"));
const CreateReview = lazy(() => import("./pages/marketplace/create-review"));

// Analytics components
const ApiAnalyticsDetail = lazy(() => import("./pages/ApiAnalyticsDetail"));

// Settings and error pages
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
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/marketplace" element={<ApiMarketplace />} />
                <Route path="/marketplace/:apiId" element={<ApiMarketDetails />} />
                <Route path="/marketplace/:apiId/reviews" element={<ApiReviews />} />

                {/* Protected routes (require authentication) */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  {/* Dashboard and API management */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/apis" element={<ApisList />} />
                  <Route path="/apis/create" element={<CreateApi />} />
                  <Route path="/apis/:id" element={<ApiDetail />} />
                  <Route path="/apis/:apiId/webhooks" element={<ApiWebhooks />} />
                  <Route path="/marketplace/:apiId/test" element={<ApiTestingPage />} />

                  {/* Analytics routes */}
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/analytics/api/:id" element={<ApiAnalyticsDetail />} />

                  {/* Marketplace actions */}
                  <Route path="/reviews/create/:apiId" element={<CreateReview />} />
                  <Route path="/purchased" element={<PurchasePage />} />

                  {/* User settings */}
                  <Route path="/settings" element={<UserSettings />} />
                </Route>

                {/* Error handling routes */}
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