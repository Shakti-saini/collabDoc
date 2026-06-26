import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1).max(255).default('Untitled Document'),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      include: { owner: { select: { id: true, name: true, image: true } }, access: { include: { user: { select: { id: true, name: true, image: true } } } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.documentAccess.findMany({
      where: { userId },
      include: { document: { include: { owner: { select: { id: true, name: true, image: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ owned, shared: shared.map(a => ({ ...a.document, myRole: a.role })) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { title } = createSchema.parse(body);
    const doc = await prisma.document.create({
      data: { title, ownerId: session.user.id, content: { type: 'doc', content: [{ type: 'paragraph' }] }, version: 1 },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
