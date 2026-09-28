import React from 'react';

// 아이콘 SVG 컴포넌트들
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

type AppView =
  | 'splash'
  | 'home'
  | 'login'
  | 'register'
  | 'my-page'
  | 'my-closet'
  | 'recommendation';

interface HeaderProps {
  isLoggedIn: boolean;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  view: AppView;
  onBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  onNavigate,
  onLogout,
  view,
  onBack,
}) => {
  const showBackButton = view !== 'home' && view !== 'splash';

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-black shadow-md">
      <div className="max-w-md mx-auto px-4 h-16 flex justify-between items-center relative">

        {/* 왼쪽: 뒤로가기 + Closet 이동 */}
        <div className="flex items-center space-x-4 text-sm font-medium text-yellow-400 min-w-[40px]">
          {showBackButton && (
            <button
              onClick={onBack}
              className="hover:text-yellow-300 transition-colors"
            >
              <BackIcon />
            </button>
          )}

          {/* 🔥 Closet 버튼을 왼쪽으로 이동 */}
          <button
            onClick={() => onNavigate('my-closet')}
            className="text-sm font-medium hover:text-yellow-300 transition-colors"
          >
            Closet
          </button>
        </div>

        {/* 가운데 로고 */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1
            onClick={() => onNavigate('home')}
            className="text-2xl font-black tracking-wider cursor-pointer text-yellow-400"
          >
            CLODY
          </h1>
        </div>

        {/* 오른쪽: 마이페이지 / 로그인 (Closet 제거됨) */}
        <div className="flex items-center space-x-3 text-yellow-400">

          {/* 마이페이지 아이콘 */}
          <button
            onClick={() => onNavigate('my-page')}
            className="hover:text-yellow-300 transition-colors"
          >
            <UserIcon />
          </button>

          {/* 로그인 / 로그아웃 */}
          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="text-sm font-medium hover:text-yellow-300 transition-colors"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-medium hover:text-yellow-300 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
