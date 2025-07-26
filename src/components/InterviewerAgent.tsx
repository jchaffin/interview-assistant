'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Play, Pause, Settings } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

interface InterviewerAgentProps {
  className?: string;
  onNewQuestion?: (question: string) => void;
  onUserResponse?: (response: string) => void;
  onTranscribedResponse?: (transcribedText: string) => void;
  onInterviewerStartsSpeaking?: () => void;
  onInterviewerFinishesSpeaking?: () => void;
  onAudioGenerated?: (audioUrl: string, text: string) => void;
  userResponses?: string[];
}

export default function InterviewerAgent({ className = '', onNewQuestion, onUserResponse, onTranscribedResponse, onInterviewerStartsSpeaking, onInterviewerFinishesSpeaking, userResponses = [] }: InterviewerAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('21m00Tcm4TlvDq8ikWAM'); // Rachel voice
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [interviewMode, setInterviewMode] = useState<'conversational' | 'technical' | 'behavioral'>('conversational');

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isProcessingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const interviewModeRef = useRef(interviewMode);
  const lastProcessedResponseRef = useRef<string>('');

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Update refs when state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    interviewModeRef.current = interviewMode;
  }, [interviewMode]);

  // Load available voices
  useEffect(() => {
    fetchVoices();
  }, []);

  // Initialize audio recording for transcription
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize media recorder for audio capture
      mediaRecorderRef.current = null;
      audioContextRef.current = null;
    }
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/elevenlabs');
      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.voices || []);
      } else {
        const errorData = await response.json();
        console.error('Error fetching voices:', errorData);
        // Show error message to user
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error loading available voices. Please check your ElevenLabs API configuration.',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error loading available voices. Please check your ElevenLabs API configuration.',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    }
  };

  const generateInterviewerResponse = useCallback(async (userMessage: string) => {
    // Prevent multiple simultaneous calls
    if (isStreaming || isProcessingRef.current) {
      console.log('InterviewerAgent: Already processing, ignoring call');
      return;
    }
    
    // Prevent processing the same response multiple times
    if (lastProcessedResponseRef.current === userMessage) {
      console.log('InterviewerAgent: Already processed this response, ignoring call');
      return;
    }
    
    lastProcessedResponseRef.current = userMessage;
    isProcessingRef.current = true;
    
    setIsStreaming(true);
    setStreamingMessage('');
    
    const systemPrompt = `You are an AI interviewer conducting a ${interviewModeRef.current} interview with a human candidate. 
    
    Interview Mode: ${interviewModeRef.current}
    - Conversational: Ask follow-up questions, show interest, create a comfortable atmosphere
    - Technical: Ask technical questions, assess problem-solving skills, evaluate technical knowledge
    - Behavioral: Ask about past experiences, use STAR method, assess soft skills
    
    Guidelines:
    - Keep responses concise (1-2 sentences)
    - Ask one clear question at a time
    - Be professional but friendly
    - Adapt to the candidate's responses
    - If this is the first message, introduce yourself and start the interview
    - You are the interviewer, the human is the candidate being interviewed
    
    Current conversation context: ${messagesRef.current.map(m => `${m.role}: ${m.content}`).join('\n')}
    
    Respond as the interviewer:`;

    try {
      const requestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: true,
      };
      
      console.log('InterviewerAgent: Sending request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                setStreamingMessage('');
                isProcessingRef.current = false;
                
                const assistantMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: accumulatedMessage,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                
                // Only process if we have a complete message
                if (accumulatedMessage && accumulatedMessage.trim().length > 10) {
                  console.log('InterviewerAgent: Complete response generated:', accumulatedMessage);
                  // Generate audio for the complete response
                  await generateSpeech(accumulatedMessage);
                } else {
                  console.log('InterviewerAgent: Incomplete message received, skipping processing');
                }
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulatedMessage += parsed.text;
                  setStreamingMessage(accumulatedMessage);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating interviewer response:', error);
      setIsStreaming(false);
      setStreamingMessage('');
      isProcessingRef.current = false;
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Could you please repeat your response?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, []);

  // Handle responses from userResponses prop (for initial setup)
  useEffect(() => {
    if (userResponses.length > 0 && !isStreaming && !isProcessingRef.current) {
      const latestResponse = userResponses[userResponses.length - 1];
      
      // Generate next interview question with a longer delay
      const timeoutId = setTimeout(() => {
        if (!isStreaming && !isProcessingRef.current) {
          console.log('InterviewerAgent: Starting response generation for:', latestResponse);
          generateInterviewerResponse(latestResponse);
        } else {
          console.log('InterviewerAgent: Skipping response generation - streaming:', isStreaming, 'processing:', isProcessingRef.current);
        }
      }, 3000);
      
      return () => {
        console.log('InterviewerAgent: Clearing timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [userResponses.length, isStreaming]);

  const generateSpeech = async (text: string) => {
    console.log('InterviewerAgent: About to start speaking:', text);
    // Notify ChatBot that InterviewerAgent is about to start speaking
    if (onInterviewerStartsSpeaking) {
      console.log('InterviewerAgent: Notifying ChatBot to start listening');
      onInterviewerStartsSpeaking();
    }
    
    try {
      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice,
        }),
      });

      if (response.ok) {
        // Use ElevenLabs audio
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Update the last assistant message with audio URL
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
            newMessages[newMessages.length - 1].audioUrl = audioUrl;
          }
          return newMessages;
        });
        
        // Play the audio and notify when it finishes
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          console.log('InterviewerAgent: Audio finished playing, notifying ChatBot');
          if (onInterviewerFinishesSpeaking) {
            onInterviewerFinishesSpeaking();
          }
        };
        audio.play();
        setCurrentAudio(audio);
      } else {
        const errorData = await response.json();
        console.error('ElevenLabs API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error generating speech. Please check your ElevenLabs API configuration.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    
    audio.play();
    setCurrentAudio(audio);
  };



  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      await generateInterviewerResponse(content.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Could you please repeat your response?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [generateInterviewerResponse]);

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'user-response.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        const transcribedText = result.text || 'No speech detected';
        
        // Notify parent component about the user's response
        if (onUserResponse) {
          onUserResponse(transcribedText);
        }
        
        // Notify parent component about the transcribed response for ChatBot
        if (onTranscribedResponse) {
          onTranscribedResponse(transcribedText);
        }
        
        // Add it to local messages for display
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: transcribedText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Don't generate next question here - let the useEffect handle it
        // This prevents duplicate calls
      } else {
        console.error('Transcription failed');
        throw new Error('Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error transcribing your response. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Wait for transcription to complete
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startInterview = () => {
    const welcomeMessage = `Hello! I'm your AI interviewer. I'll be conducting a ${interviewMode} interview today. You are the candidate being interviewed. Let's start with a brief introduction. Could you tell me a bit about yourself and your background?`;
    
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    };
    
    setMessages([assistantMessage]);
    
    // Don't notify ChatBot about the question until we actually start speaking
    // The ChatBot should only know about questions from audio, not text
    
    // Try to generate speech for the welcome message
    setTimeout(() => {
      generateSpeech(welcomeMessage);
    }, 500);
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold text-center">AI Interviewer</h1>
        <p className="text-center text-blue-100 mt-1">Professional Interview Experience • Real-time Voice</p>
      </div>



      {/* Interview Controls */}
      <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Interview Type:</span>
            <select
              value={interviewMode}
              onChange={(e) => setInterviewMode(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="conversational">Conversational</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {availableVoices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={startInterview}

            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Start Interview
          </button>
          
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">Welcome to your AI interview!</p>
            <p className="text-sm mt-2">Select your interview type and click "Start Interview" to begin</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'assistant' && message.audioUrl && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => isPlaying ? stopAudio() : playAudio(message.audioUrl!)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title={isPlaying ? "Stop audio" : "Play audio"}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <p className="whitespace-pre-wrap">
                {streamingMessage}
                <span className="typing-dots"></span>
              </p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`p-4 rounded-full transition-colors ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>
        
        {isRecording && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Speak your response... Click the microphone again to stop
          </p>
        )}
      </div>
    </div>
  );
} 