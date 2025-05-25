import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { X, Check } from 'lucide-react';

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
}

const NoticeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    fetchBusinesses();
    if (id) {
      fetchNotice();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      const typedError = err as { message?: string };
      setError(`사업 목록 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  const fetchNotice = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setBusinessId(data.business_id);
        setIsVisible(data.is_visible);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notice:', err);
      const typedError = err as { message?: string };
      setError(`공지사항 로딩 실패: ${typedError.message || '알 수 없는 오류'}`);
      setLoading(false);
    }
  };

  const createCustomUploadAdapter = (loader: any) => {
    return {
      upload: () => {
        return new Promise(async (resolve, reject) => {
          try {
            const file = await loader.file;
            if (!file) {
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
              return reject(uploadSupabaseError.message || 'Supabase upload error during file .upload');
            }
            
            if (!data || !data.path) {
              return reject(new Error('Supabase upload error: No path returned from .upload'));
            }

            const { data: publicUrlData } = supabase.storage.from('notice-images').getPublicUrl(data.path);
            
            if (!publicUrlData || !publicUrlData.publicUrl) {
              return reject(new Error('Error getting public URL: No publicUrl in response or an error occurred.'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      const noticeData = {
        title,
        content,
        business_id: businessId,
        is_visible: isVisible,
      };

      let result;
      if (id) {
        result = await supabase
          .from('notices')
          .update(noticeData)
          .eq('id', id)
          .select();
      } else {
        result = await supabase
          .from('notices')
          .insert([noticeData])
          .select();
      }

      if (result.error) throw result.error;
      navigate('/admin/dashboard', { state: { activeTab: 'notices' } });
    } catch (err) {
      console.error('Error saving notice:', err);
      const typedError = err as { message?: string };
      setError(`공지사항 ${id ? '수정' : '등록'} 실패: ${typedError.message || '알 수 없는 오류'}`);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-xl">로딩 중...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {id ? '공지사항 수정' : '새 공지사항 작성'}
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
              placeholder="공지사항 제목을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용
            </label>
            <CKEditor
              editor={ClassicEditor}
              data={content}
              onReady={(editor: any) => {
                editorRef.current = editor;
                editor.plugins.get('FileRepository').createUploadAdapter = createCustomUploadAdapter;
              }}
              onChange={(event: any, editor: any) => {
                const data = editor.getData();
                setContent(data);
              }}
              config={{
                toolbar: [
                  'heading',
                  '|',
                  'bold',
                  'italic',
                  'link',
                  'bulletedList',
                  'numberedList',
                  '|',
                  'outdent',
                  'indent',
                  '|',
                  'imageUpload',
                  'blockQuote',
                  'insertTable',
                  'mediaEmbed',
                  'undo',
                  'redo'
                ],
                language: 'ko',
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="businessId" className="block text-sm font-medium text-gray-700 mb-1">
                연관 사업 (선택)
              </label>
              <select
                id="businessId"
                value={businessId || ''}
                onChange={(e) => setBusinessId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">선택 안함</option>
                {businesses.map(business => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="isVisible" className="block text-sm font-medium text-gray-700 mb-1">
                공개 여부
              </label>
              <select
                id="isVisible"
                value={isVisible.toString()}
                onChange={(e) => setIsVisible(e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard', { state: { activeTab: 'notices' } })}
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

export default NoticeForm; 