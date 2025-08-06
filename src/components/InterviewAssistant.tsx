'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createAssistantSupervisorConfig, AssistantSupervisorConfig, ResumeData } from '@/app/agentConfigs/chatSupervisor/assistantSupervisor';
import { sessionManager } from '@/lib/session';
import { guardrails } from '@/lib/guardrails';
import { Mic, MicOff, Settings, Volume2, VolumeX, User, MessageSquare, Send, Sparkles, FileText, Brain } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'question' | 'enhanced' | 'resume-focused' | 'behavioral';
  usedResumeData?: boolean;
}

interface InterviewAssistantProps {
  className?: string;
  candidateInfo?: string;
  resumeData?: ResumeData;
  sessionId?: string;
  onSuggestionGenerated?: (suggestion: string) => void;
  onSessionCreated?: (sessionId: string) => void;
}

export default function InterviewAssistant({
  className = '',
  candidateInfo = '',
  resumeData,
  sessionId = '',
  onSuggestionGenerated,
  onSessionCreated
}: InterviewAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'enhanced' | 'resume-focused' | 'behavioral'>('enhanced');
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId);
  const [localCandidateInfo, setLocalCandidateInfo] = useState(candidateInfo);
  const [showSetupForm, setShowSetupForm] = useState(!candidateInfo);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [resumeInsights, setResumeInsights] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update session ID when prop changes
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
    }
  }, [sessionId, currentSessionId]);

  // Create session if needed
  const createSession = useCallback(async () => {
    if (!localCandidateInfo.trim()) {
      alert('Please provide candidate information to start');
      return;
    }

    try {
      const session = sessionManager.createSession(localCandidateInfo, {
        assistantMode,
        type: 'superAssistant',
        resumeData
      });
      
      setCurrentSessionId(session.id);
      onSessionCreated?.(session.id);
      
      // Generate initial resume insights
      if (resumeData) {
        generateResumeInsights();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    }
  }, [localCandidateInfo, assistantMode, resumeData, onSessionCreated]);

  const generateResumeInsights = async () => {
    if (!resumeData) return;

    try {
      const agentConfig = createAssistantSupervisorConfig({
        candidateInfo: localCandidateInfo,
        resumeData,
        sessionId: currentSessionId,
        mode: assistantMode
      });

      // Extract career progression insights
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: `You are a Super Assistant analyzing resume data. Extract key insights about career progression, technical skills, and project patterns. Provide 3-5 key insights in bullet points.`
            },
            { 
              role: 'user', 
              content: `Analyze this resume data and provide key insights: ${JSON.stringify(resumeData)}`
            }
          ],
          stream: false,
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const insights = result.message?.content || '';
        setResumeInsights(insights.split('\n').filter((line: string) => line.trim().startsWith('•')));
      }
    } catch (error) {
      console.error('Error generating resume insights:', error);
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
        
        // Process the audio through transcription
        await processAudioInput(audioBlob);
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

  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        const transcribedText = result.text || '';
        
        if (transcribedText.trim()) {
          // Add user message
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: transcribedText,
            timestamp: new Date(),
            type: 'question'
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Generate enhanced suggestion
          await generateEnhancedSuggestion(transcribedText);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateEnhancedSuggestion = async (question: string) => {
    try {
      const agentConfig = createAssistantSupervisorConfig({
        candidateInfo: localCandidateInfo,
        resumeData,
        sessionId: currentSessionId,
        mode: assistantMode
      });

      // Apply guardrails to user input
      const guardrailResult = await guardrails.analyzeContent(question);
      
      if (guardrailResult.blocked) {
        console.warn('User input blocked:', guardrailResult.reason);
        return;
      }

      // Add user input to session
      if (currentSessionId) {
        sessionManager.addMessage(currentSessionId, {
          role: 'user',
          content: guardrailResult.filteredContent || question
        });
      }

      // Generate enhanced suggestion using the super assistant
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: `You are a Super Assistant providing enhanced interview response suggestions.

${agentConfig.instructions}

Candidate Background: ${localCandidateInfo}
Resume Data: ${resumeData ? JSON.stringify(resumeData) : 'Not provided'}

Generate a sophisticated response suggestion for: "${question}"

Use specific examples from the resume data if available. Keep it to 2-3 sentences maximum.`
            },
            { 
              role: 'user', 
              content: `Interview question: ${question}`
            }
          ],
          stream: false,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const suggestion = result.message?.content || 'Focus on your relevant experience and provide specific examples.';
        
        // Apply guardrails to the response
        const responseGuardrail = await guardrails.analyzeResponse(suggestion);
        
        if (responseGuardrail.blocked) {
          console.warn('Agent response blocked:', responseGuardrail.reason);
          return;
        }

        const finalSuggestion = responseGuardrail.filteredContent || suggestion;
        const usedResumeData = resumeData && suggestion.toLowerCase().includes('resume');

        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalSuggestion,
          timestamp: new Date(),
          type: assistantMode,
          usedResumeData
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        // Add response to session
        if (currentSessionId) {
          sessionManager.addMessage(currentSessionId, {
            role: 'assistant',
            content: finalSuggestion
          });
        }

        // Notify parent component
        onSuggestionGenerated?.(finalSuggestion);
      }
    } catch (error) {
      console.error('Error generating enhanced suggestion:', error);
    }
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      type: 'question'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    await generateEnhancedSuggestion(inputText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const speakSuggestion = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onpause = () => setIsPlaying(false);
      utterance.onresume = () => setIsPlaying(true);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleSetupSubmit = () => {
    if (localCandidateInfo.trim()) {
      setShowSetupForm(false);
      createSession();
    }
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'enhanced':
        return <Brain size={16} className="text-purple-500" />;
      case 'resume-focused':
        return <FileText size={16} className="text-blue-500" />;
      case 'behavioral':
        return <MessageSquare size={16} className="text-green-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  const getMessageStyle = (message: Message) => {
    if (message.role === 'user') {
      return 'bg-blue-600 text-white';
    }
    
    switch (message.type) {
      case 'enhanced':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200';
      case 'resume-focused':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      case 'behavioral':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold text-center">Interview Assistant</h1>
        <p className="text-center text-purple-100 mt-1">AI-Powered Resume-Enhanced Interview Coaching</p>
      </div>

      {/* Setup Form */}
      {showSetupForm && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
            <Brain size={20} />
            Interview Assistant Setup
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            Provide your background and resume data for enhanced interview assistance.
          </p>
          <textarea
            value={localCandidateInfo}
            onChange={(e) => setLocalCandidateInfo(e.target.value)}
            placeholder="Describe your experience, work history, skills, and background..."
            className="w-full h-32 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none"
          />
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Mode:</span>
              <select
                value={assistantMode}
                onChange={(e) => setAssistantMode(e.target.value as any)}
                className="px-3 py-1 text-sm border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-purple-900 dark:text-white"
              >
                <option value="enhanced">Enhanced</option>
                <option value="resume-focused">Resume-Focused</option>
                <option value="behavioral">Behavioral</option>
              </select>
            </div>
            <button
              onClick={handleSetupSubmit}
              disabled={!localCandidateInfo.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Start Interview Assistant
            </button>
          </div>
        </div>
      )}

      {/* Resume Insights */}
      {!showSetupForm && resumeInsights.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <FileText size={16} />
            Resume Insights
          </h4>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            {resumeInsights.slice(0, 3).map((insight, index) => (
              <div key={index}>{insight}</div>
            ))}
          </div>
        </div>
      )}

      {/* Assistant Controls */}
      {!showSetupForm && (
        <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</span>
              <select
                value={assistantMode}
                onChange={(e) => setAssistantMode(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="enhanced">Enhanced</option>
                <option value="resume-focused">Resume-Focused</option>
                <option value="behavioral">Behavioral</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Session: {currentSessionId ? currentSessionId.slice(-8) : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!showSetupForm && messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Brain size={48} className="mx-auto mb-4 text-purple-400" />
            <p className="text-lg">Interview Assistant Ready!</p>
            <p className="text-sm mt-2">Ask complex questions for resume-enhanced suggestions</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg border ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : getMessageStyle(message)
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === 'assistant' && getMessageIcon(message.type)}
                    {message.usedResumeData && (
                      <div title="Used resume data">
                        <FileText size={12} className="text-green-500" />
                      </div>
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => isPlaying ? stopSpeaking() : speakSuggestion(message.content)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-70 hover:opacity-100"
                    title={isPlaying ? "Stop speaking" : "Speak suggestion"}
                  >
                    {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">Analyzing with resume data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!showSetupForm && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Text Input */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a complex interview question..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={sendTextMessage}
              disabled={!inputText.trim() || isProcessing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Voice Input Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`p-4 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </div>
          
          {isRecording && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Speak your question... Click the microphone again to stop
            </p>
          )}
        </div>
      )}
    </div>
  );
} 