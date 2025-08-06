import React from 'react';
import { ExternalLink, Eye, Tag, Clock, Star } from 'lucide-react';
import type { LearningResource } from '@/types';
import { getImportanceColor, getResourceTypeIcon, getResourceTypeLabel, getDifficultyColor } from '@/utils/resourceHelpers';

interface ResourceCardProps {
  resource: LearningResource;
  onClick?: () => void;
  showStats?: boolean;
  className?: string;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onClick,
  showStats = false,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.open(resource.resourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const importanceColorClass = getImportanceColor(resource.importance);

  return (
    <div
      className={`bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getResourceTypeIcon(resource.resourceType)}</span>
            <h3 className="font-medium text-gray-900 line-clamp-2">{resource.title}</h3>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
        )}

        {/* Tags */}
        {resource.parsedTags && resource.parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.parsedTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {resource.parsedTags.length > 3 && (
              <span className="text-xs text-gray-500">+{resource.parsedTags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Importance Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${importanceColorClass}`}>
              {resource.importance === 'REQUIRED' && <Star className="h-3 w-3 mr-1" />}
              {resource.importance}
            </span>

            {/* Difficulty Level */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficultyLevel)}`}>
              {resource.difficultyLevel}
            </span>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {resource.viewCount}
              </div>
              {resource._count && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {resource._count.userMaterialAccess}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Context Information */}
        {(resource.course || resource.lesson) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {resource.lesson ? (
                <span>
                  {resource.lesson.course.title} → {resource.lesson.title}
                </span>
              ) : resource.course ? (
                <span>{resource.course.title}</span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};