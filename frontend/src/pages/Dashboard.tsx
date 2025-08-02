import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export default function Dashboard() {
  const { user } = useAuth();

  const navigationCards = [
    {
      title: 'コース',
      description: '利用可能なコースを閲覧し、学習を開始しましょう',
      icon: (
        <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/courses',
      buttonText: 'コースを見る',
    },
    {
      title: '進捗管理',
      description: '学習の進捗状況を確認し、目標を達成しましょう',
      icon: (
        <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/progress',
      buttonText: '進捗を確認',
    },
    {
      title: 'Q&A',
      description: '質問を投稿したり、他の学習者と知識を共有しましょう',
      icon: (
        <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/qa',
      buttonText: 'Q&Aを見る',
    },
  ];

  const adminCards = [
    {
      title: 'ユーザー管理',
      description: 'システムユーザーの管理とアカウント設定',
      icon: (
        <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: '/users',
      buttonText: 'ユーザー管理',
    },
    {
      title: 'システム管理',
      description: 'システム設定とコンテンツ管理',
      icon: (
        <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/admin',
      buttonText: '管理画面',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          ダッシュボード
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {user ? `${user.name}さん、おかえりなさい！` : 'こんにちは！'}
          学習を続けましょう。
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-600">12</div>
          <div className="text-sm text-gray-600">受講中のコース</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-600">75%</div>
          <div className="text-sm text-gray-600">平均進捗率</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-600">28</div>
          <div className="text-sm text-gray-600">獲得バッジ</div>
        </Card>
      </section>

      {/* Navigation Cards */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">学習メニュー</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-4">
                  {card.icon}
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    {card.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  {card.description}
                </p>
                <Link to={card.href}>
                  <Button variant="outline" fullWidth>
                    {card.buttonText}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Admin Section - Only shown for admins */}
      {user?.role === 'ADMIN' && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">管理メニュー</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow border-primary-200">
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    {card.icon}
                    <h3 className="ml-3 text-lg font-semibold text-gray-900">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6 flex-grow">
                    {card.description}
                  </p>
                  <Link to={card.href}>
                    <Button variant="primary" fullWidth>
                      {card.buttonText}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">最近の活動</h2>
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">React基礎コース - レッスン3を完了</p>
                <p className="text-sm text-gray-500">2時間前</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                完了
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">JavaScript中級コース - レッスン5を開始</p>
                <p className="text-sm text-gray-500">1日前</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                進行中
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">Q&A: 「非同期処理について」に回答</p>
                <p className="text-sm text-gray-500">3日前</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Q&A
              </span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}