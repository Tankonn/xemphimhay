import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { movieId, rating } = await request.json();

    // Validate input
    if (!movieId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Invalid rating or movie ID' },
        { status: 400 }
      );
    }

    // Call your NestJS backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movieId, rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to rate movie');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error rating movie:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to rate movie' },
      { status: 500 }
    );
  }
}