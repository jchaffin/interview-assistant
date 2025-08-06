"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useEvent } from "@/contexts/EventContext";
import { LoggedEvent } from "@/types";

export interface InterviewCoachingProps {
  isExpanded: boolean;
}

function InterviewCoaching({ isExpanded }: InterviewCoachingProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<LoggedEvent[]>([]);
  const coachingContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents, toggleExpand } = useEvent();

  // Filter for coaching-related events
  const coachingEvents = useMemo(() => 
    loggedEvents.filter(event => 
      event.eventName.toLowerCase().includes('coaching') ||
      event.eventName.toLowerCase().includes('recommendation') ||
      event.eventName.toLowerCase().includes('suggestion') ||
      event.eventName.toLowerCase().includes('response')
    ), [loggedEvents]
  );

  useEffect(() => {
    const hasNewEvent = coachingEvents.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && coachingContainerRef.current) {
      coachingContainerRef.current.scrollTop =
        coachingContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(coachingEvents);
  }, [coachingEvents, isExpanded]);

  return (
    <div
      className={
        (isExpanded ? "w-1/2 overflow-auto" : "w-0 overflow-hidden opacity-0") +
        " transition-all rounded-xl duration-200 ease-in-out flex-col bg-white"
      }
      ref={coachingContainerRef}
    >
      {isExpanded && (
        <div>
          <div className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
            <span className="font-semibold">Interview Coaching</span>
            <span className="text-sm text-gray-500">Recommended Responses</span>
          </div>
          <div>
            {coachingEvents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No coaching recommendations yet.</p>
                <p className="text-xs mt-1">Start an interview to receive real-time coaching suggestions.</p>
              </div>
            ) : (
              coachingEvents.map((log, idx) => {
                const isError = log.eventName.toLowerCase().includes("error");

                return (
                  <div
                    key={`${log.id}-${idx}`}
                    className="border-t border-gray-200 py-3 px-6"
                  >
                    <div
                      onClick={() => toggleExpand(log.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-blue-500 mr-2">💡</span>
                        <span
                          className={
                            "flex-1 text-sm " +
                            (isError ? "text-red-600" : "text-gray-800")
                          }
                        >
                          {log.eventName}
                        </span>
                      </div>
                      <div className="text-gray-500 ml-1 text-xs whitespace-nowrap">
                        {log.timestamp}
                      </div>
                    </div>

                    {log.expanded && log.eventData && (
                      <div className="text-gray-800 text-left mt-2">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
                          <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                            {JSON.stringify(log.eventData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewCoaching; 