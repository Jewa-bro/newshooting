import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Business {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: 'draft' | 'recruiting' | 'closed' | 'completed';
}

const programs = [
  { 
    id: '1', 
    name: '체험 프로그램 (30분)', 
    price: '5,000원',
    description: '사격을 처음 접하시는 분들을 위한 프로그램입니다. 기본적인 자세와 안전수칙을 배우고 실제 레이저 사격을 체험해볼 수 있습니다.'
  },
  { 
    id: '2', 
    name: '체험 프로그램 (60분)', 
    price: '9,000원',
    description: '기본 체험보다 더 많은 시간을 가지고 사격을 배우고 연습할 수 있습니다. 다양한 자세와 기술을 배워볼 수 있는 프로그램입니다.'
  },
  { 
    id: '3', 
    name: '주 1회 강습 (평일)', 
    price: '100,000원',
    description: '매주 1회 정기적으로 진행되는 강습 프로그램입니다. 체계적인 커리큘럼을 통해 사격 실력을 향상시킬 수 있습니다.'
  },
  { 
    id: '4', 
    name: '주 1회 강습 (주말)', 
    price: '150,000원',
    description: '주말을 이용해 사격을 배우고 싶은 분들을 위한 프로그램입니다. 평일 강습과 동일한 커리큘럼으로 진행됩니다.'
  },
  { 
    id: '5', 
    name: '주 2회 강습 (평일)', 
    price: '200,000원',
    description: '주 2회 집중적인 훈련을 통해 빠른 실력 향상을 원하시는 분들을 위한 프로그램입니다.'
  },
  { 
    id: '6', 
    name: '주 2회 강습 (주말)', 
    price: '250,000원',
    description: '주말을 활용하여 주 2회 집중적으로 사격을 배우고 싶은 분들을 위한 프로그램입니다.'
  },
  { 
    id: '7', 
    name: '주 3회 강습 (평일)', 
    price: '300,000원',
    description: '가장 intensive한 프로그램으로, 전문가 수준의 사격 실력을 목표로 하는 분들을 위한 과정입니다.'
  }
];

const ApplicationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // NoticeDetail로부터 state로 전달받은 businessId와 businessName을 확인
  const passedState = location.state as { businessId?: string; businessName?: string } | undefined;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '',
    phone: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // 데이터를 가져오기 시작할 때 로딩 상태로 설정
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('*')
          .eq('status', 'recruiting')
          .order('created_at', { ascending: false });

        if (businessesError) throw businessesError;
        const activeBusinesses = businessesData || [];
        setBusinesses(activeBusinesses);

        // 1. location.state로부터 businessId 우선 확인
        if (passedState?.businessId) {
          const businessFromState = activeBusinesses.find(b => b.id === passedState.businessId);
          if (businessFromState) {
            setSelectedBusiness(businessFromState);
            console.log('[ApplicationForm] Business selected from state:', businessFromState.name);
            setLoading(false); // 상태에서 비즈니스 찾으면 로딩 완료
            return; // 상태에서 찾았으므로 추가 로직 불필요
          } else {
            console.warn(`[ApplicationForm] Business with ID ${passedState.businessId} from state not found or not recruiting.`);
          }
        }

        // 2. URL 파라미터 확인 (기존 로직)
        const params = new URLSearchParams(location.search);
        const noticeId = params.get('noticeId');
        const queryBusinessId = params.get('businessId'); // 이름 변경 to avoid conflict

        if (noticeId) {
          const { data: noticeData, error: noticeError } = await supabase
            .from('notices')
            .select('business_id')
            .eq('id', noticeId)
            .single();

          if (noticeError) throw noticeError;
          
          if (noticeData?.business_id) {
            const business = activeBusinesses.find(b => b.id === noticeData.business_id);
            if (business) {
              setSelectedBusiness(business);
            } else {
              console.warn(`[ApplicationForm] Business linked to notice ${noticeId} not found or not recruiting.`);
            }
          }
        } else if (queryBusinessId) {
          const business = activeBusinesses.find(b => b.id === queryBusinessId);
          if (business) {
            setSelectedBusiness(business);
          } else {
            console.warn(`[ApplicationForm] Business with ID ${queryBusinessId} from URL param not found or not recruiting.`);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        // fetchData 함수가 어떤 경로로든 완료되면 로딩 상태 해제
        // (state에서 이미 찾아서 setLoading(false) 된 경우는 제외)
        if (loading) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [location, passedState]); // passedState를 의존성 배열에 추가

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedBusiness) throw new Error('사업을 선택해주세요.');

      const birthdate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

      // 중복 신청 체크
      const { data: existingApplications, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('business_id', selectedBusiness.id)
        .eq('name', formData.name)
        .eq('phone', formData.phone);

      if (checkError) throw checkError;

      if (existingApplications && existingApplications.length > 0) {
        setError('이미 동일한 이름과 연락처로 신청한 내역이 있습니다.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('applications')
        .insert([
          {
            business_id: selectedBusiness.id,
            name: formData.name,
            birthdate,
            gender: formData.gender,
            phone: formData.phone,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      alert('신청이 완료되었습니다.');
      navigate('/');
    } catch (error: any) {
      setError(error.message || '신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Error submitting application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-center">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (selectedBusiness) {
    if (selectedBusiness.status === 'draft') {
      return (
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-yellow-800 mb-2">현재는 모집 기간이 아닙니다</h2>
              <p className="text-yellow-700 mb-4">
                해당 사업은 아직 신청자 모집이 시작되지 않았습니다.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (selectedBusiness.status === 'closed' || selectedBusiness.status === 'completed') {
      return (
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-blue-800 mb-2">모집이 완료되었습니다</h2>
              <p className="text-blue-700 mb-4">
                해당 사업은 이미 신청자 모집이 완료되었습니다.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-32">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
              참가 신청
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>돌아가기</span>
            </button>
          </div>
          <p className="text-gray-600">
            신청하실 사업을 선택하고 정보를 입력해주세요.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              신청 사업 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBusiness?.id || ''}
              onChange={(e) => {
                const selected = businesses.find(b => b.id === e.target.value);
                setSelectedBusiness(selected || null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">사업을 선택해주세요</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} ({new Date(business.start_date).toLocaleDateString()} ~ {new Date(business.end_date).toLocaleDateString()})
                </option>
              ))}
            </select>
            {selectedBusiness && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{selectedBusiness.description}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              생년월일 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleInputChange}
                  placeholder="YYYY"
                  maxLength={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="birthMonth"
                  value={formData.birthMonth}
                  onChange={handleInputChange}
                  placeholder="MM"
                  maxLength={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="birthDay"
                  value={formData.birthDay}
                  onChange={handleInputChange}
                  placeholder="DD"
                  maxLength={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              성별 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="ml-2">남성</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="ml-2">여성</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
              휴대폰번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 bg-blue-900 text-white py-3 rounded-lg transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800'
              }`}
            >
              {loading ? '신청 중...' : '신청하기'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;