import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  const url = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-adventure`;
  console.log('Executing cron job, hitting url:', url);
  try {
    // Call the generate-adventure API endpoint
    const response = await fetch(
      url,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to generate adventure: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Cron job executed successfully, data:', data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Cron job executed successfully',
        adventure: data.adventure,
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