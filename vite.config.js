import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  plugins: [
    {
      name: "agentation-dev",
      transformIndexHtml(html, ctx) {
        if (!ctx.server) return html;
        return html.replace(
          "</body>",
          `    <script type="module" src="/dev/agentation.js"></script>\n  </body>`
        );
      },
    },
  ],
});
