import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Bell, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  business_id?: string;
}

const NoticeSection = () => {
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentHeights, setContentHeights] = useState<{[key: string]: boolean}>({});
  const contentRefs = useRef<{[key: string]: HTMLParagraphElement | null}>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    // 내용의 높이를 체크하여 3줄을 초과하는지 확인
    const checkContentHeights = () => {
      const newHeights: {[key: string]: boolean} = {};
      Object.entries(contentRefs.current).forEach(([id, ref]) => {
        if (ref) {
          const lineHeight = parseInt(window.getComputedStyle(ref).lineHeight);
          newHeights[id] = ref.scrollHeight > lineHeight * 5;
        }
      });
      setContentHeights(newHeights);
    };

    checkContentHeights();
    // 창 크기가 변경될 때도 다시 체크
    window.addEventListener('resize', checkContentHeights);
    return () => window.removeEventListener('resize', checkContentHeights);
  }, [notices, activeNotice]);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotice = (id: string) => {
    setActiveNotice(activeNotice === id ? null : id);
  };

  const handleDetailClick = (id: string) => {
    window.scrollTo(0, 0);
    navigate(`/notice/${id}`);
  };

  const displayedNotices = showAll ? notices : notices.slice(0, 3);

  if (loading) {
    return (
      <section id="notice" className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-blue-900">공지사항</h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12">
            대전HB슈팅클럽의 새로운 소식을 확인하세요
          </p>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="notice" className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-blue-900">공지사항</h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-12">
          대전HB슈팅클럽의 새로운 소식을 확인하세요
        </p>
        
        <div className="max-w-3xl mx-auto">
          {displayedNotices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            displayedNotices.map((notice) => {
              // 2주 이내 작성된 공지인지 확인
              const twoWeeksAgo = new Date();
              twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
              const isNew = new Date(notice.created_at) > twoWeeksAgo;

              return (
                <div 
                  key={notice.id}
                  className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  <div 
                    className="p-5 cursor-pointer"
                    onClick={() => toggleNotice(notice.id)}
                  >
                    <div className="flex items-start">
                      <Bell className="h-5 w-5 text-red-600 mr-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 sm:line-clamp-1 flex-1">
                                {notice.title}
                              </h3>
                              {isNew && (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex-shrink-0 mt-0.5">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(notice.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {activeNotice === notice.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 ${
                      activeNotice === notice.id ? 'max-h-[500px]' : 'max-h-0'
                    }`}
                  >
                    <div className="p-5 border-t border-gray-100">
                      <div 
                        ref={el => contentRefs.current[notice.id] = el}
                        className="text-gray-700 leading-relaxed mb-4 overflow-hidden rich-text-content line-clamp-10"
                        dangerouslySetInnerHTML={{ __html: notice.content }} 
                      >
                      </div>
                      <div className="flex justify-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDetailClick(notice.id);
                          }}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          자세히 보기
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {notices.length > 3 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow"
              >
                {showAll ? (
                  <>
                    접기
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    더보기
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NoticeSection;