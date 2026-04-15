"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Cloud, Sun, CloudRain } from "lucide-react"

interface HarvestForecastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HarvestForecastModal({ open, onOpenChange }: HarvestForecastModalProps) {
  const [cropVariety, setCropVariety] = useState("")
  const [plantingDate, setPlantingDate] = useState("")
  const [showForecast, setShowForecast] = useState(false)
  const [harvestDate, setHarvestDate] = useState("")

  const estimateHarvest = () => {
    if (!plantingDate || !cropVariety) return

    const planting = new Date(plantingDate)
    let growthPeriod = 90 // default days

    switch (cropVariety) {
      case "shangi":
        growthPeriod = 85
        break
      case "markies":
        growthPeriod = 90
        break
      case "maize":
        growthPeriod = 120
        break
      case "beans":
        growthPeriod = 75
        break
    }

    const harvest = new Date(planting.getTime() + growthPeriod * 24 * 60 * 60 * 1000)
    setHarvestDate(
      harvest.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    )
    setShowForecast(true)
  }

  const resetForecast = () => {
    setCropVariety("")
    setPlantingDate("")
    setShowForecast(false)
    setHarvestDate("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span>Harvest Forecast</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">Estimate your harvest date and plan accordingly</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estimate Harvest Date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimate Harvest Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cropVariety">Crop Variety</Label>
                <Select value={cropVariety} onValueChange={setCropVariety}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop variety" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shangi">Shangi</SelectItem>
                    <SelectItem value="markies">Markies</SelectItem>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="beans">Beans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plantingDate">Planting Date</Label>
                <Input
                  id="plantingDate"
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                />
              </div>

              <Button
                onClick={estimateHarvest}
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={!cropVariety || !plantingDate}
              >
                Estimate Harvest
              </Button>

              {showForecast && (
                <Button onClick={resetForecast} variant="outline" className="w-full bg-transparent">
                  Reset Forecast
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Harvest Forecast Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-600">Harvest Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              {showForecast ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Harvest Date</div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {harvestDate.split(",")[1]} {harvestDate.split(",")[2]}
                    </div>
                    <div className="text-sm text-blue-600">Week 39, 2025</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Variety</div>
                        <div className="text-sm text-gray-600">{cropVariety}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Growth Period</div>
                        <div className="text-sm text-gray-600">
                          {cropVariety === "shangi"
                            ? "85 days"
                            : cropVariety === "markies"
                              ? "90 days"
                              : cropVariety === "maize"
                                ? "120 days"
                                : "75 days"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Planted On</div>
                        <div className="text-sm text-gray-600">
                          {new Date(plantingDate).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Growing Season</div>
                        <div className="text-sm text-gray-600">Dry Season</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Expected Weather Pattern</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-xs font-medium">25°C</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Cloud className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                        <div className="text-xs font-medium">22°C</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <CloudRain className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-xs font-medium">24°C</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-xs font-medium">27°C</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select crop variety and planting date to see harvest forecast</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
