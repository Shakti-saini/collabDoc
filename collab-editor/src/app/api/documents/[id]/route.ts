import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

async function getDocumentAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { access: { where: { userId } } },
  });

  if (!doc) return null;

  if (doc.ownerId === userId) {
    return { doc, role: 'OWNER' as const };
  }

  const access = doc.access[0];

  if (!access) return null;

  return { doc, role: access.role };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const result = await getDocumentAccess(id, session.user.id);

  if (!result) {
    return NextResponse.json(
      { error: 'Not found or access denied' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...result.doc,
    myRole: result.role,
  });
}

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.any().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const result = await getDocumentAccess(id, session.user.id);

  if (!result) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  if (result.role === 'VIEWER') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updates = updateSchema.parse(body);

    const data: Prisma.DocumentUpdateInput = {
      version: {
        increment: 1,
      },
    };

    if (updates.title !== undefined) {
      data.title = updates.title;
    }

    if (updates.content !== undefined) {
      data.content = updates.content as Prisma.InputJsonValue;
    }

    const updated = await prisma.document.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0].message },
        { status: 400 }
      );
    }

    console.error(e);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
  });

  if (!doc || doc.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  await prisma.document.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
  });
}