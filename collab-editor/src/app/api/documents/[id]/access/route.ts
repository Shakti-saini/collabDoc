import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const shareSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.ownerId !== session.user.id) return NextResponse.json({ error: 'Only owner can share' }, { status: 403 });

  const body = await req.json();
  const { email, role } = shareSchema.parse(body);
  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (targetUser.id === session.user.id) return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });

  const access = await prisma.documentAccess.upsert({
    where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    update: { role },
    create: { documentId: id, userId: targetUser.id, role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return NextResponse.json(access, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.documentAccess.deleteMany({ where: { documentId: id, userId } });
  return NextResponse.json({ success: true });
}
