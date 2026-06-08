import { useEffect, useState } from "react"

export function useDarkMode() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"))

  useEffect(() => {
    const ob = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    )
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => ob.disconnect()
  }, [])

  return dark
}
