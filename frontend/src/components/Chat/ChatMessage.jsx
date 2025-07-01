import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-prose rounded-lg px-4 py-2 text-sm shadow-md ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <MarkdownRenderer>{content}</MarkdownRenderer>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
