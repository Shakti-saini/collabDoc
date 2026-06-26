import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

async function checkAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: docId }, include: { access: { where: { userId } } } });
  if (!doc) return null;
  const role = doc.ownerId === userId ? 'OWNER' : doc.access[0]?.role ?? null;
  return { doc, role };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await checkAccess(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(versions);
}

const versionSchema = z.object({ label: z.string().max(100).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const access = await checkAccess(id, session.user.id);
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (access.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { label } = versionSchema.parse(body);

  const version = await prisma.documentVersion.create({
    data: {
      documentId: id,
      createdById: session.user.id,
      content: access.doc.content as object,
      version: access.doc.version,
      label: label ?? `Version ${access.doc.version}`,
    },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(version, { status: 201 });
}
