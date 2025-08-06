import React from 'react';
import type { ImportanceLevel, ResourceType } from '@/types';

export const getImportanceColor = (importance: ImportanceLevel): string => {
  switch (importance) {
    case 'REQUIRED':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'RECOMMENDED':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'REFERENCE':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getResourceTypeIcon = (type: ResourceType): React.ReactNode => {
  switch (type) {
    case 'YOUTUBE':
      return '🎥';
    case 'WEBSITE':
      return '🌐';
    case 'DOCUMENT':
      return '📄';
    case 'FILE':
      return '📁';
    case 'TOOL':
      return '🔧';
    default:
      return '📎';
  }
};

export const getResourceTypeLabel = (type: ResourceType): string => {
  switch (type) {
    case 'YOUTUBE':
      return 'YouTube Video';
    case 'WEBSITE':
      return 'Website';
    case 'DOCUMENT':
      return 'Document';
    case 'FILE':
      return 'File';
    case 'TOOL':
      return 'Tool';
    default:
      return 'Resource';
  }
};

export const getDifficultyColor = (level: string): string => {
  switch (level) {
    case 'BEGINNER':
      return 'text-green-600 bg-green-50';
    case 'INTERMEDIATE':
      return 'text-yellow-600 bg-yellow-50';
    case 'ADVANCED':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getImportanceLabel = (importance: ImportanceLevel): string => {
  switch (importance) {
    case 'REQUIRED':
      return 'Required';
    case 'RECOMMENDED':
      return 'Recommended';
    case 'REFERENCE':
      return 'Reference';
    default:
      return 'Reference';
  }
};