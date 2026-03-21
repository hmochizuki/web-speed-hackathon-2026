import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const appEl = document.getElementById("app")!;
const app = (
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>
);

if (appEl.hasChildNodes()) {
  hydrateRoot(appEl, app);
} else {
  createRoot(appEl).render(app);
}
