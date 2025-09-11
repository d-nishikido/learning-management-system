import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <Input
              id="title"
              name="title"
              type="text"
              label={t('course:fields.title')}
              value={formData.title}
              onChange={handleChange}
              error={validationErrors.title}
              required
              fullWidth
            />

            {/* Description */}
            <div className="form-group w-full">
              <label htmlFor="description" className="label">
                {t('course:fields.description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="input w-full min-h-[120px]"
              />
            </div>

            {/* Category */}
            <Input
              id="category"
              name="category"
              type="text"
              label={t('course:fields.category')}
              value={formData.category}
              onChange={handleChange}
              error={validationErrors.category}
              required
              fullWidth
            />

            {/* Difficulty Level */}
            <div className="form-group w-full">
              <label htmlFor="difficultyLevel" className="label">
                {t('course:fields.difficultyLevel')}
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="BEGINNER">{t('course:difficulty.beginner')}</option>
                <option value="INTERMEDIATE">{t('course:difficulty.intermediate')}</option>
                <option value="ADVANCED">{t('course:difficulty.advanced')}</option>
              </select>
            </div>

            {/* Estimated Hours */}
            <Input
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              label={t('course:fields.estimatedHours')}
              value={formData.estimatedHours}
              onChange={handleChange}
              error={validationErrors.estimatedHours}
              fullWidth
            />

            {/* Thumbnail URL */}
            <Input
              id="thumbnailUrl"
              name="thumbnailUrl"
              type="url"
              label={t('course:fields.thumbnailUrl')}
              value={formData.thumbnailUrl}
              onChange={handleChange}
              fullWidth
            />

            {/* Sort Order */}
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min="0"
              label={t('course:fields.sortOrder')}
              value={formData.sortOrder}
              onChange={handleChange}
              error={validationErrors.sortOrder}
              fullWidth
            />

            {/* Published Status */}
            <div className="form-group w-full">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isPublished"
                    name="isPublished"
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-opacity-50"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isPublished" className="font-semibold text-gray-700">
                    {t('course:fields.isPublished')}
                  </label>
                  <p className="text-gray-500 mt-1">{t('course:fields.isPublishedHelp')}</p>
                </div>
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