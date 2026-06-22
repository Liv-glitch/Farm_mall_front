"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StatsCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
  prefix?: string
  suffix?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  prefix,
  suffix,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("group overflow-hidden", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center space-x-2">
          <div className="rounded-2xl bg-primary-100 p-2 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-4 w-4 text-primary-700" />
          </div>
          <h3 className="text-sm font-bold text-primary-800">{title}</h3>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-2xl font-extrabold tracking-tight text-primary-900">
            {prefix}
            <span className="tabular-nums">
              {typeof value === 'number' && !isNaN(value) ? value.toLocaleString() : '0'}
            </span>
            {suffix}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
