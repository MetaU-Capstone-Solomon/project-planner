import React from 'react';
import FormField from '@/components/Form/FormField';
import Input from '@/components/Form/Input';
import Textarea from '@/components/Form/Textarea';
import FileUpload from '@/components/Form/FileUpload';
import useForm from '@/hooks/useForm';
import useFileUpload from '@/hooks/useFileUpload';

const NewProjectChatPage = () => {
  const { values, handleChange } = useForm({
    title: '',
    description: '',
  });

  const { file, error, handleFileSelect } = useFileUpload();

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-gray-50 p-6">
      <div className="overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="p-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Project Details</h2>

          <div className="space-y-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectChatPage;
