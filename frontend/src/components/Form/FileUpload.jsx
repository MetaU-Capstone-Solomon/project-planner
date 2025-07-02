import React from 'react';

const FileUpload = ({
  onFileSelect,
  selectedFile,
  accept = 'pdf,doc,docx,txt',
  className = '',
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (
      file &&
      accept.split(',').some((type) => file.name.toLowerCase().endsWith(type))
    ) {
      onFileSelect(file);
    }
  };

  return (
    <div className={className}>
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          id="file-upload"
          accept={accept.split(',').map(type => `.${type}`).join(',')}
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-gray-600">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, or TXT files</p>
          </div>
        </label>
      </div>
      {selectedFile && <p className="mt-2 text-sm text-green-600">Selected: {selectedFile.name}</p>}
    </div>
  );
};

export default FileUpload;
