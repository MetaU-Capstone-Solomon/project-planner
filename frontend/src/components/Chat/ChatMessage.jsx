import React from 'react';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  // Don't render markdown for user messages
  if (isUser) {
    return (
      <div className="mb-4 flex justify-end">
        <div className="max-w-prose whitespace-pre-wrap rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-md">
          {content}
        </div>
      </div>
    );
  }

  // Display AI responses as plain text (including JSON)
  return (
    <div className="mb-4 flex justify-start">
      <div className="max-w-prose whitespace-pre-wrap rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-800 shadow-md">
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;
