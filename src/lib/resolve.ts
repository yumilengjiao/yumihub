import { VNDB } from "@/types/game"

export const createVNDBParamsFromBootFile = (absPath: string) => {
  const arr = absPath.split("/")
  const name = arr[arr.length - 2]
  const vndbParams: VNDB = {
    filters: [
      "search",
      "=",
      name
    ],
    fields: "title, image.url"
  }
  return vndbParams
}
