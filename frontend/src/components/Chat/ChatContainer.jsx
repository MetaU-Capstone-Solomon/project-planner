import React, { useRef, useEffect } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

const ChatContainer = ({ messages, loading, stage, sendMessage }) => {
  const bottomRef = useRef(null);

  const handleSendMessage = (message) => {
    if (!loading) {
      sendMessage(message);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white pb-2">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto mb-1 h-6 w-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-xs">Describe your project to get started</p>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => <ChatMessage key={idx} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-2">
        <ChatInput onSendMessage={handleSendMessage} disabled={loading || stage === 'initial'} />
      </div>
    </div>
  );
};

export default ChatContainer;
