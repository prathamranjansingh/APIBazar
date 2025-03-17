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
// Marketplace pages
const ApiMarketplace = lazy(() => import("./pages/marketplace/api-marketplace"));
const ApiMarketDetails = lazy(() => import("./pages/marketplace/api-market-details"));
const ApiTestingPage = lazy(() => import("./pages/ApiTestingPage"));
const ApiReviews = lazy(() => import("./pages/marketplace/api-reviews"));
const CreateReview = lazy(() => import("./pages/marketplace/create-review"));
const Purchased = lazy(() => import("./pages/purchase"));
// const NotFound = lazy(() => import("./pages/not-found"));
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
                {/* Protected marketplace routes */}
                <Route path="/reviews/create/:apiId" element={<CreateReview />} />
                     {/* Public marketplace routes */}
              <Route path="/marketplace" element={<ApiMarketplace />} />
              <Route path="/marketplace/:apiId" element={<ApiMarketDetails />} />
              <Route path="/marketplace/:apiId/reviews" element={<ApiReviews />} />
              
                </Route>
              {/* Fallback routes */}
              {/* <Route path="/404" element={<NotFound />} /> */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
          <Toaster />
          </ApiServiceProvider>
        </UserProvider>
      </ThemeProvider>
    </div>
  );
}
export default App;