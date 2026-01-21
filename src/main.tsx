import React from "react";
import ReactDOM from "react-dom/client";
import 'normalize.css'
import router from "@/route";
import { RouterProvider } from "react-router";
import './index.css'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
