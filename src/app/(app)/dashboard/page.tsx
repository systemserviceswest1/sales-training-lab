import { createClient } from '@/lib/supabase/server';
import DashboardView from '@/components/features/dashboard/DashboardView';
import type { RoleplaySession, LeaderboardEntry } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [sessionsResult, leaderboardResult, profileResult] = await Promise.all([
    supabase
      .from('roleplay_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .not('score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('leaderboard')
      .select('*')
      .limit(10),
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user!.id)
      .single(),
  ]);

  return (
    <DashboardView
      sessions={(sessionsResult.data ?? []) as RoleplaySession[]}
      leaderboard={(leaderboardResult.data ?? []) as LeaderboardEntry[]}
      currentUserId={user!.id}
      isMaster={profileResult.data?.role === 'master'}
    />
  );
}
