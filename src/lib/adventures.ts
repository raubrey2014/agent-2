import { prisma } from './db';
import { format, subDays, isToday, isYesterday } from 'date-fns';

export interface Adventure {
  id: number;
  date: Date;
  weather: string;
  temperature: number;
  condition: string;
  suggestion: string;
}

export interface FormattedAdventure {
  date: string;
  weather: string;
  suggestion: string;
  isToday: boolean;
  isYesterday: boolean;
}

export async function getAdventures(limit = 10): Promise<FormattedAdventure[]> {
  try {
    const adventures = await prisma.adventure.findMany({
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return adventures.map(adventure => {
      const adventureDate = new Date(adventure.date);
      const isAdventureToday = isToday(adventureDate);
      const isAdventureYesterday = isYesterday(adventureDate);
      
      return {
        date: format(adventureDate, 'MMMM d, yyyy'),
        weather: `${adventure.condition}, ${adventure.temperature}°F`,
        suggestion: adventure.suggestion,
        isToday: isAdventureToday,
        isYesterday: isAdventureYesterday
      };
    });
  } catch (error) {
    console.error('Failed to fetch adventures:', error);
    return [];
  }
} 