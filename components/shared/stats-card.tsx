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
    <Card className={cn("overflow-hidden group", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-background/80 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-4 w-4 text-sage-600" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-2xl font-bold tracking-tight">
            {prefix}
            <span className="tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {suffix}
          </p>
          <p className="text-xs text-muted-foreground/80">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
