'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { StudentProfile, Scenario, EvaluationResult } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import ResultsView from './ResultsView';

interface Utterance {
  speaker: 'Consultor' | 'Estudante';
  text: string;
}

interface Props {
  profile: StudentProfile;
  scenario: Scenario;
  onEnd: (sessionId: string) => void;
}

type State = 'idle' | 'connecting' | 'active' | 'evaluating' | 'done';

export default function RolePlaySession({ profile, scenario, onEnd }: Props) {
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState<Utterance[]>([]);
  const [isStudentSpeaking, setIsStudentSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    if (state === 'active') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'input_audio_buffer.speech_started') {
        setIsStudentSpeaking(false);
      }
      if (msg.type === 'response.audio.started') {
        setIsStudentSpeaking(true);
      }
      if (msg.type === 'response.audio.done') {
        setIsStudentSpeaking(false);
      }

      if (
        msg.type === 'conversation.item.input_audio_transcription.completed' &&
        msg.transcript?.trim()
      ) {
        setTranscript((prev) => [...prev, { speaker: 'Consultor', text: msg.transcript.trim() }]);
      }

      if (msg.type === 'response.audio_transcript.done' && msg.transcript?.trim()) {
        setTranscript((prev) => [...prev, { speaker: 'Estudante', text: msg.transcript.trim() }]);
      }
    } catch {}
  }, []);

  const startSession = useCallback(async () => {
    if (state !== 'idle') return;
    setState('connecting');

    try {
      const tokenRes = await fetch('/api/ai/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, scenario }),
      });
      if (!tokenRes.ok) throw new Error('Falha ao obter token de sessão');
      const { clientSecret } = await tokenRes.json();

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = document.createElement('audio');
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      dc.onmessage = handleDataChannelMessage;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );
      if (!sdpRes.ok) throw new Error('Falha ao conectar com OpenAI Realtime');

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setState('active');
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível iniciar a sessão. Verifique as permissões de microfone.');
      setState('idle');
    }
  }, [state, profile, scenario, handleDataChannelMessage]);

  const stopSession = useCallback(async () => {
    if (state !== 'active') return;
    setState('evaluating');

    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;

    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }

    const fullTranscript = transcript
      .map((u) => `${u.speaker}: ${u.text}`)
      .join('\n');

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const evalRes = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript, profile, scenario }),
      });
      const result: EvaluationResult = await evalRes.json();
      setEvaluation(result);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: session } = await supabase.from('roleplay_sessions').insert({
          user_id: user.id,
          student_profile_snapshot: profile,
          scenario_snapshot: scenario,
          transcript: fullTranscript,
          score: result.score,
          feedback_positive: result.feedback.positive_points,
          feedback_improvements: result.feedback.improvement_points,
          duration_seconds: duration,
          completed_at: new Date().toISOString(),
        }).select().single();
        if (session) setSavedSessionId(session.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar avaliação. Tente novamente.');
    }

    setState('done');
  }, [state, transcript, profile, scenario]);

  if (state === 'done' && evaluation) {
    return (
      <ResultsView
        evaluation={evaluation}
        transcript={transcript}
        profile={profile}
        scenario={scenario}
        onFinish={() => onEnd(savedSessionId ?? '')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-west-purple">Sessão em Andamento</h1>
          {state === 'active' && (
            <p className="text-muted-foreground mt-1 font-mono">{formatTime(elapsed)}</p>
          )}
        </div>
        {state === 'active' && (
          <Button variant="destructive" onClick={stopSession} className="gap-2">
            <Square className="w-4 h-4" />
            Encerrar e Avaliar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info + Transcript */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-west-purple/20 text-west-purple font-bold">
                    {profile.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.age} anos · {profile.destination}</p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit text-xs">{profile.personality}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cenário</p>
              <p className="text-sm text-foreground/80">{scenario.name}</p>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Transcrição</p>
              <div ref={transcriptRef} className="h-64 overflow-y-auto space-y-3 pr-1">
                {transcript.length === 0 && state !== 'connecting' && (
                  <p className="text-sm text-muted-foreground italic">A transcrição aparecerá aqui...</p>
                )}
                {transcript.map((u, i) => (
                  <div key={i} className={`flex ${u.speaker === 'Consultor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                      u.speaker === 'Consultor'
                        ? 'bg-west-purple text-white'
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="font-semibold text-xs opacity-70 mb-0.5">{u.speaker}</p>
                      <p>{u.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Avatar + Controls */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-8 py-8">
          {/* Avatar with speaking animation */}
          <div className="relative flex items-center justify-center w-72 h-72">
            {isStudentSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-west-lavender animate-pulse-ring" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-west-lavender animate-pulse-ring"
                  style={{ animationDelay: '0.8s' }}
                />
              </>
            )}
            <div className="relative w-64 h-64 rounded-full bg-muted border-8 border-white shadow-2xl overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-west-purple/10">
                  <span className="text-8xl font-bold text-west-purple/30">{profile.name[0]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status indicator */}
          {state === 'active' && (
            <div className="flex items-center gap-2 text-sm">
              {isStudentSpeaking ? (
                <>
                  <Volume2 className="w-4 h-4 text-west-purple animate-pulse" />
                  <span className="text-west-purple font-medium">{profile.name} está falando...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Sua vez de falar</span>
                </>
              )}
            </div>
          )}

          {/* Start button */}
          {state === 'idle' && (
            <button
              onClick={startSession}
              className="w-24 h-24 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105"
            >
              <Mic className="w-10 h-10" />
            </button>
          )}

          {state === 'connecting' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-west-purple/20 flex items-center justify-center animate-pulse">
                <Mic className="w-10 h-10 text-west-purple" />
              </div>
              <p className="text-sm text-muted-foreground">Conectando...</p>
            </div>
          )}

          {state === 'evaluating' && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                <span className="text-4xl">🤖</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Analisando seu desempenho...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
