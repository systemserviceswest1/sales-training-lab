import { createClient } from '@/lib/supabase/server';
import RolePlaySetup from '@/components/features/roleplay/RolePlaySetup';
import type { StudentProfile, Scenario } from '@/types';

export default async function RolePlayPage() {
  const supabase = await createClient();

  const [profilesResult, scenariosResult] = await Promise.all([
    supabase.from('student_profiles').select('*').order('name'),
    supabase.from('scenarios').select('*').order('name'),
  ]);

  return (
    <RolePlaySetup
      profiles={(profilesResult.data ?? []) as StudentProfile[]}
      scenarios={(scenariosResult.data ?? []) as Scenario[]}
    />
  );
}
