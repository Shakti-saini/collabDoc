import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { EditorClient } from './EditorClient';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/auth/signin');
  const { id } = await params;
  return <EditorClient docId={id} user={session.user} />;
}
