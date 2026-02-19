import { createBrowserRouter } from "react-router"
import Home from "@/page/Home"
import Library from "@/page/Library"
import User from "@/page/User"
import Setting from "@/page/Setting"
import Layout from "@/layout/index"
// import LayoutTest from "@/layout/layoutTest"
import GameDetail from "@/page/Library/GameDetail"

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'library',
        element: <Library />,
      },
      {
        path: "game/:id",
        element: <GameDetail />
      },
      {
        path: 'user',
        element: <User />
      },
      {
        path: 'setting',
        element: <Setting />
      }
    ]
  }
]);


export default router
