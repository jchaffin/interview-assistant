import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Chat API received body:', body);
    
    if (!body) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      );
    }
    
    const { messages, stream = false } = JSON.parse(body);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (stream) {
      // For realtime streaming
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // For regular chat completion
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return NextResponse.json({
        message: completion.choices[0].message,
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 