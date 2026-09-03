import "@astryxdesign/core/reset.css";
import "@astryxdesign/theme-neutral/theme.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { LinkProvider } from "@astryxdesign/core/Link";

import { App } from "./App";
import { AppLink } from "./components/AppLink";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme theme={neutralTheme}>
      <LinkProvider component={AppLink}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LinkProvider>
    </Theme>
  </StrictMode>,
);
