import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Heart, ShieldCheck, 
  MessageSquare, AlertTriangle, Wallet, ArrowDownToLine, 
  Settings, LogOut, DollarSign 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', to: '/users', icon: Users },
  { name: 'Girls', to: '/girls', icon: Heart },
  { name: 'Verification', to: '/verification', icon: ShieldCheck },
  { name: 'Chats', to: '/chats', icon: MessageSquare },
  { name: 'Settlements', to: '/settlements', icon: DollarSign },
  { name: 'Reports', to: '/reports', icon: AlertTriangle },
  { name: 'Wallet', to: '/wallet', icon: Wallet },
  { name: 'Withdrawals', to: '/withdrawals', icon: ArrowDownToLine },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="w-64 flex flex-col bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark">
      <div className="h-16 flex items-center px-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-xl font-bold text-primary">ChatVerse Admin</h1>
      </div>
      
      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-textSecondary-light dark:text-textSecondary-dark hover:bg-background-light dark:hover:bg-background-dark'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border-light dark:border-border-dark">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};
