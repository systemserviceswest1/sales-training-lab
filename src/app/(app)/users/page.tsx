import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UsersView from '@/components/features/users/UsersView';
import type { UserProfile } from '@/types';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'master') redirect('/dashboard');

  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <UsersView
      users={(users ?? []) as UserProfile[]}
      currentUserId={user.id}
    />
  );
}
