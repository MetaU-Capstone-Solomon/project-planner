import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState('initial');
  const [loading, setLoading] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  const appendMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const generateAiResponse = useCallback(async (prompt) => {
    const response = await fetch('http://localhost:3001/api/chat', {
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

  const startChatWithDetails = useCallback(
    async ({ title, description }) => {
      setProjectTitle(title);
      setLoading(true);
      appendMessage({ role: 'user', content: `Generating a roadmap for: **${title}**` });

      try {
        const prompt = `You are ProPlan, an expert AI project manager that helps students create detailed project roadmaps.

Project Title: "${title}"

Project Description:
"""
${description}
"""

Based on all the information provided, provide a concise summary of the project (no more than 120 words) followed by a high-level draft roadmap of up to 8 numbered steps. End with the question: "Does this look correct? Reply 'yes' to generate the full roadmap or tell me what to change."`;

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
            prompt = `${history}\n\nUser: yes\n\nThe user has confirmed the draft. Provide the full detailed roadmap as markdown bullet list with sub-tasks, estimated durations and milestones.`;
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