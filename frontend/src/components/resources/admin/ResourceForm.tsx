import React, { useState, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { resourceApi } from '@/services/api';
import type { 
  LearningResource, 
  CreateLearningResourceRequest, 
  UpdateLearningResourceRequest,
  ResourceType, 
  ImportanceLevel, 
  DifficultyLevel 
} from '@/types';

interface ResourceFormProps {
  resource?: LearningResource;
  courseId?: number;
  lessonId?: number;
  onSubmit: (resource: LearningResource) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({
  resource,
  courseId,
  lessonId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateLearningResourceRequest>({
    title: '',
    description: '',
    resourceType: 'WEBSITE',
    resourceUrl: '',
    difficultyLevel: 'BEGINNER',
    importance: 'REFERENCE',
    tags: [],
    thumbnailUrl: '',
    isPublished: true,
  });
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description || '',
        resourceType: resource.resourceType,
        resourceUrl: resource.resourceUrl,
        difficultyLevel: resource.difficultyLevel,
        importance: resource.importance,
        tags: resource.parsedTags || [],
        thumbnailUrl: resource.thumbnailUrl || '',
        isPublished: resource.isPublished,
      });
    }
    loadTags();
  }, [resource]);

  const loadTags = async () => {
    try {
      const response = await resourceApi.getTags();
      if (response.success && response.data) {
        setAvailableTags(response.data);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleInputChange = (field: keyof CreateLearningResourceRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.resourceUrl.trim()) {
      newErrors.resourceUrl = 'Resource URL is required';
    } else {
      try {
        new URL(formData.resourceUrl);
        
        // Validate YouTube URLs
        if (formData.resourceType === 'YOUTUBE') {
          const url = new URL(formData.resourceUrl);
          if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
            newErrors.resourceUrl = 'Please provide a valid YouTube URL';
          }
        }
      } catch {
        newErrors.resourceUrl = 'Please provide a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let response;
      
      if (resource) {
        // Update existing resource
        const updateData: UpdateLearningResourceRequest = {
          title: formData.title,
          description: formData.description || undefined,
          resourceUrl: formData.resourceUrl,
          difficultyLevel: formData.difficultyLevel,
          importance: formData.importance,
          tags: formData.tags,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          isPublished: formData.isPublished,
        };
        response = await resourceApi.update(resource.id, updateData);
      } else {
        // Create new resource
        if (lessonId && courseId) {
          response = await resourceApi.createForLesson(courseId, lessonId, formData);
        } else if (courseId) {
          response = await resourceApi.createForCourse(courseId, formData);
        } else {
          throw new Error('Either courseId or lessonId must be provided');
        }
      }

      if (response.success && response.data) {
        onSubmit(response.data);
      } else {
        throw new Error(response.error || 'Failed to save resource');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrors({ submit: errorMessage });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {resource ? 'Edit Resource' : 'Add New Resource'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter resource title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter resource description"
            />
          </div>

          {/* Resource Type and URL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.resourceType}
                onChange={(e) => handleInputChange('resourceType', e.target.value as ResourceType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WEBSITE">Website</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="DOCUMENT">Document</option>
                <option value="FILE">File</option>
                <option value="TOOL">Tool</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource URL *
              </label>
              <input
                type="url"
                value={formData.resourceUrl}
                onChange={(e) => handleInputChange('resourceUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
              {errors.resourceUrl && <p className="mt-1 text-sm text-red-600">{errors.resourceUrl}</p>}
            </div>
          </div>

          {/* Difficulty and Importance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => handleInputChange('difficultyLevel', e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importance Level
              </label>
              <select
                value={formData.importance}
                onChange={(e) => handleInputChange('importance', e.target.value as ImportanceLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="REFERENCE">Reference</option>
                <option value="RECOMMENDED">Recommended</option>
                <option value="REQUIRED">Required</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          {/* Published Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => handleInputChange('isPublished', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
              Publish immediately
            </label>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : resource ? 'Update Resource' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};