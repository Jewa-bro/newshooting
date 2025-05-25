declare module '@toast-ui/react-editor' {
  import { Editor as EditorType } from '@toast-ui/editor';
  
  export interface EditorProps {
    initialValue?: string;
    previewStyle?: 'tab' | 'vertical';
    height?: string;
    initialEditType?: 'markdown' | 'wysiwyg';
    useCommandShortcut?: boolean;
    plugins?: any[];
    hooks?: {
      addImageBlobHook?: (blob: File, callback: (url: string, text?: string) => void) => void;
    };
  }

  export class Editor extends React.Component<EditorProps> {
    getInstance(): EditorType;
  }
}

declare module '@toast-ui/editor-plugin-color-syntax'; 