import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Boston coordinates
const BOSTON_LAT = '42.3601';
const BOSTON_LON = '-71.0589';

interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
  };
  current_units: {
    temperature_2m: string;
  };
}

// Function to convert weather code to condition
function getWeatherCondition(code: number): string {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code >= 96 && code <= 99) return 'Thunderstorm with hail';
  return 'Unknown';
}

// Function to generate adventure suggestion based on weather
function generateSuggestion(weatherCondition: string, temperature: number): string {
  if (temperature < 32) {
    return 'It\'s freezing in Boston today! Visit the Museum of Fine Arts or the New England Aquarium to stay warm while enjoying some culture.';
  } else if (temperature < 50) {
    if (weatherCondition.toLowerCase().includes('rain') || weatherCondition.toLowerCase().includes('drizzle')) {
      return 'It\'s cold and rainy in Boston today. Explore the Boston Public Library or visit the Isabella Stewart Gardner Museum to stay dry.';
    } else {
      return 'It\'s chilly but dry in Boston. Bundle up and take a walk along the Freedom Trail to explore the city\'s rich history.';
    }
  } else if (temperature < 70) {
    if (weatherCondition.toLowerCase().includes('clear')) {
      return 'Enjoy the mild weather with a stroll through Boston Common and the Public Garden. Perfect day for outdoor sightseeing!';
    } else {
      return 'Visit Faneuil Hall Marketplace for shopping and dining, then explore the nearby North End for some delicious Italian food.';
    }
  } else {
    if (weatherCondition.toLowerCase().includes('rain') || weatherCondition.toLowerCase().includes('drizzle')) {
      return 'Despite the rain, it\'s warm in Boston. Visit the Harvard Museum of Natural History or catch a show at one of Boston\'s theaters.';
    } else {
      return 'It\'s a beautiful day in Boston! Take the ferry to Georges Island to explore Fort Warren, or rent a kayak to paddle along the Charles River.';
    }
  }
}

export async function GET() {
  try {
    // Fetch current weather data for Boston using Open-Meteo API
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${BOSTON_LAT}&longitude=${BOSTON_LON}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API responded with status: ${weatherResponse.status}`);
    }
    
    const weatherData: WeatherData = await weatherResponse.json();
    
    // Extract weather information
    const temperature = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;
    const condition = getWeatherCondition(weatherCode);
    
    // Generate adventure suggestion based on weather
    const suggestion = generateSuggestion(condition, temperature);
    
    // Create a new adventure in the database
    const adventure = await prisma.adventure.create({
      data: {
        weather: `${condition}, ${temperature}°F`,
        temperature,
        condition,
        suggestion,
      },
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Cron job executed successfully',
        adventure,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Cron job failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 