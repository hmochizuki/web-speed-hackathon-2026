import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, "../../dist");

interface SsgPage {
  urlPath: string;
  outputFile: string;
  title: string;
}

const SSG_PAGES: SsgPage[] = [
  { urlPath: "/terms", outputFile: "terms.html", title: "利用規約 - CaX" },
];

function renderPage(urlPath: string): string {
  return renderToString(
    <StaticRouter location={urlPath}>
      <AppContainer />
    </StaticRouter>,
  );
}

function main(): void {
  const indexHtmlPath = path.join(DIST_PATH, "index.html");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

  for (const page of SSG_PAGES) {
    const appHtml = renderPage(page.urlPath);

    let html = indexHtml.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);

    html = html.replace("<title>CaX</title>", `<title>${page.title}</title>`);

    const outputPath = path.join(DIST_PATH, page.outputFile);
    fs.writeFileSync(outputPath, html);

    console.log(`SSG: Generated ${outputPath}`);
  }
}

main();
