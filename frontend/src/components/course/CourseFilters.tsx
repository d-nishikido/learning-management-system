import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { CourseQueryParams, DifficultyLevel } from '@/types';

interface CourseFiltersProps {
  filters: CourseQueryParams;
  onFiltersChange: (filters: CourseQueryParams) => void;
  onReset: () => void;
  categories: string[];
}

export function CourseFilters({ filters, onFiltersChange, onReset, categories }: CourseFiltersProps) {
  const { t } = useTranslation(['course', 'common']);
  const difficulties: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ 
      ...filters, 
      category: category === 'all' ? undefined : category 
    });
  };

  const handleDifficultyChange = (difficulty: string) => {
    onFiltersChange({ 
      ...filters, 
      difficultyLevel: difficulty === 'all' ? undefined : difficulty as DifficultyLevel 
    });
  };

  const handlePublishedChange = (published: string) => {
    if (published === 'all') {
      onFiltersChange({ ...filters, isPublished: undefined });
    } else {
      onFiltersChange({ ...filters, isPublished: published === 'published' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{t('course:filters')}</h3>
        <Button variant="outline" size="sm" onClick={onReset}>
          {t('common:reset')}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common:search')}
          </label>
          <Input
            type="text"
            placeholder={t('course:searchPlaceholder')}
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common:category')}
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.category || 'all'}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="all">{t('course:allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common:difficulty')}
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.difficultyLevel || 'all'}
            onChange={(e) => handleDifficultyChange(e.target.value)}
          >
            <option value="all">{t('course:allDifficulties')}</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {t(`course:difficulty.${difficulty}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Published Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common:status')}
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.isPublished === undefined ? 'all' : filters.isPublished ? 'published' : 'unpublished'}
            onChange={(e) => handlePublishedChange(e.target.value)}
          >
            <option value="all">{t('course:allCourses')}</option>
            <option value="published">{t('course:publishedOnly')}</option>
            <option value="unpublished">{t('course:unpublishedOnly')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}