import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "zh",
  locales: ["zh", "en", "ja", "ko"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
});
