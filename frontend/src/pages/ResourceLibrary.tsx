import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceList } from '@/components/resources/ResourceList';

export const ResourceLibrary: React.FC = () => {
  const { t } = useTranslation('resources');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                {t('library.title', 'Resource Library')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('library.description', 'Browse and discover learning resources across all courses and topics')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ResourceList
          title=""
          showFilters={true}
          showSearch={true}
          className="bg-transparent"
        />
      </div>
    </div>
  );
};