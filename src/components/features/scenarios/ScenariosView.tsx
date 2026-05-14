'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialScenarios: Scenario[];
}

const EMPTY: Omit<Scenario, 'id' | 'created_by' | 'created_at' | 'updated_at'> = {
  name: '', description: '', west1_expectation: '',
};

export default function ScenariosView({ initialScenarios }: Props) {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Scenario> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = editing ?? EMPTY;

  const updateForm = (field: string, value: string) => {
    setEditing((prev) => ({ ...(prev ?? EMPTY), [field]: value }));
  };

  const inputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateForm(field, e.target.value);

  const textareaChange = (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    updateForm(field, e.target.value);

  const handleSave = async () => {
    if (!form.name || !form.description || !form.west1_expectation) {
      toast.error('Preencha todos os campos.');
      return;
    }
    setIsSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      west1_expectation: form.west1_expectation,
    };

    if ((form as Scenario).id) {
      const { error } = await supabase
        .from('scenarios')
        .update(payload)
        .eq('id', (form as Scenario).id);
      if (error) { toast.error('Erro ao atualizar cenário.'); }
      else { toast.success('Cenário atualizado!'); }
    } else {
      const { data, error } = await supabase
        .from('scenarios')
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error('Erro ao criar cenário.'); }
      else {
        setScenarios((prev) => [data as Scenario, ...prev]);
        toast.success('Cenário criado!');
      }
    }

    setShowForm(false);
    setEditing(null);
    setIsSaving(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este cenário?')) return;
    const { error } = await supabase.from('scenarios').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    toast.success('Cenário removido.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-west-purple">Cenários</h1>
          <p className="text-muted-foreground mt-1">Crie situações de atendimento para os role-plays</p>
        </div>
        <Button
          onClick={() => { setEditing({ ...EMPTY }); setShowForm(true); }}
          className="bg-west-purple hover:bg-west-purple/90 gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Cenário
        </Button>
      </div>

      {showForm && (
        <Card className="border-west-purple/30">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-xl font-bold text-west-purple">
              {(editing as Scenario)?.id ? 'Editar' : 'Novo'} Cenário
            </h3>

            <div className="space-y-2">
              <Label>Nome do Cenário *</Label>
              <Input
                value={form.name ?? ''}
                onChange={inputChange('name')}
                placeholder="Ex: Objeção de Preço"
              />
            </div>
            <div className="space-y-2">
              <Label>Dúvida / Preocupação do Estudante *</Label>
              <Textarea
                rows={4}
                value={form.description ?? ''}
                onChange={textareaChange('description')}
                placeholder="Descreva como o estudante se comporta e qual é a situação que ele apresenta..."
              />
            </div>
            <div className="space-y-2">
              <Label>Como a WEST 1 Espera que o Consultor Responda *</Label>
              <Textarea
                rows={6}
                value={form.west1_expectation ?? ''}
                onChange={textareaChange('west1_expectation')}
                placeholder="Descreva as perguntas investigativas, argumentos e informações obrigatórias que o consultor deve usar..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="bg-west-purple hover:bg-west-purple/90">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {scenarios.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum cenário criado ainda.
            </CardContent>
          </Card>
        )}
        {scenarios.map((scenario) => {
          const isExpanded = expandedId === scenario.id;
          return (
            <Card key={scenario.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors rounded-xl"
              >
                <div>
                  <p className="font-bold text-west-purple">{scenario.name}</p>
                  {!isExpanded && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{scenario.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => { e.stopPropagation(); setEditing(scenario); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleDelete(scenario.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 space-y-3 border-t">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Situação do Estudante</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{scenario.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Expectativa da WEST 1</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{scenario.west1_expectation}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
