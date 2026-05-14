import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { StudentProfile, Scenario, EvaluationResult } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { transcript, profile, scenario } = await request.json() as {
      transcript: string;
      profile: StudentProfile;
      scenario: Scenario;
    };

    if (!transcript?.trim()) {
      return NextResponse.json({
        score: 0,
        feedback: {
          positive_points: 'Sessão muito curta para avaliar.',
          improvement_points: 'Realize uma sessão mais longa para receber feedback detalhado.',
        },
      } satisfies EvaluationResult);
    }

    const prompt = `Você é um coach de vendas especialista da WEST 1, uma agência de intercâmbio educacional.
Avalie esta sessão de role-play de treinamento de consultores.

**Contexto do estudante:**
- Nome: ${profile.name}, ${profile.age} anos, ${profile.gender}
- Profissão: ${profile.profession ?? 'não informada'}
- Personalidade: ${profile.personality}
- Interesse: ${profile.destination}

**Cenário:** ${scenario.name}
${scenario.description}
${scenario.west1_expectation ? `**Expectativa WEST 1:** ${scenario.west1_expectation}` : ''}

**Transcrição:**
---
${transcript}
---

Responda em JSON com:
- score: nota de 0.0 a 5.0 (pode ser decimal, ex: 3.7)
- feedback.positive_points: o que o consultor fez bem (PT-BR, 2-4 pontos)
- feedback.improvement_points: o que pode melhorar (PT-BR, 2-4 pontos)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia da IA');

    const result = JSON.parse(content) as EvaluationResult;

    if (typeof result.score !== 'number' || !result.feedback) {
      throw new Error('Formato de resposta inválido');
    }

    result.score = Math.min(5, Math.max(0, result.score));

    return NextResponse.json(result);
  } catch (err) {
    console.error('Evaluate error:', err);
    return NextResponse.json({ error: 'Erro ao avaliar sessão' }, { status: 500 });
  }
}
