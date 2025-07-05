import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { extractProjectInfo } from '@/utils/fileUtils';
import { API_ENDPOINTS } from '@/config/api';
import { MESSAGE_TYPES } from '@/constants/messageTypes';
import { CHAT_STAGES, MESSAGES } from '@/constants/messages';
import { buildRoadmapPrompt, validateProjectData } from '@/utils/promptBuilder';
import { ROADMAP_MODIFICATION_PROMPT } from '@/constants/prompts';

// Hook for managing AI chat interactions and roadmap generation
const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState(CHAT_STAGES.INITIAL);
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  // Adds a new message to the chat history
  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, type: msg.type || MESSAGE_TYPES.EXPLANATION }]);
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
      throw new Error(err.error || MESSAGES.ERROR.BACKEND_API_FAILED);
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
        setProjectTitle(extractedTitle || MESSAGES.ACTIONS.DEFAULT_TITLE);

        // Start chat
        const userMessage = extractedTitle
          ? `Generating a roadmap for: ${extractedTitle}`
          : 'Generating a roadmap from uploaded document';
        appendMessage({ 
          role: 'user', 
          content: userMessage, 
          type: MESSAGE_TYPES.REQUEST 
        });

        // Build project data object
        const projectData = {
          title: extractedTitle,
          description: extractedDescription,
          timeline,
          experienceLevel,
          technologies,
          scope: projectScope
        };

        // Validate project data
        const validation = validateProjectData(projectData);
        if (!validation.isValid) {
          throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
        }

        // Build comprehensive prompt using the prompt builder
        let prompt = buildRoadmapPrompt(projectData);

        // Add file content if available
        if (fileContent) {
          prompt += `\n\nAdditional Document Content (${fileContent.length} characters):\n"""\n${fileContent}\n"""`;

          if (isSummarized) {
            prompt += `\n\nNote: Document was intelligently summarized to ${fileContent.length} characters to preserve important information.`;
          }
        }

        const aiResponse = await generateAiResponse(prompt);
        appendMessage({ 
          role: 'assistant', 
          content: aiResponse, 
          type: MESSAGE_TYPES.ROADMAP 
        });
        setStage(CHAT_STAGES.AWAITING_CONFIRMATION);
      } catch (error) {
        console.error('AI generate error', error);
        appendMessage({ 
          role: 'assistant', 
          content: `${MESSAGES.ERROR.AI_GENERATION_FAILED} ${error.message}`, 
          type: MESSAGE_TYPES.ERROR 
        });
      } finally {
        setLoading(false);
      }
    },
    [appendMessage, generateAiResponse]
  );

  // Handles user messages and generates AI responses
  const sendMessage = useCallback(
    async (content) => {
      if (stage === CHAT_STAGES.INITIAL) {
        return;
      }

      appendMessage({ 
        role: 'user', 
        content, 
        type: MESSAGE_TYPES.REQUEST 
      });
      setLoading(true);

      try {
        const history = messages
          .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
          .join('\n');

        let prompt = '';
        let responseType = MESSAGE_TYPES.EXPLANATION;

        if (stage === CHAT_STAGES.AWAITING_CONFIRMATION) {
          const userResponse = content.trim().toLowerCase();
          if (userResponse === 'yes' || userResponse === 'y') {
            // User confirmed - save the roadmap
            const roadmapMessage = findRoadmapMessage();
            if (roadmapMessage) {
              const { error } = await supabase
                .from('roadmap')
                .insert([{ content: roadmapMessage.content, title: projectTitle }]);

              if (error) {
                console.error('Supabase insert error', error);
                throw new Error(`${MESSAGES.ERROR.SUPABASE_INSERT_FAILED} ${error.message}`);
              }

              setStage(CHAT_STAGES.DONE);
              return; // Don't generate new AI response
            }
          } else {
            // User wants modifications - only include the current roadmap, not full history
            const roadmapMessage = findRoadmapMessage();
            const currentRoadmap = roadmapMessage ? roadmapMessage.content : '';
            
            prompt = `Current Roadmap:\n${currentRoadmap}\n\n${ROADMAP_MODIFICATION_PROMPT.replace('[USER_MESSAGE]', content)}`;
            
            responseType = MESSAGE_TYPES.ROADMAP; // Always ROADMAP type for roadmap responses
          }
        } else {
          prompt = content;
          responseType = MESSAGE_TYPES.EXPLANATION;
        }

        const aiText = await generateAiResponse(prompt);
        appendMessage({ 
          role: 'assistant', 
          content: aiText, 
          type: responseType 
        });
      } catch (err) {
        console.error('AI generate error', err);
        appendMessage({ 
          role: 'assistant', 
          content: `${MESSAGES.ERROR.AI_GENERATION_FAILED} ${err.message}`, 
          type: MESSAGE_TYPES.ERROR 
        });
      } finally {
        setLoading(false);
      }
    },
    [stage, appendMessage, generateAiResponse, messages, projectTitle]
  );

  // Utility function to find roadmap message
  const findRoadmapMessage = useCallback(() => {
    return messages.find(m => m.role === 'assistant' && m.type === MESSAGE_TYPES.ROADMAP);
  }, [messages]);

  return { 
    messages, 
    loading, 
    stage, 
    sendMessage, 
    startChatWithDetails,
    findRoadmapMessage,
    MESSAGE_TYPES
  };
};

export default useChat;
