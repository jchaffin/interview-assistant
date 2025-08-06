"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useEvent } from "@/contexts/EventContext";
import { useTranscript } from "@/contexts/TranscriptContext";

export interface SuggestionsProps {
  isExpanded: boolean;
}

function Suggestions({ isExpanded }: SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  const processedEventsRef = useRef<Set<number>>(new Set());
  const { loggedEvents } = useEvent();
  const { transcriptItems } = useTranscript();

  // Listen to agent's voice audio and generate answer suggestions for the candidate
  const generateSuggestions = useCallback(async (context: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          candidateInfo: "Professional candidate in an interview setting",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process new events to generate suggestions
  useEffect(() => {
    const newEvents = loggedEvents.filter(event => !processedEventsRef.current.has(event.id));
    
    newEvents.forEach(event => {
      processedEventsRef.current.add(event.id);
      
      // Generate suggestions based on certain event types
      if (event.eventName.includes('response') || event.eventName.includes('message')) {
        const messageItems = transcriptItems.filter(item => item.type === 'MESSAGE');
        const context = `Recent conversation: ${messageItems.slice(-3).map(m => `${m.role}: ${m.title}`).join(' | ')}`;
        generateSuggestions(context);
      }
    });
  }, [loggedEvents, transcriptItems, generateSuggestions]);

  // Auto-scroll to bottom when new suggestions arrive
  useEffect(() => {
    if (isExpanded && suggestionsContainerRef.current) {
      suggestionsContainerRef.current.scrollTop = suggestionsContainerRef.current.scrollHeight;
    }
  }, [suggestions, isExpanded]);

  return (
    <div
      className={
        (isExpanded ? "w-full md:w-1/2 overflow-auto" : "w-0 overflow-hidden opacity-0") +
        " transition-all rounded-xl duration-200 ease-in-out flex-col bg-white"
      }
      ref={suggestionsContainerRef}
    >
      {isExpanded && (
        <div>
          <div className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
            <span className="font-semibold">Smart Suggestions</span>
            <span className="text-sm text-gray-500">AI-Powered Responses</span>
          </div>
          <div>
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Generating suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No suggestions yet.</p>
                <p className="text-xs mt-1">Start the conversation to receive AI-powered response suggestions.</p>
              </div>
            ) : (
              suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="border-t border-gray-200 py-3 px-6"
                >
                  <div className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {suggestion}
                      </p>
                      <button
                        onClick={() => {
                          // Copy suggestion to clipboard
                          navigator.clipboard.writeText(suggestion);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Copy to clipboard
                      </button>
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