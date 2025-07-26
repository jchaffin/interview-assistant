import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const candidateInfo = formData.get('candidateInfo') as string;
    
    console.log('Received audio file size:', audioFile?.size);
    console.log('Candidate info:', candidateInfo?.substring(0, 100) + '...');

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // First, transcribe the audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    const transcribedText = transcription.text;

    // Only generate suggestion if we have meaningful transcribed text
    if (transcribedText && transcribedText.trim().length > 5) {
      // Then generate a suggestion based on the transcribed text using GPT-4o
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant providing interview answer suggestions. 
            
            Candidate Background: ${candidateInfo}
            
            Guidelines:
            - Generate a suggested answer to the interview question
            - Use the candidate's background to provide relevant examples
            - Keep responses concise and professional
            - Provide specific examples based on their work history
            - Respond with just the suggested answer, no explanations`
          },
          {
            role: "user",
            content: `Interview question: "${transcribedText}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const suggestion = completion.choices[0]?.message?.content || '';
      return NextResponse.json({ suggestion, transcribedText });
    } else {
      // Return empty response if no meaningful transcription
      return NextResponse.json({ suggestion: '', transcribedText: transcribedText || '' });
    }
  } catch (error) {
    console.error('Error processing real-time audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process audio', details: errorMessage }, { status: 500 });
  }
} 