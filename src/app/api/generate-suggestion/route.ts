import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    // Call OpenAI API to generate suggestion
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: context
          },
          {
            role: 'user',
            content: `Generate a helpful interview answer for this question: "${question}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate suggestion');
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || 'I would provide a thoughtful response based on my experience.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
} 