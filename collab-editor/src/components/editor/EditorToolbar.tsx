'use client';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, Image, Highlighter,
  Undo, Redo, CheckSquare, RemoveFormatting
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props { editor: Editor; onImageUpload: () => void; }

export function EditorToolbar({ editor, onImageUpload }: Props) {
  const ToolbarButton = ({ onClick, active, disabled, icon: Icon, tooltip }: {
    onClick: () => void; active?: boolean; disabled?: boolean; icon: React.ElementType; tooltip: string;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('h-7 w-7', active && 'bg-accent text-accent-foreground')} onClick={onClick} disabled={disabled}>
            <Icon className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const setLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = prompt('Enter URL:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b sticky top-[49px] z-40 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-0.5 px-4 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} tooltip="Undo (Ctrl+Z)" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} tooltip="Redo (Ctrl+Y)" />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} tooltip="Heading 1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading2} tooltip="Heading 2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} icon={Heading3} tooltip="Heading 3" />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} tooltip="Bold (Ctrl+B)" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} tooltip="Italic (Ctrl+I)" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={Strikethrough} tooltip="Strikethrough" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} icon={Code} tooltip="Inline Code" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} icon={Highlighter} tooltip="Highlight" />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} tooltip="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} tooltip="Ordered List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} icon={CheckSquare} tooltip="Task List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={Quote} tooltip="Blockquote" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} icon={Code} tooltip="Code Block" />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} icon={Link2} tooltip="Insert Link" />
        <ToolbarButton onClick={onImageUpload} icon={Image} tooltip="Insert Image" />
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} tooltip="Horizontal Rule" />
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} icon={RemoveFormatting} tooltip="Clear Formatting" />
      </div>
    </div>
  );
}
