# 뉴스호팅 관리자 대시보드

React + TypeScript + Vite + Supabase로 구축된 관리자 대시보드입니다.

## 🚀 개발환경 세팅

### 1. 필수 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn

### 2. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd newshooting
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key를 `.env.local`에 추가
3. 필요한 테이블 생성 (applications, notices, businesses)

### 5. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
│   └── AdminDashboard.tsx
├── lib/                # 라이브러리 설정
│   └── supabase.ts
├── types/              # TypeScript 타입 정의
│   └── ckeditor.d.ts
└── App.tsx
```

## 🛠️ 사용된 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Rich Text Editor**: CKEditor 5
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📋 주요 기능

- 신청 현황 관리 (승인/거절/대기)
- 사업 관리 (생성/수정/삭제)
- 공지사항 관리 (리치 텍스트 에디터 포함)
- 이미지 업로드 (Supabase Storage)
- 실시간 데이터 동기화

## 🔧 빌드 및 배포

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 미리보기
```bash
npm run preview
```

## 🐛 문제 해결

### TypeScript 오류
- CKEditor 관련 타입 오류가 발생하면 `src/types/ckeditor.d.ts` 파일이 있는지 확인하세요.

### 환경 변수 오류
- `.env.local` 파일이 올바르게 설정되었는지 확인하세요.
- 환경 변수명이 `VITE_` 접두사로 시작하는지 확인하세요.

### Supabase 연결 오류
- Supabase 프로젝트 URL과 키가 올바른지 확인하세요.
- RLS(Row Level Security) 정책이 올바르게 설정되었는지 확인하세요.

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 