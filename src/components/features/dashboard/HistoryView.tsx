'use client';

import { useState } from 'react';
import type { RoleplaySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/features/roleplay/StarRating';
import { ChevronDown, ChevronUp, Clock, User } from 'lucide-react';

interface Props {
  sessions: RoleplaySession[];
  isMaster: boolean;
}

export default function HistoryView({ sessions, isMaster }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-west-purple">Histórico</h1>
        <p className="text-muted-foreground mt-1">
          {isMaster ? 'Todas as sessões da equipe' : 'Suas sessões de role-play'}
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhuma sessão concluída ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const profile = session.student_profile_snapshot;
            const scenario = session.scenario_snapshot;
            const consultant = (session.user_profile as any);

            return (
              <Card key={session.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-semibold text-foreground truncate">
                      {scenario?.name ?? 'Cenário não disponível'}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(session.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {isMaster && consultant && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {consultant.full_name ?? consultant.email ?? 'Consultor'}
                        </span>
                      )}
                      {profile && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {profile.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {session.score != null && <StarRating rating={session.score} compact />}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-5 space-y-5 bg-muted/20">
                    {session.score != null && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Nota:</span>
                        <StarRating rating={session.score} />
                        <span className="text-lg font-bold text-west-purple">{session.score}/5</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {session.feedback_positive && (
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                          <h4 className="font-bold text-green-700 mb-2 text-sm">O que foi bem</h4>
                          <p className="text-sm text-green-800 whitespace-pre-wrap">{session.feedback_positive}</p>
                        </div>
                      )}
                      {session.feedback_improvements && (
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                          <h4 className="font-bold text-orange-700 mb-2 text-sm">Pontos de melhoria</h4>
                          <p className="text-sm text-orange-800 whitespace-pre-wrap">{session.feedback_improvements}</p>
                        </div>
                      )}
                    </div>

                    {session.transcript && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Transcrição</h4>
                        <div className="bg-background rounded-xl border p-4 max-h-48 overflow-y-auto">
                          <p className="text-sm whitespace-pre-wrap text-foreground/80">{session.transcript}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
