
import React from 'react';
import { LayoutDashboard, Users, CalendarCheck, FileText, Map, ClipboardList, DatabaseBackup, BookOpen, ShieldCheck, Sparkles, Mic2, MapPinned, LogOut, Lock, Presentation, Lightbulb, RefreshCw, Inbox, Link as LinkIcon, Globe, Store } from 'lucide-react';
import { SystemRole } from '../types';

interface SideMenuProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  userRole: SystemRole | null;
  currentUserRoles?: string[]; // Propriedade nova para checar roles específicas (tags)
}

const SideMenu: React.FC<SideMenuProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, onLogout, userRole, currentUserRoles = [] }) => {
  
  // VERSÃO DO SISTEMA
  const APP_VERSION = "Z-Elo v1.2";

  const hasServicePrivilege = userRole === SystemRole.TOTAL || 
                              currentUserRoles.includes('Coordenador') || 
                              currentUserRoles.includes('Sup. Serviço');

  // Itens disponíveis para ADMIN (Acesso Total)
  const allAdminItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'report_inbox', label: 'Caixa de Entrada', icon: <Inbox size={20} /> },
    { id: 'members', label: 'Publicadores', icon: <Users size={20} /> },
    { id: 'groups', label: 'Grupos de Campo', icon: <Map size={20} /> },
    { id: 'territories', label: 'Territórios', icon: <Globe size={20} />, restricted: true }, // Novo
    { id: 'public_witnessing', label: 'Testemunho Público', icon: <Store size={20} />, restricted: true }, // Novo
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
    // Publicadores comuns podem ver a agenda de carrinhos para se inscrever
    { id: 'public_witnessing', label: 'Carrinhos (Inscrição)', icon: <Store size={20} /> }, 
    { id: 'duties', label: 'Designações Apoio', icon: <ShieldCheck size={20} /> },
    { id: 'cleaning', label: 'Limpeza do Salão', icon: <Sparkles size={20} /> },
  ];

  let menuItems = publisherItems;

  if (userRole === SystemRole.TOTAL) {
    menuItems = allAdminItems;
  } else if (userRole === SystemRole.SELECTIVE) {
    // 1. Base: Remove itens técnicos
    let selectiveItems = allAdminItems.filter(item => item.id !== 'access' && item.id !== 'data');
    
    // 2. Filtro de Módulos Especiais (Territórios e Carrinhos)
    // Só mostra se tiver permissão de Coordenador ou Sup. Serviço
    if (!hasServicePrivilege) {
        selectiveItems = selectiveItems.filter(item => item.id !== 'territories');
        // Mantém 'public_witnessing' mas talvez em modo leitura (tratado no componente)
    }

    // Renomeia Dashboard
    selectiveItems = selectiveItems.map(item => 
        item.id === 'dashboard' ? { ...item, label: 'Meu Painel' } : item
    );
    
    menuItems = selectiveItems;
  }

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.reload();
  };

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
          {/* COMPACT LOGO */}
          <div className="relative w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center overflow-hidden shrink-0">
               <LinkIcon className="absolute text-purple-200 -rotate-45" size={28} />
               <span className="text-2xl font-black text-purple-900 z-10 relative">Z</span>
               <div className="absolute top-1 right-1 bg-amber-400 p-0.5 rounded-full border border-white z-20">
                  <Lightbulb size={8} className="text-white fill-white" />
               </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">Z-Elo</h1>
            <p className="text-xs text-purple-300 font-medium mt-1">Gestão de Congregação</p>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-2 overflow-y-auto h-[calc(100vh-220px)] custom-scrollbar pb-4">
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

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-purple-950 border-t border-purple-800 z-40">
           <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-200 rounded-lg transition-colors text-sm font-medium border border-purple-800 mb-3"
           >
             <LogOut size={16} /> Sair
           </button>
           
           <div className="flex items-center justify-between text-[10px] text-purple-400 px-1">
              <span>{APP_VERSION}</span>
              <button 
                type="button"
                onClick={handleRefresh} 
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-purple-900" 
                title="Recarregar Sistema"
              >
                 <RefreshCw size={12} /> Atualizar
              </button>
           </div>
        </div>
      </aside>
    </>
  );
};

export default SideMenu;
