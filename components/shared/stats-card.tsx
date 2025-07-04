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
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-sage-600" />
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-2xl font-bold">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
