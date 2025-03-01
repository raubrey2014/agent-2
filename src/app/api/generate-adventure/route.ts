import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAventure } from '@/lib/mastra';

// Use Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Generate adventure using Mastra (runs in Node.js environment)
    const adventureData = await generateAventure();
    
    // Create a new adventure in the database
    const adventure = await prisma.adventure.create({
      data: {
        weather: `${adventureData.condition}, ${adventureData.temperature}°F`,
        temperature: adventureData.temperature,
        condition: adventureData.condition,
        suggestion: adventureData.suggestion,
      },
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Adventure generated successfully',
        adventure,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Adventure generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Adventure generation failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 