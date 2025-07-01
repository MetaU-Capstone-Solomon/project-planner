import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { extractProjectInfo } from '@/utils/fileUtils';
import { API_ENDPOINTS } from '@/config/api';

// Hook for managing AI chat interactions and roadmap generation
const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState('initial');
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  // Adds a new message to the chat history
  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Fetches AI response from the backend
  const generateAiResponse = useCallback(async (prompt) => {
    const response = await fetch(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch from backend API');
    }

    const data = await response.json();
    return data.content;
  }, []);

  // Initiates chat with project details and file content
  const startChatWithDetails = useCallback(
    async ({ title, description, timeline, experienceLevel, technologies, projectScope, processedFile }) => {
      setLoading(true);

      try {
        let extractedTitle = title;
        let extractedDescription = description;
        let fileContent = '';
        let isSummarized = false;

        if (processedFile) {
          fileContent = processedFile.processedText;
          isSummarized = processedFile.isSummarized;

          // no title/description provided, extract from file
          if (!title && !description) {
            const extracted = extractProjectInfo(
              processedFile.originalText,
              processedFile.fileName
            );
            extractedTitle = extracted.title;
            extractedDescription = extracted.description;
          }
        }

        // Set project title
        setProjectTitle(extractedTitle || 'Untitled Project');

        // Start chat
        const userMessage = extractedTitle
          ? `Generating a roadmap for: **${extractedTitle}**`
          : 'Generating a roadmap from uploaded document';
        appendMessage({ role: 'user', content: userMessage });

        // Build prompt
        let prompt = `You are ProPlan, an expert AI technical project manager that helps developers create detailed project roadmaps.`;

        if (extractedTitle) {
          prompt += `\n\nProject Title: "${extractedTitle}"`;
        }

        if (extractedDescription) {
          prompt += `\n\nProject Description:\n"""\n${extractedDescription}\n"""`;
        }

        // Add new project context
        if (timeline) {
          prompt += `\n\nTimeline: ${timeline}`;
        }

        if (experienceLevel) {
          prompt += `\n\nExperience Level: ${experienceLevel}`;
        }

        if (technologies) {
          prompt += `\n\nTechnologies/Frameworks: ${technologies}`;
        }

        if (projectScope) {
          prompt += `\n\nProject Scope: ${projectScope}`;
        }

        if (fileContent) {
          prompt += `\n\nDocument content (${fileContent.length} characters):\n"""\n${fileContent}\n"""`;

          if (isSummarized) {
            prompt += `\n\nNote: Document was intelligently summarized to ${fileContent.length} characters to preserve important information.`;
          }
        }

        prompt += `\n\nBased on all the information provided, provide a concise summary of the project (no more than 120 words) followed by a high-level draft roadmap of up to 8 numbered steps. Use proper markdown formatting with **bold** for emphasis, bullet points for lists, and clear structure. End with the question: "Does this look correct? Reply 'yes' to generate the full roadmap or tell me what to change."`;

        const aiResponse = await generateAiResponse(prompt);
        appendMessage({ role: 'assistant', content: aiResponse });
        setStage('awaiting_confirmation');
      } catch (error) {
        console.error('AI generate error', error);
        appendMessage({ role: 'assistant', content: `An error occurred: ${error.message}` });
      } finally {
        setLoading(false);
      }
    },
    [appendMessage, generateAiResponse]
  );

  // Handles user messages and generates AI responses
  const sendMessage = useCallback(
    async (content) => {
      if (stage === 'initial') {
        return;
      }

      appendMessage({ role: 'user', content });
      setLoading(true);

      try {
        const history = messages
          .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
          .join('\n');

        let prompt = '';
        if (stage === 'awaiting_confirmation') {
          if (content.trim().toLowerCase().startsWith('yes')) {
            prompt = `${history}\n\nUser: yes\n\nThe user has confirmed the draft. Provide the full detailed roadmap using proper markdown formatting with headers, bullet points, sub-tasks, estimated durations, and milestones. Use **bold** for emphasis and structure it clearly with sections.`;
          } else {
            prompt = `${history}\n\nUser: ${content}\n\nThe user provided feedback. Revise the summary and draft roadmap accordingly and again end with the confirmation question.`;
          }
        } else {
          prompt = content;
        }

        const aiText = await generateAiResponse(prompt);
        appendMessage({ role: 'assistant', content: aiText });

        if (stage === 'awaiting_confirmation' && content.trim().toLowerCase().startsWith('yes')) {
          const { error } = await supabase
            .from('roadmap')
            .insert([{ content: aiText, title: projectTitle }]);

          if (error) {
            console.error('Supabase insert error', error);
            throw new Error(`Failed to save roadmap: ${error.message}`);
          }

          setStage('done');
        }
      } catch (err) {
        console.error('AI generate error', err);
        appendMessage({ role: 'assistant', content: `An error occurred: ${err.message}` });
      } finally {
        setLoading(false);
      }
    },
    [stage, appendMessage, generateAiResponse, messages, projectTitle]
  );

  return { messages, loading, stage, sendMessage, startChatWithDetails };
};

export default useChat;
