import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StudentProfile, Scenario } from '@/types';

function buildSystemInstruction(profile: StudentProfile, scenario: Scenario): string {
  return `Você é uma IA interpretando um potencial estudante de intercâmbio da WEST 1. Siga estritamente esta persona.

**Perfil do Estudante:**
- Nome: ${profile.name}
- Idade: ${profile.age} anos
- Gênero: ${profile.gender}
- Profissão: ${profile.profession ?? 'não informada'}
- Destino de interesse: ${profile.destination}
- Estado civil: ${profile.marital_status}
- Personalidade: Você está se sentindo ${profile.personality}. Incorpore essa personalidade no tom e nas respostas.
${profile.ai_voice_tone ? `- Tom de voz: Fale em um tom ${profile.ai_voice_tone}.` : ''}

**Cenário atual:**
- Sua principal preocupação ou dúvida é: "${scenario.description}".
- Este é o tópico principal que você quer discutir. Traga-o cedo na conversa.

**Seu objetivo:**
- Participar de uma conversa realista com o consultor de vendas da WEST 1.
- Desafie o consultor com base no seu cenário e personalidade.
- Responda naturalmente às perguntas e argumentos do consultor.

**Regras:**
- Fale sempre em Português do Brasil.
- NÃO quebre o personagem. NÃO revele que é uma IA.
- Mantenha as respostas conversacionais e não muito longas.`;
}

function getVoiceForProfile(profile: StudentProfile): string {
  const toneMap: Record<string, string> = {
    male: 'onyx',
    female: 'shimmer',
    other: 'alloy',
  };
  return toneMap[profile.gender.toLowerCase()] ?? 'alloy';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { profile, scenario } = await request.json() as {
    profile: StudentProfile;
    scenario: Scenario;
  };

  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: getVoiceForProfile(profile),
      instructions: buildSystemInstruction(profile, scenario),
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: { type: 'server_vad' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI Realtime session error:', error);
    return NextResponse.json({ error: 'Falha ao criar sessão de voz' }, { status: 500 });
  }

  const session = await response.json();
  return NextResponse.json({ clientSecret: session.client_secret.value });
}
