import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { materialApi, resourceApi } from '@/services/api';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import type { 
  LearningMaterial, 
  LearningResource, 
  ApiRequestError,
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

interface SearchResult {
  type: 'material' | 'resource';
  data: LearningMaterial | LearningResource;
}

export function Search() {
  const { user } = useAuth();
  const { t } = useTranslation(['search', 'common']);
  
  const [query, setQuery] = useState<SearchQuery>({
    page: 1,
    limit: 12,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: SearchQuery, append = false) => {
    if (!searchQuery.search && !searchQuery.materialType && !searchQuery.resourceType && 
        !searchQuery.difficulty && !searchQuery.importance && !searchQuery.category && 
        searchQuery.isPublished === undefined) {
      // No search criteria provided
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      return;
    }

    try {
      setError(null);
      if (!append) {
        setIsLoading(true);
        setResults([]);
      } else {
        setIsLoadingMore(true);
      }

      // Search both materials and resources in parallel
      const promises = [];
      
      // Search materials if no resource-specific filters are set
      if (!searchQuery.resourceType && !searchQuery.importance) {
        const materialQuery = {
          search: searchQuery.search,
          materialType: searchQuery.materialType,
          materialCategory: searchQuery.category,
          isPublished: searchQuery.isPublished,
          page: searchQuery.page || 1,
          limit: Math.ceil((searchQuery.limit || 12) / 2), // Split limit between materials and resources
        };
        promises.push(
          materialApi.search(materialQuery).then(response => ({
            type: 'materials' as const,
            data: response
          }))
        );
      }

      // Search resources if no material-specific filters are set  
      if (!searchQuery.materialType && !searchQuery.category) {
        const resourceQuery = {
          search: searchQuery.search,
          resourceType: searchQuery.resourceType,
          difficultyLevel: searchQuery.difficulty,
          importance: searchQuery.importance,
          isPublished: searchQuery.isPublished,
          page: searchQuery.page || 1,
          limit: Math.ceil((searchQuery.limit || 12) / 2), // Split limit between materials and resources
        };
        promises.push(
          resourceApi.search(resourceQuery).then(response => ({
            type: 'resources' as const,
            data: response
          }))
        );
      }

      const responses = await Promise.all(promises);
      const newResults: SearchResult[] = [];
      let combinedTotal = 0;
      let maxPages = 1;

      responses.forEach(response => {
        if (response.data.success && response.data.data) {
          if (response.type === 'materials') {
            const materials = response.data.data.materials || [];
            materials.forEach((material: LearningMaterial) => {
              newResults.push({ type: 'material', data: material });
            });
            combinedTotal += response.data.data.total || 0;
            maxPages = Math.max(maxPages, response.data.data.totalPages || 1);
          } else if (response.type === 'resources') {
            const resources = response.data.data.resources || [];
            resources.forEach((resource: LearningResource) => {
              newResults.push({ type: 'resource', data: resource });
            });
            combinedTotal += response.data.data.total || 0;
            maxPages = Math.max(maxPages, response.data.data.totalPages || 1);
          }
        }
      });

      // Sort results by relevance (title matches first, then description matches)
      if (searchQuery.search) {
        const searchTerm = searchQuery.search.toLowerCase();
        newResults.sort((a, b) => {
          const aTitle = a.data.title.toLowerCase();
          const bTitle = b.data.title.toLowerCase();
          const aTitleMatch = aTitle.includes(searchTerm);
          const bTitleMatch = bTitle.includes(searchTerm);
          
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;
          
          return aTitle.localeCompare(bTitle);
        });
      }

      if (append) {
        setResults(prev => [...prev, ...newResults]);
      } else {
        setResults(newResults);
        setCurrentPage(searchQuery.page || 1);
      }
      
      setTotal(combinedTotal);
      setTotalPages(maxPages);
      setHasSearched(true);
    } catch (err) {
      const errorMessage = (err as ApiRequestError).response?.data?.message || 
        t('search:error');
      setError(errorMessage);
      if (!append) {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [t]);

  // Initial empty state
  useEffect(() => {
    if (!hasSearched) {
      setResults([]);
      setTotal(0);
      setError(null);
    }
  }, [hasSearched]);

  const handleSearch = () => {
    performSearch({ ...query, page: 1 });
  };

  const handleQueryChange = (newQuery: SearchQuery) => {
    setQuery(newQuery);
  };

  const handleReset = () => {
    const defaultQuery: SearchQuery = {
      page: 1,
      limit: 12,
    };
    setQuery(defaultQuery);
    setResults([]);
    setTotal(0);
    setError(null);
    setHasSearched(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      performSearch({ ...query, page: nextPage }, true);
    }
  };

  const handleRetry = () => {
    performSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('search:title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('search:description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <SearchFilters
            query={query}
            onQueryChange={handleQueryChange}
            onReset={handleReset}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            total={total}
            page={currentPage}
            totalPages={totalPages}
            onLoadMore={handleLoadMore}
            onRetry={handleRetry}
            hasMore={currentPage < totalPages}
            isLoadingMore={isLoadingMore}
          />
        </div>
      </div>
    </div>
  );
}