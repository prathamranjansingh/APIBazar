import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from "@auth0/auth0-react";
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";

const authDomain = import.meta.env.VITE_AUTH0_DOMAIN;
const authClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const authAudience = import.meta.env.VITE_AUTH0_AUDIENCE;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
    domain={authDomain}
    clientId={authClientId}
    authorizationParams={{
      audience: authAudience,
      redirect_uri: window.location.origin
    }}
  >
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        </Routes>
    </BrowserRouter>
  </Auth0Provider>
  </StrictMode>,
)
