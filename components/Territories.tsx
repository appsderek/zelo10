
import React, { useState } from 'react';
import { Territory, TerritoryHistory, Member } from '../types';
import { Map, Plus, Search, UserCheck, Clock, MapPin, ExternalLink, X, CalendarDays, CheckCircle2, Trash2, AlertTriangle, Navigation, Crosshair, Loader2, Flame, Thermometer, Info } from 'lucide-react';

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
  const [isHeatmapMode, setIsHeatmapMode] = useState(false); // Novo estado para o modo Heatmap
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentTerritory, setCurrentTerritory] = useState<Territory | null>(null);
  const [territoryToDelete, setTerritoryToDelete] = useState<Territory | null>(null);
  const [formData, setFormData] = useState<Partial<Territory>>({});
  const [assigneeId, setAssigneeId] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

  // CAPTURA DE LOCALIZAÇÃO (INOVAÇÃO 2)
  const handleGetLocation = () => {
      if (!navigator.geolocation) {
          alert('Geolocalização não é suportada pelo seu navegador.');
          return;
      }

      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
          (position) => {
              setFormData(prev => ({
                  ...prev,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
              }));
              setIsLoadingLocation(false);
          },
          (error) => {
              console.error(error);
              alert('Erro ao obter localização. Verifique as permissões do navegador.');
              setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true }
      );
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
              notes: formData.notes,
              latitude: formData.latitude,
              longitude: formData.longitude
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

  // --- LÓGICA DE EXCLUSÃO ---
  const handleRequestDelete = (t: Territory) => {
      if (isReadOnly) return;
      setTerritoryToDelete(t);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (territoryToDelete) {
          onSaveTerritories(territories.filter(t => t.id !== territoryToDelete.id));
          if (currentTerritory?.id === territoryToDelete.id) {
              setIsEditModalOpen(false);
          }
      }
      setIsDeleteModalOpen(false);
      setTerritoryToDelete(null);
  };

  const handleDeleteFromEdit = () => {
      if (!currentTerritory) return;
      setIsEditModalOpen(false);
      handleRequestDelete(currentTerritory);
  };

  // --- LÓGICA DO MAPA DE CALOR (HEATMAP) ---
  const getHeatmapProperties = (lastWorked?: string) => {
      if (!lastWorked) return { color: 'bg-blue-600', text: 'Frio (Crítico)', border: 'border-blue-700', bgLight: 'bg-blue-50' };

      const workedDate = new Date(lastWorked);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - workedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 0-60 dias: Quente (Vermelho) - Muito trabalhado recentemente
      if (diffDays <= 60) return { color: 'bg-red-600', text: 'Muito Quente', border: 'border-red-700', bgLight: 'bg-red-50' };
      
      // 60-120 dias: Morno (Laranja)
      if (diffDays <= 120) return { color: 'bg-orange-500', text: 'Moderado', border: 'border-orange-600', bgLight: 'bg-orange-50' };
      
      // 120-180 dias: Esfriando (Amarelo)
      if (diffDays <= 180) return { color: 'bg-yellow-500', text: 'Esfriando', border: 'border-yellow-600', bgLight: 'bg-yellow-50' };
      
      // > 180 dias: Frio (Azul) - Pouco trabalhado
      return { color: 'bg-blue-600', text: 'Frio (Crítico)', border: 'border-blue-700', bgLight: 'bg-blue-50' };
  };

  // Cores de Status (Normal)
  const getStatusColor = (t: Territory) => {
      if (t.status === 'Disponível') {
          const lastWorked = t.lastWorkedDate ? new Date(t.lastWorkedDate) : null;
          const fourMonthsAgo = new Date();
          fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
          
          if (!lastWorked || lastWorked < fourMonthsAgo) return 'bg-emerald-100 border-emerald-200 text-emerald-800'; 
          return 'bg-green-50 border-green-100 text-green-700'; 
      }
      return 'bg-red-50 border-red-100 text-red-700'; 
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

        {/* FILTROS E CONTROLES */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
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
            
            <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${filterStatus === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>Todos</button>
                <button onClick={() => setFilterStatus('Disponível')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${filterStatus === 'Disponível' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200'}`}>Disponíveis</button>
                
                {/* BOTÃO HEATMAP (Inovação) */}
                <button 
                    onClick={() => setIsHeatmapMode(!isHeatmapMode)} 
                    className={`ml-2 px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 transition-all ${isHeatmapMode ? 'bg-gradient-to-r from-red-500 to-blue-500 text-white border-transparent shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                    title="Alternar Mapa de Calor"
                >
                    <Thermometer size={16} /> Mapa de Calor
                </button>
            </div>
        </div>

        {/* LEGENDA DO HEATMAP (DETALHADA) */}
        {isHeatmapMode && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-fade-in mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-purple-600" />
                    Legenda de Frequência (Baseado na Data da Última Cobertura)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* QUENTE */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Flame size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-red-900 uppercase">Muito Quente</p>
                            <p className="text-[10px] font-medium text-red-700">Trabalhado há <br/><strong>menos de 2 meses</strong></p>
                        </div>
                    </div>

                    {/* MODERADO */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-orange-900 uppercase">Moderado</p>
                            <p className="text-[10px] font-medium text-orange-700">Trabalhado entre <br/><strong>2 a 4 meses</strong></p>
                        </div>
                    </div>

                    {/* ESFRIANDO */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-sm shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-yellow-900 uppercase">Esfriando</p>
                            <p className="text-[10px] font-medium text-yellow-700">Trabalhado entre <br/><strong>4 a 6 meses</strong></p>
                        </div>
                    </div>

                    {/* FRIO */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-blue-900 uppercase">Frio (Prioridade)</p>
                            <p className="text-[10px] font-medium text-blue-700">Não trabalhado há <br/><strong>mais de 6 meses</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* GRID DE TERRITÓRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTerritories.map(t => {
                // Cálculo Heatmap
                const heat = getHeatmapProperties(t.lastWorkedDate);
                const cardBorder = isHeatmapMode ? heat.border : (t.status === 'Disponível' ? 'border-slate-200' : 'border-red-200');
                
                return (
                <div key={t.id} className={`bg-white rounded-xl shadow-sm border ${cardBorder} overflow-hidden hover:shadow-md transition-all group relative`}>
                    
                    {/* LINK FLUTUANTE DO MAPA (APARECE NO HOVER) */}
                    {t.imageUrl && (
                        <a 
                            href={t.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-14 right-4 z-20 bg-blue-600 text-white p-3 rounded-full shadow-xl flex items-center gap-2 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-700 hover:scale-110 transform translate-y-2 group-hover:translate-y-0"
                            title="Abrir Mapa (Imagem)"
                        >
                            <Map size={24} />
                        </a>
                    )}

                    {/* BOTÃO NAVEGAR GPS (SE TIVER COORDENADAS) */}
                    {t.latitude && t.longitude && (
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${t.latitude},${t.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-14 left-4 z-20 bg-emerald-600 text-white p-3 rounded-full shadow-xl flex items-center gap-2 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-700 hover:scale-110 transform translate-y-2 group-hover:translate-y-0"
                            title="Navegar até a Quadra"
                        >
                            <Navigation size={24} />
                        </a>
                    )}

                    {/* HEADER DO CARD - LÓGICA HEATMAP vs NORMAL */}
                    <div className={`p-3 flex justify-between items-center border-b ${isHeatmapMode ? `${heat.color} text-white` : `${getStatusColor(t).replace('text', 'border').split(' ')[1]} ${getStatusColor(t).split(' ')[0]}`}`}>
                        <div className="flex items-center gap-2">
                            <span className={`font-black text-lg ${isHeatmapMode ? 'text-white' : getStatusColor(t).split(' ')[2]}`}>#{t.number}</span>
                            {/* INDICADORES VISUAIS */}
                            {t.imageUrl && <MapPin size={16} className={`${isHeatmapMode ? 'text-white' : getStatusColor(t).split(' ')[2]} opacity-50`} />}
                            {t.latitude && <Navigation size={14} className={`${isHeatmapMode ? 'text-white' : getStatusColor(t).split(' ')[2]} opacity-50`} />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/30 ${isHeatmapMode ? 'text-white' : getStatusColor(t).split(' ')[2]}`}>
                            {isHeatmapMode ? heat.text : t.status}
                        </span>
                    </div>
                    
                    <div className={`p-4 space-y-3 ${isHeatmapMode ? heat.bgLight : ''}`}>
                        <h3 className="font-bold text-slate-800 truncate pr-8" title={t.name}>{t.name}</h3>
                        
                        {t.status === 'Designado' ? (
                            <div className="bg-white/80 p-2 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                                    <UserCheck size={14} /> {t.currentAssigneeName}
                                </div>
                                <div className="flex items-center gap-2 text-red-600 text-xs">
                                    <CalendarDays size={12} /> Desde: {t.assignedDate ? new Date(t.assignedDate).toLocaleDateString('pt-BR') : '-'}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/80 p-2 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Clock size={12} /> Última vez: {t.lastWorkedDate ? new Date(t.lastWorkedDate).toLocaleDateString('pt-BR') : 'Nunca'}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2 justify-end">
                            {/* BOTOES DE AÇÃO */}
                            {!isReadOnly && (
                                <>
                                    <button 
                                        onClick={() => handleOpenEdit(t)} 
                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold shadow-sm"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleRequestDelete(t)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                        title="Excluir Território"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>

                        {!isReadOnly && (
                            <div className="pt-1 border-t border-slate-200/50">
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
            )})}
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
                        
                        {/* COORDENADAS GPS (Inovação 2) */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Navigation size={12} /> Coordenadas GPS
                                </label>
                                <button 
                                    onClick={handleGetLocation} 
                                    disabled={isLoadingLocation}
                                    className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200 transition-colors"
                                >
                                    {isLoadingLocation ? <Loader2 size={10} className="animate-spin" /> : <Crosshair size={10} />}
                                    Capturar Local
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Lat" 
                                    className="w-1/2 p-2 text-xs border rounded bg-white" 
                                    value={formData.latitude || ''} 
                                    onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Long" 
                                    className="w-1/2 p-2 text-xs border rounded bg-white" 
                                    value={formData.longitude || ''} 
                                    onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas</label>
                            <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                        </div>
                        <div className="flex gap-2 pt-4">
                            {currentTerritory && (
                                <button onClick={handleDeleteFromEdit} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold">Excluir</button>
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

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {isDeleteModalOpen && territoryToDelete && !isReadOnly && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center gap-4 mb-4 text-red-600">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
                    </div>
                    <p className="text-slate-600 mb-6">
                        Tem certeza que deseja excluir o território <strong>#{territoryToDelete.number} - {territoryToDelete.name}</strong>? 
                        <br/><span className="text-xs text-red-500 mt-2 block">Esta ação não pode ser desfeita e todo o histórico será perdido.</span>
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

export default Territories;
