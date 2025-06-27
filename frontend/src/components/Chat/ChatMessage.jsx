import React from 'react';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user';

  // markdown rendering for AI responses
  const renderMarkdown = (text) => {
    if (isUser) return text; // Don't render markdown

    return text
      .split('\n')
      .map((line) => {
        // Bold text
        if (line.includes('**')) {
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          return `<div class="ml-4">${line}</div>`;
        }

        // Bullet points
        if (line.trim().startsWith('- ')) {
          return `<div class="ml-4">• ${line.substring(2)}</div>`;
        }

        return line;
      })
      .join('\n');
  };

  const formattedContent = renderMarkdown(content);

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-prose whitespace-pre-wrap rounded-lg px-4 py-2 text-sm shadow-md ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
        }`}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );
};

export default ChatMessage;
