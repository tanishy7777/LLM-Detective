import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "./Router";
import { store } from "./Store";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import * as secret from './Credentials/Secret.json';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={secret.web.client_id}>
      <Provider store={store}>
        <Router />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
