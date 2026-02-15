import { useThemeStore } from '@/store/themeStore'
import './index.css'
import { useEffect } from 'react';
import { Surface } from '@/layout/Surface';

export default function index() {
  const { themes } = useThemeStore()
  console.log("themes是", themes);
  useEffect(() => {
    console.log('themes changed', themes);
  }, [themes])
  const fakeNode = {
    id: "88",
    nt: "background",
    style: {
      itemBasis: "basis-1/6",
      variant: "scaler"
    },
    className: "",
  }
  console.log("----------", themes[0].layout.pages["/"].content)
  return (
    <Surface node={themes[0].layout.pages["/"].content}></Surface>
  )
}

