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

import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useProjectSave } from '@/hooks/useProjectSave';
import { MESSAGES, CHAT_STAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import {
  TIMELINE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PROJECT_SCOPE_OPTIONS,
  FORM_FIELDS,
} from '@/constants/projectOptions';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';
import { CheckCircle, Plus } from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';
import resetNewProjectState from '@/utils/resetNewProjectState';
import confirmAction from '@/utils/confirmAction';

const NewProjectChatPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileStep, setMobileStep] = React.useState(1); // 1 = form, 2 = chat
  const {
    file,
    processedFile,
    error,
    loading: fileLoading,
    handleFileSelect,
    clearFile,
  } = useFileUpload();
  const {
    messages,
    loading: chatLoading,
    stage,
    sendMessage,
    startChatWithDetails,
    resetChat,
  } = useChat();

  const { values, handleChange, handleGenerateRoadmap, canGenerate, resetForm } = useProjectForm(
    startChatWithDetails,
    chatLoading,
    fileLoading,
    stage
  );

  const { saving, savedProjectId, handleSaveProject } = useProjectSave(messages, values);

  // Listen for reset event from navbar
  React.useEffect(() => {
    const handleReset = () => {
      clearFile();
      resetChat();
      resetForm();
      setMobileStep(1);
    };

    window.addEventListener('resetNewProject', handleReset);
    return () => window.removeEventListener('resetNewProject', handleReset);
  }, [clearFile, resetChat, resetForm]);

  const onGenerateClick = async () => {
    try {
      await handleGenerateRoadmap(processedFile);
      if (isMobile) setMobileStep(2);
    } catch (error) {
      //not advance to chat step on mobile if there's an error
    }
  };

  const handleNewProject = () => {
    const shouldProceed = confirmAction(
      'Are you sure you want to start over? This will clear all your current progress.'
    );

    if (!shouldProceed) {
      return; // User cancelled, nothing happens
    }

    // Reset state
    resetNewProjectState();
    clearFile();
    resetChat();
    resetForm();
    setMobileStep(1);
  };

  // --- Form Section ---
  const formSection = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-800">
      <div className="border-b border-gray-200 p-6 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Details</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-100">
          Fill in the details below or upload a document to get started
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <FormField label="Project Title" isRequired={true}>
          <Input
            name={FORM_FIELDS.TITLE}
            placeholder="Enter your project title"
            value={values[FORM_FIELDS.TITLE]}
            onChange={handleChange}
          />
        </FormField>
        <FormField label="Project Description" isRequired={true}>
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
        <FormField label="Upload Document">
          <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
          {fileLoading && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <LoadingSpinner size="sm" />
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                {MESSAGES.LOADING.PROCESSING_DOCUMENT}
              </p>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          {processedFile && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <p>{MESSAGES.SUCCESS.FILE_PROCESSED}</p>
            </div>
          )}
        </FormField>
        <div className="flex justify-center pt-4">
          <div className="text-center">
            <Button
              onClick={onGenerateClick}
              disabled={!canGenerate(processedFile)}
              size="md"
              className="px-6 py-2"
            >
              {chatLoading
                ? MESSAGES.LOADING.GENERATING_ROADMAP
                : MESSAGES.ACTIONS.GENERATE_ROADMAP}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Chat Section ---
  const chatSection = (
    <div
      className={`flex flex-col overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-800 ${isMobile ? 'h-[calc(100vh-3rem)]' : 'h-full'}`}
    >
      <div className="border-b border-gray-200 p-6 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-100">
          Take advantage of our AI assistant
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
      {(stage === CHAT_STAGES.AWAITING_CONFIRMATION || stage === CHAT_STAGES.DONE) && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex justify-center space-x-4">
            <Button onClick={handleSaveProject} disabled={saving} size="md" className="px-6 py-2">
              {saving ? MESSAGES.LOADING.SAVING_PROJECT : MESSAGES.ACTIONS.SAVE_PROJECT}
            </Button>
            <Button 
              onClick={handleNewProject} 
              size="md" 
              variant="secondary"
              className="px-6 py-2 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // --- Responsive Layout ---
  return (
    <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {isMobile ? (
          <div className="flex flex-col gap-6">{mobileStep === 1 ? formSection : chatSection}</div>
        ) : (
          <div className="grid h-[calc(100vh-3rem)] grid-cols-1 gap-6 lg:grid-cols-2">
            {formSection}
            {chatSection}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProjectChatPage;
