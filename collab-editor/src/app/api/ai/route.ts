import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import OpenAI from 'openai';

const schema = z.object({
  action: z.enum(['improve', 'summarize', 'expand', 'grammar', 'tone', 'custom']),
  content: z.string().max(10000),
  instruction: z.string().max(500).optional(),
  tone: z.enum(['professional', 'casual', 'academic', 'persuasive']).optional(),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  improve: 'You are a writing assistant. Improve the following text for clarity, flow, and impact. Return only the improved text.',
  summarize: 'You are a writing assistant. Provide a concise summary of the following text in 2-3 sentences. Return only the summary.',
  expand: 'You are a writing assistant. Expand the following text with more detail and context while maintaining the original tone. Return only the expanded text.',
  grammar: 'You are a grammar checker. Fix any grammar, punctuation, and spelling errors in the text. Return only the corrected text.',
  tone: 'You are a writing assistant. Rewrite the following text in the specified tone. Return only the rewritten text.',
  custom: 'You are a writing assistant. Follow the user instruction precisely.',
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Return a mock response if no API key
    return NextResponse.json({ result: `[AI feature requires OPENAI_API_KEY] Your text: "${body.content.slice(0, 100)}..."` });
  }

  try {
    const client = new OpenAI({ apiKey });
    let userMessage = body.content;
    if (body.action === 'tone' && body.tone) userMessage = `Rewrite in ${body.tone} tone:\n\n${body.content}`;
    if (body.action === 'custom' && body.instruction) userMessage = `${body.instruction}\n\n${body.content}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[body.action] },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (e) {
    console.error('OpenAI error:', e);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
