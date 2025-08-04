import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { CreateCourseRequest, UpdateCourseRequest, ApiRequestError } from '@/types';

export function CourseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['course', 'common']);
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CreateCourseRequest>({
    title: '',
    description: '',
    category: '',
    difficultyLevel: 'BEGINNER',
    estimatedHours: 0,
    thumbnailUrl: '',
    isPublished: false,
    sortOrder: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load course data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadCourse(parseInt(id));
    }
  }, [id, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourse = async (courseId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await courseApi.getById(courseId);
      if (response.success && response.data) {
        const course = response.data;
        setFormData({
          title: course.title,
          description: course.description || '',
          category: course.category,
          difficultyLevel: course.difficultyLevel,
          estimatedHours: course.estimatedHours || 0,
          thumbnailUrl: course.thumbnailUrl || '',
          isPublished: course.isPublished,
          sortOrder: course.sortOrder || 0,
        });
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('course:errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = t('course:validation.titleRequired');
    }

    if (!formData.category.trim()) {
      errors.category = t('course:validation.categoryRequired');
    }

    if (formData.estimatedHours && formData.estimatedHours < 0) {
      errors.estimatedHours = t('course:validation.invalidHours');
    }

    if (formData.sortOrder && formData.sortOrder < 0) {
      errors.sortOrder = t('course:validation.invalidSortOrder');
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
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (isEditMode && id) {
        const updateData: UpdateCourseRequest = { ...formData };
        const response = await courseApi.update(parseInt(id), updateData);
        if (response.success) {
          navigate('/admin/courses', { state: { message: t('course:messages.updateSuccess') } });
        }
      } else {
        const response = await courseApi.create(formData);
        if (response.success) {
          navigate('/admin/courses', { state: { message: t('course:messages.createSuccess') } });
        }
      }
    } catch (err) {
      const apiError = err as ApiRequestError;
      setError(apiError.response?.data?.message || t('course:errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/courses');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? t('course:editCourse') : t('course:createCourse')}
          </h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                {t('course:fields.title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
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
                {t('course:fields.description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                {t('course:fields.category')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.category
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } sm:text-sm`}
              />
              {validationErrors.category && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
              )}
            </div>

            {/* Difficulty Level */}
            <div>
              <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700">
                {t('course:fields.difficultyLevel')}
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="BEGINNER">{t('course:difficulty.beginner')}</option>
                <option value="INTERMEDIATE">{t('course:difficulty.intermediate')}</option>
                <option value="ADVANCED">{t('course:difficulty.advanced')}</option>
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700">
                {t('course:fields.estimatedHours')}
              </label>
              <input
                type="number"
                id="estimatedHours"
                name="estimatedHours"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.estimatedHours
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } sm:text-sm`}
              />
              {validationErrors.estimatedHours && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.estimatedHours}</p>
              )}
            </div>

            {/* Thumbnail URL */}
            <div>
              <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700">
                {t('course:fields.thumbnailUrl')}
              </label>
              <input
                type="url"
                id="thumbnailUrl"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
                {t('course:fields.sortOrder')}
              </label>
              <input
                type="number"
                id="sortOrder"
                name="sortOrder"
                min="0"
                value={formData.sortOrder}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.sortOrder
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } sm:text-sm`}
              />
              {validationErrors.sortOrder && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.sortOrder}</p>
              )}
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
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isPublished" className="font-medium text-gray-700">
                  {t('course:fields.isPublished')}
                </label>
                <p className="text-gray-500">{t('course:fields.isPublishedHelp')}</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
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
        </div>
      </div>
    </div>
  );
}