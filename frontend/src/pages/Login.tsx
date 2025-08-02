import { LoginFormWithoutAuth } from '@/components/auth/LoginFormWithoutAuth';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            アカウントにログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            学習管理システムへようこそ
          </p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow">
          <LoginFormWithoutAuth />
        </div>
        
        {/* Sample Credentials */}
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">テスト用アカウント</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <p className="text-sm font-medium text-gray-700">管理者アカウント</p>
              <div className="mt-1 font-mono text-xs text-gray-600">
                <p>メール: admin@test.example.com</p>
                <p>パスワード: Admin123!</p>
              </div>
            </div>
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <p className="text-sm font-medium text-gray-700">一般ユーザーアカウント</p>
              <div className="mt-1 font-mono text-xs text-gray-600">
                <p>メール: user1@test.example.com</p>
                <p>パスワード: User123!</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            ※ これらは開発・テスト環境用のサンプルアカウントです
          </p>
        </div>
      </div>
    </div>
  );
}