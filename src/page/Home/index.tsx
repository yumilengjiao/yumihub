import { useThemeStore } from '@/store/themeStore'
import './index.css'
import { Surface } from "@/layout/Surface"


export default function Home() {
  const { themes } = useThemeStore()
  return (
    <div className='home relative' >
      {themes.length > 0 &&
        <Surface node={themes[0].layout.pages["/"].content}></Surface>
      }
    </div>
  )
}

