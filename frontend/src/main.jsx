import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

const authDomain = import.meta.env.VITE_AUTH0_DOMAIN || "your-default-domain";
const authClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "your-default-client-id";
const authAudience = import.meta.env.VITE_AUTH0_AUDIENCE || "your-default-audience";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Auth0Provider
      domain={authDomain}
      clientId={authClientId}
      authorizationParams={{
        audience: authAudience,
        redirect_uri: window.location.origin,
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>
);
