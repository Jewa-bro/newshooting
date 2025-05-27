import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Popup {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  priority: number;
  is_active: boolean;
  linked_notice_id?: string | null;
  created_at?: string;
}

interface PopupModalProps {
  popupToPreview?: Popup | null;    // 미리보기할 팝업 데이터
  isPreview?: boolean;             // 미리보기 모드 여부
  onClosePreview?: () => void;     // 미리보기 닫기 콜백
}

const PopupModal: React.FC<PopupModalProps> = ({ popupToPreview, isPreview = false, onClosePreview }) => {
  const navigate = useNavigate();
  const [popups, setPopups] = useState<Popup[]>(popupToPreview && isPreview ? [popupToPreview] : []);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(isPreview && !!popupToPreview);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPreview && popupToPreview) {
      setPopups([popupToPreview]);
      setCurrentPopupIndex(0);
      setShowPopup(true);
      console.log('[PopupModal] Preview mode: Displaying popupToPreview', popupToPreview);
    } else if (!isPreview) {
      // fetchActivePopups(); // 일반 모드 팝업 로드는 다른 useEffect에서 처리
    }
  }, [isPreview, popupToPreview]);

  useEffect(() => {
    if (!isPreview) {
      fetchActivePopups();
    }
  }, [isPreview]); // isPreview가 false일 때만 실행

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 또는 showPopup이 false로 변경될 때 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPopup]);

  const fetchActivePopups = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      console.log('[PopupModal] fetchActivePopups: Fetching active popups...');
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('priority', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('[PopupModal] fetchActivePopups: Fetched raw popups:', data);
        const visiblePopups = data.filter((popup: Popup) => {
          if (!popup.id) {
            console.warn('[PopupModal] fetchActivePopups: Popup with no ID found, filtering out.', popup);
            return false;
          }
          const hideUntilKey = `popup_${popup.id}_hide_until`;
          const hideUntilTimestamp = localStorage.getItem(hideUntilKey);
          if (hideUntilTimestamp && new Date().getTime() < parseInt(hideUntilTimestamp)) {
            console.log(`[PopupModal] fetchActivePopups: Popup ID ${popup.id} is hidden, filtering out.`);
            return false;
          }
          return true;
        });

        console.log('[PopupModal] fetchActivePopups: Visible popups after filtering:', visiblePopups);
        if (visiblePopups.length > 0) {
          setPopups(visiblePopups);
          setCurrentPopupIndex(0);
          setShowPopup(true);
        } else {
          console.log('[PopupModal] fetchActivePopups: No visible popups to display.');
          setShowPopup(false);
        }
      } else {
        console.log('[PopupModal] fetchActivePopups: No active popups found from DB.');
        setShowPopup(false);
      }
    } catch (err) {
      console.error('[PopupModal] Error fetching popups:', err);
      setShowPopup(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (isPreview && onClosePreview) {
      console.log('[PopupModal] Preview mode: Closing via onClosePreview.');
      onClosePreview();
      setShowPopup(false);
    } else if (!isPreview) {
      console.log(`[PopupModal] Normal mode: handleClose called. Current index: ${currentPopupIndex}, Popups length: ${popups.length}`);
      if (currentPopupIndex < popups.length - 1) {
        setCurrentPopupIndex(currentPopupIndex + 1);
        console.log(`[PopupModal] Normal mode: Moving to next popup. New index: ${currentPopupIndex + 1}`);
      } else {
        setShowPopup(false);
        console.log('[PopupModal] Normal mode: All popups shown or closed. Hiding modal.');
      }
    } else {
      setShowPopup(false);
    }
  }, [isPreview, onClosePreview, currentPopupIndex, popups.length]);

  const handleHideToday = useCallback(() => {
    if (isPreview) {
      handleClose();
      return;
    }
    const currentPopupToHide = popups[currentPopupIndex];
    if (currentPopupToHide && currentPopupToHide.id) {
      const hideUntilKey = `popup_${currentPopupToHide.id}_hide_until`;
      const hideUntilValue = new Date().setHours(23, 59, 59, 999).toString();
      localStorage.setItem(hideUntilKey, hideUntilValue);
    }
    handleClose();
  }, [isPreview, popups, currentPopupIndex, handleClose]);

  const handleNavigateToNotice = useCallback(() => {
    const currentPopupToNavigate = popups[currentPopupIndex];
    if (currentPopupToNavigate && currentPopupToNavigate.linked_notice_id) {
      navigate(`/notice/${currentPopupToNavigate.linked_notice_id}`);
      if (isPreview && onClosePreview) {
        onClosePreview();
      }
      setShowPopup(false);
    }
  }, [popups, currentPopupIndex, navigate, isPreview, onClosePreview]);

  const handleBackgroundClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (modalContainerRef.current && !modalContainerRef.current.contains(event.target as Node)) {
      handleClose();
    }
  }, [handleClose]);

  if (!showPopup) return null;
  if (isPreview && (!popupToPreview || popups.length === 0)) return null;
  if (!isPreview && (popups.length === 0 || currentPopupIndex >= popups.length)) return null;
  
  const currentPopup = popups[currentPopupIndex];
  if (!currentPopup) return null;

  console.log(`[PopupModal] Rendering popup (ID: ${currentPopup.id}, Title: ${currentPopup.title}, isPreview: ${isPreview})`);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackgroundClick}
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div 
          ref={modalContainerRef}
          className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
            >
              <span className="sr-only">닫기</span>
              <X size={24} />
            </button>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {currentPopup.title}
                </h3>
                <div className="mt-4">
                  {currentPopup.image_url && (
                    <img
                      src={currentPopup.image_url}
                      alt={currentPopup.title}
                      className="w-full h-auto max-h-60 object-contain mb-4"
                    />
                  )}
                  <div className="text-sm text-gray-700 mb-4">
                    <h3 id="modal-title" className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      {currentPopup.title}
                    </h3>
                    <div dangerouslySetInnerHTML={{ __html: currentPopup.content || '' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:items-center sm:justify-between">
            <div>
              {currentPopup.linked_notice_id && (
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-blue-600 shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm transition-colors duration-150 flex items-center"
                  onClick={handleNavigateToNotice}
                >
                  <ExternalLink size={18} className="mr-2" />
                  공지사항 보기
                </button>
              )}
            </div>

            <div className="mt-3 sm:mt-0 sm:ml-3 flex flex-col-reverse sm:flex-row">
              {!isPreview && (
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm transition-colors duration-150"
                  onClick={handleHideToday}
                >
                  오늘 하루 보지 않기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupModal; 