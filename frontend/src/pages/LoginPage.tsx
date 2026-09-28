import React, { useState } from 'react';
import { InputField, StyledInput } from '../components/ui/Form';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onNavigate: (view: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // -----------------------------------------------------------
  // 🔥 실제 로그인 요청 함수 (세션 쿠키 포함)
  // -----------------------------------------------------------
  const performLoginRequest = async (username: string, password: string) => {
    try {
      const API_BASE = "http://localhost:5000";

      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) return false;

      return true;
    } catch (error) {
      console.error("Login fetch error:", error);
      return false;
    }
  };

  // -----------------------------------------------------------
  // 🔥 로그인 실행
  // -----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    const loginOK = await performLoginRequest(username, password);

    setIsLoading(false);

    if (!loginOK) {
      setErrorMsg('로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.');
      return;
    }

    // App.tsx로 로그인 성공 전달
    await onLogin(username, password);
  };

  return (
    <div className="p-6 flex flex-col justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-black">환영합니다!</h2>
        <p className="text-gray-500 mt-2">개인화된 CLODY 서비스를 이용하시려면 로그인해주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        )}

        <InputField label="아이디">
          <StyledInput
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디를 입력하세요"
            required
          />
        </InputField>

        <InputField label="비밀번호">
          <StyledInput
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
          />
        </InputField>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg 
                       hover:bg-yellow-500 transition-colors disabled:bg-yellow-200"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          아직 계정이 없으신가요?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-semibold text-yellow-500 hover:underline"
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
};
