"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp } from "lucide-react"

export function CostCalculatorPublic() {
  const [landSize, setLandSize] = useState("")
  const [cropType, setCropType] = useState("")
  const [seedSize, setSeedSize] = useState<1 | 2>(1)
  const [showResults, setShowResults] = useState(false)
  const [calculatedCost, setCalculatedCost] = useState(0)
  const [seedRequirement, setSeedRequirement] = useState(0)

  const calculateCost = () => {
    const size = Number.parseFloat(landSize) || 0
    let costPerUnit = 0
    const bagsPerAcre = seedSize === 1 ? 16 : 20

    switch (cropType) {
      case "markies-potatoes":
        costPerUnit = 153500 // KSh per acre
        break
      case "shangi-potatoes":
        costPerUnit = 175000 // KSh per acre
        break
      case "dutch-robijn":
        costPerUnit = 165000 // KSh per acre
        break
      default:
        costPerUnit = 150000
    }

    const total = size * costPerUnit
    const seeds = size * bagsPerAcre
    setCalculatedCost(total)
    setSeedRequirement(seeds)
    setShowResults(true)
  }

  const resetCalculator = () => {
    setLandSize("")
    setCropType("")
    setSeedSize(1)
    setShowResults(false)
    setCalculatedCost(0)
    setSeedRequirement(0)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Production Details */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Card className="h-full border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-sage-700" />
              <span>Calculate Your Costs</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Enter your farm details to get accurate cost estimates</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="cropType">Crop Variety</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select crop variety" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shangi-potatoes">Shangi</SelectItem>
                  <SelectItem value="markies-potatoes">Markies</SelectItem>
                  <SelectItem value="dutch-robijn">Dutch Robijn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="landSize">Farm Size (Acres)</Label>
              <Input
                id="landSize"
                type="number"
                placeholder="Enter acreage"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="seedSize">Seed Size</Label>
              <Select value={seedSize.toString()} onValueChange={(value) => setSeedSize(Number(value) as 1 | 2)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Size 1 (16 bags per acre)</SelectItem>
                  <SelectItem value="2">Size 2 (20 bags per acre)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={calculateCost}
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white"
              disabled={!landSize || !cropType}
            >
              Calculate Costs
            </Button>

            {showResults && (
              <Button onClick={resetCalculator} variant="outline" className="w-full h-12 bg-transparent">
                Reset Calculator
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost Breakdown */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Card className="h-full border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-warm-600" />
              <span>Cost Breakdown</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              {showResults ? `Estimated costs for ${cropType?.replace("-", " ")}` : "Results will appear here"}
            </p>
          </CardHeader>
          <CardContent>
            {showResults ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-sage-50 to-warm-50 rounded-xl border border-sage-100">
                  <div className="text-sm text-gray-600 mb-1">Total Production Cost</div>
                  <div className="text-3xl font-bold text-sage-700">KSh {calculatedCost.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Cost per acre: KSh {Math.round(calculatedCost / Number.parseFloat(landSize)).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sage-600 rounded-full"></div>
                      <span className="text-sm font-medium">Seeds</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh 15</div>
                      <div className="text-xs text-gray-500">{seedRequirement} bags</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warm-600 rounded-full"></div>
                      <span className="text-sm font-medium">Fertilizers</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh 2,300</div>
                      <div className="text-xs text-gray-500">Per acre</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sage-600 rounded-full"></div>
                      <span className="text-sm font-medium">Labor</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh 350</div>
                      <div className="text-xs text-gray-500">Per acre</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warm-600 rounded-full"></div>
                      <span className="text-sm font-medium">Other Costs</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh 4,000</div>
                      <div className="text-xs text-gray-500">Transport, etc.</div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-3">Want detailed breakdown and planning tools?</p>
                  <Button className="bg-sage-700 hover:bg-sage-800 text-white">Sign Up for Full Access</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter your production details to see cost estimates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
