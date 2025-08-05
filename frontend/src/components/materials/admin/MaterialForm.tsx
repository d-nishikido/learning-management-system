import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FileUploadField } from '../FileUploadField';
import type { 
  CreateLearningMaterialRequest, 
  UpdateLearningMaterialRequest, 
  LearningMaterial,
  MaterialType
} from '@/types';

interface MaterialFormProps {
  courseId: number;
  lessonId: number;
  material?: LearningMaterial;
  onSubmit: (data: CreateLearningMaterialRequest | UpdateLearningMaterialRequest, file?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MaterialForm({ 
  material, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: MaterialFormProps) {
  const { t } = useTranslation(['material', 'common']);
  const isEditMode = !!material;

  const [formData, setFormData] = useState<CreateLearningMaterialRequest>({
    title: '',
    description: '',
    materialType: 'FILE',
    materialCategory: 'MAIN',
    externalUrl: '',
    durationMinutes: undefined,
    allowManualProgress: false,
    sortOrder: 1,
    isPublished: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title,
        description: material.description || '',
        materialType: material.materialType,
        materialCategory: material.materialCategory,
        externalUrl: material.externalUrl || '',
        durationMinutes: material.durationMinutes,
        allowManualProgress: material.allowManualProgress,
        sortOrder: material.sortOrder,
        isPublished: material.isPublished,
      });
    }
  }, [material]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = t('material:validation.titleRequired');
    }

    if (formData.materialType === 'FILE' && !isEditMode && !selectedFile) {
      errors.file = t('material:validation.fileRequired');
    }

    if (formData.materialType === 'URL' && !formData.externalUrl?.trim()) {
      errors.externalUrl = t('material:validation.urlRequired');
    }

    if (formData.materialType === 'URL' && formData.externalUrl) {
      try {
        new URL(formData.externalUrl);
      } catch {
        errors.externalUrl = t('material:validation.invalidUrl');
      }
    }

    if (formData.durationMinutes !== undefined && formData.durationMinutes < 0) {
      errors.durationMinutes = t('material:validation.invalidDuration');
    }

