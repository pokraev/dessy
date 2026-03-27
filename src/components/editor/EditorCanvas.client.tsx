'use client';

import dynamic from 'next/dynamic';

const EditorCanvasInner = dynamic(
  () => import('./EditorCanvasInner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-[13px]">Loading canvas...</p>
      </div>
    ),
  }
);

export default function EditorCanvasClient(props: { projectId: string; formatId: string }) {
  return <EditorCanvasInner {...props} />;
}
