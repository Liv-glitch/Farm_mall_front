export interface WeatherRecommendationInput {
  temperature: number
  windSpeed: number
  condition: string
}

const HEAVY_RAIN_TERMS = ["thunderstorm", "heavy rain", "shower rain", "extreme rain"]
const LIGHT_RAIN_TERMS = ["light rain", "drizzle", "rain"]
const CLEAR_TERMS = ["clear", "sunny"]

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term))
}

export function getWeatherRecommendation(weather: WeatherRecommendationInput): string {
  const condition = weather.condition.toLowerCase()

  if (includesAny(condition, HEAVY_RAIN_TERMS)) {
    return "Delay spraying and heavy fieldwork if you can, and check drainage around low spots."
  }

  if (includesAny(condition, LIGHT_RAIN_TERMS)) {
    return "Good timing for transplanting or water-dependent tasks, but avoid spraying because rain can wash products off."
  }

  if (weather.windSpeed > 30) {
    return "Strong wind can cause spray drift. Hold off spraying and check crop supports or staking."
  }

  if (includesAny(condition, CLEAR_TERMS) && weather.temperature > 28) {
    return "Plan fieldwork for early morning or evening, and watch irrigation needs during the hotter part of the day."
  }

  if (includesAny(condition, CLEAR_TERMS) && weather.temperature >= 16 && weather.temperature <= 28 && weather.windSpeed <= 20) {
    return "Good conditions for most routine fieldwork. Keep monitoring the sky before spraying."
  }

  return "Conditions look workable, but keep checking local changes before spraying or starting sensitive fieldwork."
}
