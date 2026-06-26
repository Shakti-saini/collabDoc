import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { mergeClock, compareClock, VectorClock } from '@/lib/sync/vectorClock';

const MAX_PAYLOAD_BYTES = 512 * 1024;
const MAX_TITLE_LEN = 255;

const syncSchema = z.object({
  operation: z.object({
    documentId: z.string(),
    title: z.string().max(MAX_TITLE_LEN).optional(),
    content: z.record(z.unknown()).optional(),
    clientVersion: z.number().int().min(0),
  }),
  vectorClock: z.record(z.number()),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Guard payload size to prevent OOM attacks
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // Row-level security: check access
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { access: { where: { userId: session.user.id } } },
  });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  const isOwner = doc.ownerId === session.user.id;
  const role = isOwner ? 'OWNER' : doc.access[0]?.role;
  if (!role || role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: z.infer<typeof syncSchema>;
  try {
    const raw = await req.json();
    body = syncSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid sync payload' }, { status: 400 });
  }

  const { operation, vectorClock: clientClock } = body;

  // Vector clock conflict detection
  const serverClock: VectorClock = (doc as Record<string, unknown> & { vectorClock?: VectorClock }).vectorClock ?? {};
  const comparison = compareClock(clientClock, serverClock);

  if (comparison === 'concurrent') {
    // Deterministic merge: last-write-wins on content, merge titles by choosing non-empty
    const mergedContent = operation.content ?? doc.content;
    const mergedTitle = operation.title ?? doc.title;
    const mergedClock = mergeClock(clientClock, serverClock);

    const updated = await prisma.document.update({
      where: { id },
      data: { content: mergedContent as object, title: mergedTitle, version: { increment: 1 } },
    });

    await prisma.syncOperation.create({
      data: {
        documentId: id, userId: session.user.id,
        operation: operation as object,
        vectorClock: mergedClock,
        status: 'CONFLICTED', appliedAt: new Date(),
      },
    });

    return NextResponse.json({ merged: mergedContent, version: updated.version, vectorClock: mergedClock, conflict: true }, { status: 409 });
  }

  // Normal apply
  const mergedClock = mergeClock(clientClock, serverClock);
  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(operation.title && { title: operation.title }),
      ...(operation.content && { content: operation.content as object }),
      version: { increment: 1 },
    },
  });

  await prisma.syncOperation.create({
    data: {
      documentId: id, userId: session.user.id,
      operation: operation as object,
      vectorClock: mergedClock,
      status: 'APPLIED', appliedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, version: updated.version, vectorClock: mergedClock });
}