    if (formData.sortOrder !== undefined && formData.sortOrder < 1) {
      errors.sortOrder = t('material:validation.invalidSortOrder');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : parseInt(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleMaterialTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialType = e.target.value as MaterialType;
    setFormData(prev => ({
      ...prev,
      materialType,
      // Reset fields based on material type
      externalUrl: materialType === 'URL' ? prev.externalUrl : '',
      allowManualProgress: materialType === 'MANUAL_PROGRESS' ? true : prev.allowManualProgress,
    }));
    
    // Clear file selection if changing from FILE type
    if (materialType !== 'FILE') {
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (validationErrors.file) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.file;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode) {
        // For edit mode, only send changed fields
        const updateData: UpdateLearningMaterialRequest = {};
        
        if (formData.title !== material.title) updateData.title = formData.title;
        if (formData.description !== material.description) updateData.description = formData.description;
        if (formData.externalUrl !== material.externalUrl) updateData.externalUrl = formData.externalUrl;
        if (formData.durationMinutes !== material.durationMinutes) updateData.durationMinutes = formData.durationMinutes;
        if (formData.allowManualProgress !== material.allowManualProgress) updateData.allowManualProgress = formData.allowManualProgress;
        if (formData.sortOrder !== material.sortOrder) updateData.sortOrder = formData.sortOrder;
        if (formData.isPublished !== material.isPublished) updateData.isPublished = formData.isPublished;
        
        await onSubmit(updateData);
      } else {
        // For create mode, handle file upload separately
        const createData = { ...formData };
        
        // Remove empty optional fields
        if (!createData.description?.trim()) delete createData.description;
        if (createData.materialType !== 'URL') delete createData.externalUrl;
        if (createData.durationMinutes === undefined) delete createData.durationMinutes;
        
        await onSubmit(createData, selectedFile || undefined);
      }
    } catch (error) {
      // Error handling is done by parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          {t('material:fields.title')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            validationErrors.title
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } sm:text-sm`}
        />
        {validationErrors.title && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {t('material:fields.description')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Material Type */}
      {!isEditMode && (
        <div>
          <label htmlFor="materialType" className="block text-sm font-medium text-gray-700">
            {t('material:fields.materialType')} <span className="text-red-500">*</span>
          </label>
          <select
            id="materialType"
            name="materialType"
            value={formData.materialType}
            onChange={handleMaterialTypeChange}
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="FILE">{t('material:types.file')}</option>
            <option value="URL">{t('material:types.url')}</option>
            <option value="MANUAL_PROGRESS">{t('material:types.manualProgress')}</option>
          </select>
        </div>
      )}

      {/* Material Category */}
      <div>
        <label htmlFor="materialCategory" className="block text-sm font-medium text-gray-700">
          {t('material:fields.materialCategory')}
        </label>
        <select
          id="materialCategory"
          name="materialCategory"
          value={formData.materialCategory}
          onChange={handleChange}
          disabled={isLoading || isEditMode}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="MAIN">{t('material:categories.main')}</option>
          <option value="SUPPLEMENTARY">{t('material:categories.supplementary')}</option>
        </select>
      </div>

      {/* File Upload (only for FILE type in create mode) */}
      {!isEditMode && formData.materialType === 'FILE' && (
        <FileUploadField
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          error={validationErrors.file}
          disabled={isLoading}
        />
      )}

      {/* External URL (only for URL type) */}
      {formData.materialType === 'URL' && (
        <div>
          <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700">
            {t('material:fields.externalUrl')} <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="externalUrl"
            name="externalUrl"
            value={formData.externalUrl}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="https://example.com"
            className={`mt-1 block w-full rounded-md shadow-sm ${
              validationErrors.externalUrl
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } sm:text-sm`}
          />
          {validationErrors.externalUrl && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.externalUrl}</p>
          )}
        </div>
      )}

      {/* Duration Minutes */}
      <div>
        <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">
          {t('material:fields.durationMinutes')}
        </label>
        <input
          type="number"
          id="durationMinutes"
          name="durationMinutes"
          min="0"
          value={formData.durationMinutes ?? ''}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            validationErrors.durationMinutes
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } sm:text-sm`}
        />
        {validationErrors.durationMinutes && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.durationMinutes}</p>
        )}
      </div>

      {/* Allow Manual Progress */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="allowManualProgress"
            name="allowManualProgress"
            type="checkbox"
            checked={formData.allowManualProgress}
            onChange={handleChange}
            disabled={isLoading || formData.materialType === 'MANUAL_PROGRESS'}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="allowManualProgress" className="font-medium text-gray-700">
            {t('material:fields.allowManualProgress')}
          </label>
          <p className="text-gray-500">{t('material:fields.allowManualProgressHelp')}</p>
        </div>
      </div>

      {/* Sort Order */}
      <div>
        <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
          {t('material:fields.sortOrder')}
        </label>
        <input
          type="number"
          id="sortOrder"
          name="sortOrder"
          min="1"
          value={formData.sortOrder}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full rounded-md shadow-sm ${
            validationErrors.sortOrder
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } sm:text-sm`}
        />
        {validationErrors.sortOrder && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.sortOrder}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">{t('material:fields.sortOrderHelp')}</p>
      </div>

      {/* Published Status */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            checked={formData.isPublished}
            onChange={handleChange}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isPublished" className="font-medium text-gray-700">
            {t('material:fields.isPublished')}
          </label>
          <p className="text-gray-500">{t('material:fields.isPublishedHelp')}</p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common:cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t('common:saving')}
            </>
          ) : (
            isEditMode ? t('common:update') : t('common:create')
          )}
        </Button>
      </div>
    </form>
  );
}