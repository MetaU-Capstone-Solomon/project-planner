import React from 'react';
import { formatAIResponse } from '@/utils/chatFormatter';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  // Don't render markdown for user messages
  if (isUser) {
    return (
      <div className="mb-4 flex justify-end">
        <div className="max-w-prose whitespace-pre-wrap rounded-lg bg-indigo-600 px-4 py-2 text-left text-sm text-white shadow-md">
          {content}
        </div>
      </div>
    );
  }

  // Display AI responses with JSON formatting for better readability
  const formattedContent = formatAIResponse(content);

  return (
    <div className="mb-4 flex justify-start">
      <div
        className="max-w-prose whitespace-pre-wrap rounded-lg bg-gray-100 px-4 py-3 text-left font-mono text-sm leading-relaxed text-gray-800 shadow-md"
        style={{
          textIndent: '-2ch',
          paddingLeft: '2ch',
        }}
      >
        {formattedContent}
      </div>
    </div>
  );
};

export default ChatMessage;
