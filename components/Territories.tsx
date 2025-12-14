
import React, { useState } from 'react';
import { Territory, TerritoryHistory, Member } from '../types';
import { Map, Plus, Search, UserCheck, Clock, MapPin, ExternalLink, X, CalendarDays, CheckCircle2 } from 'lucide-react';

interface TerritoriesProps {
  territories: Territory[];
  members: Member[];
  history: TerritoryHistory[];
  onSaveTerritories: (territories: Territory[]) => void;
  onSaveHistory: (history: TerritoryHistory[]) => void;
  isReadOnly?: boolean;
}

const Territories: React.FC<TerritoriesProps> = ({ territories, members, history, onSaveTerritories, onSaveHistory, isReadOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Disponível' | 'Designado'>('all');
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  
  const [currentTerritory, setCurrentTerritory] = useState<Territory | null>(null);
  const [formData, setFormData] = useState<Partial<Territory>>({});
  const [assigneeId, setAssigneeId] = useState('');

  // FILTRAGEM
  const filteredTerritories = territories.filter(t => {
      const matchesSearch = t.number.includes(searchTerm) || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.currentAssigneeName && t.currentAssigneeName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchesSearch && matchesStatus;
  }).sort((a,b) => {
      // Tenta ordenar numericamente se for possível
      const numA = parseInt(a.number);
      const numB = parseInt(b.number);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.number.localeCompare(b.number);
  });

  // AÇÕES
  const handleOpenEdit = (t?: Territory) => {
      if (isReadOnly) return;
      if (t) {
          setCurrentTerritory(t);
          setFormData(t);
      } else {
          setCurrentTerritory(null);
          setFormData({ number: '', name: '', status: 'Disponível', imageUrl: '' });
      }
      setIsEditModalOpen(true);
  };

  const handleSaveTerritory = () => {
      if (!formData.number || !formData.name) return;
      
      let newTerritories = [...territories];
      if (currentTerritory) {
          newTerritories = newTerritories.map(t => t.id === currentTerritory.id ? { ...t, ...formData } as Territory : t);
      } else {
          const newT: Territory = {
              id: crypto.randomUUID(),
              number: formData.number || '',
              name: formData.name || '',
              status: 'Disponível',
              imageUrl: formData.imageUrl || '',
              notes: formData.notes
          };
          newTerritories.push(newT);
      }
      onSaveTerritories(newTerritories);
      setIsEditModalOpen(false);
  };

  const handleOpenAssign = (t: Territory) => {
      if (isReadOnly) return;
      setCurrentTerritory(t);
      setAssigneeId('');
      setIsAssignModalOpen(true);
  };

  const handleAssign = () => {
      if (!currentTerritory || !assigneeId) return;
      
      const member = members.find(m => m.id === assigneeId);
      if (!member) return;

      const updatedT: Territory = {
          ...currentTerritory,
          status: 'Designado',
          currentAssigneeId: member.id,
          currentAssigneeName: member.fullName,
          assignedDate: new Date().toISOString().slice(0, 10)
      };

      onSaveTerritories(territories.map(t => t.id === currentTerritory.id ? updatedT : t));
      setIsAssignModalOpen(false);
  };

  const handleOpenReturn = (t: Territory) => {
      if (isReadOnly) return;
      setCurrentTerritory(t);
      setIsReturnModalOpen(true);
  };

  const handleReturn = () => {
      if (!currentTerritory) return;

      // 1. Salvar no histórico
      const newHistory: TerritoryHistory = {
          id: crypto.randomUUID(),
          territoryId: currentTerritory.id,
          assigneeName: currentTerritory.currentAssigneeName || 'Desconhecido',
          assignedDate: currentTerritory.assignedDate || '',
          returnedDate: new Date().toISOString().slice(0, 10)
      };
      onSaveHistory([newHistory, ...history]);

      // 2. Atualizar território
      const updatedT: Territory = {
          ...currentTerritory,
          status: 'Disponível',
          currentAssigneeId: undefined,
          currentAssigneeName: undefined,
          assignedDate: undefined,
          lastWorkedDate: new Date().toISOString().slice(0, 10)
      };

      onSaveTerritories(territories.map(t => t.id === currentTerritory.id ? updatedT : t));
      setIsReturnModalOpen(false);
  };

  const handleDelete = () => {
      if (!currentTerritory) return;
      if (confirm('Tem certeza que deseja excluir este território?')) {
          onSaveTerritories(territories.filter(t => t.id !== currentTerritory.id));
          setIsEditModalOpen(false);
      }
  };

  // Cores de Status
  const getStatusColor = (t: Territory) => {
      if (t.status === 'Disponível') {
          // Se não trabalhado há mais de 4 meses, destacar
          const lastWorked = t.lastWorkedDate ? new Date(t.lastWorkedDate) : null;
          const fourMonthsAgo = new Date();
          fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
          
          if (!lastWorked || lastWorked < fourMonthsAgo) return 'bg-emerald-100 border-emerald-200 text-emerald-800'; // Prioritário
          return 'bg-green-50 border-green-100 text-green-700'; // Normal
      }
      return 'bg-red-50 border-red-100 text-red-700'; // Designado
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Map className="text-purple-600" /> Territórios
                </h2>
                <p className="text-slate-500">Gestão de mapas e designações de quadras.</p>
            </div>
            {!isReadOnly && (
                <button onClick={() => handleOpenEdit()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors">
                    <Plus size={18} /> Novo Território
                </button>
            )}
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por número, nome ou publicador..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${filterStatus === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>Todos</button>
                <button onClick={() => setFilterStatus('Disponível')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${filterStatus === 'Disponível' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200'}`}>Disponíveis</button>
                <button onClick={() => setFilterStatus('Designado')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${filterStatus === 'Designado' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200'}`}>Designados</button>
            </div>
        </div>

        {/* GRID DE TERRITÓRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTerritories.map(t => (
                <div key={t.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all group relative`}>
                    <div className={`p-3 flex justify-between items-center border-b ${getStatusColor(t).replace('text', 'border').split(' ')[1]} ${getStatusColor(t).split(' ')[0]}`}>
                        <span className={`font-black text-lg ${getStatusColor(t).split(' ')[2]}`}>#{t.number}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/50 ${getStatusColor(t).split(' ')[2]}`}>
                            {t.status}
                        </span>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        <h3 className="font-bold text-slate-800 truncate" title={t.name}>{t.name}</h3>
                        
                        {t.status === 'Designado' ? (
                            <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                                    <UserCheck size={14} /> {t.currentAssigneeName}
                                </div>
                                <div className="flex items-center gap-2 text-red-600 text-xs">
                                    <CalendarDays size={12} /> Desde: {t.assignedDate ? new Date(t.assignedDate).toLocaleDateString('pt-BR') : '-'}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Clock size={12} /> Última vez: {t.lastWorkedDate ? new Date(t.lastWorkedDate).toLocaleDateString('pt-BR') : 'Nunca'}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            {t.imageUrl && (
                                <a 
                                    href={t.imageUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                    <MapPin size={14} /> Abrir Mapa
                                </a>
                            )}
                            {!isReadOnly && (
                                <button 
                                    onClick={() => handleOpenEdit(t)} 
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold"
                                >
                                    Editar
                                </button>
                            )}
                        </div>

                        {!isReadOnly && (
                            <div className="pt-1 border-t border-slate-100">
                                {t.status === 'Disponível' ? (
                                    <button onClick={() => handleOpenAssign(t)} className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-colors">
                                        Designar
                                    </button>
                                ) : (
                                    <button onClick={() => handleOpenReturn(t)} className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">
                                        Devolver
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* MODAL EDITAR/CRIAR */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800">{currentTerritory ? 'Editar Território' : 'Novo Território'}</h3>
                        <button onClick={() => setIsEditModalOpen(false)}><X size={24} className="text-slate-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome / Descrição</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link do Mapa (Google Maps)</label>
                            <input type="text" placeholder="https://maps.google.com/..." className="w-full p-2 border rounded-lg" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas</label>
                            <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                        </div>
                        <div className="flex gap-2 pt-4">
                            {currentTerritory && (
                                <button onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold">Excluir</button>
                            )}
                            <div className="flex-1"></div>
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                            <button onClick={handleSaveTerritory} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL DESIGNAR */}
        {isAssignModalOpen && currentTerritory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Designar Território #{currentTerritory.number}</h3>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selecione o Publicador</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg mb-6 bg-white outline-none focus:ring-2 focus:ring-purple-500"
                        value={assigneeId}
                        onChange={e => setAssigneeId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {members.sort((a,b) => a.fullName.localeCompare(b.fullName)).map(m => (
                            <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                    </select>
                    <div className="flex gap-3">
                        <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                        <button onClick={handleAssign} disabled={!assigneeId} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 disabled:opacity-50">Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL DEVOLVER */}
        {isReturnModalOpen && currentTerritory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Devolver Território #{currentTerritory.number}?</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Isso marcará o território como disponível novamente e salvará o registro no histórico.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setIsReturnModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg font-bold text-slate-600">Cancelar</button>
                        <button onClick={handleReturn} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Territories;
