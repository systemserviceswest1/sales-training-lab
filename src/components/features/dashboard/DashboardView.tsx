'use client';

import type { RoleplaySession, LeaderboardEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import StarRating from '@/components/features/roleplay/StarRating';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Mic, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  sessions: RoleplaySession[];
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
  isMaster: boolean;
}

export default function DashboardView({ sessions, leaderboard, currentUserId, isMaster }: Props) {
  const stats = useMemo(() => {
    if (sessions.length === 0) return { total: 0, avg: 0, chartData: [] };
    const avg = sessions.reduce((s, r) => s + (r.score ?? 0), 0) / sessions.length;
    const chartData = sessions.slice(0, 8).reverse().map((s, i) => ({
      label: `#${i + 1}`,
      score: s.score ?? 0,
      date: new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    }));
    return { total: sessions.length, avg: Math.round(avg * 10) / 10, chartData };
  }, [sessions]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-west-purple">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isMaster ? 'Visão geral da equipe' : 'Seu desempenho'}
          </p>
        </div>
        <Link
          href="/roleplay"
          className={buttonVariants({ className: 'bg-west-purple hover:bg-west-purple/90 gap-2' })}
        >
          <Mic className="w-4 h-4" />
          Iniciar Role Play
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-west-purple/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-west-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-3xl font-bold text-west-purple">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-west-purple/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-west-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Geral</p>
                <p className="text-3xl font-bold text-west-purple">
                  {stats.avg > 0 ? stats.avg.toFixed(1) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-west-purple/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-west-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                {stats.avg > 0 ? (
                  <StarRating rating={stats.avg} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-west-purple">Desempenho Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toFixed(1)} / 5`, 'Nota']}
                    labelFormatter={(l) => `Data: ${l}`}
                  />
                  <Bar dataKey="score" fill="#652D90" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <BarChart3 className="w-10 h-10 mx-auto opacity-30" />
                  <p>Complete uma sessão para ver seu gráfico.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-west-purple">Ranking da Equipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem dados ainda.</p>
            ) : (
              leaderboard.map((entry, index) => {
                const isMe = entry.id === currentUserId;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isMe ? 'bg-west-purple text-white' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm w-5 shrink-0">
                        {medal ?? `${index + 1}.`}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {entry.full_name ?? 'Consultor'}
                        {isMe && (
                          <Badge variant="outline" className="ml-1.5 text-xs border-white/40 text-white/80 py-0">
                            Você
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-sm">{Number(entry.average_score).toFixed(1)} ★</p>
                      <p className={`text-xs ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {entry.total_sessions} sessões
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
