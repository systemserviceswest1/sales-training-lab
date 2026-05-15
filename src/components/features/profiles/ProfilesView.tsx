'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudentProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialProfiles: StudentProfile[];
}

const EMPTY: Omit<StudentProfile, 'id' | 'created_by' | 'created_at' | 'updated_at'> = {
  name: '', age: 25, gender: 'Female', destination: '', marital_status: 'Single',
  personality: '', profession: '', avatar_url: null, ai_voice_tone: '',
};

export default function ProfilesView({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<StudentProfile> | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = editing ?? EMPTY;

  const updateForm = (field: string, value: string | number | null) => {
    setEditing((prev) => ({ ...(prev ?? EMPTY), [field]: value ?? '' }));
  };

  const inputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateForm(field, e.target.value);

  const selectChange = (field: string) => (v: string | null) =>
    updateForm(field, v ?? '');

  const handleGenerateAvatar = async () => {
    if (!form.personality || !form.gender || !form.age) {
      toast.error('Preencha personalidade, gênero e idade antes de gerar o avatar.');
      return;
    }
    setIsGeneratingAvatar(true);
    try {
      const res = await fetch('/api/ai/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: form }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error ?? 'Resposta inválida');
      }
      updateForm('avatar_url', data.imageUrl);
      toast.success('Avatar gerado! Clique em Salvar para confirmar.');
    } catch (err) {
      console.error('Avatar error:', err);
      toast.error('Falha ao gerar avatar. Tente novamente.');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.destination || !form.personality) {
      toast.error('Preencha nome, destino e personalidade.');
      return;
    }
    setIsSaving(true);

    const payload = {
      name: form.name, age: Number(form.age), gender: form.gender,
      destination: form.destination, marital_status: form.marital_status,
      personality: form.personality, profession: form.profession ?? null,
      avatar_url: form.avatar_url ?? null, ai_voice_tone: form.ai_voice_tone ?? null,
    };

    if ((form as StudentProfile).id) {
      const { error } = await supabase
        .from('student_profiles')
        .update(payload)
        .eq('id', (form as StudentProfile).id);
      if (error) { toast.error('Erro ao atualizar persona.'); }
      else { toast.success('Persona atualizada!'); router.refresh(); }
    } else {
      const { data, error } = await supabase
        .from('student_profiles')
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error('Erro ao criar persona.'); }
      else {
        setProfiles((prev) => [data as StudentProfile, ...prev]);
        toast.success('Persona criada!');
      }
    }

    setShowForm(false);
    setEditing(null);
    setIsSaving(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta persona?')) return;
    const { error } = await supabase.from('student_profiles').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    toast.success('Persona removida.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-west-purple">Personas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os perfis de estudantes para os role-plays</p>
        </div>
        <Button
          onClick={() => { setEditing({ ...EMPTY }); setShowForm(true); }}
          className="bg-west-purple hover:bg-west-purple/90 gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Persona
        </Button>
      </div>

      {showForm && (
        <Card className="border-west-purple/30">
          <CardHeader>
            <CardTitle className="text-west-purple">
              {(editing as StudentProfile)?.id ? 'Editar' : 'Nova'} Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                {isGeneratingAvatar ? (
                  <AvatarFallback className="bg-west-purple/10">
                    <Loader2 className="w-8 h-8 text-west-purple animate-spin" />
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={form.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-west-purple/20 text-west-purple font-bold text-xl">
                      {form.name?.[0] ?? '?'}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAvatar}
                disabled={isGeneratingAvatar}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4 text-west-purple" />
                {isGeneratingAvatar ? 'Gerando...' : 'Gerar Avatar com IA'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name ?? ''} onChange={inputChange('name')} placeholder="Ex: Ana Costa" />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input type="number" value={form.age ?? 25} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm('age', parseInt(e.target.value))} min={16} max={80} />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={form.gender ?? 'Female'} onValueChange={selectChange('gender')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Feminino</SelectItem>
                    <SelectItem value="Male">Masculino</SelectItem>
                    <SelectItem value="Other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destino de Interesse *</Label>
                <Input value={form.destination ?? ''} onChange={inputChange('destination')} placeholder="Ex: Sydney, Dublin, Toronto" />
              </div>
              <div className="space-y-2">
                <Label>Profissão</Label>
                <Input value={form.profession ?? ''} onChange={inputChange('profession')} placeholder="Ex: Designer gráfica" />
              </div>
              <div className="space-y-2">
                <Label>Estado Civil</Label>
                <Select value={form.marital_status ?? 'Single'} onValueChange={selectChange('marital_status')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Solteiro(a)</SelectItem>
                    <SelectItem value="Married">Casado(a)</SelectItem>
                    <SelectItem value="Other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Personalidade *</Label>
                <Input value={form.personality ?? ''} onChange={inputChange('personality')} placeholder="Ex: Impaciente, direto, sem paciência" />
              </div>
              <div className="space-y-2">
                <Label>Tom de Voz da IA</Label>
                <Input value={form.ai_voice_tone ?? ''} onChange={inputChange('ai_voice_tone')} placeholder="Ex: Firme, jovem, impaciente" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="flex flex-col">
            <CardContent className="p-5 flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 shrink-0">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-west-purple/20 text-west-purple font-bold">
                    {profile.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-west-purple truncate">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.age} anos · {profile.destination}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{profile.personality}</Badge>
                </div>
              </div>
              {profile.profession && (
                <p className="text-sm text-muted-foreground">{profile.profession}</p>
              )}
            </CardContent>
            <div className="px-5 pb-5 flex gap-2 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => { setEditing(profile); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDelete(profile.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
