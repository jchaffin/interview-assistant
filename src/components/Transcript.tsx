"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranscript } from "@/contexts/TranscriptContext";
import { DownloadIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";
import { GuardrailChip } from "./GuardrailChip";

export interface TranscriptProps {
  downloadRecording: () => void;
}

function Transcript({
  downloadRecording,
}: TranscriptProps) {
  const { messages, breadcrumbs } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevMessages, setPrevMessages] = useState<any[]>([]);
  const [justCopied, setJustCopied] = useState(false);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = messages.length > prevMessages.length;
    const hasUpdatedMessage = messages.some((newItem, index) => {
      const oldItem = prevMessages[index];
      return (
        oldItem &&
        (newItem.content !== oldItem.content)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevMessages(messages);
  }, [messages, prevMessages.length]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white min-h-0 rounded-xl">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-6 py-3 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
          <span className="font-semibold">Transcript</span>
          <div className="flex gap-x-2">
            <button
              onClick={handleCopyTranscript}
              className="w-10 h-10 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer"
              title={justCopied ? "Copied!" : "Copy transcript"}
            >
              <ClipboardCopyIcon />
            </button>
            <button
              onClick={downloadRecording}
              className="w-10 h-10 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer"
              title="Download audio"
            >
              <DownloadIcon />
            </button>
          </div>
        </div>

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className="overflow-auto p-4 flex flex-col gap-y-4 h-full"
        >
          {/* Render breadcrumbs first */}
          {breadcrumbs.map((breadcrumb) => (
            <div
              key={breadcrumb.id}
              className="flex flex-col justify-start items-start text-gray-500 text-sm"
            >
              <span className="text-xs font-mono">
                {new Date(breadcrumb.timestamp).toLocaleTimeString()}
              </span>
              <div className="whitespace-pre-wrap flex items-center font-mono text-sm text-gray-800">
                {breadcrumb.text}
              </div>
              {breadcrumb.agent && (
                <div className="text-gray-800 text-left">
                  <pre className="border-l-2 ml-1 border-gray-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                    {JSON.stringify(breadcrumb.agent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {/* Render messages */}
          {messages.map((message) => {
            const isUser = message.role === "user";
            const containerClasses = `flex justify-end flex-col ${
              isUser ? "items-end" : "items-start"
            }`;
            const bubbleBase = `max-w-lg p-3 ${
              isUser ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-black"
            }`;
            const isBracketedMessage =
              message.content.startsWith("[") && message.content.endsWith("]");
            const messageStyle = isBracketedMessage
              ? 'italic text-gray-400'
              : '';
            const displayContent = isBracketedMessage
              ? message.content.slice(1, -1)
              : message.content;

            return (
              <div key={message.id} className={containerClasses}>
                <div className="max-w-lg">
                  <div className={`${bubbleBase} rounded-xl`}>
                    <div
                      className={`text-xs ${
                        isUser ? "text-gray-400" : "text-gray-500"
                      } font-mono`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <div className={`whitespace-pre-wrap ${messageStyle}`}>
                      <ReactMarkdown>{displayContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Transcript;
