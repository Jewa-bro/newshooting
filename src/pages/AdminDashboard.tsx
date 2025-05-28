import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, useCallback } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, X, Check, Bell, Calendar, Pencil, Trash2, ImagePlus, AlertTriangle, Eye, ExternalLink, ListFilter, Search, ChevronDown, ChevronUp, CheckSquare, XSquare } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import BusinessForm from './BusinessForm';
import NoticeForm from './NoticeForm';
import PopupForm from './PopupForm';
import PopupModal from '../components/PopupModal';

interface Application {
  id: string;
  name: string;
  phone: string;
  email: string;
  business_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string | null;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  business_id?: string | null;
  is_visible: boolean;
  images?: string[];
}

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

interface Popup {
  id: string;
  title: string;
  content?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  priority: number;
  is_active: boolean;
  linked_notice_id?: string | null;
  created_at?: string;
}

// CKEditor Upload Adapter Interfaces
interface FileLoader {
  file: Promise<File>;
  // Add other properties if used by your loader
}

interface UploadResponse {
  default: string;
}

interface CKUploadAdapter {
  upload(): Promise<UploadResponse>;
  abort(): void;
}

// AdminDashboard 컴포넌트 내부 최상단 또는 interface 정의 바로 아래 등에 위치
type ApplicationSortKey = keyof Application | 'business';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'applications' | 'notices' | 'business' | 'popups'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessDescription, setNewBusinessDescription] = useState('');
  const [newBusinessStatus, setNewBusinessStatus] = useState<'draft' | 'recruiting' | 'closed' | 'completed' | 'cancelled'>('draft');
  const [newBusinessStartDate, setNewBusinessStartDate] = useState('');
  const [newBusinessEndDate, setNewBusinessEndDate] = useState('');
  const [newBusinessMaxParticipants, setNewBusinessMaxParticipants] = useState<number | undefined>(undefined);

  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editBusinessDescription, setEditBusinessDescription] = useState('');
  const [editBusinessStatus, setEditBusinessStatus] = useState<'draft' | 'recruiting' | 'closed' | 'completed' | 'cancelled'>('draft');
  const [editBusinessStartDate, setEditBusinessStartDate] = useState('');
  const [editBusinessEndDate, setEditBusinessEndDate] = useState('');
  const [editBusinessMaxParticipants, setEditBusinessMaxParticipants] = useState<number | undefined>(undefined);

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeBusinessId, setNewNoticeBusinessId] = useState<string | null>(null);
  const [newNoticeIsVisible, setNewNoticeIsVisible] = useState(true);

  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editNoticeTitle, setEditNoticeTitle] = useState('');
  const [editNoticeContent, setEditNoticeContent] = useState('');
  const [editNoticeBusinessId, setEditNoticeBusinessId] = useState<string | null>(null);
  const [editNoticeIsVisible, setEditNoticeIsVisible] = useState(true);

  const [businessSearchTerm, setBusinessSearchTerm] = useState('');
  const [businessStatusFilter, setBusinessStatusFilter] = useState('');

  const [noticeSearchTerm, setNoticeSearchTerm] = useState('');
  const [noticeVisibilityFilter, setNoticeVisibilityFilter] = useState<'' | 'visible' | 'hidden'>('');
  
  const editorRef = useRef<InstanceType<typeof ClassicEditor> | null>(null);

  // Determine if the current page is a form page based on the path
  const [isFormPage, setIsFormPage] = useState(false);

  // 신청 현황 필터 상태 추가
  const [applicationBusinessFilter, setApplicationBusinessFilter] = useState('');
  const [applicationDateRange, setApplicationDateRange] = useState({ start: '', end: '' });
  const [applicationNameFilter, setApplicationNameFilter] = useState('');
  const [applicationPhoneFilter, setApplicationPhoneFilter] = useState('');

  // 정렬 상태 추가
  const [sortConfig, setSortConfig] = useState<{
    key: ApplicationSortKey | null;
    direction: 'ascending' | 'descending' | null;
  }>({ key: 'created_at', direction: 'descending' });

  // 미리보기 관련 상태 추가
  const [selectedPopupForPreview, setSelectedPopupForPreview] = useState<Popup | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin/login');
      } else {
        fetchInitialData();
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const path = location.pathname;
    setIsFormPage(path.includes('/new') || path.includes('/edit'));
  }, [location.pathname]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchApplications(), fetchNotices(), fetchBusinesses(), fetchPopups()]);
    setLoading(false);
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      const typedError = err as { message?: string };
      setError(`신청 목록 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
      const typedError = err as { message?: string };
      setError(`공지사항 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      const typedError = err as { message?: string };
      setError(`사업 목록 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const fetchPopups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPopups(data || []);
    } catch (err) {
      console.error('Error fetching popups:', err);
      const typedError = err as { message?: string };
      setError(`팝업 목록 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      setError('로그아웃 실패');
    } else {
      navigate('/auth');
    }
  };

  const handleCreateBusiness = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBusinessName || !newBusinessDescription || !newBusinessStartDate || !newBusinessEndDate) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert([{
          name: newBusinessName,
          description: newBusinessDescription,
          status: newBusinessStatus,
          start_date: newBusinessStartDate,
          end_date: newBusinessEndDate,
          max_participants: newBusinessMaxParticipants
        }])
        .select();
      if (error) throw error;
      if (data) {
        setBusinesses([data[0], ...businesses]);
        setNewBusinessName('');
        setNewBusinessDescription('');
        setNewBusinessStatus('draft');
        setNewBusinessStartDate('');
        setNewBusinessEndDate('');
        setNewBusinessMaxParticipants(undefined);
        setError(null);
      }
    } catch (err) {
      console.error('Error creating business:', err);
      const typedError = err as { message?: string };
      setError(`사업 생성 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const handleEditBusiness = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBusiness || !editBusinessName || !editBusinessDescription || !editBusinessStartDate || !editBusinessEndDate) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          name: editBusinessName,
          description: editBusinessDescription,
          status: editBusinessStatus,
          start_date: editBusinessStartDate,
          end_date: editBusinessEndDate,
          max_participants: editBusinessMaxParticipants
        })
        .eq('id', editingBusiness.id)
        .select();

      if (error) throw error;
      if (data) {
        setBusinesses(businesses.map(b => b.id === editingBusiness.id ? data[0] : b));
        setEditingBusiness(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error updating business:', err);
      const typedError = err as { message?: string };
      setError(`사업 수정 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('정말로 이 사업을 삭제하시겠습니까?\n연관된 모든 신청 및 공지사항도 함께 삭제될 수 있습니다.')) return;
    try {
      const { error: noticeError } = await supabase
        .from('notices')
        .update({ business_id: null })
        .eq('business_id', id);
      if (noticeError) throw noticeError;

      const { error: appError } = await supabase
        .from('applications')
        .delete()
        .eq('business_id', id);
      if (appError) throw appError;
      
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setBusinesses(businesses.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting business:', err);
      const typedError = err as { message?: string };
      setError(`사업 삭제 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const startEditBusiness = (business: Business) => {
    setShowAddBusiness(false);
    setEditingBusiness(business);
    setEditBusinessName(business.name);
    setEditBusinessDescription(business.description);
    setEditBusinessStatus(business.status);
    setEditBusinessStartDate(business.start_date);
    setEditBusinessEndDate(business.end_date);
    setEditBusinessMaxParticipants(business.max_participants ?? undefined);
  };

  const handleAddBusinessClick = () => {
    setShowAddBusiness(!showAddBusiness);
    if (!showAddBusiness) {
      setEditingBusiness(null);
    }
  };
  
  const createCustomUploadAdapter = (loader: FileLoader): CKUploadAdapter => {
    return {
      upload: () => {
        return new Promise<UploadResponse>(async (resolve, reject) => {
          try {
            const file = await loader.file;
            if (!file) {
              console.error('File loader returned null');
              return reject(new Error('File loader returned null'));
            }
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error: uploadSupabaseError } = await supabase.storage
              .from('notice-images')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadSupabaseError) {
              console.error('Supabase upload error:', uploadSupabaseError);
              return reject(uploadSupabaseError.message || 'Supabase upload error during file .upload');
            }
            
            if (!data || !data.path) {
                console.error('Supabase upload error: No path returned from .upload');
                return reject(new Error('Supabase upload error: No path returned from .upload'));
            }

            const { data: publicUrlData } = supabase.storage.from('notice-images').getPublicUrl(data.path);
            
            if (!publicUrlData || !publicUrlData.publicUrl) {
                console.error('Error getting public URL: No publicUrl in response or an error occurred.');
                return reject(new Error('Error getting public URL: No publicUrl in response or an error occurred. Check Supabase logs.'));
            }

            resolve({ default: publicUrlData.publicUrl });
          } catch (err) {
            console.error('Image upload failed:', err);
            const typedError = err as { message?: string };
            reject(typedError.message || 'Image upload failed due to unknown error');
          }
        });
      },
      abort: () => {
        console.log('Image upload aborted');
      }
    };
  };

  const handleCreateNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeContent) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notices')
        .insert([{
          title: newNoticeTitle,
          content: newNoticeContent,
          business_id: newNoticeBusinessId,
          is_visible: newNoticeIsVisible,
        }])
        .select();
      if (error) throw error;
      if (data) {
        setNotices([data[0], ...notices]);
        setNewNoticeTitle('');
        setNewNoticeContent('');
        setNewNoticeBusinessId(null);
        setNewNoticeIsVisible(true);
        if (editorRef.current) {
          editorRef.current.setData('');
        }
        setError(null);
      }
    } catch (err) {
      console.error('Error creating notice:', err);
      const typedError = err as { message?: string };
      setError(`공지 생성 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const handleEditNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !editNoticeTitle || !editNoticeContent) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notices')
        .update({
          title: editNoticeTitle,
          content: editNoticeContent,
          business_id: editNoticeBusinessId,
          is_visible: editNoticeIsVisible,
        })
        .eq('id', editingNotice.id)
        .select();

      if (error) throw error;
      if (data) {
        setNotices(notices.map(n => n.id === editingNotice.id ? data[0] : n));
        setEditingNotice(null);
        if (editorRef.current) {
          editorRef.current.setData('');
        }
        setError(null);
      }
    } catch (err) {
      console.error('Error updating notice:', err);
      const typedError = err as { message?: string };
      setError(`공지 수정 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setNotices(notices.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notice:', err);
      const typedError = err as { message?: string };
      setError(`공지 삭제 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const startEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setEditNoticeTitle(notice.title);
    setEditNoticeContent(notice.content);
    setEditNoticeBusinessId(notice.business_id ?? null);
    setEditNoticeIsVisible(notice.is_visible);
    if (editorRef.current) {
      editorRef.current.setData(notice.content);
    }
  };

  const updateApplicationStatus = async (id: string, status: Application['status'], businessId: string) => {
    try {
      if (status === 'approved') {
        const business = businesses.find((b: Business) => b.id === businessId);
        if (business && business.max_participants) {
          const approvedCount = applications.filter(app => app.business_id === businessId && app.status === 'approved').length;
          if (approvedCount >= business.max_participants) {
            setError(`최대 승인 인원(${business.max_participants}명)을 초과할 수 없습니다.`);
            return;
          }
        }
      }

      const updateData: Partial<Application> = { status };
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else {
        updateData.approved_at = null;
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data) {
        setApplications(applications.map(app => app.id === id ? data[0] : app));
        setError(null);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      const typedError = err as { message?: string };
      setError(`상태 변경 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };
  
  const handleDeleteApplication = async (id: string) => {
    if (!confirm('정말로 이 신청을 삭제하시겠습니까?\n삭제된 신청은 복구할 수 없습니다.')) return;
    
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchApplications();
    } catch (err) {
      console.error('Error deleting application:', err);
      const typedError = err as { message?: string };
      setError('신청 삭제 중 오류가 발생했습니다.');
    }
  };

  const getApprovalOrder = (businessId: string, approvedAt: string | null | undefined) => {
    if (!approvedAt) return null;
    const approvedApplications = applications
      .filter(app => app.business_id === businessId && app.status === 'approved' && app.approved_at)
      .sort((a, b) => new Date(a.approved_at!).getTime() - new Date(b.approved_at!).getTime());
    const order = approvedApplications.findIndex(app => app.approved_at === approvedAt);
    return order !== -1 ? order + 1 : null;
  };

  const getFilteredBusinesses = () => {
    return businesses.filter(business => {
      const matchesSearch = !businessSearchTerm || 
        business.name.toLowerCase().includes(businessSearchTerm.toLowerCase());
      const matchesStatus = !businessStatusFilter || business.status === businessStatusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredNotices = () => {
    return notices.filter(notice => {
      const matchesSearch = !noticeSearchTerm || 
        notice.title.toLowerCase().includes(noticeSearchTerm.toLowerCase());
      const matchesVisibility = noticeVisibilityFilter === '' || 
        (noticeVisibilityFilter === 'visible' && notice.is_visible) ||
        (noticeVisibilityFilter === 'hidden' && !notice.is_visible);
      return matchesSearch && matchesVisibility;
    });
  };

  const getFilteredApplications = () => {
    return applications.filter(application => {
      const business = businesses.find(b => b.id === application.business_id);
      
      // 사업명 필터
      const matchesBusiness = !applicationBusinessFilter || 
        application.business_id === applicationBusinessFilter;

      // 신청일 필터 - 날짜만 비교하도록 수정
      const applicationDate = new Date(application.created_at);
      const startDate = applicationDateRange.start ? new Date(applicationDateRange.start) : null;
      const endDate = applicationDateRange.end ? new Date(applicationDateRange.end) : null;

      // 날짜 비교를 위해 시간을 00:00:00으로 설정
      const compareDate = new Date(applicationDate.getFullYear(), applicationDate.getMonth(), applicationDate.getDate());
      const compareStart = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
      const compareEnd = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;

      const matchesDateRange = (!compareStart || compareDate >= compareStart) &&
                             (!compareEnd || compareDate <= compareEnd);

      // 신청자명 필터
      const matchesName = !applicationNameFilter || 
        application.name.toLowerCase().includes(applicationNameFilter.toLowerCase());

      // 연락처 필터
      const matchesPhone = !applicationPhoneFilter || 
        application.phone.includes(applicationPhoneFilter);

      return matchesBusiness && matchesDateRange && matchesName && matchesPhone;
    });
  };

  const handleReset = () => {
    setApplicationBusinessFilter('');
    setApplicationDateRange({ start: '', end: '' });
    setApplicationNameFilter('');
    setApplicationPhoneFilter('');
  };

  // 정렬 함수 추가
  const handleSort = (key: ApplicationSortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === 'ascending') return { key, direction: 'descending' };
        if (current.direction === 'descending') return { key: null, direction: null };
        return { key, direction: 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  };

  // 정렬된 신청 목록을 반환하는 함수
  const getSortedApplications = () => {
    const filteredApplications = getFilteredApplications();
    if (!sortConfig.key || !sortConfig.direction) return filteredApplications;

    const { key, direction } = sortConfig;
    const dir = direction === 'ascending' ? 1 : -1;

    return [...filteredApplications].sort((a, b) => {
      if (key === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return (dateA - dateB) * dir;
      }
      
      if (key === 'business') {
        const businessA = businesses.find(biz => biz.id === a.business_id)?.name?.toLowerCase() || '';
        const businessB = businesses.find(biz => biz.id === b.business_id)?.name?.toLowerCase() || '';
        return businessA.localeCompare(businessB) * dir;
      }

      if (key === 'status') {
        const statusOrder: { [key in Application['status']]: number } = { pending: 0, approved: 1, rejected: 2 };
        const orderA = statusOrder[a.status];
        const orderB = statusOrder[b.status];
        return (orderA - orderB) * dir;
      }

      const valA = a[key as keyof Application]?.toString().toLowerCase() || '';
      const valB = b[key as keyof Application]?.toString().toLowerCase() || '';
      
      return valA.localeCompare(valB) * dir;
    });
  };

  // 정렬 방향 표시 아이콘 컴포넌트
  const SortIcon = ({ columnKey }: { columnKey: ApplicationSortKey }) => {
    if (sortConfig.key !== columnKey) return <span className="ml-1 inline-block w-4">&nbsp;</span>;
    if (sortConfig.direction === 'ascending') return <span className="ml-1 inline-block w-4">↑</span>;
    if (sortConfig.direction === 'descending') return <span className="ml-1 inline-block w-4">↓</span>;
    return <span className="ml-1 inline-block w-4">&nbsp;</span>;
  };

  const handleBusinessRowClick = (businessId: string) => {
    setSelectedBusinessId(selectedBusinessId === businessId ? null : businessId);
  };

  const getBusinessApplications = (businessId: string) => {
    return applications.filter(app => app.business_id === businessId);
  };

  const toggleNoticeVisibility = async (noticeId: string, currentVisibility: boolean) => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .update({ is_visible: !currentVisibility })
        .eq('id', noticeId)
        .select();

      if (error) throw error;
      if (data) {
        setNotices(notices.map(n => n.id === noticeId ? data[0] : n));
        setError(null);
      }
    } catch (err) {
      console.error('Error updating notice visibility:', err);
      const typedError = err as { message?: string };
      setError(`공지사항 상태 변경 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const handleDeletePopup = async (popupId: string) => {
    if (!window.confirm('정말로 이 팝업을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', popupId);

      if (error) throw error;
      setPopups(popups.filter(p => p.id !== popupId));
      setError(null);
    } catch (err) {
      console.error('Error deleting popup:', err);
      const typedError = err as { message?: string };
      setError(`팝업 삭제 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const togglePopupVisibility = async (popupId: string, currentVisibility: boolean) => {
    try {
      const { data, error } = await supabase
        .from('popups')
        .update({ is_active: !currentVisibility })
        .eq('id', popupId)
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setPopups(popups.map(p => p.id === popupId ? { ...p, is_active: data[0].is_active } : p));
        setError(null);
      } else {
        console.warn('Popup visibility update returned no data or empty data array.');
        // 필요하다면 사용자에게 알림
      }
    } catch (err) {
      console.error('Error updating popup visibility:', err);
      const typedError = err as { message?: string };
      setError(`팝업 상태 변경 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  // 미리보기 핸들러 함수
  const handlePreviewPopup = (popup: Popup) => {
    setSelectedPopupForPreview(popup);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setSelectedPopupForPreview(null);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-xl">로딩 중...</p></div>;
  
  const getBusinessStatusStyleAndText = (status: Business['status']) => {
    switch (status) {
      case 'draft': return { style: 'bg-slate-100 text-slate-700', text: '준비중' };
      case 'recruiting': return { style: 'bg-blue-100 text-blue-800', text: '모집중' };
      case 'closed': return { style: 'bg-yellow-100 text-yellow-800', text: '모집마감' };
      case 'completed': return { style: 'bg-green-100 text-green-800', text: '완료' };
      case 'cancelled': return { style: 'bg-red-100 text-red-700', text: '취소' };
      default: return { style: 'bg-gray-100 text-gray-500', text: '알수없음' };
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'applications':
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">전체 신청 현황</h2>
            {error && <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center"><AlertTriangle size={20} className="mr-2" />{error}</div>}
            
            {/* 필터 섹션 수정 */}
            <div className="mb-4 bg-white p-4 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">검색 필터</h3>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  필터 초기화
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사업 선택</label>
                    <select
                      value={applicationBusinessFilter}
                      onChange={(e) => setApplicationBusinessFilter(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">전체 사업</option>
                      {businesses.map(business => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">신청자명</label>
                    <input
                      type="text"
                      placeholder="신청자명 입력..."
                      value={applicationNameFilter}
                      onChange={(e) => setApplicationNameFilter(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">신청 기간</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={applicationDateRange.start}
                        onChange={(e) => setApplicationDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="date"
                        value={applicationDateRange.end}
                        onChange={(e) => setApplicationDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                      type="text"
                      placeholder="연락처 입력..."
                      value={applicationPhoneFilter}
                      onChange={(e) => setApplicationPhoneFilter(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                          <span>신청일</span>
                          <SortIcon columnKey="created_at" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleSort('business')}
                      >
                        <div className="flex items-center">
                          <span>사업명</span>
                          <SortIcon columnKey="business" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          <span>신청자명</span>
                          <SortIcon columnKey="name" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleSort('phone')}
                      >
                        <div className="flex items-center">
                          <span>연락처</span>
                          <SortIcon columnKey="phone" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          <span>이메일</span>
                          <SortIcon columnKey="email" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 relative"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          <span>상태</span>
                          <SortIcon columnKey="status" />
                        </div>
                      </th>
                      <th scope="col" className="w-[15%] pl-6 pr-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSortedApplications().length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">검색 결과가 없습니다.</td>
                      </tr>
                    )}
                    {getSortedApplications().map((application) => {
                      const business = businesses.find(b => b.id === application.business_id);
                      const approvalOrder = getApprovalOrder(application.business_id, application.approved_at);
                      return (
                        <tr key={application.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(application.created_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{business?.name || '알 수 없는 사업'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{application.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{application.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{application.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'}`}>
                              {application.status === 'pending' ? '대기' : application.status === 'approved' ? '승인' : '거절'}
                              {application.status === 'approved' && approvalOrder && (
                                <span className="ml-1.5">({approvalOrder}번째)</span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'approved', application.business_id)}
                                disabled={application.status === 'approved'}
                                className={`p-1.5 rounded-md transition-colors duration-150 ${
                                  application.status === 'approved' 
                                    ? 'bg-green-500 text-white cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="승인"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected', application.business_id)}
                                disabled={application.status === 'rejected'}
                                className={`p-1.5 rounded-md transition-colors duration-150 ${
                                  application.status === 'rejected' 
                                    ? 'bg-red-500 text-white cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="거절"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'pending', application.business_id)}
                                disabled={application.status === 'pending'}
                                className={`p-1.5 rounded-md transition-colors duration-150 ${
                                  application.status === 'pending' 
                                    ? 'bg-yellow-500 text-white cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="대기"
                              >
                                <AlertTriangle size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteApplication(application.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors duration-150"
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'business':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">사업 관리</h2>
              <button
                onClick={() => navigate('business/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>새 사업 추가</span>
                </button>
            </div>

            {error && <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center"><AlertTriangle size={20} className="mr-2" />{error}</div>}

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="사업명 검색..."
                value={businessSearchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBusinessSearchTerm(e.target.value)}
                className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
              <select
                value={businessStatusFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setBusinessStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow"
              >
                <option value="">모든 상태</option>
                <option value="draft">준비중</option>
                <option value="recruiting">모집중</option>
                <option value="closed">모집마감</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사업명</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참가자</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredBusinesses().length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">해당 조건의 사업이 없습니다.</td>
                      </tr>
                    )}
                    {getFilteredBusinesses().map((business) => {
                        const approvedCount = applications.filter(app => app.business_id === business.id && app.status === 'approved').length;
                        return (
                        <React.Fragment key={business.id}>
                          <tr
                              onClick={() => handleBusinessRowClick(business.id)}
                              className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${selectedBusinessId === business.id ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{business.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={business.description}>{business.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBusinessStatusStyleAndText(business.status).style}`}>
                                {getBusinessStatusStyleAndText(business.status).text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(business.start_date).toLocaleDateString()} ~ {new Date(business.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {approvedCount}명{business.max_participants ? ` / ${business.max_participants}명` : ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => navigate(`business/edit/${business.id}`)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-150" 
                                  title="수정"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteBusiness(business.id)} 
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors duration-150" 
                                  title="삭제"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {selectedBusinessId === business.id && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50 border-t border-b border-gray-200">
                                <div className="mb-4">
                                  <h3 className="text-lg font-semibold text-gray-800 mb-2">"{business.name}" 신청 현황</h3>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th scope="col" className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청일</th>
                                          <th scope="col" className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청자명</th>
                                          <th scope="col" className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                                          <th scope="col" className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                          <th scope="col" className="w-[15%] pl-2 pr-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {getBusinessApplications(business.id).length === 0 ? (
                                          <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">신청 내역이 없습니다.</td>
                                          </tr>
                                        ) : (
                                          getBusinessApplications(business.id).map((application) => {
                                            const approvalOrder = getApprovalOrder(business.id, application.approved_at);
                                            return (
                                              <tr key={application.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                  {new Date(application.created_at).toLocaleString('ko-KR', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                  })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{application.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{application.phone}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full min-w-[60px] justify-center
                                                    ${application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                      'bg-yellow-100 text-yellow-800'}`}>
                                                    {application.status === 'pending' ? '대기' : application.status === 'approved' ? '승인' : '거절'}
                                                    {application.status === 'approved' && approvalOrder && (
                                                      <span className="ml-1.5">({approvalOrder}번째)</span>
                                                    )}
                                                  </span>
                                                </td>
                                                <td className="pl-2 pr-0 py-4 whitespace-nowrap text-sm font-medium">
                                                  <div className="flex items-center space-x-1">
                                                    <button
                                                      onClick={() => updateApplicationStatus(application.id, 'approved', business.id)}
                                                      disabled={application.status === 'approved'}
                                                      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 ${
                                                        application.status === 'approved' 
                                                          ? 'bg-green-500 text-white cursor-not-allowed' 
                                                          : 'text-gray-500 hover:bg-gray-100'
                                                      }`}
                                                      title="승인"
                                                    >
                                                      <Check size={16} />
                                                    </button>
                                                    <button
                                                      onClick={() => updateApplicationStatus(application.id, 'rejected', business.id)}
                                                      disabled={application.status === 'rejected'}
                                                      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 ${
                                                        application.status === 'rejected' 
                                                          ? 'bg-red-500 text-white cursor-not-allowed' 
                                                          : 'text-gray-500 hover:bg-gray-100'
                                                      }`}
                                                      title="거절"
                                                    >
                                                      <X size={16} />
                                                    </button>
                                                    <button
                                                      onClick={() => updateApplicationStatus(application.id, 'pending', business.id)}
                                                      disabled={application.status === 'pending'}
                                                      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 ${
                                                        application.status === 'pending' 
                                                          ? 'bg-yellow-500 text-white cursor-not-allowed' 
                                                          : 'text-gray-500 hover:bg-gray-100'
                                                      }`}
                                                      title="대기"
                                                    >
                                                      <AlertTriangle size={16} />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteApplication(application.id)}
                                                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors duration-150"
                                                      title="삭제"
                                                    >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                                            );
                                          })
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'notices':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">공지사항 관리</h2>
              <button
                onClick={() => navigate('notice/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>새 공지사항 작성</span>
                  </button>
            </div>

            {error && <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center"><AlertTriangle size={20} className="mr-2" />{error}</div>}

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <input
                    type="text"
                placeholder="공지사항 검색..."
                    value={noticeSearchTerm}
                onChange={(e) => setNoticeSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
                <select
                    value={noticeVisibilityFilter}
                onChange={(e) => setNoticeVisibilityFilter(e.target.value as '' | 'visible' | 'hidden')}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-shadow"
                >
                    <option value="">모든 상태</option>
                    <option value="visible">공개</option>
                    <option value="hidden">비공개</option>
                </select>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연관 사업</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredNotices().length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">등록된 공지사항이 없습니다.</p>
                      <p className="text-sm">새로운 공지사항을 작성해보세요.</p>
                        </td>
                      </tr>
              )}
              {getFilteredNotices().map((notice) => {
                const associatedBusiness = businesses.find(b => b.id === notice.business_id);
                return (
                        <tr key={notice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(notice.created_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium hover:text-blue-600 cursor-pointer" onClick={() => navigate(`notice/edit/${notice.id}`)}>
                              {notice.title}
                          </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {associatedBusiness?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleNoticeVisibility(notice.id, notice.is_visible)}
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full min-w-[60px] justify-center transition-colors duration-150
                                ${notice.is_visible 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                            >
                                {notice.is_visible ? '공개' : '비공개'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`notice/edit/${notice.id}`)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-150"
                                title="수정"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteNotice(notice.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors duration-150"
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                          </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                      </div>
            </div>
          </div>
        );
      case 'popups':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">팝업 관리</h2>
              <button
                onClick={() => navigate('popup/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>새 팝업 등록</span>
                        </button>
                      </div>

            {error && (
              <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                {error}
                    </div>
            )}

            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노출 기간</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {popups.map((popup) => (
                    <tr key={popup.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium hover:text-blue-600 cursor-pointer" onClick={() => navigate(`popup/edit/${popup.id}`)}>
                          {popup.title}
                  </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(popup.start_date).toLocaleDateString()} ~ {new Date(popup.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {popup.priority}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => togglePopupVisibility(popup.id, popup.is_active)}
                          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full min-w-[60px] justify-center transition-colors duration-150 ${
                            popup.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {popup.is_active ? '공개' : '비공개'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handlePreviewPopup(popup)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors duration-150"
                            title="미리보기"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => navigate(`popup/edit/${popup.id}`)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-150"
                            title="수정"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePopup(popup.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors duration-150"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {!isFormPage && ( // Conditionally render the sidebar
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">관리자 대시보드</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {(['applications', 'business', 'notices', 'popups'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150
                ${activeTab === item ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
            >
              {item === 'applications' && <Calendar size={20} />}
              {item === 'business' && <ImagePlus size={20} />}
              {item === 'notices' && <Bell size={20} />}
                {item === 'popups' && <ImagePlus size={20} />}
              <span className="font-medium">
                  {item === 'applications' ? '신청 현황' : item === 'business' ? '사업 관리' : item === 'notices' ? '공지사항 관리' : '팝업 관리'}
              </span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          {/* Site Home Link */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 mb-2"
          >
            <ExternalLink className="w-5 h-5 mr-3" />
            사이트 홈으로
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-150 shadow-md"
          >
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>
      </aside>
      )}

      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={renderContent()} />
          <Route path="business/new" element={<BusinessForm />} />
          <Route path="business/edit/:id" element={<BusinessForm />} />
          <Route path="notice/new" element={<NoticeForm />} />
          <Route path="notice/edit/:id" element={<NoticeForm />} />
          <Route path="popup/new" element={<PopupForm />} />
          <Route path="popup/edit/:id" element={<PopupForm />} />
        </Routes>
      </main>
      {/* PopupModal 렌더링 */}
      {showPreviewModal && selectedPopupForPreview && (
        <PopupModal
          isPreview={true}
          popupToPreview={{...selectedPopupForPreview, content: selectedPopupForPreview.content ?? ''}}
          onClosePreview={handleClosePreview}
        />
      )}
    </div>
  );
};

export default AdminDashboard;