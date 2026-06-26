import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, versionId } = await params;

  const doc = await prisma.document.findUnique({ where: { id }, include: { access: { where: { userId: session.user.id } } } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const role = doc.ownerId === session.user.id ? 'OWNER' : doc.access[0]?.role;
  if (!role || role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const targetVersion = await prisma.documentVersion.findFirst({ where: { id: versionId, documentId: id } });
  if (!targetVersion) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

  // Save current state as a version before restoring
  await prisma.documentVersion.create({
    data: { documentId: id, createdById: session.user.id, content: doc.content as object, version: doc.version, label: `Before restore to v${targetVersion.version}` },
  });

  const updated = await prisma.document.update({
    where: { id },
    data: { content: targetVersion.content as object, version: { increment: 1 } },
  });
  return NextResponse.json({ success: true, document: updated });
}
