import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MESSAGES } from '@/constants/messages';

/**
 * Reusable MarkdownRenderer component
 * 
 * Provides consistent markdown rendering across the application
 * Used in chat UI, project detail pages, and any other content display
 * 
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fallbackToPlain - Whether to fallback to plain text for non-markdown
 */
const MarkdownRenderer = ({ 
  content, 
  className = '', 
  fallbackToPlain = true 
}) => {
  // Simple markdown detection
  const hasMarkdown = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /^#+\s|^\*\s|^\d+\.\s|`.*`|\*\*.*\*\*|\[.*\]\(.*\)/.test(text);
  };

  // Default styling for markdown content
  const defaultClasses = 'prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded';
  
  if (!content) {
    return <p className="text-gray-500 italic">{MESSAGES.CONTENT.NO_CONTENT_AVAILABLE}</p>;
  }

  // Render markdown if detected, otherwise fallback to plain text
  if (hasMarkdown(content) || !fallbackToPlain) {
    return (
      <div className={`${defaultClasses} ${className}`}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={prism}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback to plain text with pre-formatted styling
  return (
    <pre className={`whitespace-pre-wrap font-sans text-gray-900 bg-gray-50 p-6 rounded-lg border ${className}`}>
      {content}
    </pre>
  );
};

export default MarkdownRenderer; 