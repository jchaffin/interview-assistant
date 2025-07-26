# AI Interviewer Agent

A professional AI interviewer with real-time voice synthesis using ElevenLabs, built with Next.js and OpenAI's GPT-4o.

## Features

- 🎤 **AI Interviewer**: Professional interview experience with natural voice synthesis
- 🎭 **Interview Modes**: Conversational, Technical, and Behavioral interview types
- 🔊 **ElevenLabs Voice**: High-quality, natural-sounding voice synthesis
- 🎵 **Voice Selection**: Choose from multiple ElevenLabs voices
- 💬 **Real-time Responses**: Streaming AI responses with instant voice generation
- 🎤 **Voice Input**: Speech-to-text for natural conversation
- 🌙 **Dark Mode**: Automatic dark/light mode support
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o with streaming
- **Voice Synthesis**: ElevenLabs API
- **Voice Recognition**: Web Speech API
- **Icons**: Lucide React

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd live-interview
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

4. **Get API keys (REQUIRED)**
   - **OpenAI**: Visit [OpenAI Platform](https://platform.openai.com/) and create an API key
   - **ElevenLabs**: Visit [ElevenLabs](https://elevenlabs.io/) and create an account to get your API key
   
   **Note**: Both API keys are required for the application to function properly. The app will not work without valid API keys.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Starting an Interview
1. Select your interview type:
   - **Conversational**: Friendly, follow-up questions, comfortable atmosphere
   - **Technical**: Technical questions, problem-solving assessment
   - **Behavioral**: Past experiences, STAR method, soft skills evaluation

2. Choose your preferred ElevenLabs voice from the dropdown

3. Click "Start Interview" to begin

### During the Interview
- **Text Input**: Type your responses in the input field
- **Voice Input**: Click the microphone button to speak your responses
- **Listen to Questions**: Click the play button next to interviewer messages to hear them
- **Real-time Responses**: See and hear the AI interviewer's questions as they're generated

### Interview Types

#### Conversational
- Follow-up questions based on your responses
- Creates a comfortable, natural conversation flow
- Shows genuine interest in your background and experiences

#### Technical
- Asks technical questions relevant to your field
- Evaluates problem-solving and technical knowledge
- May include coding challenges or technical scenarios

#### Behavioral
- Uses the STAR method (Situation, Task, Action, Result)
- Asks about past experiences and how you handled challenges
- Assesses soft skills like leadership, teamwork, and communication

## API Endpoints

- `POST /api/chat` - Chat completion with streaming support
- `POST /api/elevenlabs` - ElevenLabs voice synthesis
- `GET /api/elevenlabs` - Get available ElevenLabs voices
- `POST /api/transcribe` - Audio transcription (for system audio input)

## Development

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # OpenAI chat integration
│   │   ├── elevenlabs/route.ts     # ElevenLabs voice synthesis
│   │   └── transcribe/route.ts     # Audio transcription
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main page
├── components/
│   ├── ChatBot.tsx                 # Original chatbot component
│   └── InterviewerAgent.tsx        # AI interviewer component
└── types/
    └── speech.d.ts                 # Web Speech API types
```

### Key Features Implementation

1. **AI Interviewer**: Custom system prompts for different interview types
2. **Voice Synthesis**: ElevenLabs API integration for natural speech
3. **Real-time Streaming**: Server-Sent Events for instant responses
4. **Voice Recognition**: Web Speech API for speech-to-text
5. **Audio Playback**: HTML5 Audio API for voice playback
6. **Interview Flow**: Structured conversation management

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your API keys to Vercel environment variables:
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
4. Deploy

### Other Platforms
- Ensure HTTPS is enabled (required for Web Speech API)
- Set the required environment variables
- Build with `npm run build`
- Start with `npm start`

## Troubleshooting

### Voice Synthesis Not Working
- Verify your ElevenLabs API key is correct and properly configured
- Check your ElevenLabs account has sufficient credits
- Ensure the API key has the necessary permissions
- The application requires a valid ElevenLabs API key to function - no fallback is provided

### Interview Responses Not Generating
- Verify your OpenAI API key is correct
- Check your OpenAI account has sufficient credits
- Ensure the API key has the necessary permissions

### Voice Input Not Working
- Ensure you're using HTTPS (required for Web Speech API)
- Check browser permissions for microphone access
- Try refreshing the page

### Performance Issues
- The app uses streaming for better perceived performance
- Large conversations may impact memory usage
- Voice synthesis may take a few seconds for longer responses

## ElevenLabs Voices

The app supports all available ElevenLabs voices. Some popular options include:
- **Rachel** (21m00Tcm4TlvDq8ikWAM) - Professional, clear
- **Domi** (AZnzlk1XvdvUeBnXmlld) - Warm, friendly
- **Bella** (EXAVITQu4vr4xnSDxMaL) - Natural, conversational
- **Antoni** (ErXwobaYiN019PkySvjV) - Professional, authoritative

## License

MIT License - see LICENSE file for details.
