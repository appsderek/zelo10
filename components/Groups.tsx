import React, { useState } from 'react';
import { Group, Member, MemberPrivilege, ServiceReport, InboxMessage } from '../types';
import { Plus, Edit2, Trash2, X, MapPin, User, Users, Eye, CheckCircle2, Clock } from 'lucide-react';

interface GroupsProps {
  groups: Group[];
  members: Member[];
  reports: ServiceReport[];
  inboxMessages?: InboxMessage[]; // Nova prop para ler a caixa de entrada
  onAddGroup: (group: Group) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
  isReadOnly?: boolean;
}

const Groups: React.FC<GroupsProps> = ({ groups, members, reports = [], inboxMessages = [], onAddGroup, onUpdateGroup, onDeleteGroup, isReadOnly = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // States para o Modal de Detalhes do Grupo
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Inicializa com o mês ANTERIOR por padrão (pois é o mês de relatório)
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  });

  const [formData, setFormData] = useState<Partial<Group>>({
    name: '',
    overseer: '',
    assistant: '',
    meetingPlace: ''
  });

  // Filtra apenas Anciãos e Servos Ministeriais para liderança
  const qualifiedBrothers = members.filter(m => 
    m.privilege === MemberPrivilege.ELDER || 
    m.privilege === MemberPrivilege.MINISTERIAL_SERVANT
  ).sort((a, b) => a.fullName.localeCompare(b.fullName));

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData(group);
    } else {
      if(isReadOnly) return;
      setEditingGroup(null);
      setFormData({
        name: `Grupo ${groups.length + 1}`,
        overseer: '',
        assistant: '',
        meetingPlace: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isReadOnly) return;
    if (editingGroup) {
      onUpdateGroup({ ...editingGroup, ...formData } as Group);
    } else {
      onAddGroup({ ...formData, id: crypto.randomUUID() } as Group);
    }
    setIsModalOpen(false);
  };

  const getReportStatus = (memberId: string) => {
      // 1. Verifica na lista oficial de relatórios processados
      const report = reports.find(r => r.memberId === memberId && r.month === viewMonth);
      if (report && report.participated) return 'submitted';
      if (report && !report.participated) return 'submitted_zero';

      // 2. Verifica na CAIXA DE ENTRADA (Espelhamento)
      // Se houver uma mensagem de relatório desse membro para esse mês, considera entregue.
      if (inboxMessages && inboxMessages.length > 0) {
          const inboxItem = inboxMessages.find(msg => 
              msg.type === 'report' && 
              msg.fromMemberId === memberId && 
              msg.reportData?.month === viewMonth
          );

          if (inboxItem && inboxItem.reportData) {
              return inboxItem.reportData.participated ? 'submitted' : 'submitted_zero';
          }
      }

      return 'pending';
  };

  const inputClass = `w-full p-2.5 bg-white border border-purple-200 rounded-lg text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow ${isReadOnly ? 'cursor-not-allowed bg-slate-50' : ''}`;
  const labelClass = "text-sm font-semibold text-purple-800 mb-1 block";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Grupos de Serviço de Campo</h2>
          <p className="text-slate-500">Gerenciamento dos grupos e acompanhamento de relatórios.</p>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Novo Grupo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const groupMembers = members.filter(m => m.serviceGroup === group.name);
          const memberCount = groupMembers.length;

          // Cálculo rápido de status para o card
          const submittedCount = groupMembers.filter(m => getReportStatus(m.id).startsWith('submitted')).length;
          const percent = memberCount > 0 ? Math.round((submittedCount / memberCount) * 100) : 0;

          return (
            <div 
                key={group.id} 
                onClick={() => setSelectedGroup(group)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="bg-purple-50 p-4 border-b border-purple-100 flex justify-between items-center group-hover:bg-purple-100 transition-colors">
                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                  <Users size={18} /> {group.name}
                </h3>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleOpenModal(group)} className="p-1.5 text-purple-400 hover:text-purple-700 hover:bg-white rounded-md transition-colors">
                    {isReadOnly ? <Eye size={16} /> : <Edit2 size={16} />}
                  </button>
                  {!isReadOnly && (
                    <button onClick={() => onDeleteGroup(group.id)} className="p-1.5 text-purple-400 hover:text-red-600 hover:bg-white rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-white px-5 py-3 flex justify-between items-center border-b border-slate-50">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Relatórios ({viewMonth.split('-')[1]}/{viewMonth.split('-')[0]})</span>
                 <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${percent === 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                   {percent}% Entregue
                 </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">Dirigente</p>
                  <div className="flex items-center gap-2 text-purple-900">
                    <User size={16} className="text-purple-500" />
                    <span className="font-medium">{group.overseer || 'Não designado'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">Ajudante</p>
                  <div className="flex items-center gap-2 text-purple-900">
                    <User size={16} className="text-purple-300" />
                    <span>{group.assistant || '-'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">Local de Saída</p>
                  <div className="flex items-center gap-2 text-purple-900">
                    <MapPin size={16} className="text-purple-300" />
                    <span className="text-sm truncate">{group.meetingPlace || 'A definir'}</span>
                  </div>
                </div>
                
                <div className="pt-2 text-center">
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full group-hover:bg-purple-200 transition-colors">
                        Ver Detalhes
                    </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {groups.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">Nenhum grupo cadastrado.</p>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO/CRIAÇÃO DE GRUPO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-purple-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold text-purple-900">
                {isReadOnly ? 'Detalhes do Grupo' : (editingGroup ? 'Editar Grupo' : 'Novo Grupo')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-purple-300 hover:text-purple-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-b-2xl">
              <div className="space-y-1">
                <label className={labelClass}>Nome do Grupo</label>
                <input required type="text" placeholder="Ex: Grupo 1" className={inputClass} disabled={isReadOnly}
                  value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="space-y-1">
                <label className={labelClass}>Dirigente (Ancião ou Servo)</label>
                <select 
                  className={inputClass} 
                  disabled={isReadOnly}
                  value={formData.overseer || ''} 
                  onChange={e => setFormData({...formData, overseer: e.target.value})}
                >
                  <option value="">Selecione o Dirigente...</option>
                  {qualifiedBrothers.map(b => (
                    <option key={b.id} value={b.fullName}>
                      {b.fullName} ({b.privilege})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Ajudante (Ancião ou Servo)</label>
                <select 
                  className={inputClass} 
                  disabled={isReadOnly}
                  value={formData.assistant || ''} 
                  onChange={e => setFormData({...formData, assistant: e.target.value})}
                >
                  <option value="">Selecione o Ajudante...</option>
                  {qualifiedBrothers.map(b => (
                    <option key={b.id} value={b.fullName}>
                      {b.fullName} ({b.privilege})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Local de Saída</label>
                <input type="text" placeholder="Endereço ou local" className={inputClass} disabled={isReadOnly}
                  value={formData.meetingPlace || ''} onChange={e => setFormData({...formData, meetingPlace: e.target.value})} />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-purple-50 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors">
                  {isReadOnly ? 'Fechar' : 'Cancelar'}
                </button>
                {!isReadOnly && (
                  <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                    Salvar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO GRUPO (MEMBROS E RELATÓRIOS) */}
      {selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-purple-100 flex justify-between items-center bg-purple-50">
                      <div>
                          <h3 className="text-xl font-bold text-purple-900">{selectedGroup.name}</h3>
                          <p className="text-sm text-purple-600">Lista de Membros e Status</p>
                      </div>
                      <button onClick={() => setSelectedGroup(null)} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                          <Clock size={18} className="text-purple-500" />
                          <span className="text-sm font-bold text-slate-700">Verificando Mês:</span>
                      </div>
                      <input 
                          type="month" 
                          value={viewMonth}
                          onChange={(e) => setViewMonth(e.target.value)}
                          className="p-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:border-purple-500 outline-none"
                      />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                      {(() => {
                          const groupMembers = members.filter(m => m.serviceGroup === selectedGroup.name).sort((a,b) => a.fullName.localeCompare(b.fullName));
                          const submittedCount = groupMembers.filter(m => getReportStatus(m.id).startsWith('submitted')).length;
                          const percent = groupMembers.length > 0 ? Math.round((submittedCount / groupMembers.length) * 100) : 0;

                          return (
                              <div className="space-y-4">
                                  {/* Barra de Progresso */}
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                          <span>Entrega de Relatórios</span>
                                          <span>{submittedCount}/{groupMembers.length} ({percent}%)</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                          <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                      </div>
                                  </div>

                                  {/* Lista de Membros */}
                                  <div className="grid grid-cols-1 gap-2">
                                      {groupMembers.map(member => {
                                          const status = getReportStatus(member.id);
                                          return (
                                              <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-200 transition-colors">
                                                  <div className="flex flex-col">
                                                      <span className="font-bold text-slate-800 text-sm">{member.fullName}</span>
                                                      <span className="text-xs text-slate-400">{member.privilege}</span>
                                                  </div>
                                                  
                                                  <div>
                                                      {status === 'submitted' && (
                                                          <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                                              <CheckCircle2 size={14} /> Enviado
                                                          </span>
                                                      )}
                                                      {status === 'submitted_zero' && (
                                                          <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                                                              <CheckCircle2 size={14} /> Enviado (0h)
                                                          </span>
                                                      )}
                                                      {status === 'pending' && (
                                                          <span className="flex items-center gap-1.5 text-slate-400 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                              <Clock size={14} /> Pendente
                                                          </span>
                                                      )}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                      {groupMembers.length === 0 && (
                                          <p className="text-center text-slate-400 py-4">Nenhum membro neste grupo.</p>
                                      )}
                                  </div>
                              </div>
                          );
                      })()}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Groups;