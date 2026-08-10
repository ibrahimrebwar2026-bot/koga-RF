import React, { useState } from 'react';
import { Role } from '../types';
import { 
  Package, 
  Calculator, 
  Users, 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Store,
  History
} from 'lucide-react';
import InventoryView from './views/InventoryView';
import LedgerView from './views/LedgerView';
import RepsView from './views/RepsView';
import DebtsView from './views/DebtsView';
import CashView from './views/CashView';
import PaidDebtsView from './views/PaidDebtsView';
import OrdersView from './views/OrdersView';
import MarketsView from './views/MarketsView';
import StockHistoryView from './views/StockHistoryView';

interface DashboardProps {
  role: Role;
  onLogout: () => void;
}

export default function Dashboard({ role, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenu = [
    { id: 'inventory', label: 'داخڵکردن و کۆگا', icon: Package },
    { id: 'stock_history', label: 'مێژووی هاتنی کاڵا', icon: History },
    { id: 'orders', label: 'ئۆردەرەکان', icon: ShoppingCart },
    { id: 'markets', label: 'مارکێتەکان', icon: Store },
    { id: 'ledger', label: 'دەفتەری حیسابات', icon: Calculator },
    { id: 'reps', label: 'مەندووبەکان', icon: Users },
    { id: 'debts', label: 'قەرزەکان', icon: CreditCard },
    { id: 'cash', label: 'نەقدەکان', icon: Banknote },
    { id: 'paid', label: 'واسڵکراوەکان', icon: CheckCircle },
  ];

  const warehouseMenu = [
    { id: 'inventory', label: 'داخڵکردن و کۆگا', icon: Package },
    { id: 'stock_history', label: 'مێژووی هاتنی کاڵا', icon: History },
    { id: 'orders', label: 'ئۆردەرەکان', icon: ShoppingCart },
  ];

  const repMenu = [
    { id: 'orders', label: 'ئۆردەرکردنی کاڵا', icon: ShoppingCart },
  ];

  const menu = role === 'admin' ? adminMenu : role === 'warehouse' ? warehouseMenu : repMenu;

  // Initialize active tab if empty
  if (!activeTab && menu.length > 0) {
    setActiveTab(menu[0].id);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory': return <InventoryView role={role} />;
      case 'stock_history': return <StockHistoryView />;
      case 'markets': return <MarketsView />;
      case 'ledger': return <LedgerView />;
      case 'reps': return <RepsView />;
      case 'debts': return <DebtsView />;
      case 'cash': return <CashView />;
      case 'paid': return <PaidDebtsView />;
      case 'orders': return <OrdersView role={role} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#1E293B] font-sans overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Header */}
      <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Package size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">کۆگای RF</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {role === 'admin' ? 'بەڕێوەبەر' : role === 'warehouse' ? 'کارمەندی کۆگا' : 'مەندووب'}
            </span>
            <span className="text-sm font-medium">{menu.find(m => m.id === activeTab)?.label}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-500">
            <Users size={20} />
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Package size={20} />
          </div>
          <h2 className="font-semibold text-slate-800 text-lg">
            {menu.find(m => m.id === activeTab)?.label}
          </h2>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-30 w-64 bg-white border-l border-slate-200 flex flex-col p-4 gap-2 transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="lg:hidden p-2 mb-2 border-b border-slate-100 flex justify-between items-center">
             <h1 className="font-bold text-slate-800">کۆگای RF</h1>
             <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500"><X size={20}/></button>
          </div>

          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl flex items-center gap-3 font-semibold mb-2">
            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span> داشبۆرد
          </div>
          
          <nav className="flex flex-col gap-1 overflow-y-auto">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors
                    ${isActive ? 'bg-slate-50 text-indigo-600 font-medium border border-slate-100' : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">سێرڤەری فایەربەیس</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs font-bold text-slate-700">پەیوەستە</span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium"
            >
              <LogOut size={18} />
              <span>چوونەدەرەوە</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
