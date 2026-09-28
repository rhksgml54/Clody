// src/components/RegisterPage.tsx

import React, { useState } from 'react';

interface RegisterPageProps {
  onRegister: (username: string, password: string) => Promise<boolean>;
  onNavigate: (view: any) => void;
}

const InputField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
  />
);

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onNavigate }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'female' as 'female' | 'male',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 🔹 API 대신 localStorage 기반 onRegister 사용
      const success = await onRegister(formData.username, formData.password);

      if (success) {
        alert('회원가입 성공! 로그인 페이지로 이동합니다.');
        onNavigate('login');
      } else {
        setError('회원가입에 실패했습니다. 다른 아이디로 다시 시도해주세요.');
      }
    } catch {
      setError('회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col justify-center h-full">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-black">회원가입</h2>
        <p className="text-gray-500 mt-2">Clody에 가입하고 개인 맞춤 코디 추천을 받아보세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Username">
          <StyledInput
            type="text"
            name="ID"
            value={formData.username}
            onChange={handleChange}
            placeholder="사용할 아이디"
            required
          />
        </InputField>

        <InputField label="Password">
          <StyledInput
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호"
            required
          />
        </InputField>

        <InputField label="Confirm Password">
          <StyledInput
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호 확인"
            required
          />
        </InputField>

        <InputField label="Gender">
          <StyledSelect name="gender" value={formData.gender} onChange={handleChange}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </StyledSelect>
        </InputField>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-yellow-200"
          >
            {isLoading ? '계정 생성 중...' : '회원가입'}
          </button>
        </div>  
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-semibold text-yellow-500 hover:underline"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
};
