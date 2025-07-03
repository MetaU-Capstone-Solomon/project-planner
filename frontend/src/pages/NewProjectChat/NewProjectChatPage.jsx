/**
 * NewProjectChatPage - Project creation and AI chat interface
 * 
 * Current Implementation (PR #1):
 * - Basic project form with AI chat
 * - Save project functionality after roadmap generation
 * - Simple success message display
 * - Console logging for saved project details
 * 
 * Future Enhancements (Next PRs):
 * - Toast notifications for better UX
 * - Project detail page navigation
 * - Timeline visualization and progress tracking
 * - Enhanced error handling and retry mechanisms
 */

import React, { useState } from 'react';
import FormField from '@/components/Form/FormField';
import Input from '@/components/Form/Input';
import Textarea from '@/components/Form/Textarea';
import Select from '@/components/Form/Select';
import FileUpload from '@/components/Form/FileUpload';
import ChatContainer from '@/components/Chat/ChatContainer';
import Button from '@/components/Button/Button';
import useFileUpload from '@/hooks/useFileUpload';
import useChat from '@/hooks/useChat';
import { useProjectForm } from '@/hooks/useProjectForm';
import { saveProject } from '@/services/projectService';
import { 
  TIMELINE_OPTIONS, 
  EXPERIENCE_LEVEL_OPTIONS, 
  PROJECT_SCOPE_OPTIONS,
  FORM_FIELDS 
} from '@/constants/projectOptions';

const NewProjectChatPage = () => {
  const { file, processedFile, error, loading: fileLoading, handleFileSelect } = useFileUpload();
  const { messages, loading: chatLoading, stage, sendMessage, startChatWithDetails } = useChat();
  
  // Project saving state
  const [saving, setSaving] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState(null);
  
  // Custom hook for form logic and validation
  const { values, handleChange, handleGenerateRoadmap, canGenerate } = useProjectForm(
    startChatWithDetails, 
    chatLoading, 
    fileLoading
  );

  const onGenerateClick = () => {
    handleGenerateRoadmap(processedFile);
  };

  // Save project after AI generates roadmap
  const handleSaveProject = async () => {
    if (saving || savedProjectId) return;
    
    setSaving(true);
    try {
      // Find the last AI message (the generated roadmap)
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (!lastAssistantMessage) {
        throw new Error('No AI roadmap found to save.');
      }

      const result = await saveProject({
        title: values[FORM_FIELDS.TITLE] || 'Untitled Project',
        content: lastAssistantMessage.content,
      });

      if (result.success) {
        setSavedProjectId(result.projectId);
        console.log('Project saved successfully!', {
          projectId: result.projectId,
          title: values[FORM_FIELDS.TITLE] || 'Untitled Project',
          content: lastAssistantMessage.content.substring(0, 100) + '...', // First 100 chars
          savedAt: new Date().toISOString()
        });
      } else {
        throw new Error(result.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      // TODO: Add user-facing error handling with toast notifications (PR feedback: better UX)
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-gray-50 p-6">
      <div className="grid h-[calc(100vh-3rem)] grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project form section */}
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
            <p className="mt-1 text-sm text-gray-600">
              Fill in the details below or upload a document to get started
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {/* Required fields */}
            <FormField label="Project Title" isRequired={true}>
              <Input
                name={FORM_FIELDS.TITLE}
                placeholder="Enter your project title"
                value={values[FORM_FIELDS.TITLE]}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Project Description">
              <Textarea
                name={FORM_FIELDS.DESCRIPTION}
                placeholder="Describe your project idea"
                value={values[FORM_FIELDS.DESCRIPTION]}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Timeline" isRequired={true}>
              <Select
                name={FORM_FIELDS.TIMELINE}
                value={values[FORM_FIELDS.TIMELINE]}
                onChange={handleChange}
                options={TIMELINE_OPTIONS}
              />
            </FormField>

            {/* Custom timeline input  */}
            {values[FORM_FIELDS.TIMELINE] === 'custom' && (
              <FormField label="Custom Timeline" isRequired={true}>
                <Input
                  name={FORM_FIELDS.CUSTOM_TIMELINE}
                  placeholder="e.g., 2 weeks, 4 months, 1.5 years"
                  value={values[FORM_FIELDS.CUSTOM_TIMELINE] || ''}
                  onChange={handleChange}
                />
              </FormField>
            )}

            <FormField label="Experience Level" isRequired={true}>
              <Select
                name={FORM_FIELDS.EXPERIENCE_LEVEL}
                value={values[FORM_FIELDS.EXPERIENCE_LEVEL]}
                onChange={handleChange}
                options={EXPERIENCE_LEVEL_OPTIONS}
              />
            </FormField>

            <FormField label="Technologies/Frameworks">
              <Input
                name={FORM_FIELDS.TECHNOLOGIES}
                placeholder="e.g., React, Python, PyTorch, HTML/CSS"
                value={values[FORM_FIELDS.TECHNOLOGIES]}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Project Scope" isRequired={true}>
              <Select
                name={FORM_FIELDS.PROJECT_SCOPE}
                value={values[FORM_FIELDS.PROJECT_SCOPE]}
                onChange={handleChange}
                options={PROJECT_SCOPE_OPTIONS}
              />
            </FormField>

            {/* File upload section */}
            <FormField label="Upload Document">
              <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
              {fileLoading && (
                <p className="mt-2 text-sm text-blue-600">Processing document, please wait...</p>
              )}
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {processedFile && (
                <div className="mt-2 text-sm text-green-600">
                  <p>✓ Document processed successfully!</p>
                </div>
              )}
            </FormField>

            {/* Generate button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={onGenerateClick}
                disabled={!canGenerate(processedFile)}
                size="md"
                className="px-6 py-2"
              >
                {chatLoading ? 'Generating...' : 'Generate Roadmap'}
              </Button>
            </div>
          </div>
        </div>

        {/* AI chat section */}
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>
            <p className="mt-1 text-sm text-gray-600">
              Take advantage of our AI assistant (# questions max)
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatContainer
              messages={messages}
              loading={chatLoading}
              stage={stage}
              sendMessage={sendMessage}
            />
          </div>
          
          {/* Project saving section - show when roadmap is generated */}
          {stage === 'done' && (
            <div className="border-t border-gray-200 p-4">
              {savedProjectId ? (
                <div className="text-center">
                  <p className="text-sm text-green-600">✓ Project saved successfully!</p>
                  {/* TODO: Add "View Project" button linking to project detail page (Next PR) */}
                </div>
              ) : (
                <div className="text-center">
                  <Button
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : 'Save Project'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewProjectChatPage;
