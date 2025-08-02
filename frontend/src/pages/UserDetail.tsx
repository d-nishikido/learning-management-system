import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { userApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { User, UserProgress, UserBadge, UserSkill } from '@/types';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const isCurrentUser = currentUser?.id.toString() === id;
  const canEdit = currentUser?.role === 'ADMIN' || isCurrentUser;

  useEffect(() => {
    if (id) {
      loadUserData();
    }
  }, [id]);

  const loadUserData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError('');

      const [userResponse, progressResponse, badgesResponse, skillsResponse] = await Promise.all([
        userApi.getById(id),
        userApi.getMyProgress(id),
        userApi.getMyBadges(id),
        userApi.getMySkills(id),
      ]);

      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data as User);
      } else {
        setError('ユーザーが見つかりません。');
        return;
      }

      if (progressResponse.success && progressResponse.data) {
        setUserProgress(progressResponse.data as UserProgress[]);
      }
      if (badgesResponse.success && badgesResponse.data) {
        setUserBadges(badgesResponse.data as UserBadge[]);
      }
      if (skillsResponse.success && skillsResponse.data) {
        setUserSkills(skillsResponse.data as UserSkill[]);
      }
    } catch (err: unknown) {
      console.error('Failed to load user data:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data &&
        typeof err.response.data.message === 'string' ? err.response.data.message : 'ユーザーデータの取得に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !id) return;
    
    if (!confirm(`本当に ${user.name} を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await userApi.delete(id);
      
      if (response.success) {
        navigate('/users');
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error || 'ユーザーが見つかりません。'}</div>
        </div>
        <div className="mt-4">
          <Link to="/users" className="text-primary-600 hover:text-primary-700">
            ← ユーザー一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="text-sm breadcrumbs mb-2">
            <Link to="/users" className="text-primary-600 hover:text-primary-700">
              ユーザー一覧
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-600">{user.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600">@{user.username}</p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Link to={isCurrentUser ? '/profile' : `/users/${id}/edit`}>
              <Button>編集</Button>
            </Link>
            {currentUser?.role === 'ADMIN' && !isCurrentUser && (
              <Button 
                variant="secondary" 
                onClick={handleDeleteUser}
                className="text-red-600 hover:text-red-700"
              >
                削除
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">基本情報</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ユーザー名</label>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">メールアドレス</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">名前</label>
                    <p className="text-gray-900">{user.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">姓</label>
                    <p className="text-gray-900">{user.lastName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ロール</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'ADMIN' ? '管理者' : 'ユーザー'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ステータス</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'アクティブ' : '非アクティブ'}
                    </span>
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">自己紹介</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{user.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">登録日</label>
                    <p className="text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">最終ログイン</label>
                      <p className="text-gray-900">
                        {new Date(user.lastLoginAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Learning Progress */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">学習進捗詳細</h2>
              {userProgress.length > 0 ? (
                <div className="space-y-4">
                  {userProgress.slice(0, 10).map((progress) => (
                    <div key={progress.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">コース ID: {progress.courseId}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          progress.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800'
                            : progress.status === 'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {progress.status === 'COMPLETED' ? '完了' : 
                           progress.status === 'IN_PROGRESS' ? '進行中' : '未開始'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${progress.progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>進捗: {progress.progressPercentage}%</span>
                        {progress.lastAccessedAt && (
                          <span>最終アクセス: {new Date(progress.lastAccessedAt).toLocaleDateString('ja-JP')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">学習進捗データがありません。</p>
              )}
            </div>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* User Avatar */}
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-700 text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-gray-600">@{user.username}</p>
            </div>
          </Card>

          {/* Badges */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">獲得バッジ ({userBadges.length})</h3>
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {userBadges.slice(0, 8).map((badge) => (
                    <div key={badge.id} className="text-center p-2 border rounded-lg">
                      <div className="w-8 h-8 mx-auto mb-1 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-sm">🏆</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900">{badge.badgeName}</p>
                      <p className="text-xs text-gray-500">{badge.rarity}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">まだバッジを獲得していません</p>
              )}
            </div>
          </Card>

          {/* Skills */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">スキル ({userSkills.length})</h3>
              {userSkills.length > 0 ? (
                <div className="space-y-3">
                  {userSkills.slice(0, 8).map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">{skill.skillName}</span>
                        <span className="text-xs text-gray-500">Lv.{skill.level}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((skill.totalPoints / 1000) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{skill.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">まだスキルを習得していません</p>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">統計</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">完了したコース</span>
                  <span className="text-sm font-medium">
                    {userProgress.filter(p => p.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">進行中のコース</span>
                  <span className="text-sm font-medium">
                    {userProgress.filter(p => p.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">獲得バッジ</span>
                  <span className="text-sm font-medium">{userBadges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">習得スキル</span>
                  <span className="text-sm font-medium">{userSkills.length}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}