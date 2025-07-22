import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { extractProjectInfo } from '@/utils/fileUtils';
import { API_ENDPOINTS } from '@/config/api';
import { MESSAGE_TYPES } from '@/constants/messageTypes';
import { CHAT_STAGES, MESSAGES } from '@/constants/messages';
import { buildRoadmapPrompt, validateProjectData } from '@/utils/promptBuilder';
import { ROADMAP_MODIFICATION_PROMPT } from '@/constants/prompts';
import { useAICache } from '@/services/aiCacheService';
import { STORAGE_KEYS } from '@/constants/cache';

// Hook for managing AI chat interactions and roadmap generation
const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState(CHAT_STAGES.INITIAL);
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Use cached AI response
  const { data: aiResponse, isLoading: aiLoading, error: aiError } = useAICache(currentPrompt);

  // Save messages to localStorage
  const saveMessages = useCallback((newMessages) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(newMessages));
  }, []);

  // Save stage to localStorage
  const saveStage = useCallback((newStage) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_STAGE, newStage);
  }, []);

  // Save project title to localStorage
  const saveProjectTitle = useCallback((title) => {
    localStorage.setItem(STORAGE_KEYS.PROJECT_TITLE, title);
  }, []);

  // Load saved chat data on mount
  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES) || '[]');
    const savedStage = localStorage.getItem(STORAGE_KEYS.CHAT_STAGE) || CHAT_STAGES.INITIAL;
    const savedTitle = localStorage.getItem(STORAGE_KEYS.PROJECT_TITLE) || '';

    if (savedMessages.length > 0) {
      setMessages(savedMessages);
      setStage(savedStage);
      setProjectTitle(savedTitle);
    }
  }, []);

  // Handle AI response when it's ready
  useEffect(() => {
    if (aiResponse && currentPrompt) {
      appendMessage({
        role: 'assistant',
        content: aiResponse,
        type:
          stage === CHAT_STAGES.AWAITING_CONFIRMATION
            ? MESSAGE_TYPES.ROADMAP
            : MESSAGE_TYPES.EXPLANATION,
      });
      setCurrentPrompt(''); // Clear the prompt to prevent re-triggering
    }
  }, [aiResponse, currentPrompt]);

  // Handle AI errors
  useEffect(() => {
    if (aiError && currentPrompt) {
      appendMessage({
        role: 'assistant',
        content: `${MESSAGES.ERROR.AI_GENERATION_FAILED} ${aiError.message}`,
        type: MESSAGE_TYPES.ERROR,
      });
      setCurrentPrompt(''); // Clear the prompt to prevent re-triggering
    }
  }, [aiError, currentPrompt]);

  // Update loading state based on AI loading
  useEffect(() => {
    setLoading(aiLoading);
  }, [aiLoading]);

  // Adds a new message to the chat history
  const appendMessage = useCallback(
    (msg) => {
      setMessages((prevMessages) => {
        const newMessages = [
          ...prevMessages,
          { ...msg, type: msg.type || MESSAGE_TYPES.EXPLANATION },
        ];
        saveMessages(newMessages);
        return newMessages;
      });
    },
    [saveMessages]
  );

  // Initiates chat with project details and file content
  const startChatWithDetails = useCallback(
    async ({
      title,
      description,
      timeline,
      experienceLevel,
      technologies,
      projectScope,
      processedFile,
    }) => {
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
        const finalTitle = extractedTitle || MESSAGES.ACTIONS.DEFAULT_TITLE;
        setProjectTitle(finalTitle);
        saveProjectTitle(finalTitle);

        // Start chat
        const userMessage = extractedTitle
          ? `Generating a roadmap for: ${extractedTitle}`
          : 'Generating a roadmap from uploaded document';
        appendMessage({
          role: 'user',
          content: userMessage,
          type: MESSAGE_TYPES.REQUEST,
        });

        // Build project data object
        const projectData = {
          title: extractedTitle,
          description: extractedDescription,
          timeline,
          experienceLevel,
          technologies,
          scope: projectScope,
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

        // Set the prompt to trigger cached AI call
        setCurrentPrompt(prompt);

        const newStage = CHAT_STAGES.AWAITING_CONFIRMATION;
        setStage(newStage);
        saveStage(newStage);
      } catch (error) {
        console.error('AI generate error', error);
        appendMessage({
          role: 'assistant',
          content: `${MESSAGES.ERROR.AI_GENERATION_FAILED} ${error.message}`,
          type: MESSAGE_TYPES.ERROR,
        });
        setLoading(false);
      }
    },
    [appendMessage, saveProjectTitle, saveStage]
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
        type: MESSAGE_TYPES.REQUEST,
      });
      setLoading(true);

      try {
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

              const newStage = CHAT_STAGES.DONE;
              setStage(newStage);
              saveStage(newStage);
              setLoading(false);
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

        // Set the prompt to trigger cached AI call
        setCurrentPrompt(prompt);
      } catch (err) {
        console.error('AI generate error', err);
        appendMessage({
          role: 'assistant',
          content: `${MESSAGES.ERROR.AI_GENERATION_FAILED} ${err.message}`,
          type: MESSAGE_TYPES.ERROR,
        });
        setLoading(false);
      }
    },
    [stage, appendMessage, messages, projectTitle, saveStage]
  );

  // Utility function to find roadmap message - get the latest one
  const findRoadmapMessage = useCallback(() => {
    // Find the last roadmap message (most recent modification)
    const roadmapMessages = messages.filter(
      (m) => m.role === 'assistant' && m.type === MESSAGE_TYPES.ROADMAP
    );
    return roadmapMessages.length > 0 ? roadmapMessages[roadmapMessages.length - 1] : null;
  }, [messages]);

  // Reset chat state to initial values
  const resetChat = useCallback(() => {
    setMessages([]);
    setStage(CHAT_STAGES.INITIAL);
    setLoading(false);
    setProjectTitle('');
    setCurrentPrompt('');
  }, []);

  return {
    messages,
    loading,
    stage,
    sendMessage,
    startChatWithDetails,
    findRoadmapMessage,
    resetChat,
    MESSAGE_TYPES,
  };
};

export default useChat;
