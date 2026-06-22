"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Cloud, Sun, CloudRain } from "lucide-react"
import { POTATO_VARIETIES } from "@/lib/data/potato-varieties"

export function HarvestForecastPublic() {
  const [selectedVarietyId, setSelectedVarietyId] = useState("")
  const [plantingDate, setPlantingDate] = useState("")
  const [showForecast, setShowForecast] = useState(false)
  const [harvestDate, setHarvestDate] = useState("")

  const selectedVariety = POTATO_VARIETIES.find(v => v.id === selectedVarietyId)

  const estimateHarvest = () => {
    if (!plantingDate || !selectedVariety) return

    const planting = new Date(plantingDate)
    const growthPeriod = selectedVariety.maturityPeriodDays

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
    setSelectedVarietyId("")
    setPlantingDate("")
    setShowForecast(false)
    setHarvestDate("")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Card className="h-full border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-secondary-600" />
              <span>Estimate Harvest Date</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Plan your farming activities with accurate harvest predictions</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="cropVariety">Crop Variety</Label>
              <Select value={selectedVarietyId} onValueChange={setSelectedVarietyId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select crop variety" />
                </SelectTrigger>
                <SelectContent>
                  {POTATO_VARIETIES.map((variety) => (
                    <SelectItem key={variety.id} value={variety.id}>
                      {variety.name}
                    </SelectItem>
                  ))}
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
                className="h-12"
              />
            </div>

            <Button
              onClick={estimateHarvest}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-secondary-500 hover:from-green-600 hover:to-secondary-600"
              disabled={!selectedVarietyId || !plantingDate}
            >
              Estimate Harvest
            </Button>

            {showForecast && (
              <Button onClick={resetForecast} variant="outline" className="w-full h-12 bg-transparent">
                Reset Forecast
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Forecast Results */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Card className="h-full border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-secondary-600">Harvest Forecast</CardTitle>
            <p className="text-sm text-gray-600">
              {showForecast ? "Your personalized harvest prediction" : "Results will appear here"}
            </p>
          </CardHeader>
          <CardContent>
            {showForecast && selectedVariety ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-secondary-50 to-accent-50 rounded-xl border border-secondary-100">
                  <div className="text-sm text-gray-600 mb-1">Expected Harvest Date</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-secondary-600 bg-clip-text text-transparent mb-1">
                    {harvestDate.split(",")[1]} {harvestDate.split(",")[2]}
                  </div>
                  <div className="text-sm text-secondary-600">
                    {selectedVariety.maturityPeriodDays} days growth period
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Variety</div>
                      <div className="text-sm text-gray-600">{selectedVariety.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                    <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
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

                  <div className="flex items-center space-x-3 p-3 bg-accent-50 rounded-lg">
                    <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Expected Yield</div>
                      <div className="text-sm text-gray-600">
                        {(selectedVariety.averageYieldPerAcre / 1000).toFixed(1)} tons/acre
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Expected Weather Pattern</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                      <div className="text-xs font-medium">25°C</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Cloud className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                      <div className="text-xs font-medium">22°C</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <CloudRain className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-xs font-medium">24°C</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                      <div className="text-xs font-medium">27°C</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Get detailed weather insights and planning tools</p>
                  <Button className="bg-gradient-to-r from-green-500 to-secondary-500 hover:from-green-600 hover:to-secondary-600">
                    Sign Up for Advanced Features
                  </Button>
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
      </motion.div>
    </div>
  )
}
