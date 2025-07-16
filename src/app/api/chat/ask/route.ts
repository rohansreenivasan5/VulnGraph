import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }
    const result = await runPipeline(message);
    return NextResponse.json(result);
  } catch (err: unknown) {
    // Log error to server console
    console.error('API /api/chat/ask error:', err);
    // Return error message in response
    let errorMsg = 'Unknown error';
    let stack = undefined;
    if (err instanceof Error) {
      errorMsg = err.message;
      stack = err.stack;
    } else if (typeof err === 'string') {
      errorMsg = err;
    }
    return NextResponse.json({ error: errorMsg, stack }, { status: 500 });
  }
} 