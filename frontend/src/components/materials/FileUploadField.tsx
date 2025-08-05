import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FileUploadFieldProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  error?: string;
  disabled?: boolean;
  accept?: string;
  maxSizeBytes?: number;
}

const ALLOWED_FILE_TYPES = {
  // Videos
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  
  // Audio
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-m4a': '.m4a',
  'audio/ogg': '.ogg',
  
  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  
  // Text files
  'text/plain': '.txt',
  'text/markdown': '.md',
  
  // Compressed files
  'application/zip': '.zip',
};

const DEFAULT_MAX_SIZE = 500 * 1024 * 1024; // 500MB

export function FileUploadField({
  onFileSelect,
  selectedFile,
  error,
  disabled = false,
  accept,
  maxSizeBytes = DEFAULT_MAX_SIZE,
}: FileUploadFieldProps) {
  const { t } = useTranslation(['material', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const acceptedTypes = accept || Object.values(ALLOWED_FILE_TYPES).join(',');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    setLocalError(null);

    // Check file size
    if (file.size > maxSizeBytes) {
      setLocalError(
        t('material:validation.fileTooLarge', { 
          size: formatFileSize(file.size), 
          maxSize: formatFileSize(maxSizeBytes) 
        })
      );
      return false;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      setLocalError(t('material:validation.unsupportedFileType', { type: file.type }));
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File | null) => {
    if (file && validateFile(file)) {
      onFileSelect(file);
    } else if (!file) {
      onFileSelect(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    handleFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayError = error || localError;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('material:fields.file')} <span className="text-red-500">*</span>
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : displayError
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="ml-4 text-sm font-medium text-red-600 hover:text-red-500"
              >
                {t('material:actions.removeFile')}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {t('material:upload.dragDropOrClick')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('material:upload.maxSize', { size: formatFileSize(maxSizeBytes) })}
            </p>
          </div>
        )}
      </div>

      {displayError && (
        <p className="mt-2 text-sm text-red-600">{displayError}</p>
      )}

      <div className="mt-2">
        <p className="text-xs text-gray-500">{t('material:upload.supportedFormats')}</p>
        <p className="text-xs text-gray-400 mt-1">
          {t('material:upload.formats')}: PDF, Word, PowerPoint, MP4, MP3, PNG, JPG, etc.
        </p>
      </div>
    </div>
  );
}