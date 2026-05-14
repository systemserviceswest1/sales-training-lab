'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, newRole: 'master' | 'consultant') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: caller } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (caller?.role !== 'master') throw new Error('Sem permissão');

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await service
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  revalidatePath('/users');
}
