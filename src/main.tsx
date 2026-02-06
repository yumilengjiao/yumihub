import React from "react";
import ReactDOM from "react-dom/client";
import 'normalize.css'
import router from "@/route";
import { RouterProvider } from "react-router";
import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { messages as zhMessages } from "./locales/zh/messages";
import { messages as enMessages } from "./locales/en/messages";
import { messages as jaMessages } from "./locales/ja/messages";
import { messages as koMessages } from "./locales/ko/messages";
import './index.css'
import './style/custom.css'

i18n.load({
  zh: zhMessages,
  en: enMessages,
  ja: jaMessages,
  ko: koMessages
})
i18n.activate('zh')

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nProvider>
  </React.StrictMode>,
);
