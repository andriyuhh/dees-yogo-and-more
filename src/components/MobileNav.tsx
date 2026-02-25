import { NavLink as RouterNavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, TrendingUp, Users, Settings } from 'lucide-react';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/inventory', icon: Package, label: 'Stock' },
  { to: '/customers', icon: Users, label: 'CRM' },
  { to: '/sales', icon: TrendingUp, label: 'Sales' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-semibold">{label}</span>
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
