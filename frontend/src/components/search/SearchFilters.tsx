import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { 
  MaterialType, 
  ResourceType, 
  DifficultyLevel, 
  ImportanceLevel 
} from '@/types';

interface SearchQuery {
  search?: string;
  materialType?: MaterialType;
  resourceType?: ResourceType;
  difficulty?: DifficultyLevel;
  importance?: ImportanceLevel;
  category?: 'MAIN' | 'SUPPLEMENTARY';
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

interface SearchFiltersProps {
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  onReset: () => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function SearchFilters({ 
  query, 
  onQueryChange, 
  onReset, 
  onSearch,
  isLoading = false 
}: SearchFiltersProps) {
  const { t } = useTranslation(['search', 'common']);

  const handleSearchChange = (value: string) => {
    onQueryChange({ ...query, search: value || undefined });
  };

  const handleFilterChange = (key: keyof SearchQuery, value: string | boolean) => {
    onQueryChange({ 
      ...query, 
      [key]: value === 'all' || value === '' ? undefined : value,
      page: 1 // Reset to first page when filter changes
    });
  };

  const materialTypes: MaterialType[] = ['FILE', 'URL', 'MANUAL_PROGRESS'];
  const resourceTypes: ResourceType[] = ['FILE', 'WEBSITE', 'YOUTUBE', 'DOCUMENT', 'TOOL'];
  const difficulties: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const importanceLevels: ImportanceLevel[] = ['REQUIRED', 'RECOMMENDED', 'REFERENCE'];

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{t('search:filters')}</h3>
        <Button variant="outline" size="sm" onClick={onReset} disabled={isLoading}>
          {t('search:clearFilters')}
        </Button>
      </div>

      <div className="space-y-3">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common:search')}
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder={t('search:searchPlaceholder')}
              value={query.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              disabled={isLoading}
            />
            <Button
              onClick={onSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? t('search:loading') : t('common:search')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
          {/* Material Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search:materialType')}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={query.materialType || 'all'}
              onChange={(e) => handleFilterChange('materialType', e.target.value)}
              disabled={isLoading}
            >
              <option value="all">{t('search:allTypes')}</option>
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`search:${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search:resourceType')}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={query.resourceType || 'all'}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              disabled={isLoading}
            >
              <option value="all">{t('search:allTypes')}</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`search:${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search:difficulty')}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={query.difficulty || 'all'}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              disabled={isLoading}
            >
              <option value="all">{t('search:allDifficulties')}</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {t(`search:${difficulty.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Importance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search:importance')}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={query.importance || 'all'}
              onChange={(e) => handleFilterChange('importance', e.target.value)}
              disabled={isLoading}
            >
              <option value="all">{t('search:allImportance')}</option>
              {importanceLevels.map((importance) => (
                <option key={importance} value={importance}>
                  {t(`search:${importance.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search:category')}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={query.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              disabled={isLoading}
            >
              <option value="all">{t('search:allCategories')}</option>
              <option value="MAIN">{t('search:main')}</option>
              <option value="SUPPLEMENTARY">{t('search:supplementary')}</option>
            </select>
          </div>

          {/* Published Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search:status')}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={query.isPublished === undefined ? 'all' : query.isPublished ? 'published' : 'unpublished'}
              onChange={(e) => handleFilterChange('isPublished', e.target.value === 'all' ? undefined : e.target.value === 'published')}
              disabled={isLoading}
            >
              <option value="all">{t('search:allStatus')}</option>
              <option value="published">{t('search:published')}</option>
              <option value="unpublished">{t('search:unpublished')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}