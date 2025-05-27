import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, X, Check, AlertTriangle } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'recruiting' | 'closed' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  created_at: string;
  max_participants?: number | null;
}

const BusinessForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'recruiting' | 'closed' | 'completed' | 'cancelled'>('draft');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);

  const getUiStatus = (dbStatus: Business['status']): 'draft' | 'recruiting' | 'closed' => {
    if (dbStatus === 'draft') return 'draft';
    if (dbStatus === 'recruiting') return 'recruiting';
    if (['closed', 'completed', 'cancelled'].includes(dbStatus)) return 'closed';
    return 'draft';
  };

  useEffect(() => {
    if (isEditMode) {
      fetchBusiness();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setBusiness(data);
        setName(data.name);
        setDescription(data.description);
        setStatus(data.status);
        setStartDate(data.start_date);
        setEndDate(data.end_date);
        setMaxParticipants(data.max_participants ?? undefined);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching business:', err);
      const typedError = err as { message?: string };
      setError(`사업 정보 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !description || !startDate || !endDate) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }

    try {
      if (isEditMode && business) {
        const { error } = await supabase
          .from('businesses')
          .update({
            name,
            description,
            status,
            start_date: startDate,
            end_date: endDate,
            max_participants: maxParticipants
          })
          .eq('id', business.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('businesses')
          .insert([{
            name,
            description,
            status,
            start_date: startDate,
            end_date: endDate,
            max_participants: maxParticipants
          }]);

        if (error) throw error;
      }

      navigate('/admin/dashboard', { state: { activeTab: 'business' } });
    } catch (err) {
      console.error('Error saving business:', err);
      const typedError = err as { message?: string };
      setError(`사업 ${isEditMode ? '수정' : '생성'} 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              {isEditMode ? `사업 수정: ${business?.name}` : '새 사업 추가'}
            </h1>
            <button
              onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'business' } })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex items-center space-x-2"
            >
              <X size={20} />
              <span>취소</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">사업명</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                id="description"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  id="status"
                  value={getUiStatus(status)}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setStatus(e.target.value as 'draft' | 'recruiting' | 'closed');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow"
                >
                  <option value="draft">준비중</option>
                  <option value="recruiting">모집중</option>
                  <option value="closed">종료</option>
                </select>
              </div>

              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                  최대 참가 인원 (선택)
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  value={maxParticipants === undefined ? '' : maxParticipants}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'business' } })}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 transition-all duration-150 flex items-center justify-center"
              >
                <X size={18} className="mr-2"/> 취소
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all duration-150 flex items-center justify-center"
              >
                {isEditMode ? (
                  <>
                    <Check size={18} className="mr-2"/> 변경사항 저장
                  </>
                ) : (
                  <>
                    <Plus size={18} className="mr-2"/> 사업 추가
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessForm; 