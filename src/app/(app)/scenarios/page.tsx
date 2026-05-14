import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ScenariosView from '@/components/features/scenarios/ScenariosView';
import type { Scenario } from '@/types';

export default async function ScenariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'master') redirect('/dashboard');

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .order('created_at', { ascending: false });

  return <ScenariosView initialScenarios={(scenarios ?? []) as Scenario[]} />;
}
