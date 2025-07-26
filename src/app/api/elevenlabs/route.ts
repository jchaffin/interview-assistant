import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id = '21m00Tcm4TlvDq8ikWAM', model_id = 'eleven_monolingual_v1' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key is required. Please configure ELEVENLABS_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // Generate speech using ElevenLabs
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate speech from ElevenLabs API' },
        { status: response.status }
      );
    }

    // Check if the response is audio data
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('audio/')) {
      // Get the audio buffer
      const audioBuffer = await response.arrayBuffer();

      // Return the audio as a response
      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unexpected response format from ElevenLabs API' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('ElevenLabs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling ElevenLabs API' },
      { status: 500 }
    );
  }
}

// Get available voices
export async function GET() {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key is required. Please configure ELEVENLABS_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch voices from ElevenLabs API' },
        { status: response.status }
      );
    }

    const voices = await response.json();
    return NextResponse.json(voices);

  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching voices from ElevenLabs API' },
      { status: 500 }
    );
  }
} 