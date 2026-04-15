import { motion, useMotionValue, animate } from 'framer-motion'
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
  const x = useMotionValue(0)
  const [constraints, setConstraints] = useState({ left: 0, right: 0 })

  const updateConstraints = () => {
    if (!containerRef.current || !contentRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    const contentWidth = contentRef.current.scrollWidth
    const left = Math.min(0, containerWidth - contentWidth)
    setConstraints({ left, right: 0 })
    // 关键修复：主动夹回 x，防止 Framer Motion 强制弹跳
    const cur = x.get()
    if (cur < left) animate(x, left, { duration: 0.15, ease: 'easeOut' })
    else if (cur > 0) animate(x, 0, { duration: 0.15, ease: 'easeOut' })
  }

  useEffect(() => {
    updateConstraints()
    window.addEventListener('resize', updateConstraints)
    return () => window.removeEventListener('resize', updateConstraints)
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
        style={{ x }}
        whileTap={{ cursor: 'grabbing' }}
        className="h-full w-max"
      >
        {children}
      </motion.div>
    </div>
  )
}

export default DragScroller
