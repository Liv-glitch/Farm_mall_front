"use client"

import { motion } from "framer-motion"
import { Leaf, Sprout, Sun, Cloud } from "lucide-react"

export function FloatingElements() {
  const elements = [
    { Icon: Leaf, delay: 0, x: 100, y: 50 },
    { Icon: Sprout, delay: 0.5, x: -80, y: 100 },
    { Icon: Sun, delay: 1, x: 150, y: -50 },
    { Icon: Cloud, delay: 1.5, x: -120, y: -80 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute opacity-10"
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            x: [0, x, 0],
            y: [0, y, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{
            left: `${20 + index * 20}%`,
            top: `${30 + index * 15}%`,
          }}
        >
          <Icon className="w-8 h-8 text-green-500" />
        </motion.div>
      ))}
    </div>
  )
}
