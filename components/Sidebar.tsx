import React from 'react';
import { LayoutDashboard, Users, CalendarCheck, FileText, Map, ClipboardList, DatabaseBackup, BookOpen, ShieldCheck, Sparkles, Mic2, MapPinned, LogOut, Lock, Presentation, Lightbulb } from 'lucide-react';
import { SystemRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  userRole: SystemRole | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, onLogout, userRole }) => {
  
  // Itens disponíveis para ADMIN (Acesso Total) e SELETIVO
  const adminItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'members', label: 'Publicadores', icon: <Users size={20} /> },
    { id: 'groups', label: 'Grupos de Campo', icon: <Map size={20} /> },
    { id: 'schedule', label: 'Vida e Ministério', icon: <BookOpen size={20} /> },
    { id: 'public_talks', label: 'Discursos Públicos', icon: <Presentation size={20} /> },
    { id: 'chairman_readers', label: 'Presidentes e Leitores', icon: <Mic2 size={20} /> },
    { id: 'field_service', label: 'Saídas de Campo', icon: <MapPinned size={20} /> },
    { id: 'duties', label: 'Designações Apoio', icon: <ShieldCheck size={20} /> },
    { id: 'cleaning', label: 'Limpeza do Salão', icon: <Sparkles size={20} /> },
    { id: 'idea_bank', label: 'Banco de Ideias', icon: <Lightbulb size={20} /> },
    { id: 'reports', label: 'Relatórios de Campo', icon: <ClipboardList size={20} /> },
    { id: 'attendance', label: 'Assistência', icon: <CalendarCheck size={20} /> },
    { id: 'access', label: 'Controle de Acesso', icon: <Lock size={20} /> },
    { id: 'data', label: 'Dados & Backup', icon: <DatabaseBackup size={20} /> },
  ];

  // Itens disponíveis para PUBLICADOR (Visualização Restrita)
  const publisherItems = [
    { id: 'dashboard', label: 'Meu Painel', icon: <LayoutDashboard size={20} /> },
    { id: 'schedule', label: 'Vida e Ministério', icon: <BookOpen size={20} /> },
    { id: 'public_talks', label: 'Discursos Públicos', icon: <Presentation size={20} /> },
    { id: 'chairman_readers', label: 'Presidentes e Leitores', icon: <Mic2 size={20} /> },
    { id: 'field_service', label: 'Saídas de Campo', icon: <MapPinned size={20} /> },
    { id: 'duties', label: 'Designações Apoio', icon: <ShieldCheck size={20} /> },
    { id: 'cleaning', label: 'Limpeza do Salão', icon: <Sparkles size={20} /> },
  ];

  // A lógica agora é: se for Total ou Seletivo, mostra o menu completo. Se for Restrito, mostra o limitado.
  const menuItems = (userRole === SystemRole.TOTAL || userRole === SystemRole.SELECTIVE) ? adminItems : publisherItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden print-hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-purple-900 text-white transition-transform duration-300 ease-in-out print-hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-purple-800 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-md">
            <BookOpen className="text-purple-900" size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight leading-none text-white">Zelo</h1>
            <p className="text-xs text-purple-300 font-medium">Gestão Teocrática</p>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-2 overflow-y-auto h-[calc(100vh-200px)] custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${activeTab === item.id 
                  ? 'bg-purple-700 text-white shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-800 hover:text-white'}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-purple-950 border-t border-purple-800">
           <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-200 rounded-lg transition-colors text-sm font-medium border border-purple-800 mb-2"
           >
             <LogOut size={16} /> Sair do Sistema
           </button>
           <p className="text-[10px] text-purple-500 text-center">
            Zelo v1.0 &copy; 2024
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;