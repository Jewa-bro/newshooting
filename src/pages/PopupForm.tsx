import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, Check, ImagePlus } from 'lucide-react';

interface NoticeForSelect {
  id: string;
  title: string;
}

interface Popup {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  linked_notice_id?: string | null;
}

const PopupForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkedNoticeId, setLinkedNoticeId] = useState<string | null>(null);
  const [notices, setNotices] = useState<NoticeForSelect[]>([]);

  useEffect(() => {
    const fetchNoticesAndPopup = async () => {
      setLoading(true);
      try {
        const { data: noticesData, error: noticesError } = await supabase
          .from('notices')
          .select('id, title')
          .order('created_at', { ascending: false });

        if (noticesError) throw noticesError;
        setNotices(noticesData || []);

        if (id) {
          const { data: popupData, error: fetchError } = await supabase
            .from('popups')
            .select('*')
            .eq('id', id)
            .single();
          
          if (fetchError) throw fetchError;

          if (popupData) {
            setTitle(popupData.title);
            setContent(popupData.content);
            setImageUrl(popupData.image_url);
            setStartDate(popupData.start_date ? new Date(popupData.start_date).toISOString().split('T')[0] : '');
            setEndDate(popupData.end_date ? new Date(popupData.end_date).toISOString().split('T')[0] : '');
            setPriority(popupData.priority);
            setIsActive(popupData.is_active);
            setLinkedNoticeId(popupData.linked_notice_id || null);
            setImageFile(null);
          }
        } else {
          setTitle('');
          setContent('');
          setImageUrl(undefined);
          setStartDate('');
          setEndDate('');
          setPriority(1);
          setIsActive(true);
          setLinkedNoticeId(null);
          setImageFile(null);
        }
      } catch (err) {
        console.error('Error fetching data for popup form:', err);
        const typedError = err as { message?: string };
        setError(`데이터 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticesAndPopup();
  }, [id]);

  const handleImageUpload = async (fileToUpload: File | null) => {
    if (!fileToUpload) {
      console.error("handleImageUpload: No file provided for upload.");
      throw new Error("업로드할 파일이 없습니다.");
    }

    try {
      console.log('--- File object received by handleImageUpload ---');
      console.log('Name:', fileToUpload.name);
      console.log('Size:', fileToUpload.size);
      console.log('Type:', fileToUpload.type);
      console.log('Last Modified:', new Date(fileToUpload.lastModified).toLocaleString());
      console.log('-------------------------------------------------');

      const originalName = fileToUpload.name;
      const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();

      let baseName = originalName.substring(0, originalName.lastIndexOf('.'));
      baseName = baseName
        .replace(/[^a-zA-Z0-9_.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      if (!baseName || baseName.length < 3) {
        baseName = 'popup_image';
      }
      
      const fileName = `${Date.now()}-${baseName}${extension}`;
      console.log('Final fileName for Supabase:', fileName);

      console.log('--- File object just before supabase.upload ---');
      console.log('Name:', fileToUpload.name);
      console.log('Size:', fileToUpload.size);
      console.log('Type (before upload):', fileToUpload.type);
      console.log('-----------------------------------------------');

      let contentType = fileToUpload.type;
      if (!contentType || contentType === 'application/octet-stream') {
        if (extension === '.jpg' || extension === '.jpeg') {
          contentType = 'image/jpeg';
        } else if (extension === '.png') {
          contentType = 'image/png';
        } else if (extension === '.gif') {
          contentType = 'image/gif';
        }
        console.log(`Inferred contentType based on extension '${extension}': ${contentType}`);
      }

      const { data, error: uploadError } = await supabase.storage
        .from('popup-images')
        .upload(
          fileName,
          fileToUpload,
          {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType,
          }
        );

      if (uploadError) {
        console.error('Supabase upload raw error:', uploadError);
        throw uploadError;
      }
      
      if (!data || !data.path) {
        throw new Error('업로드 경로를 찾을 수 없습니다.');
      }

      const { data: publicUrlData, error: urlError } = supabase.storage
        .from('popup-images')
        .getPublicUrl(data.path);
      
      if (urlError) {
        console.error('Supabase getPublicUrl raw error:', urlError);
        throw urlError;
      }

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('공개 URL을 가져올 수 없습니다.');
      }
      
      console.log('Uploaded Image Public URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      const typedError = err as { message?: string, statusCode?: string, error?: string };
      let detailedMessage = typedError.message || '알 수 없는 오류';
      if (typedError.error && typedError.message?.includes(typedError.error)) {
      } else if (typedError.error) {
        detailedMessage = `${detailedMessage} (Server: ${typedError.error})${typedError.statusCode ? ' Status: ' + typedError.statusCode : ''}`;
      }
      throw new Error(`이미지 업로드 실패: ${detailedMessage}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      setError('제목과 노출 기간을 입력해주세요.');
      return;
    }

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await handleImageUpload(imageFile);
      }

      const finalStartDate = startDate ? `${startDate}T00:00:00` : null;
      const finalEndDate = endDate ? `${endDate}T23:59:59` : null;

      if (!title || !finalStartDate || !finalEndDate) {
        setError('제목과 노출 기간을 입력해주세요.');
        return;
      }
      
      const popupData = {
        title,
        content,
        image_url: finalImageUrl,
        start_date: finalStartDate,
        end_date: finalEndDate,
        priority,
        is_active: isActive,
        linked_notice_id: linkedNoticeId,
      };

      let result;
      if (id) {
        result = await supabase
          .from('popups')
          .update(popupData)
          .eq('id', id)
          .select();
      } else {
        result = await supabase
          .from('popups')
          .insert([popupData])
          .select();
      }

      if (result.error) throw result.error;
      navigate('/admin/dashboard', { state: { activeTab: 'popups' } });
    } catch (err) {
      console.error('Error saving popup:', err);
      const typedError = err as { message?: string };
      setError(`팝업 ${id ? '수정' : '등록'} 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-xl">로딩 중...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {id ? '팝업 수정' : '새 팝업 등록'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="팝업 제목을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용 (선택)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="팝업에 표시할 내용을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이미지
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {imageUrl && (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-32 w-auto object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(undefined)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <label className="cursor-pointer flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImageUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                <div className="text-center">
                  <ImagePlus className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-600">
                    이미지 업로드
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                시작일
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                종료일
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                우선순위
              </label>
              <input
                type="number"
                id="priority"
                min="1"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                id="isActive"
                value={isActive.toString()}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="true">활성화</option>
                <option value="false">비활성화</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="linkedNotice" className="block text-sm font-medium text-gray-700 mb-1">
              연결할 공지사항 (선택)
            </label>
            <select
              id="linkedNotice"
              value={linkedNoticeId || ''}
              onChange={(e) => setLinkedNoticeId(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">연결 안함</option>
              {notices.map(notice => (
                <option key={notice.id} value={notice.id}>
                  {notice.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'popups' } })}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 transition-all duration-150 flex items-center"
            >
              <X size={18} className="mr-2" />
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all duration-150 flex items-center"
            >
              <Check size={18} className="mr-2" />
              {id ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupForm; 