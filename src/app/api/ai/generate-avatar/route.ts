import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { StudentProfile } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { profile } = await request.json() as { profile: Partial<StudentProfile> };

    const prompt = `Pixar-style friendly portrait avatar, forward-facing, soft neutral background, no text or logos. Character: ${profile.age ?? 25} years old, ${profile.gender ?? 'person'}, works as ${profile.profession ?? 'professional'}, personality: ${profile.personality ?? 'friendly'}.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: 'Falha ao gerar imagem' }, { status: 500 });

    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('generate-avatar error:', err);
    return NextResponse.json({ error: 'Erro ao gerar avatar' }, { status: 500 });
  }
}
