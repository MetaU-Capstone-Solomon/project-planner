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
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import FormField from '@/components/Form/FormField';
import Select from '@/components/Form/Select';
import ChatContainer from '@/components/Chat/ChatContainer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Skeleton from '@/components/ui/Skeleton';
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
import Spinner from '@/components/ui/Spinner';
import { CheckCircle, Plus } from 'lucide-react';
import useIsMobile from '@/hooks/useIsMobile';
import resetNewProjectState from '@/utils/resetNewProjectState';
import confirmAction from '@/utils/confirmAction';
import OnboardingModal from '@/components/Onboarding/OnboardingModal';
import BYOKModal from '@/components/BYOK/BYOKModal';
import { useUserSettings, useInvalidateUserSettings } from '@/hooks/useUserSettings';
import { pageTransition } from '@/constants/motion';

const NewProjectChatPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileStep, setMobileStep] = React.useState(1); // 1 = form, 2 = chat
  const [dragOver, setDragOver] = React.useState(false);
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

  const { data: userSettings } = useUserSettings();
  const invalidateSettings = useInvalidateUserSettings();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [onboardingDone, setOnboardingDone] = React.useState(false);
  const [byokTrigger, setByokTrigger] = React.useState(null);
  const pendingByokCheck = React.useRef(false);

  // Show onboarding once if role has not been set
  React.useEffect(() => {
    if (userSettings !== undefined && userSettings?.role === null && !onboardingDone) {
      setShowOnboarding(true);
    }
  }, [userSettings, onboardingDone]);

  // one-remaining trigger: show when user has used limit-1 generations and has no API key
  React.useEffect(() => {
    if (!userSettings) return;
    if (userSettings.apiProvider) return; // user already has a key
    const { used, limit } = userSettings.usage;
    if (used === limit - 1 && byokTrigger === null) {
      setByokTrigger('one-remaining');
    }
  }, [userSettings, byokTrigger]);

  // first-generation trigger (effect 1): set pending flag and invalidate settings when stage is reached
  React.useEffect(() => {
    if (stage === CHAT_STAGES.AWAITING_CONFIRMATION) {
      pendingByokCheck.current = true;
      invalidateSettings();
    }
  }, [stage, invalidateSettings]);

  // first-generation trigger (effect 2): check fresh settings once invalidation resolves
  React.useEffect(() => {
    if (!pendingByokCheck.current) return;
    if (!userSettings) return;
    pendingByokCheck.current = false;
    if (!userSettings.apiProvider && !userSettings.byokNudgeDismissed && userSettings.usage.used === 0) {
      setByokTrigger('first-generation');
    }
  }, [userSettings, setByokTrigger]);

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

  return (
    <motion.div {...pageTransition} className="flex min-h-[calc(100vh-56px)] flex-col lg:flex-row bg-[var(--bg-base)]">

      {/* Left panel — Input */}
      <div className="flex flex-col gap-5 border-b border-[var(--border)] p-6 lg:w-2/5 lg:border-b-0 lg:border-r lg:p-8">
        <div>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Describe your project</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Give us the details — we'll build the roadmap.</p>
        </div>

        <Input
          label="Project title"
          placeholder="e.g. E-commerce platform, Mobile fitness app"
          name={FORM_FIELDS.TITLE}
          value={values[FORM_FIELDS.TITLE]}
          onChange={handleChange}
        />

        <Textarea
          label="Description"
          placeholder="What are you building? Who is it for? What's your experience level? Any specific technologies or timeline?"
          name={FORM_FIELDS.DESCRIPTION}
          value={values[FORM_FIELDS.DESCRIPTION]}
          onChange={handleChange}
          className="min-h-[140px]"
        />

        <FormField label="Timeline" isRequired={true}>
          <Select
            name={FORM_FIELDS.TIMELINE}
            value={values[FORM_FIELDS.TIMELINE]}
            onChange={handleChange}
            options={TIMELINE_OPTIONS}
          />
        </FormField>

        {values[FORM_FIELDS.TIMELINE] === 'custom' && (
          <Input
            label="Custom Timeline"
            placeholder="e.g., 2 weeks, 4 months, 1.5 years"
            name={FORM_FIELDS.CUSTOM_TIMELINE}
            value={values[FORM_FIELDS.CUSTOM_TIMELINE] || ''}
            onChange={handleChange}
          />
        )}

        <FormField label="Experience Level" isRequired={true}>
          <Select
            name={FORM_FIELDS.EXPERIENCE_LEVEL}
            value={values[FORM_FIELDS.EXPERIENCE_LEVEL]}
            onChange={handleChange}
            options={EXPERIENCE_LEVEL_OPTIONS}
          />
        </FormField>

        <Input
          label="Technologies / Frameworks"
          placeholder="e.g., React, Python, PyTorch, HTML/CSS"
          name={FORM_FIELDS.TECHNOLOGIES}
          value={values[FORM_FIELDS.TECHNOLOGIES]}
          onChange={handleChange}
        />

        <FormField label="Project Scope" isRequired={true}>
          <Select
            name={FORM_FIELDS.PROJECT_SCOPE}
            value={values[FORM_FIELDS.PROJECT_SCOPE]}
            onChange={handleChange}
            options={PROJECT_SCOPE_OPTIONS}
          />
        </FormField>

        {/* File upload zone */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            Or upload a document <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
          <motion.label
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            htmlFor="file-upload"
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
              dragOver
                ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
          >
            <Upload size={20} className="text-[var(--text-muted)]" />
            {file ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">{file.name}</span>
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); clearFile(); }}
                  className="text-[var(--text-muted)] hover:text-[var(--destructive)]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="text-sm text-[var(--text-muted)]">Drop a PDF, DOCX, or TXT</span>
            )}
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={e => handleFileSelect(e.target.files[0])}
            />
          </motion.label>
          {fileLoading && (
            <div className="mt-2 flex items-center gap-2 text-[var(--text-muted)]">
              <Spinner size="sm" className="text-[var(--accent)]" />
              <p className="text-sm">{MESSAGES.LOADING.PROCESSING_DOCUMENT}</p>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p>}
          {processedFile && (
            <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <p className="text-sm">{MESSAGES.SUCCESS.FILE_PROCESSED}</p>
            </div>
          )}
        </div>

        <Button
          onClick={onGenerateClick}
          loading={chatLoading}
          disabled={!canGenerate(processedFile)}
          size="lg"
          className="w-full"
        >
          {chatLoading ? MESSAGES.LOADING.GENERATING_ROADMAP : MESSAGES.ACTIONS.GENERATE_ROADMAP}
        </Button>
      </div>

      {/* Right panel — Output */}
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {!messages.length && !chatLoading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]">
              <FileText size={28} className="text-[var(--text-muted)]" />
            </div>
            <p className="font-medium text-[var(--text-secondary)]">Your roadmap will appear here</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Fill in the details on the left and click Generate</p>
          </div>
        )}

        {chatLoading && !messages.length && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {(messages.length > 0 || chatLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-full"
          >
            <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <ChatContainer
                messages={messages}
                loading={chatLoading}
                stage={stage}
                sendMessage={sendMessage}
              />
            </div>

            {(stage === CHAT_STAGES.AWAITING_CONFIRMATION || stage === CHAT_STAGES.DONE) && (
              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={handleNewProject} size="lg" variant="secondary" className="flex items-center gap-2">
                  <Plus size={16} />
                  New Project
                </Button>
                <Button onClick={handleSaveProject} loading={saving} size="lg">
                  {saving ? MESSAGES.LOADING.SAVING_PROJECT : MESSAGES.ACTIONS.SAVE_PROJECT}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Existing modals */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboarding(false);
            setOnboardingDone(true);
          }}
        />
      )}
      {byokTrigger && (
        <BYOKModal
          trigger={byokTrigger}
          onDismiss={() => setByokTrigger(null)}
        />
      )}
    </motion.div>
  );
};

export default NewProjectChatPage;
