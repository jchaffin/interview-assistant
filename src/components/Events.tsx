"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/contexts/EventContext";

export interface EventsProps {
  isExpanded: boolean;
}

function Events({ isExpanded }: EventsProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<any[]>([]);
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { eventLogs } = useEvent();

  const getDirectionArrow = (source: string) => {
    if (source === "client") return { symbol: "▲", color: "#7f5af0" };
    if (source === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  useEffect(() => {
    const hasNewEvent = eventLogs.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(eventLogs);
  }, [eventLogs, isExpanded, prevEventLogs.length]);

  return (
    <div
      className={
        (isExpanded ? "h-1/3 overflow-auto" : "h-0 overflow-hidden opacity-0") +
        " transition-all rounded-xl duration-200 ease-in-out flex-col bg-white absolute bottom-16 left-0 right-0 z-20"
      }
      ref={eventLogsContainerRef}
    >
      {isExpanded && (
        <div>
          <div className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
            <span className="font-semibold">Technical Logs</span>
          </div>
          <div>
            {eventLogs.map((log, idx) => {
              const arrowInfo = getDirectionArrow(log.source);
              const isError = log.type.toLowerCase().includes("error");

              return (
                <div
                  key={`${log.id}-${idx}`}
                  className="border-t border-gray-200 py-2 px-6 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span
                        style={{ color: arrowInfo.color }}
                        className="ml-1 mr-2"
                      >
                      {arrowInfo.symbol}
                      </span>
                      <span
                        className={
                          "flex-1 text-sm " +
                          (isError ? "text-red-600" : "text-gray-800")
                        }
                      >
                        {log.type}
                      </span>
                    </div>
                    <div className="text-gray-500 ml-1 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {log.data && Object.keys(log.data).length > 0 && (
                    <div className="text-gray-800 text-left">
                      <pre className="border-l-2 ml-1 border-gray-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
