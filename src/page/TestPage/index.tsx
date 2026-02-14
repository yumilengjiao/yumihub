import { useThemeStore } from '@/store/themeStore'
import './index.css'
import Surface from '@/layout/Surface';
import { useEffect } from 'react';

export default function index() {
  const { themes } = useThemeStore()
  console.log("themes是", themes);
  useEffect(() => {

  }, [themes])

  return (
    <Surface node={themes[0].layout.pages["/"]!.content}></Surface>
  )
}

