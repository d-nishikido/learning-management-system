import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { ResourceCard } from './ResourceCard';
import { resourceApi } from '@/services/api';
import type { LearningResource, LearningResourceQueryParams, ResourceType, ImportanceLevel, DifficultyLevel } from '@/types';

interface ResourceListProps {
  courseId?: number;
  lessonId?: number;
  title?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  courseId,
  lessonId,
  title = 'Learning Resources',
  showFilters = true,
  showSearch = true,
  className = '',
}) => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LearningResourceQueryParams>({
    page: 1,
    limit: 12,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadResources();
    if (showFilters) {
      loadTags();
    }
  }, [courseId, lessonId, filters]);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        ...filters,
        search: searchTerm || undefined,
      };

      let response;
      if (lessonId && courseId) {
        response = await resourceApi.getByLesson(courseId, lessonId, queryParams);
      } else if (courseId) {
        response = await resourceApi.getByCourse(courseId, queryParams);
      } else {
        response = await resourceApi.search(queryParams);
      }

      if (response.success && response.data) {
        setResources(response.data.resources);
        setTotalPages(response.data.totalPages);
      } else {
        throw new Error(response.error || 'Failed to load resources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    loadResources();
  };

  const handleFilterChange = (key: keyof LearningResourceQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 12 });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadResources}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 inline mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-500">
          {resources.length} resource{resources.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          {/* Search */}
          {showSearch && (
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Resource Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.resourceType || ''}
                  onChange={(e) => handleFilterChange('resourceType', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="WEBSITE">Website</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="FILE">File</option>
                  <option value="TOOL">Tool</option>
                </select>
              </div>

              {/* Importance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importance</label>
                <select
                  value={filters.importance || ''}
                  onChange={(e) => handleFilterChange('importance', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="REQUIRED">Required</option>
                  <option value="RECOMMENDED">Recommended</option>
                  <option value="REFERENCE">Reference</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficultyLevel || ''}
                  onChange={(e) => handleFilterChange('difficultyLevel', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  <Filter className="h-4 w-4 inline mr-1" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources Grid */}
      {resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                showStats={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                disabled={filters.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {filters.page || 1} of {totalPages}
              </span>
              
              <button
                onClick={() => handleFilterChange('page', Math.min(totalPages, (filters.page || 1) + 1))}
                disabled={filters.page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No resources found</p>
          <p className="text-gray-400 text-sm">
            {searchTerm || Object.keys(filters).some(key => key !== 'page' && key !== 'limit' && filters[key as keyof LearningResourceQueryParams])
              ? 'Try clearing your search and filters'
              : 'Resources will appear here when they are added'
            }
          </p>
        </div>
      )}
    </div>
  );
};