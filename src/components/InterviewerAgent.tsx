'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createInterviewerAgentConfig } from '@/lib/agentConfigs';
import { sessionManager } from '@/lib/session';
import { guardrails } from '@/lib/guardrails';
import { ResumeData } from '@/app/agentConfigs/chatSupervisor/interviewerSupervisor';
import { Mic, MicOff, Settings, Volume2, VolumeX, Brain, FileText } from 'lucide-react';
import Transcript from './Transcript';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

interface InterviewerAgentProps {
  className?: string;
  candidateInfo?: string;
  resumeData?: ResumeData;
  onSessionCreated?: (sessionId: string) => void;
  onInterviewComplete?: (sessionId: string) => void;
}

export default function InterviewerAgent({
  className = '',
  candidateInfo = '',
  resumeData,
  onSessionCreated,
  onInterviewComplete
}: InterviewerAgentProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>('21m00Tcm4TlvDq8ikWAM'); // Rachel voice
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [interviewMode, setInterviewMode] = useState<'conversational' | 'technical' | 'behavioral'>('conversational');
  const [sessionId, setSessionId] = useState<string>('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [userText, setUserText] = useState<string>('');

  // Load available voices
  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/elevenlabs');
      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.voices || []);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const createSession = useCallback(async () => {
    if (!candidateInfo.trim()) {
      alert('Please provide candidate information to start the interview');
      return;
    }

    try {
      const session = sessionManager.createSession(candidateInfo, {
        interviewMode,
        voiceId: selectedVoice,
        resumeData
      });
      
      setSessionId(session.id);
      onSessionCreated?.(session.id);
      setIsInterviewStarted(true);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create interview session');
    }
  }, [candidateInfo, interviewMode, selectedVoice, resumeData, onSessionCreated]);

  const startInterview = useCallback(async () => {
    if (!sessionId) {
      await createSession();
      return;
    }

    // Start the interview with resume-enhanced context
    const enhancedPrompt = resumeData 
      ? `Start the interview. I have access to the candidate's resume with ${resumeData.experience.length} years of experience in ${resumeData.skills.slice(0, 3).join(', ')}. Use this information to ask relevant questions.`
      : 'Start the interview';
    
    console.log('Starting interview with prompt:', enhancedPrompt);
    setIsInterviewStarted(true);
  }, [sessionId, interviewMode, selectedVoice, candidateInfo, resumeData, createSession]);

  const handleSendTextMessage = () => {
    if (!userText.trim() || !isInterviewStarted) return;
    
    // Add user message to session
    if (sessionId) {
      sessionManager.addMessage(sessionId, {
        role: 'user',
        content: userText.trim()
      });
    }
    
    setUserText("");
  };

  const completeInterview = useCallback(() => {
    if (sessionId) {
      sessionManager.completeSession(sessionId);
      onInterviewComplete?.(sessionId);
      setIsInterviewStarted(false);
    }
  }, [sessionId, onInterviewComplete]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold text-center">AI Interviewer</h1>
        <p className="text-center text-blue-100 mt-1">Realtime Interview Experience • Professional Voice</p>
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
          
          <div className="flex items-center gap-2">
            {!isInterviewStarted ? (
              <button
                onClick={startInterview}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Start Interview
              </button>
            ) : (
              <button
                onClick={completeInterview}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                End Interview
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Component */}
      <div className="flex-1 overflow-hidden">
        <Transcript
          userText={userText}
          setUserText={setUserText}
          onSendMessage={handleSendTextMessage}
          canSend={isInterviewStarted && userText.trim().length > 0}
          downloadRecording={() => {
            // TODO: Implement download functionality
            console.log('Download recording');
          }}
        />
      </div>
    </div>
  );
} 