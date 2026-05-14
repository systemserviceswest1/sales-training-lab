'use client';

import { useState, useTransition } from 'react';
import type { UserProfile } from '@/types';
import { updateUserRole } from '@/app/actions/updateUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, User, Mail, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  users: UserProfile[];
  currentUserId: string;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium',
      role === 'master'
        ? 'bg-west-purple text-white'
        : 'bg-muted text-muted-foreground'
    )}>
      {role === 'master' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role === 'master' ? 'Master' : 'Consultor'}
    </span>
  );
}

function UserRow({
  user,
  isCurrentUser,
}: {
  user: UserProfile;
  isCurrentUser: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isMaster = user.role === 'master';

  const handleToggle = () => {
    const newRole = isMaster ? 'consultant' : 'master';
    startTransition(async () => {
      try {
        await updateUserRole(user.id, newRole);
        toast.success(
          `${user.full_name ?? 'Usuário'} agora é ${newRole === 'master' ? 'Master' : 'Consultor'}.`
        );
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar papel.');
      }
    });
  };

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl border transition-colors',
      isCurrentUser ? 'border-west-purple/40 bg-west-purple/5' : 'border-border bg-card'
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-west-purple/10 flex items-center justify-center shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={initials} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="text-west-purple font-bold text-sm">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{user.full_name ?? 'Sem nome'}</p>
            {isCurrentUser && (
              <span className="text-xs text-muted-foreground">(você)</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(user.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <RoleBadge role={user.role} />
        {!isCurrentUser && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50',
              isMaster
                ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                : 'border-west-purple/40 text-west-purple hover:bg-west-purple/10'
            )}
          >
            {isPending ? '...' : isMaster ? 'Rebaixar' : 'Promover'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function UsersView({ users, currentUserId }: Props) {
  const masters = users.filter((u) => u.role === 'master');
  const consultants = users.filter((u) => u.role === 'consultant');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-west-purple">Gestão de Usuários</h1>
        <p className="text-muted-foreground mt-1">
          {users.length} {users.length === 1 ? 'usuário registrado' : 'usuários registrados'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-west-purple/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-west-purple" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-west-purple">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-west-purple/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-west-purple" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Masters</p>
              <p className="text-2xl font-bold text-west-purple">{masters.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-west-purple/10 flex items-center justify-center">
              <User className="w-5 h-5 text-west-purple" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consultores</p>
              <p className="text-2xl font-bold text-west-purple">{consultants.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-west-purple">Usuários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhum usuário registrado ainda.
            </p>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
