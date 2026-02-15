import { useThemeStore } from '@/store/themeStore'
import './index.css'
import Surface from '@/layout/Surface';
import { useEffect } from 'react';

export default function index() {
  const { themes } = useThemeStore()
  console.log("themes是", themes);
  useEffect(() => {

  }, [themes])
  const fakeNode = {
    id: "88",
    nt: "Background",
    style: {
      itemBasis: "basis-1/6",
      variant: "scaler"
    },
    className: "",
  }

  return (
    <Surface node={fakeNode}></Surface>
  )
}

