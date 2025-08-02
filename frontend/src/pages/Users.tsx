import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { userApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { User, UserListQuery, PaginatedResponse, UserCreateRequest } from '@/types';

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState<UserListQuery>({
    page: 1,
    limit: 10,
    search: '',
    role: undefined,
    isActive: undefined,
  });

  const [createFormData, setCreateFormData] = useState<UserCreateRequest>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER',
    bio: '',
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await userApi.getAll(filters);
      
      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<User>;
        setUsers(paginatedData.data);
        setPagination({
          page: paginatedData.page,
          limit: paginatedData.limit,
          total: paginatedData.total,
          totalPages: paginatedData.totalPages,
        });
      } else {
        setError(response.error || 'ユーザー一覧の取得に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('Failed to load users:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data &&
        typeof err.response.data.message === 'string' ? err.response.data.message : 'ユーザー一覧の取得に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UserListQuery, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const response = await userApi.create(createFormData);
      
      if (response.success) {
        setSuccess('ユーザーが正常に作成されました。');
        setShowCreateModal(false);
        setCreateFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'USER',
          bio: '',
        });
        loadUsers(); // Refresh the list
      } else {
        setError(response.error || 'ユーザーの作成に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('Failed to create user:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data &&
        typeof err.response.data.message === 'string' ? err.response.data.message : 'ユーザーの作成に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`本当に ${userName} を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const response = await userApi.delete(userId.toString());
      
      if (response.success) {
        setSuccess(`${userName} が正常に削除されました。`);
        loadUsers(); // Refresh the list
      } else {
        setError(response.error || 'ユーザーの削除に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('Failed to delete user:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data &&
        typeof err.response.data.message === 'string' ? err.response.data.message : 'ユーザーの削除に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Only admins can access this page
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">このページにアクセスする権限がありません。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          新規ユーザー作成
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">フィルター</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="検索"
              value={filters.search || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
              placeholder="名前、ユーザー名、メールアドレス"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
              <select
                value={filters.role || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('role', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">すべて</option>
                <option value="USER">ユーザー</option>
                <option value="ADMIN">管理者</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">すべて</option>
                <option value="true">アクティブ</option>
                <option value="false">非アクティブ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">表示件数</label>
              <select
                value={filters.limit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={5}>5件</option>
                <option value={10}>10件</option>
                <option value={25}>25件</option>
                <option value={50}>50件</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* User List */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">ユーザー一覧</h2>
            <span className="text-sm text-gray-600">
              {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ロール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              {user.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary-700 font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? '管理者' : 'ユーザー'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'アクティブ' : '非アクティブ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP')
                            : '未ログイン'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link 
                              to={`/users/${user.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              詳細
                            </Link>
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="text-red-600 hover:text-red-900"
                              >
                                削除
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      前へ
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      次へ
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        {pagination.total}件中{' '}
                        <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                        {' '}から{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>
                        {' '}件を表示
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <Button
                          variant="secondary"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="rounded-l-md"
                        >
                          前へ
                        </Button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNumber = Math.max(1, pagination.page - 2) + i;
                          if (pageNumber > pagination.totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={pageNumber === pagination.page ? "primary" : "secondary"}
                              onClick={() => handlePageChange(pageNumber)}
                              className="rounded-none"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="secondary"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                          className="rounded-r-md"
                        >
                          次へ
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">条件に一致するユーザーが見つかりません。</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">新規ユーザー作成</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  label="ユーザー名"
                  name="username"
                  value={createFormData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
                
                <Input
                  label="メールアドレス"
                  name="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                
                <Input
                  label="パスワード"
                  name="password"
                  type="password"
                  value={createFormData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="名前"
                    name="firstName"
                    value={createFormData.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                  
                  <Input
                    label="姓"
                    name="lastName"
                    value={createFormData.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
                  <select
                    value={createFormData.role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateFormData(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USER">ユーザー</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介（任意）</label>
                  <textarea
                    value={createFormData.bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="自己紹介を入力してください..."
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? '作成中...' : '作成'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}