'use client';

import type { StudentProfile, Scenario, EvaluationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import { LayoutDashboard, ThumbsUp, Lightbulb } from 'lucide-react';

interface Utterance {
  speaker: 'Consultor' | 'Estudante';
  text: string;
}

interface Props {
  evaluation: EvaluationResult;
  transcript: Utterance[];
  profile: StudentProfile;
  scenario: Scenario;
  onFinish: () => void;
}

export default function ResultsView({ evaluation, transcript, onFinish }: Props) {
  const scoreColor =
    evaluation.score >= 4 ? 'text-green-600' :
    evaluation.score >= 2.5 ? 'text-amber-600' :
    'text-red-600';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-west-purple">Resultado da Sessão</h1>
        <p className="text-muted-foreground">Análise realizada pelo coach de IA</p>
      </div>

      {/* Score */}
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pontuação Geral</p>
          <StarRating rating={evaluation.score} />
          <p className={`text-5xl font-bold ${scoreColor}`}>
            {evaluation.score.toFixed(1)}<span className="text-2xl text-muted-foreground">/5</span>
          </p>
        </CardContent>
      </Card>

      {/* Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 text-base">
              <ThumbsUp className="w-4 h-4" /> O que foi bem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 whitespace-pre-wrap">
              {evaluation.feedback.positive_points}
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700 text-base">
              <Lightbulb className="w-4 h-4" /> Pontos de melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800 whitespace-pre-wrap">
              {evaluation.feedback.improvement_points}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transcrição da Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {transcript.map((u, i) => (
                <div key={i} className={`flex ${u.speaker === 'Consultor' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${
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
      )}

      <div className="flex justify-center">
        <Button
          onClick={onFinish}
          className="h-12 px-8 text-base font-semibold bg-west-purple hover:bg-west-purple/90 gap-2"
          size="lg"
        >
          <LayoutDashboard className="w-5 h-5" />
          Ir para o Histórico
        </Button>
      </div>
    </div>
  );
}
