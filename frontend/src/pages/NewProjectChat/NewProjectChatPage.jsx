import React, { useState } from 'react';
import FormField from '@/components/Form/FormField';
import Input from '@/components/Form/Input';
import Textarea from '@/components/Form/Textarea';
import FileUpload from '@/components/Form/FileUpload';
import ChatContainer from '@/components/Chat/ChatContainer';
import useForm from '@/hooks/useForm';
import useFileUpload from '@/hooks/useFileUpload';

const NewProjectChatPage = () => {
  const { values, handleChange } = useForm({
    title: '',
    description: '',
  });

  const { file, error, handleFileSelect } = useFileUpload();
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleGenerate = async () => {
    // Clear previous errors
    setValidationError('');

    // Validate required fields
    if (!values.title.trim()) {
      setValidationError('Project title is required');
      return;
    }

    if (!values.description.trim()) {
      setValidationError('Project description is required');
      return;
    }

    // Start generation process
    setIsGenerating(true);
    
    try {
      // Create prompt for AI
      const prompt = `Create a project roadmap for: ${values.title}

Description: ${values.description}

Please provide a detailed roadmap with steps, timeline, and key milestones.`;

      // Call backend API
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roadmap');
      }

      const data = await response.json();
      console.log('Generated roadmap:', data.content);
      
      // TODO: Handle the generated roadmap (will be added in next PR)
      
    } catch (error) {
      console.error('Generation error:', error);
      setValidationError(error.message || 'Failed to generate roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl bg-gray-50 p-6">
      <div className="grid h-[calc(100vh-3rem)] grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project Details Card - Static header, scrollable*/}
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <FormField label="Project Title">
              <Input
                name="title"
                placeholder="Enter your project title"
                value={values.title}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Project Description">
              <Textarea
                name="description"
                placeholder="Describe your project idea"
                value={values.description}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Upload Document (Optional)">
              <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </FormField>

            {/* Generate button */}
            <div className="flex flex-col items-center space-y-2 pt-4">
              {validationError && (
                <p className="text-sm text-red-600">{validationError}</p>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!values.title.trim() || !values.description.trim() || isGenerating}
                className="rounded-lg bg-blue-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Assistant Card  */}
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>
            <p className="mt-1 text-sm text-gray-600">Take advantage of our AI assistant (# questions max)</p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatContainer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectChatPage;
