import React from "react";
import ReactDOM from "react-dom/client";
import 'normalize.css'
import router from "@/route";
import { RouterProvider } from "react-router";
import './index.css'
import './style/custom.css'
import 'sonner/dist/styles.css'

i18n.load({
  zh: zhMessages,
  en: enMessages,
  ja: jaMessages,
  ko: koMessages
})
i18n.activate('zh')

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
