'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Mic,
  History,
  Users,
  BookOpen,
  ShieldCheck,
  LogOut,
  ChevronDown,
  FlaskConical,
} from 'lucide-react';
// buttonVariants imported above for Link-as-button pattern (base-ui Button has no asChild)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  masterOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roleplay', label: 'Role Play', icon: Mic },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/profiles', label: 'Personas', icon: Users, masterOnly: true },
  { href: '/scenarios', label: 'Cenários', icon: BookOpen, masterOnly: true },
  { href: '/users', label: 'Usuários', icon: ShieldCheck, masterOnly: true },
];

interface AppShellProps {
  children: React.ReactNode;
  userProfile: UserProfile;
}

export default function AppShell({ children, userProfile }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isMaster = userProfile.role === 'master';
  const initials = userProfile.full_name
    ? userProfile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-west-purple flex items-center justify-center">
              <FlaskConical className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-west-purple text-lg tracking-tight">
              WEST 1 <span className="font-light text-foreground/70">Sales Lab</span>
            </span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems
              .filter((item) => !item.masterOnly || isMaster)
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-west-purple/10 text-west-purple'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors outline-none">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-west-purple text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
                  {userProfile.full_name ?? userProfile.email ?? 'Usuário'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 flex flex-col gap-1">
                <span className="font-semibold text-sm">{userProfile.full_name ?? 'Usuário'}</span>
                <span className={cn(
                  'w-fit text-xs px-2 py-0.5 rounded-full font-medium',
                  isMaster ? 'bg-west-purple text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {isMaster ? 'Master' : 'Consultor'}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Nav Mobile */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {navItems
            .filter((item) => !item.masterOnly || isMaster)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-west-purple/10 text-west-purple'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
