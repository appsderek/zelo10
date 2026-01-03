import React, { useState } from 'react';
import { InboxMessage, Member, Group, SystemRole } from '../types';
import { Mail, CheckCircle2, Trash2, Clock, Check, AlertCircle, AlertTriangle, Search, Filter, Printer, Map as MapIcon, ExternalLink } from 'lucide-react';
import { handlePrint } from '../services/notificationService';

interface ReportInboxProps {
  messages: InboxMessage[];
  onMarkRead: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  currentUser?: Member;
  isReadOnly?: boolean;
  members?: Member[];
  groups?: Group[];
}

const ReportInbox: React.FC<ReportInboxProps> = ({ messages, onMarkRead, onDeleteMessage, currentUser, isReadOnly = false, members = [], groups = [] }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchName, setSearchName] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  
  // Estados para o Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageIdToDelete, setMessageIdToDelete] = useState<string | null>(null);

  const isTargetUser = (msg: InboxMessage) => {
      // 1. Admin Total vê tudo
      if (currentUser?.customRole === SystemRole.TOTAL) return true;

      // 2. Se for Seletivo...
      if (currentUser?.customRole === SystemRole.SELECTIVE) {
          // A. Se tiver a tag 'Coordenador', 'Secretário' ou 'Sup. Serviço', vê tudo (pois são administradores do campo)
          const userRoles = currentUser.roles || [];
          if (userRoles.includes('Coordenador') || userRoles.includes('Secretário') || userRoles.includes('Sup. Serviço')) {
             return true;
          }

          // B. Caso contrário, só vê se for direcionado especificamente a ele
          return msg.targetOverseerName === currentUser.fullName || !msg.targetOverseerName;
      }
      return false;
  };

  const filteredMessages = messages
    .filter(msg => isTargetUser(msg))
    .filter(msg => {
        // Filtro de Status
        if (filter === 'unread' && msg.read) return false;
        if (filter === 'read' && !msg.read) return false;

        // Busca de Membro para filtro avançado
        const member = members.find(m => m.id === msg.fromMemberId);
        const memberName = msg.fromMemberName || member?.fullName || '';
        const memberGroup = member?.serviceGroup || '';

        // Filtro de Nome
        if (searchName && !memberName.toLowerCase().includes(searchName.toLowerCase())) return false;

        // Filtro de Grupo
        if (searchGroup && memberGroup !== searchGroup) return false;

        return true;
    })
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Totais do Relatório Atual
  const totalHours = filteredMessages.reduce((sum, msg) => sum + (msg.reportData?.hours || 0), 0);
  const totalStudies = filteredMessages.reduce((sum, msg) => sum + (msg.reportData?.studies || 0), 0);

  const handleRequestDelete = (id: string) => {
      if (isReadOnly) return;
      setMessageIdToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (messageIdToDelete) {
          onDeleteMessage(messageIdToDelete);
          setIsDeleteModalOpen(false);
          setMessageIdToDelete(null);
      }
  };

  // Função auxiliar para exibir o mês corretamente independente do fuso horário
  const getDisplayMonth = (monthStr: string) => {
      if (!monthStr) return '-';
      const [year, month] = monthStr.split('-').map(Number);
      // Cria a data no dia 15 ao meio-dia para garantir que não volte o mês devido ao timezone
      const date = new Date(year, month - 1, 15, 12, 0, 0); 
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Mail className="text-purple-600" /> Caixa de Entrada
          </h2>
          <p className="text-slate-500">Relatórios e mensagens recebidas dos publicadores.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
                <Printer size={18} /> Imprimir Relatório (PDF)
            </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 print-hidden">
          <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500">
              <Search size={18} className="text-slate-400" />
              <input 
                  type="text" 
                  placeholder="Filtrar por nome..." 
                  className="bg-transparent outline-none text-sm w-full text-slate-700"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
              />
          </div>
          
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500 lg:w-64">
              <Filter size={18} className="text-slate-400" />
              <select 
                  className="bg-transparent outline-none text-sm w-full text-slate-700 cursor-pointer"
                  value={searchGroup}
                  onChange={(e) => setSearchGroup(e.target.value)}
              >
                  <option value="">Todos os Grupos</option>
                  {groups.map(g => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
              </select>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}>Todos</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'unread' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Não Lidos</button>
            <button onClick={() => setFilter('read')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'read' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500'}`}>Lidos</button>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden printable-content">
          {/* CABEÇALHO APENAS PARA IMPRESSÃO */}
          <div className="hidden print:block p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold uppercase text-center mb-2">Relatório de Envios - Caixa de Entrada</h1>
              <div className="flex justify-between text-sm text-gray-600">
                  <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>Filtro: {searchGroup || 'Todos os Grupos'}</span>
              </div>
          </div>

          {filteredMessages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs print:bg-white print:text-black">
                        <tr>
                            <th className="px-6 py-4 print:py-2">Status</th>
                            <th className="px-6 py-4 print:py-2">Data/Hora</th>
                            <th className="px-6 py-4 print:py-2">Remetente</th>
                            <th className="px-6 py-4 print:py-2">Conteúdo / Dados</th>
                            <th className="px-6 py-4 text-right print:hidden">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-gray-200">
                        {filteredMessages.map(msg => (
                            <tr key={msg.id} className={`transition-colors ${msg.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50 print:bg-white'}`}>
                                <td className="px-6 py-4 print:py-2 align-top">
                                    {msg.read ? (
                                        <span className="flex items-center gap-1 text-slate-400 text-xs font-medium print:hidden">
                                            <Check size={14} /> Lida
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-100 px-2 py-1 rounded-full print:hidden">
                                            <AlertCircle size={14} /> Nova
                                        </span>
                                    )}
                                    {/* Exibição simplificada para impressão */}
                                    <span className="hidden print:inline text-xs font-bold uppercase">
                                        {msg.read ? 'Lida' : 'Nova'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 print:py-2 align-top text-slate-600 text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{new Date(msg.date).toLocaleDateString('pt-BR')}</span>
                                        <span className="text-[10px] opacity-70">{new Date(msg.date).toLocaleTimeString('pt-BR')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 print:py-2 align-top">
                                    <div className="font-bold text-slate-800 text-sm">{msg.fromMemberName}</div>
                                    <div className="text-xs text-slate-500">Dir: {msg.targetOverseerName || 'Secretaria'}</div>
                                </td>
                                <td className="px-6 py-4 print:py-2 align-top">
                                    <p className="text-sm text-slate-700 mb-1">{msg.content}</p>
                                    {msg.reportData && (
                                        <div className="bg-purple-50 border border-purple-100 p-2 rounded text-xs text-purple-800 flex gap-3 w-fit print:bg-transparent print:border-slate-300 print:text-black">
                                            <span className="font-bold">Mês: {getDisplayMonth(msg.reportData.month)}</span>
                                            <span>|</span>
                                            <span>Horas: <strong>{msg.reportData.hours}</strong></span>
                                            <span>|</span>
                                            <span>Estudos: <strong>{msg.reportData.studies}</strong></span>
                                        </div>
                                    )}
                                    {msg.assignmentData && (
                                        <div className="bg-blue-50 border border-blue-100 p-2 rounded text-xs text-blue-800 flex flex-col gap-1 w-fit print:bg-transparent print:border-slate-300 print:text-black">
                                            <div className="flex items-center gap-1 font-bold">
                                                <MapIcon size={12} /> Território #{msg.assignmentData.territoryNumber}
                                            </div>
                                            <span>{msg.assignmentData.territoryName}</span>
                                            {msg.assignmentData.territoryImage && (
                                                <a href={msg.assignmentData.territoryImage} target="_blank" rel="noreferrer" className="text-blue-600 underline flex items-center gap-1 mt-1 print:hidden">
                                                    <ExternalLink size={10} /> Ver Mapa
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right align-top print:hidden">
                                    <div className="flex justify-end gap-2">
                                        {!msg.read && (
                                            <button 
                                                onClick={() => onMarkRead(msg.id)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Marcar como lida"
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleRequestDelete(msg.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir mensagem"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
              <div className="p-12 text-center text-slate-400">
                  <Mail size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhuma mensagem encontrada.</p>
              </div>
          )}
            
            {/* TOTALIZADORES DE RODAPÉ (RESUMO) */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center text-sm font-bold text-slate-600 print:bg-white print:border-t-2 print:border-black">
                <span>Total de Mensagens Listadas: {filteredMessages.length}</span>
                <div className="flex gap-4">
                    <span>Total Horas: {totalHours}</span>
                    <span>Total Estudos: {totalStudies}</span>
                </div>
            </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="p-3 bg-red-100 rounded-full">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Tem certeza que deseja excluir esta mensagem? 
               <br/><span className="text-xs text-red-500 mt-2 block">Esta ação não pode ser desfeita.</span>
             </p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
               <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors">Sim, Excluir</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportInbox;