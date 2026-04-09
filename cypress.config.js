import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
    setupNodeEvents() {},
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
  },

  env: {
    INTEGRATION: process.env.CYPRESS_INTEGRATION === "true",
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
