import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfilesView from '@/components/features/profiles/ProfilesView';
import type { StudentProfile } from '@/types';

export default async function ProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'master') redirect('/dashboard');

  const { data: profiles } = await supabase
    .from('student_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return <ProfilesView initialProfiles={(profiles ?? []) as StudentProfile[]} />;
}
