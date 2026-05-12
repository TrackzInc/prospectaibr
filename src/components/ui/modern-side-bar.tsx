"use client";
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  FileText,
  Bell,
  Search,
  HelpCircle,
  History,
  TrendingUp,
  Columns,
  Link2
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "@tanstack/react-router";

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

interface SidebarProps {
  className?: string;
}

const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3, href: "/?tab=dashboard" },
  { id: "search", name: "Busca", icon: Search, href: "/" },
  { id: "funil", name: "Funil", icon: Columns, href: "/funil" },
  { id: "conexoes", name: "Conexões", icon: Link2, href: "/conexoes" },
  { id: "history", name: "Histórico", icon: History, href: "/?tab=history" },
];

export function Sidebar({ className = "" }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0]
        });
      }
    });
  }, []);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-zinc-800 shadow-md border border-zinc-700 md:hidden hover:bg-zinc-700 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-zinc-50" /> : 
          <Menu className="h-5 w-5 text-zinc-50" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-64"}
          md:translate-x-0 md:sticky md:top-0
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-[0_0_15px_rgba(170,255,0,0.3)]">
                <TrendingUp className="text-primary-foreground h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-50 text-sm tracking-tight">PROSPECT AI</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(170,255,0,0.3)]">
              <TrendingUp className="text-primary-foreground h-4 w-4" />
            </div>
          )}

          {/* Desktop collapse button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all duration-200"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-0 py-6 overflow-y-auto">
          <div className="px-4 mb-4">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 px-2">
                Navegação
              </p>
            )}
          </div>
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || (item.href === "/" && location.pathname === "/" && !(location.search as any).tab) || ((location.search as any).tab === item.id);

              return (
                <li key={item.id} className="relative">
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(170,255,0,0.5)]" />
                  )}
                  <Link
                    to={item.href as any}
                    onClick={() => {
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-6 py-2 transition-all duration-200 group
                      ${isActive
                        ? "text-zinc-50"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                      }
                      ${isCollapsed ? "justify-center px-0" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[20px]">
                      <Icon
                        className={`
                          h-5 w-5 flex-shrink-0 transition-colors
                          ${isActive 
                            ? "text-primary" 
                            : "text-zinc-500 group-hover:text-zinc-400"
                          }
                        `}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>{item.name}</span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-zinc-50 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-zinc-700">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-zinc-800/50 p-4">
          {!isCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-50 truncate">{user?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user?.email || 'Acessando...'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair da conta</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-primary text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-zinc-500 hover:text-zinc-50 transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
