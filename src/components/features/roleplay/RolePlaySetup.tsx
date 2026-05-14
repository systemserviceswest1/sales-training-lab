'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { StudentProfile, Scenario } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Play, User, FileText } from 'lucide-react';
import RolePlaySession from './RolePlaySession';

interface Props {
  profiles: StudentProfile[];
  scenarios: Scenario[];
}

function getRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export default function RolePlaySetup({ profiles, scenarios }: Props) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('random');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('random');

  const handleProfileChange = (v: string | null) => setSelectedProfileId(v ?? 'random');
  const handleScenarioChange = (v: string | null) => setSelectedScenarioId(v ?? 'random');
  const [activeSession, setActiveSession] = useState<{ profile: StudentProfile; scenario: Scenario } | null>(null);
  const router = useRouter();

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) ?? null,
    [selectedProfileId, profiles]
  );

  const selectedScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId) ?? null,
    [selectedScenarioId, scenarios]
  );

  const handleStart = () => {
    const profile = selectedProfile ?? getRandom(profiles);
    const scenario = selectedScenario ?? getRandom(scenarios);
    if (!profile || !scenario) return;
    setActiveSession({ profile, scenario });
  };

  const handleSessionEnd = () => {
    router.push('/history');
  };

  if (activeSession) {
    return (
      <RolePlaySession
        profile={activeSession.profile}
        scenario={activeSession.scenario}
        onEnd={handleSessionEnd}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-west-purple">Role Play</h1>
        <p className="text-muted-foreground mt-1">Configure e inicie uma sessão de treinamento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuração */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-west-purple" />
                1. Persona do Estudante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProfileId} onValueChange={handleProfileChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">
                    <span className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4" /> Aleatório
                    </span>
                  </SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-west-purple" />
                2. Cenário de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedScenarioId} onValueChange={handleScenarioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cenário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">
                    <span className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4" /> Aleatório
                    </span>
                  </SelectItem>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Preview + Iniciar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo da Sessão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProfile ? (
                <div className="flex items-start gap-4 p-4 bg-muted/40 rounded-xl">
                  <Avatar className="w-14 h-14 shrink-0">
                    <AvatarImage src={selectedProfile.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-west-purple/20 text-west-purple font-bold">
                      {selectedProfile.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold">{selectedProfile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProfile.age} anos · {selectedProfile.profession ?? 'Profissão não definida'}
                    </p>
                    <Badge variant="secondary" className="text-xs">{selectedProfile.personality}</Badge>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground flex items-center gap-2">
                  <Shuffle className="w-4 h-4" /> Uma persona aleatória será escolhida
                </div>
              )}

              <hr className="border-border/60" />

              {selectedScenario ? (
                <div className="p-4 bg-muted/40 rounded-xl space-y-1">
                  <p className="font-bold text-sm">{selectedScenario.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedScenario.description}</p>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground flex items-center gap-2">
                  <Shuffle className="w-4 h-4" /> Um cenário aleatório será escolhido
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                O microfone será ativado ao iniciar. Fale naturalmente com o estudante.
              </p>
              <Button
                onClick={handleStart}
                disabled={profiles.length === 0 || scenarios.length === 0}
                className="w-full h-12 text-base font-semibold bg-west-purple hover:bg-west-purple/90 gap-2"
                size="lg"
              >
                <Play className="w-5 h-5" />
                Iniciar Sessão
              </Button>
              {(profiles.length === 0 || scenarios.length === 0) && (
                <p className="text-xs text-destructive">
                  Adicione pelo menos uma persona e um cenário antes de iniciar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
