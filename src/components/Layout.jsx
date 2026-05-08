import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, BarChart2, Star, Menu, X, Sun, Moon, Bell, LogOut, User, Gift, Award, PenSquare, Heart, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import GiftLevelIndicator from './GiftLevelIndicator';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/leaderboard', label: 'Leaderboard', icon: Award },
  { path: '/stats', label: 'Stats', icon: BarChart2 },
  { path: '/promote', label: 'Promote', icon: Star },
  { path: '/vibe-history', label: 'Vibes', icon: Heart },
];

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const { user, profile } = useAuth();
  const location = useLocation();

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6">
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
              <Gem className="h-7 w-7 text-primary" />
              <span className="gradient-text">Herazur</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`
                        }
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto -mx-2">
                <div className='p-4 text-center text-xs text-muted-foreground'>
                  <Link to="/about" className="hover:underline">About</Link> · 
                  <Link to="/contact" className="hover:underline"> Contact</Link> · 
                  <Link to="/blog" className="hover:underline"> Blog</Link> <br/>
                  <Link to="/privacy" className="hover:underline">Privacy</Link> · 
                  <Link to="/terms" className="hover:underline"> Terms</Link>
                  <p className='mt-2'>© {new Date().getFullYear()} Herazur</p>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed inset-0 z-50"
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 h-full bg-background border-r border-border/40 p-6">
              <div className="flex h-16 shrink-0 items-center mb-5">
                <Link to="/" className="flex items-center gap-2 text-2xl font-bold" onClick={() => setSidebarOpen(false)}>
                  <Gem className="h-7 w-7 text-primary" />
                  <span className="gradient-text">Herazur</span>
                </Link>
              </div>
              <nav>
                <ul role="list" className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Header = ({ setSidebarOpen }) => {
  const { theme, setTheme, themes } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { coins } = useData();

  const toggleTheme = () => {
    setTheme(theme === themes.DARK ? themes.PURPLE : themes.DARK);
  };

  return (
    <header className="lg:pl-64 sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/40 bg-background/95 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden">
        <Menu className="h-6 w-6" />
      </Button>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/activity"><Bell className="h-6 w-6" /></Link>
            </Button>
          )}

          {user && profile && (
            <>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <Gem className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">{coins}</span>
              </div>
              <div className="flex items-center gap-2">
                 <GiftLevelIndicator level={profile.gift_level ?? 1} xp={profile.gift_xp ?? 0} />
              </div>
            </>
          )}

          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-x-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{profile.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/u/${profile.username}`}><User className="mr-2 h-4 w-4" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link to="/edit-profile"><PenSquare className="mr-2 h-4 w-4" /> Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthRoute = location.pathname === '/auth';

  if (isAuthRoute) {
    return <main>{children}</main>;
  }

  return (
    <div>
      <Sidebar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />
        <main>{children}</main>
      </div>
    </div>
  );
}