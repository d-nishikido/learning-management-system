import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lessonApi, courseApi, materialApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AdminMaterialList } from '@/components/materials/admin/AdminMaterialList';
import { MaterialForm } from '@/components/materials/admin/MaterialForm';
import type { CreateLessonRequest, UpdateLessonRequest, ApiRequestError, Course, CreateLearningMaterialRequest } from '@/types';

export function LessonForm() {
  const { courseId, id } = useParams<{ courseId: string; id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['lesson', 'common']);
  const isEditMode = !!id;

  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CreateLessonRequest>({
    title: '',
    description: '',
    content: '',
    estimatedMinutes: 0,
    isPublished: false,
    sortOrder: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Material management state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);

  // Load course and lesson data
  useEffect(() => {
    const courseIdNum = parseInt(courseId || '0');
    if (courseIdNum) {
      loadCourse(courseIdNum);
      if (isEditMode && id) {
        loadLesson(courseIdNum, parseInt(id));
      }
    }
  }, [courseId, id, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourse = async (courseIdNum: number) => {
    try {
      setError(null);
      const response = await courseApi.getById(courseIdNum);
      if (response.success && response.data) {
        setCourse(response.data);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('lesson:errors.courseLoadFailed'));
    }
  };

  const loadLesson = async (courseIdNum: number, lessonId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await lessonApi.getById(courseIdNum, lessonId);
      if (response.success && response.data) {
        const lesson = response.data;
        setFormData({
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          estimatedMinutes: lesson.estimatedMinutes || 0,
          isPublished: lesson.isPublished,
          sortOrder: lesson.sortOrder || 0,
        });
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('lesson:errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = t('lesson:validation.titleRequired');
    }

    if (formData.estimatedMinutes && formData.estimatedMinutes < 0) {
      errors.estimatedMinutes = t('lesson:validation.invalidMinutes');
    }

    if (formData.sortOrder && formData.sortOrder < 0) {
      errors.sortOrder = t('lesson:validation.invalidSortOrder');
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

    const courseIdNum = parseInt(courseId || '0');
    if (!courseIdNum) {
      setError(t('lesson:errors.invalidCourse'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (isEditMode && id) {
        const updateData: UpdateLessonRequest = { ...formData };
        // Remove zero values to avoid validation errors
        if (updateData.estimatedMinutes === 0) delete updateData.estimatedMinutes;
        if (updateData.sortOrder === 0) delete updateData.sortOrder;
        // Remove empty strings to avoid validation errors
        if (!updateData.description || updateData.description.trim() === '') delete updateData.description;
        if (!updateData.content || updateData.content.trim() === '') delete updateData.content;
        
        const response = await lessonApi.update(courseIdNum, parseInt(id), updateData);
        if (response.success) {
          navigate(`/admin/courses/${courseId}/lessons`, { 
            state: { message: t('lesson:messages.updateSuccess') } 
          });
        }
      } else {
        const createData = { ...formData };
        // Remove zero values to avoid validation errors
        if (createData.estimatedMinutes === 0) delete createData.estimatedMinutes;
        if (createData.sortOrder === 0) delete createData.sortOrder;
        // Remove empty strings to avoid validation errors
        if (!createData.description || createData.description.trim() === '') delete createData.description;
        if (!createData.content || createData.content.trim() === '') delete createData.content;
        
        const response = await lessonApi.create(courseIdNum, createData);
        if (response.success) {
          navigate(`/admin/courses/${courseId}/lessons`, { 
            state: { message: t('lesson:messages.createSuccess') } 
          });
        }
      }
    } catch (err) {
      const apiError = err as ApiRequestError;
      setError(apiError.response?.data?.message || t('lesson:errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/courses/${courseId}/lessons`);
  };

  const handleCreateMaterial = async (data: CreateLearningMaterialRequest, file?: File) => {
    const courseIdNum = parseInt(courseId || '0');
    const lessonIdNum = parseInt(id || '0');
    
    if (!courseIdNum || !lessonIdNum) {
      setMaterialError(t('material:errors.createFailed'));
      return;
    }

    try {
      setMaterialError(null);
      
      if (data.materialType === 'FILE' && file) {
        // Handle file upload
        const response = await materialApi.upload(courseIdNum, lessonIdNum, file, data);
        if (response.success) {
          setShowMaterialForm(false);
        }
      } else {
        // Handle URL or manual progress material
        const response = await materialApi.create(courseIdNum, lessonIdNum, data);
        if (response.success) {
          setShowMaterialForm(false);
        }
      }
    } catch (err) {
      const apiError = err as ApiRequestError;
      setMaterialError(apiError.response?.data?.message || t('material:errors.createFailed'));
    }
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
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <div className="flex items-center">
                    <a href="/admin/courses" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                      {t('lesson:breadcrumb.courses')}
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <a href={`/admin/courses/${courseId}/lessons`} className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                      {course?.title || t('lesson:breadcrumb.lessons')}
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">
                      {isEditMode ? t('lesson:editLesson') : t('lesson:createLesson')}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? t('lesson:editLesson') : t('lesson:createLesson')}
            {course && <span className="text-lg font-normal text-gray-600 ml-2">- {course.title}</span>}
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
                {t('lesson:fields.title')} <span className="text-red-500">*</span>
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
                {t('lesson:fields.description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                {t('lesson:fields.content')}
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                value={formData.content}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('lesson:fields.contentPlaceholder')}
              />
            </div>

            {/* Estimated Minutes */}
            <div>
              <label htmlFor="estimatedMinutes" className="block text-sm font-medium text-gray-700">
                {t('lesson:fields.estimatedMinutes')}
              </label>
              <input
                type="number"
                id="estimatedMinutes"
                name="estimatedMinutes"
                min="0"
                step="1"
                value={formData.estimatedMinutes}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.estimatedMinutes
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } sm:text-sm`}
              />
              {validationErrors.estimatedMinutes && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.estimatedMinutes}</p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
                {t('lesson:fields.sortOrder')}
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
              <p className="mt-1 text-sm text-gray-500">{t('lesson:fields.sortOrderHelp')}</p>
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
                  {t('lesson:fields.isPublished')}
                </label>
                <p className="text-gray-500">{t('lesson:fields.isPublishedHelp')}</p>
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

          {/* Material Management Section - Only show in edit mode */}
          {isEditMode && id && (
            <div className="mt-8 pt-8 border-t">
              {showMaterialForm ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {t('material:createMaterial')}
                  </h3>
                  
                  {materialError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{materialError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <MaterialForm
                    courseId={parseInt(courseId!)}
                    lessonId={parseInt(id)}
                    onSubmit={handleCreateMaterial}
                    onCancel={() => {
                      setShowMaterialForm(false);
                      setMaterialError(null);
                    }}
                  />
                </div>
              ) : (
                <AdminMaterialList
                  courseId={parseInt(courseId!)}
                  lessonId={parseInt(id)}
                  onAddNew={() => setShowMaterialForm(true)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}