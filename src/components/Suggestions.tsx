"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/contexts/EventContext";
import { useTranscript } from "@/contexts/TranscriptContext";
import { LoggedEvent } from "@/types";
import { interviewConfig } from "@/app/agentConfigs/interview/config";

export interface SuggestionsProps {
  isExpanded: boolean;
}

interface Suggestion {
  id: string;
  timestamp: string;
  suggestion: string;
  context: string;
  urgency: string;
  type: string;
}

function Suggestions({ isExpanded }: SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const { loggedEvents } = useEvent();
  const { transcriptItems } = useTranscript();

  // Listen to agent's voice audio and generate answer suggestions for the candidate
  useEffect(() => {
    const processedQuestions = new Set<string>();
    let lastQuestionTime = 0;
    let suggestionTimeout: NodeJS.Timeout | null = null;
    let lastResponseId: string | null = null;
    
    // Generate interview answer using LLM
    const generateInterviewAnswer = async (question: string) => {
      try {
        const response = await fetch('/api/generate-suggestion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: question,
            context: `Generate a brief, 1-2 sentence answer for this interview question. Use the candidate's background: ${interviewConfig.candidate.experience.map(exp => `${exp.role} at ${exp.company}`).join(', ')}. Keep it short and specific.`
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.answer || 'I would provide a thoughtful response based on my experience and the specific question asked.';
        }
      } catch (error) {
        console.error('Error generating interview answer:', error);
      }
      
      // Fallback response if API fails
      return 'I have relevant experience in this area and would provide a specific example.';
    };
    
    // Listen to agent voice audio events
    loggedEvents.forEach((event) => {
      // Skip if we've already processed this event
      if (processedEventsRef.current.has(String(event.id))) {
        return;
      }
      
      console.log('Processing new event:', event.eventName, event.direction, event.eventData);
      
      // Look for agent response completion events - only after voice is done
      if (event.direction === 'server' && 
          event.eventName.includes('response.done') &&
          event.eventData.response && 
          event.eventData.response.id) {
        
        const responseId = event.eventData.response.id;
        
        // Only process if this is a new response (not a duplicate)
        if (responseId === lastResponseId) {
          processedEventsRef.current.add(String(event.id));
          return;
        }
        
        lastResponseId = responseId;
        processedEventsRef.current.add(String(event.id));
        console.log('Found agent response completion event:', responseId);
        
        // Wait a bit longer to ensure the transcript is fully updated
        setTimeout(() => {
          // Find the most recent assistant message that's completed
          const correspondingTranscriptItem = transcriptItems
            .filter(item => item.role === 'assistant' && item.status === 'DONE' && item.type === 'MESSAGE')
            .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
          
          console.log('Found corresponding transcript item:', correspondingTranscriptItem);
          
          if (correspondingTranscriptItem && 
              correspondingTranscriptItem.title && 
              !processedQuestions.has(correspondingTranscriptItem.title)) {
            
            const agentVoiceText = correspondingTranscriptItem.title.trim();
            console.log('Found agent voice text:', agentVoiceText);
            
            // Only generate suggestions for actual questions (more strict filtering)
            const isQuestion = agentVoiceText.includes('?') || 
                             agentVoiceText.toLowerCase().startsWith('tell me') ||
                             agentVoiceText.toLowerCase().startsWith('describe') ||
                             agentVoiceText.toLowerCase().startsWith('explain') ||
                             agentVoiceText.toLowerCase().startsWith('what') ||
                             agentVoiceText.toLowerCase().startsWith('how') ||
                             agentVoiceText.toLowerCase().startsWith('why') ||
                             agentVoiceText.toLowerCase().startsWith('can you') ||
                             agentVoiceText.toLowerCase().startsWith('could you');
            
            if (agentVoiceText.length > 10 && isQuestion) {
              
              // Only generate if we haven't processed this question recently
              const currentTime = Date.now();
              if (currentTime - lastQuestionTime > 20000) { // Wait 20 seconds between suggestions
                console.log('Agent finished asking a question:', agentVoiceText);
                processedQuestions.add(agentVoiceText);
                lastQuestionTime = currentTime;
                
                // Clear any existing timeout
                if (suggestionTimeout) {
                  clearTimeout(suggestionTimeout);
                }
                
                // Add additional delay before generating suggestion to ensure agent is done speaking
                suggestionTimeout = setTimeout(() => {
                  // Generate interview answer suggestion for the candidate
                  generateInterviewAnswer(agentVoiceText).then(interviewAnswer => {
                    console.log('Generated answer:', interviewAnswer);
                    const suggestion: Suggestion = {
                      id: `suggestion-${responseId}-${Date.now()}`,
                      timestamp: event.timestamp,
                      suggestion: interviewAnswer,
                      context: `Suggested answer for: "${agentVoiceText}"`,
                      urgency: 'normal',
                      type: 'interview-answer'
                    };
                    
                    setSuggestions(prev => [...prev, suggestion]);
                  });
                }, 5000); // 5-second delay after agent finishes speaking
              } else {
                console.log('Skipping suggestion - too soon since last one:', currentTime - lastQuestionTime, 'ms ago');
              }
            } else {
              console.log('Skipping - not a question or too short:', agentVoiceText);
            }
          } else {
            console.log('Skipping - already processed or no transcript item');
          }
        }, 2000); // 2-second delay to ensure transcript is updated
      } else {
        // Mark non-response events as processed to avoid reprocessing
        processedEventsRef.current.add(String(event.id));
      }
    });
    
    // Cleanup timeout on unmount
    return () => {
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }
    };
  }, [loggedEvents, transcriptItems]);

  useEffect(() => {
    if (isExpanded && suggestionsContainerRef.current) {
      suggestionsContainerRef.current.scrollTop =
        suggestionsContainerRef.current.scrollHeight;
    }
  }, [suggestions, isExpanded]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      default:
        return '💡';
    }
  };

  return (
    <div
      className={
        (isExpanded ? "w-1/2 overflow-auto" : "w-0 overflow-hidden opacity-0") +
        " transition-all rounded-xl duration-200 ease-in-out flex-col bg-white"
      }
      ref={suggestionsContainerRef}
    >
      {isExpanded && (
        <div>
          <div className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
            <span className="font-semibold">Interview Answers</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{suggestions.length} answers</span>
            </div>
          </div>
          <div>
            {suggestions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-2xl mb-2">💡</div>
                <div className="text-sm">No coaching tips yet</div>
                <div className="text-xs mt-1">Start an interview to see helpful suggestions</div>
              </div>
            ) : (
              suggestions.map((suggestion, idx) => (
                <div
                  key={`${suggestion.id}-${idx}`}
                  className="border-t border-gray-200 py-3 px-6"
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-lg ${getUrgencyColor(suggestion.urgency).split(' ')[0]}`}>
                      {getUrgencyIcon(suggestion.urgency)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full border ${getUrgencyColor(suggestion.urgency)}`}>
                          {suggestion.urgency === 'high' ? 'URGENT' : 
                           suggestion.urgency === 'medium' ? 'Important' : 'Answer'}
                        </span>
                        <div className="text-gray-500 text-xs">
                          {suggestion.timestamp}
                        </div>
                      </div>
                      
                      <div className="text-gray-800 text-sm mb-2 leading-relaxed">
                        {suggestion.suggestion}
                      </div>
                      
                      {suggestion.context && (
                        <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                          <strong>Context:</strong> {suggestion.context}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Suggestions; 