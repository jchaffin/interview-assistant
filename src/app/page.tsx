'use client';

import { useState, useRef } from 'react';
import InterviewerAgent from '@/components/InterviewerAgent';
import ChatBot from '@/components/ChatBot';

export default function Home() {
  // State for the current interview question
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  // State for the ChatBot's suggestion
  const [chatBotSuggestion, setChatBotSuggestion] = useState<string | null>(null);
  // State for the InterviewerAgent's conversation
  const [interviewerMessages, setInterviewerMessages] = useState<string[]>([]);
  // State for candidate information
  const [candidateInfo, setCandidateInfo] = useState<string>('');

  // Called by InterviewerAgent when a new question is generated
  const handleNewQuestion = (question: string) => {
    console.log('Main page: Received new question:', question);
    // Only set the question if it's from ChatBot transcription, not from InterviewerAgent generation
    if (question.length > 50) { // Likely a transcribed question
      setCurrentQuestion(question);
    }
    setChatBotSuggestion(null); // Reset suggestion until ChatBot generates it
  };

  // Called by InterviewerAgent when it starts speaking
  const handleInterviewerStartsSpeaking = () => {
    console.log('Main page: InterviewerAgent is starting to speak');
    // This will trigger the ChatBot to start listening
    setCurrentQuestion('INTERVIEWER_SPEAKING');
  };

  // Called by InterviewerAgent when it finishes speaking
  const handleInterviewerFinishesSpeaking = () => {
    console.log('Main page: InterviewerAgent finished speaking');
    // This will trigger the ChatBot to stop listening
    setCurrentQuestion('INTERVIEWER_FINISHED_SPEAKING');
  };

  // Called by InterviewerAgent when user response is transcribed
  const handleTranscribedResponse = (transcribedText: string) => {
    setCurrentQuestion(transcribedText); // Use transcribed text as the "question" for ChatBot
    setChatBotSuggestion(null); // Reset suggestion until ChatBot generates it
  };

  // Called by InterviewerAgent when candidate info is provided
  const handleCandidateInfo = (info: string) => {
    setCandidateInfo(info);
  };

  // Called by ChatBot when a suggestion is ready
  const handleSuggestion = (suggestion: string) => {
    setChatBotSuggestion(suggestion);
  };

  // Called when the user's system audio is transcribed
  const handleUserResponse = (transcribedAnswer: string) => {
    setInterviewerMessages(prev => [...prev, transcribedAnswer]);
    // Don't clear the question here - let ChatBot generate suggestions based on the transcribed response
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex h-screen">
        {/* InterviewerAgent Column */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-800">
          <InterviewerAgent
            onNewQuestion={handleNewQuestion}
            onUserResponse={handleUserResponse}
            onTranscribedResponse={handleTranscribedResponse}
            onInterviewerStartsSpeaking={handleInterviewerStartsSpeaking}
            onInterviewerFinishesSpeaking={handleInterviewerFinishesSpeaking}
            userResponses={interviewerMessages}
          />
        </div>
        {/* ChatBot Suggestions Column */}
        <div className="w-1/2">
          <ChatBot
            question={currentQuestion}
            onSuggestion={handleSuggestion}
            suggestion={chatBotSuggestion}
            candidateInfo={candidateInfo}
            onCandidateInfo={handleCandidateInfo}
            onNewQuestion={handleNewQuestion}
          />
        </div>
      </div>
    </main>
  );
}
