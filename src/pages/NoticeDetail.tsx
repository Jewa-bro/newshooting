import React, { useEffect, useState, MouseEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { supabase, Session as SupabaseSession, AuthChangeEvent } from '../lib/supabase';

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  business_id?: string;
}

interface Business {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: 'draft' | 'recruiting' | 'closed' | 'completed';
}

const NoticeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNoticeData = async (noticeId: string | undefined) => {
    if (!noticeId) {
      console.warn('[NoticeDetail] fetchNoticeData called without an ID. Aborting fetch.');
      setNotice(null);
      setBusiness(null);
      setLoading(false);
      return;
    }

    console.log(`[NoticeDetail] Proceeding to fetch notice for ID: ${noticeId}. Setting loading to true.`);
    setLoading(true);
    try {
      console.log(`[NoticeDetail] Attempting to fetch notice for ID: ${noticeId} from Supabase.`);
      
      const { data: noticeData, error: noticeError } = await supabase
        .from('notices')
        .select('*')
        .eq('id', noticeId)
        .single();
      console.log(`[NoticeDetail] Supabase notice query awaited for ID: ${noticeId}. Error: ${JSON.stringify(noticeError)}, HasData: ${!!noticeData}`);

      if (noticeError) {
        console.error('Error fetching notice data:', noticeError);
        setNotice(null);
        setBusiness(null);
      } else {
        setNotice(noticeData);

        if (noticeData && noticeData.business_id) {
          try {
            const { data: businessArray, error: businessError } = await supabase
              .from('businesses')
              .select('*')
              .eq('id', noticeData.business_id)
              .limit(1);

            if (businessError) {
              console.error('Error fetching business data specifically:', businessError);
              setBusiness(null);
            } else if (businessArray && businessArray.length > 0) {
              setBusiness(businessArray[0]);
            } else {
              console.warn(`[NoticeDetail] Business not found for id: ${noticeData.business_id}`);
              setBusiness(null);
            }
          } catch (innerError: any) {
            console.error('Error during business data fetch (inner catch):', innerError);
            setBusiness(null);
          }
        } else {
          setBusiness(null);
        }
      }
    } catch (error: any) {
      console.error('Overall error in fetchNoticeData (outer catch):', error);
      setNotice(null);
      setBusiness(null);
    } finally {
      console.log(`[NoticeDetail] fetchNoticeData finished for ID: ${noticeId}. Attempting to set loading to false.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    console.log('[NoticeDetail] useEffect runs. Current ID from useParams:', id);

    if (id) {
      console.log('[NoticeDetail] ID is present. Calling fetchNoticeData.');
      fetchNoticeData(id);
    } else {
      console.log('[NoticeDetail] useEffect: ID is not available. Setting loading to false.');
      if (isActive) {
        setLoading(false);
        setNotice(null);
        setBusiness(null);
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: SupabaseSession | null) => {
        if (!isActive) {
          console.log('[NoticeDetail Auth] Listener called, but isActive is false. Aborting.');
          return;
        }
        console.log(`[NoticeDetail Auth] Event: ${event}, Session: ${session ? 'exists' : 'null'}. Current ID in useEffect closure: ${id}`);
      }
    );
    
    return () => {
      console.log('[NoticeDetail] Cleaning up useEffect.');
      isActive = false;
      if (authListener && authListener.subscription) {
        console.log('[NoticeDetail] Unsubscribing from onAuthStateChange listener.');
        authListener.subscription.unsubscribe();
      }
    };
  }, [id]);

  const handleGoToList = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-4">
              존재하지 않는 공지사항입니다.
            </h1>
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-3">
                {notice.title}
              </h1>
              <p className="text-gray-500">
                {new Date(notice.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div 
              className="prose max-w-none mb-8 rich-text-content"
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />

            {business && business.status === 'recruiting' && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-900">{business.name}</h3>
                    <p className="mt-1 text-sm text-blue-800">
                      {new Date(business.start_date).toLocaleDateString()} ~ {new Date(business.end_date).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-blue-800">{business.description}</p>
                    <Link
                      to="/apply"
                      state={{ businessId: business.id, businessName: business.name }}
                      className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      신청하기
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <Link
                to="/"
                onClick={handleGoToList}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;