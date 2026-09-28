import React, { useState, useEffect, useRef } from 'react';
import type { UserClothingItem } from '../types';

/* ----------------------------
  재사용 가능한 UI Components
----------------------------- */

const InputField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {label}
    </label>
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

/* -----------------------------------------
   대분류 → 중분류 매핑 테이블
------------------------------------------ */

const CATEGORY_MAP: Record<string, string[]> = {
  상의: ['반팔 티셔츠', '긴팔 티셔츠', '셔츠/블라우스', '니트/스웨터', '후드/맨투맨'],
  하의: ['바지', '청바지', '반바지', '스커트'],
  아우터: ['코트', '자켓', '가디건', '패딩'],
  원피스: ['미니 원피스', '미디 원피스', '맥시 원피스', '점프수트'],
  신발: ['스니커즈', '로퍼', '부츠', '샌들', '힐'],
};

/* -----------------------------------------
   선택 가능한 색상 목록
------------------------------------------ */

const COLOR_LIST = [
  '블랙',
  '화이트',
  '그레이',
  '네이비',
  '블루',
  '베이지',
  '브라운',
  '카키',
  '레드',
];

export const MyClosetPage: React.FC = () => {
  const [closetItems, setClosetItems] = useState<UserClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('전체');
  const [showForm, setShowForm] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    categoryLarge: '상의',
    categorySmall: CATEGORY_MAP['상의'][0],
    color: '블랙',
    file: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ----------------------------
     옷장 데이터 가져오기
    ----------------------------- */
  const fetchClosetData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/closet', { credentials: 'include' });
      const data = await response.json();
      setClosetItems(data);
    } catch (error) {
      console.error('Failed to fetch closet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClosetData();
  }, []);

  /* ----------------------------
      파일 변경 → 미리보기 적용
    ----------------------------- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      setNewItem((prev) => ({ ...prev, file }));
    }
  };

  /* ----------------------------
       입력값 변경 처리
    ----------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setNewItem((prev) => {
      if (name === 'categoryLarge') {
        return {
          ...prev,
          categoryLarge: value,
          categorySmall: CATEGORY_MAP[value][0],
          color: value === '신발' ? '' : prev.color,
        };
      }
      return { ...prev, [name]: value };
    });
  };

  /* ----------------------------
       추가 폼 초기화
    ----------------------------- */
  const resetForm = () => {
    setShowForm(false);
    setNewItem({
      name: '',
      categoryLarge: '상의',
      categorySmall: CATEGORY_MAP['상의'][0],
      color: '블랙',
      file: null,
    });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ----------------------------
       옷 추가 API 요청
    ----------------------------- */
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.name || !newItem.file) {
      alert('이름과 이미지를 모두 입력해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('name', newItem.name);
    formData.append('category_large', newItem.categoryLarge);
    formData.append('category_small', newItem.categorySmall);

    if (newItem.categoryLarge !== '신발') {
      formData.append('color', newItem.color);
    }

    formData.append('image', newItem.file);

    try {
      const response = await fetch('/api/closet/add', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        fetchClosetData();
      } else {
        alert(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('옷 저장 오류:', error);
      alert('저장 중 오류 발생');
    }
  };

  /* ----------------------------
       옷 삭제 API 요청
    ----------------------------- */
  const deleteItem = async (itemId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/closet/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        fetchClosetData();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  /* ----------------------------
      대분류 필터 적용
    ----------------------------- */
  const filteredItems =
    filterCategory === '전체'
      ? closetItems
      : closetItems.filter((item) => item.category_large === filterCategory);

  /* ======================================================
     렌더링 시작
  ====================================================== */
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-black">My Closet</h2>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500"
          >
            Add Clothes
          </button>
        )}
      </div>

      {/* -------------------- 옷 추가 폼 -------------------- */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleAddItem} className="space-y-4">
            <InputField label="Clothing Image">
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </InputField>

            <InputField label="Name">
              <StyledInput
                type="text"
                name="name"
                value={newItem.name}
                onChange={handleChange}
              />
            </InputField>

            <InputField label="Category (Large)">
              <StyledSelect
                name="categoryLarge"
                value={newItem.categoryLarge}
                onChange={handleChange}
              >
                {Object.keys(CATEGORY_MAP).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </StyledSelect>
            </InputField>

            <InputField label="Category (Small)">
              <StyledSelect
                name="categorySmall"
                value={newItem.categorySmall}
                onChange={handleChange}
              >
                {CATEGORY_MAP[newItem.categoryLarge].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </StyledSelect>
            </InputField>

            {/* 신발은 색상 선택 UI 숨김 */}
            {newItem.categoryLarge !== '신발' && (
              <InputField label="Color">
                <StyledSelect
                  name="color"
                  value={newItem.color}
                  onChange={handleChange}
                >
                  {COLOR_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </StyledSelect>
              </InputField>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-yellow-400 py-2 px-4 rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------- 옷 리스트 + 필터 -------------------- */}
      {closetItems.length > 0 ? (
        <>

          {/* 필터 버튼 */}
          <div className="flex gap-2 mb-4">
            {['전체', '상의', '하의', '아우터', '신발'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={
                  'px-3 py-1 rounded-full text-sm border ' +
                  (filterCategory === cat
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-white text-gray-700 border-gray-300')
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 필터된 아이템 */}
          <div className="grid grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="relative rounded-lg overflow-hidden shadow"
              >
                <button
                  onClick={() => deleteItem(item.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow hover:bg-red-600"
                >
                  ✕
                </button>

                <img
                  src={item.image_path}
                  className="w-full aspect-square object-cover"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-white text-xs">
                  {item.name}
                  <br />
                  {item.category_large} / {item.category_small}
                  {item.color && item.category_large !== '신발' && (
                    <>
                      <br />
                      색상: {item.color}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Your closet is empty.
        </div>
      )}
    </div>
  );
};

