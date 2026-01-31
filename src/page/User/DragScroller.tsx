import { motion } from 'framer-motion'
import { ReactNode, useRef, useEffect, useState } from 'react'

type HorizontalDragContainerProps = {
  children: ReactNode
  height?: string
  className?: string
}

export function DragScroller({
  children,
  height = 'h-full',
  className = '',
}: HorizontalDragContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })

  const calculateConstraints = () => {
    if (!containerRef.current || !contentRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    const contentWidth = contentRef.current.scrollWidth

    setConstraints({
      left: containerWidth - contentWidth,
      right: 0,
    })
  }

  useEffect(() => {
    calculateConstraints()
    window.addEventListener('resize', calculateConstraints)
    return () => window.removeEventListener('resize', calculateConstraints)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-grab ${height} ${className}`}
    >
      <motion.div
        ref={contentRef}
        drag="x"
        dragConstraints={constraints}
        dragElastic={0.08}
        dragMomentum={true}
        whileTap={{ cursor: 'grabbing' }}
        className="h-full w-max"
      >
        {children}
      </motion.div>
    </div>
  )
}
export default DragScroller
