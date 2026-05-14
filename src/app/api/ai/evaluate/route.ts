import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { StudentProfile, Scenario, EvaluationResult } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { transcript, profile, scenario } = await request.json() as {
    transcript: string;
    profile: StudentProfile;
    scenario: Scenario;
  };

  const prompt = `Como coach de vendas especialista da WEST 1, uma agência de intercâmbio, avalie esta sessão de role-play.

**Contexto:**
- Persona do estudante: ${profile.age} anos, ${profile.gender}, ${profile.profession}, personalidade "${profile.personality}", interesse em ${profile.destination}.
- Cenário: "${scenario.description}"
- Expectativa da WEST 1: "${scenario.west1_expectation}"

**Transcrição:**
---
${transcript}
---

Avalie o desempenho do consultor e responda em JSON com:
- score: número de 0 a 5 (pode ser decimal)
- feedback.positive_points: o que o consultor fez bem (string em PT-BR)
- feedback.improvement_points: o que pode melhorar (string em PT-BR)`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 500 });
  }

  const result = JSON.parse(content) as EvaluationResult;
  return NextResponse.json(result);
}
