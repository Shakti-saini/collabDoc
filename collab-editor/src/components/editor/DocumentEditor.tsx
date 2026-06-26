'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect, useCallback } from 'react';
import { EditorToolbar } from './EditorToolbar';

interface Props {
  content: Record<string, unknown>;
  onContentChange: (content: Record<string, unknown>) => void;
  editable: boolean;
  userId: string;
  userName: string;
}

export function DocumentEditor({ content, onContentChange, editable, userId, userName }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-lg' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: Object.keys(content).length > 0 ? content : undefined,
    editable,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] px-8 py-6', spellCheck: 'true' },
    },
  });

  // Sync external content changes (e.g., version restore)
  useEffect(() => {
    if (!editor || !content || Object.keys(content).length === 0) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  const handleImageUpload = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-col min-h-screen">
      {editable && editor && <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />}
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}
