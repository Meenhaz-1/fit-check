"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check } from "lucide-react"

interface AnimatedStatusBadgeProps {
  trigger: boolean
  onAnimationComplete?: () => void
  className?: string
}

export function AnimatedStatusBadge({
  trigger,
  onAnimationComplete,
  className = ""
}: AnimatedStatusBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (!trigger) return

    setIsAnimating(true)
    setIsCompleted(false)

    const t1 = setTimeout(() => {
      setIsAnimating(false)
      const t2 = setTimeout(() => {
        setIsCompleted(true)
        const t3 = setTimeout(() => {
          setIsCompleted(false)
          onAnimationComplete?.()
        }, 3000)
        return () => clearTimeout(t3)
      }, 300)
      return () => clearTimeout(t2)
    }, 3000)

    return () => clearTimeout(t1)
  }, [trigger, onAnimationComplete])

  return (
    <>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className={`absolute top-0 right-0 bg-yellow-100 text-yellow-600 text-xs font-medium px-2.5 py-0.5 rounded-none flex items-center space-x-1 shadow-md border border-yellow-300/50 z-10 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            <span>Running</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className={`absolute top-0 right-0 bg-green-100 text-green-600 text-xs font-medium px-2.5 py-0.5 rounded-none flex items-center space-x-1 shadow-md border border-green-300/50 z-10 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="h-3 w-3 mr-1" />
            <span>Completed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
