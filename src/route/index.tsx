import { createBrowserRouter } from "react-router";
import Home from "../page/Home";
import Library from "../page/Library";
import User from "../page/User";
import Setting from "../page/Setting";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: 'library',
    element: <Library />
  },
  {
    path: 'user',
    element: <User />
  },
  {
    path: 'setting',
    element: <Setting />
  }
]);


export default router
