import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { userApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserUpdateRequest, UserProgress, UserBadge, UserSkill } from '@/types';

export function Profile() {
  const { user, refreshToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserUpdateRequest>({});
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || '',
        profileImageUrl: user.profileImageUrl || '',
      });
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [progressResponse, badgesResponse, skillsResponse] = await Promise.all([
        userApi.getMyProgress(user.id.toString()),
        userApi.getMyBadges(user.id.toString()),
        userApi.getMySkills(user.id.toString()),
      ]);

      if (progressResponse.success && progressResponse.data) {
        setUserProgress(progressResponse.data as UserProgress[]);
      }
      if (badgesResponse.success && badgesResponse.data) {
        setUserBadges(badgesResponse.data as UserBadge[]);
      }
      if (skillsResponse.success && skillsResponse.data) {
        setUserSkills(skillsResponse.data as UserSkill[]);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('ユーザーデータの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await userApi.updateMe(formData);
      
      if (response.success) {
        setSuccess('プロフィールが正常に更新されました。');
        setIsEditing(false);
        await refreshToken(); // Refresh user data in context
      } else {
        setError(response.error || 'プロフィールの更新に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('Profile update failed:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data &&
        typeof err.response.data.message === 'string' ? err.response.data.message : 'プロフィールの更新に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || '',
        profileImageUrl: user.profileImageUrl || '',
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            プロフィール編集
          </Button>
        )}
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">基本情報</h2>
              
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="ユーザー名"
                      name="username"
                      value={formData.username || ''}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="メールアドレス"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="名前"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="姓"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      自己紹介
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="自己紹介を入力してください..."
                    />
                  </div>

                  <Input
                    label="プロフィール画像URL"
                    name="profileImageUrl"
                    value={formData.profileImageUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? '更新中...' : '保存'}
                    </Button>
                    <Button variant="secondary" type="button" onClick={handleCancel}>
                      キャンセル
                    </Button>
                  </div>
                </form>
              ) : (
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

                  {user.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">自己紹介</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{user.bio}</p>
                    </div>
                  )}

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
              )}
            </div>
          </Card>
        </div>

        {/* User Statistics */}
        <div className="space-y-6">
          {/* Badges */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">獲得バッジ ({userBadges.length})</h3>
              {isLoading ? (
                <LoadingSpinner />
              ) : userBadges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {userBadges.slice(0, 6).map((badge) => (
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
              {isLoading ? (
                <LoadingSpinner />
              ) : userSkills.length > 0 ? (
                <div className="space-y-3">
                  {userSkills.slice(0, 5).map((skill) => (
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">まだスキルを習得していません</p>
              )}
            </div>
          </Card>

          {/* Learning Progress Summary */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">学習進捗</h3>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
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
                    <span className="text-sm text-gray-600">総学習時間</span>
                    <span className="text-sm font-medium">-</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}