import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HistoryView from '@/components/features/dashboard/HistoryView';
import type { RoleplaySession } from '@/types';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isMaster = profileData?.role === 'master';

  let query = supabase
    .from('roleplay_sessions')
    .select('*, user_profile:user_profiles(id, full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!isMaster) {
    query = query.eq('user_id', user.id);
  }

  const { data: sessions } = await query;

  return (
    <HistoryView
      sessions={(sessions ?? []) as RoleplaySession[]}
      isMaster={isMaster}
    />
  );
}
