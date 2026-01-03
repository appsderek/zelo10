
import React, { useState, useEffect, useRef } from 'react';
import { Territory, TerritoryHistory, Member, GeoPoint, TrackingSession } from '../types';
import { Map, Plus, Search, UserCheck, Clock, MapPin, ExternalLink, X, CalendarDays, CheckCircle2, Trash2, AlertTriangle, Navigation, Crosshair, Loader2, Flame, Thermometer, Info, Image as ImageIcon, Play, Pause, StopCircle } from 'lucide-react';

declare const L: any; // Declaração global do Leaflet

interface TerritoriesProps {
  territories: Territory[];
  members: Member[];
  history: TerritoryHistory[];
  onSaveTerritories: (territories: Territory[]) => void;
  onSaveHistory: (history: TerritoryHistory[]) => void;
  isReadOnly?: boolean;
  onNotifyMember?: (memberId: string, message: string, assignmentData?: any) => void;
  currentUser?: Member;
}

const Territories: React.FC<TerritoriesProps> = ({ territories, members, history, onSaveTerritories, onSaveHistory, isReadOnly = false, onNotifyMember, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Disponível' | 'Designado'>('all');
  const [isHeatmapMode, setIsHeatmapMode] = useState(false); 
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  
  const [currentTerritory, setCurrentTerritory] = useState<Territory | null>(null);
  const [territoryToDelete, setTerritoryToDelete] = useState<Territory | null>(null);
  const [formData, setFormData] = useState<Partial<Territory>>({});
  const [assigneeId, setAssigneeId] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // TRACKING STATE
  const [isTracking, setIsTracking] = useState(false);
  const [currentPath, setCurrentPath] = useState<GeoPoint[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // FILTRAGEM
  const filteredTerritories = territories.filter(t => {
      const matchesSearch = t.number.includes(searchTerm) || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.currentAssigneeName && t.currentAssigneeName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchesSearch && matchesStatus;
  }).sort((a,b) => {
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
      
      // NOTIFICAR PUBLICADOR (COM DADOS DO MAPA)
      if (onNotifyMember) {
          const msg = `Você recebeu a designação do Território #${updatedT.number} - ${updatedT.name}. Verifique o mapa anexo.`;
          onNotifyMember(member.id, msg, {
              territoryNumber: updatedT.number,
              territoryId: updatedT.id,
              territoryName: updatedT.name,
              territoryImage: updatedT.imageUrl // ENVIANDO A URL DA IMAGEM
          });
      }

      setIsAssignModalOpen(false);
  };

  const handleOpenReturn = (t: Territory) => {
      if (isReadOnly && currentUser?.id !== t.currentAssigneeId) return; // Permite ao próprio designado devolver
      setCurrentTerritory(t);
      setIsReturnModalOpen(true);
  };

  const handleReturn = () => {
      if (!currentTerritory) return;

      const newHistory: TerritoryHistory = {
          id: crypto.randomUUID(),
          territoryId: currentTerritory.id,
          assigneeName: currentTerritory.currentAssigneeName || 'Desconhecido',
          assignedDate: currentTerritory.assignedDate || '',
          returnedDate: new Date().toISOString().slice(0, 10)
      };
      onSaveHistory([newHistory, ...history]);

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

  // --- TRACKING LOGIC (MAPA LEAFLET) ---
  
  const handleOpenTracking = (t: Territory) => {
      setCurrentTerritory(t);
      setCurrentPath([]);
      setIsTracking(false);
      setIsTrackingModalOpen(true);
  };

  const startTracking = () => {
      if (!navigator.geolocation) {
          alert("Geolocalização não suportada.");
          return;
      }
      setIsTracking(true);
      
      const id = navigator.geolocation.watchPosition(
          (pos) => {
              const { latitude, longitude } = pos.coords;
              const point: GeoPoint = { lat: latitude, lng: longitude, timestamp: Date.now() };
              
              setCurrentPath(prev => {
                  const newPath = [...prev, point];
                  // Atualiza o mapa visualmente
                  if (polylineRef.current) {
                      polylineRef.current.setLatLngs(newPath.map(p => [p.lat, p.lng]));
                  }
                  if (userMarkerRef.current) {
                      userMarkerRef.current.setLatLng([latitude, longitude]);
                  } else if (mapRef.current && L) {
                      userMarkerRef.current = L.marker([latitude, longitude], {
                          icon: L.divIcon({
                              className: 'bg-blue-600 rounded-full border-2 border-white shadow-lg w-4 h-4',
                              iconSize: [16, 16]
                          })
                      }).addTo(mapRef.current);
                  }
                  if (mapRef.current) {
                      mapRef.current.panTo([latitude, longitude]);
                  }
                  return newPath;
              });
          },
          (err) => console.error(err),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      watchIdRef.current = id;
  };

  const stopTracking = () => {
      if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
      }
      setIsTracking(false);
  };

  const finishSession = () => {
      stopTracking();
      if (currentPath.length > 0 && currentTerritory) {
          const session: TrackingSession = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              publisherName: currentUser?.fullName || 'Desconhecido',
              path: currentPath
          };
          
          const updatedT = {
              ...currentTerritory,
              trackingSessions: [...(currentTerritory.trackingSessions || []), session]
          };
          
          onSaveTerritories(territories.map(t => t.id === currentTerritory.id ? updatedT : t));
          alert("Trajeto salvo com sucesso!");
      }
      setIsTrackingModalOpen(false);
  };

  // Inicializar Mapa Leaflet no Modal
  useEffect(() => {
      if (isTrackingModalOpen && currentTerritory && typeof L !== 'undefined') {
          setTimeout(() => {
              if (mapRef.current) {
                  mapRef.current.remove();
              }
              
              // Centro inicial: ou a coordenada do território ou local do usuário
              const startLat = currentTerritory.latitude || -23.5505;
              const startLng = currentTerritory.longitude || -46.6333;

              const map = L.map('map-container').setView([startLat, startLng], 16);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '&copy; OpenStreetMap contributors'
              }).addTo(map);

              // Desenha marker do território se tiver coordenada
              if (currentTerritory.latitude && currentTerritory.longitude) {
                  L.marker([currentTerritory.latitude, currentTerritory.longitude])
                   .addTo(map)
                   .bindPopup(`Território #${currentTerritory.number}`)
                   .openPopup();
              }

              // Inicia polyline vazia
              const polyline = L.polyline([], { color: 'blue', weight: 4 }).addTo(map);
              polylineRef.current = polyline;
              mapRef.current = map;

              // Se não tiver coord, tenta pegar local atual pra centralizar
              if (!currentTerritory.latitude) {
                  navigator.geolocation.getCurrentPosition(pos => {
                      map.setView([pos.coords.latitude, pos.coords.longitude], 16);
                  });
              }

          }, 100);
      }
      return () => {
          if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      };
  }, [isTrackingModalOpen, currentTerritory]);


  const getHeatmapProperties = (lastWorked?: string) => {
      if (!lastWorked) return { color: 'bg-blue-600', text: 'Frio (Crítico)', border: 'border-blue-700', bgLight: 'bg-blue-50' };
      const workedDate = new Date(lastWorked);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - workedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 60) return { color: 'bg-red-600', text: 'Muito Quente', border: 'border-red-700', bgLight: 'bg-red-50' };
      if (diffDays <= 120) return { color: 'bg-orange-500', text: 'Moderado', border: 'border-orange-600', bgLight: 'bg-orange-50' };
      if (diffDays <= 180) return { color: 'bg-yellow-500', text: 'Esfriando', border: 'border-yellow-600', bgLight: 'bg-yellow-50' };
      return { color: 'bg-blue-600', text: 'Frio (Crítico)', border: 'border-blue-700', bgLight: 'bg-blue-50' };
  };

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
                
                <button 
                    onClick={() => setIsHeatmapMode(!isHeatmapMode)} 
                    className={`ml-2 px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 transition-all ${isHeatmapMode ? 'bg-gradient-to-r from-red-500 to-blue-500 text-white border-transparent shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                    title="Alternar Mapa de Calor"
                >
                    <Thermometer size={16} /> Mapa de Calor
                </button>
            </div>
        </div>

        {/* LEGENDA HEATMAP */}
        {isHeatmapMode && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-fade-in mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-purple-600" />
                    Legenda de Frequência (Baseado na Data da Última Cobertura)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100"><div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-sm shrink-0"><Flame size={20} /></div><div><p className="text-xs font-black text-red-900 uppercase">Muito Quente</p><p className="text-[10px] font-medium text-red-700">Trabalhado há <br/><strong>menos de 2 meses</strong></p></div></div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100"><div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-sm shrink-0"><Clock size={20} /></div><div><p className="text-xs font-black text-orange-900 uppercase">Moderado</p><p className="text-[10px] font-medium text-orange-700">Trabalhado entre <br/><strong>2 a 4 meses</strong></p></div></div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100"><div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-sm shrink-0"><AlertTriangle size={20} /></div><div><p className="text-xs font-black text-yellow-900 uppercase">Esfriando</p><p className="text-[10px] font-medium text-yellow-700">Trabalhado entre <br/><strong>4 a 6 meses</strong></p></div></div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100"><div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0"><MapPin size={20} /></div><div><p className="text-xs font-black text-blue-900 uppercase">Frio (Prioridade)</p><p className="text-[10px] font-medium text-blue-700">Não trabalhado há <br/><strong>mais de 6 meses</strong></p></div></div>
                </div>
            </div>
        )}

        {/* GRID DE TERRITÓRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTerritories.map(t => {
                const heat = getHeatmapProperties(t.lastWorkedDate);
                const cardBorder = isHeatmapMode ? heat.border : (t.status === 'Disponível' ? 'border-slate-200' : 'border-red-200');
                const statusColorClass = isHeatmapMode ? heat.color + ' text-white' : getStatusColor(t);
                const isAssignedToMe = currentUser?.id === t.currentAssigneeId;

                return (
                <div key={t.id} className={`bg-white rounded-xl shadow-sm border ${cardBorder} overflow-hidden hover:shadow-md transition-all group relative flex flex-col`}>
                    
                    {/* IMAGEM MINIATURA */}
                    <div className="h-36 w-full bg-slate-100 relative group-hover:opacity-95 transition-all border-b border-slate-100">
                        {t.imageUrl ? (
                            <img 
                                src={t.imageUrl} 
                                alt={`Mapa ${t.number}`}
                                className="w-full h-full object-cover transition-opacity duration-500 opacity-0"
                                loading="lazy"
                                onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'; 
                                    e.currentTarget.parentElement?.querySelector('.placeholder-map')?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        
                        <div className={`placeholder-map absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300 ${t.imageUrl ? 'hidden' : ''}`}>
                            <Map size={48} opacity={0.5} />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        <div className="absolute top-2 right-2 z-10">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm ${statusColorClass}`}>
                                {isHeatmapMode ? heat.text : t.status}
                            </span>
                        </div>
                        
                        <div className="absolute bottom-2 left-3 z-10">
                            <span className="text-3xl font-black text-white drop-shadow-md tracking-tight">
                                #{t.number}
                            </span>
                        </div>

                        {t.imageUrl && (
                            <a href={t.imageUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors" title="Abrir Imagem Original">
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>

                    {/* BOTÃO NAVEGAR GPS */}
                    {t.latitude && t.longitude && (
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${t.latitude},${t.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-[8.5rem] left-4 z-20 bg-emerald-600 text-white p-3 rounded-full shadow-xl flex items-center gap-2 font-bold hover:bg-emerald-700 hover:scale-110 transition-transform"
                            title="Navegar até a Quadra"
                        >
                            <Navigation size={20} />
                        </a>
                    )}
                    
                    <div className={`p-4 space-y-3 flex-1 flex flex-col ${isHeatmapMode ? heat.bgLight : ''}`}>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight" title={t.name}>{t.name}</h3>
                        </div>
                        
                        <div className="mt-auto space-y-3">
                            {/* STATUS AREA */}
                            {t.status === 'Designado' ? (
                                <div className="bg-white/80 p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                                        <UserCheck size={14} /> {t.currentAssigneeName}
                                    </div>
                                    <div className="flex items-center gap-2 text-red-600 text-xs">
                                        <CalendarDays size={12} /> Desde: {t.assignedDate ? new Date(t.assignedDate).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                    {/* MODO DE CAMPO PARA O DESIGNADO */}
                                    {isAssignedToMe && (
                                        <button 
                                            onClick={() => handleOpenTracking(t)}
                                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm animate-pulse"
                                        >
                                            <Play size={12} fill="white" /> INICIAR CAMPO
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white/80 p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Clock size={12} /> Última vez: {t.lastWorkedDate ? new Date(t.lastWorkedDate).toLocaleDateString('pt-BR') : 'Nunca'}
                                    </div>
                                </div>
                            )}

                            {/* BOTOES DE AÇÃO (ADMIN) */}
                            {!isReadOnly && (
                                <div className="flex gap-2 pt-1 justify-end border-t border-slate-200/50">
                                    <button onClick={() => handleOpenEdit(t)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold shadow-sm">Editar</button>
                                    <button onClick={() => handleRequestDelete(t)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            )}

                            {/* BOTOES DESIGNAR/DEVOLVER */}
                            <div className="pt-1">
                                {t.status === 'Disponível' && !isReadOnly && (
                                    <button onClick={() => handleOpenAssign(t)} className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-colors">Designar</button>
                                )}
                                {t.status === 'Designado' && (!isReadOnly || isAssignedToMe) && (
                                    <button onClick={() => handleOpenReturn(t)} className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">Devolver</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )})}
        </div>

        {/* --- MODAL DE RASTREAMENTO DE CAMPO (LEAFLET) --- */}
        {isTrackingModalOpen && currentTerritory && (
            <div className="fixed inset-0 z-[80] bg-black bg-opacity-90 backdrop-blur-sm flex flex-col">
                <div className="bg-white p-4 flex justify-between items-center shadow-md z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Navigation className="text-blue-600" /> Modo de Campo
                        </h3>
                        <p className="text-xs text-slate-500">Território #{currentTerritory.number} - {currentTerritory.name}</p>
                    </div>
                    <button onClick={() => setIsTrackingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* MAP CONTAINER */}
                <div className="flex-1 relative bg-slate-200">
                    <div id="map-container" className="absolute inset-0 w-full h-full" />
                    
                    {/* CONTROLES FLUTUANTES */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-[999]">
                        {!isTracking ? (
                            <button 
                                onClick={startTracking}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-2 text-lg transform hover:scale-105 transition-all"
                            >
                                <Play fill="white" /> INICIAR
                            </button>
                        ) : (
                            <button 
                                onClick={stopTracking}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-2 text-lg transform hover:scale-105 transition-all"
                            >
                                <Pause fill="white" /> PAUSAR
                            </button>
                        )}
                        <button 
                            onClick={finishSession}
                            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full font-bold shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all"
                            title="Finalizar e Salvar"
                        >
                            <StopCircle size={28} />
                        </button>
                    </div>

                    {/* Stats Overlay */}
                    {isTracking && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-[999]">
                            <p className="text-xs font-bold text-slate-500 uppercase">Pontos Rastreados</p>
                            <p className="text-2xl font-black text-blue-600">{currentPath.length}</p>
                            <div className="flex items-center gap-1 text-[10px] text-green-600 animate-pulse mt-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Gravando GPS
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

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
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <ImageIcon size={12} /> URL da Imagem (Mapa)
                            </label>
                            <input type="text" placeholder="https://exemplo.com/imagem-mapa.jpg" className="w-full p-2 border rounded-lg" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Navigation size={12} /> Coordenadas GPS</label>
                                <button onClick={handleGetLocation} disabled={isLoadingLocation} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200 transition-colors">
                                    {isLoadingLocation ? <Loader2 size={10} className="animate-spin" /> : <Crosshair size={10} />} Capturar Local
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Lat" className="w-1/2 p-2 text-xs border rounded bg-white" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} />
                                <input type="number" placeholder="Long" className="w-1/2 p-2 text-xs border rounded bg-white" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas</label>
                            <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                        </div>
                        <div className="flex gap-2 pt-4">
                            {currentTerritory && (<button onClick={handleDeleteFromEdit} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold">Excluir</button>)}
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
                    <select className="w-full p-3 border border-slate-300 rounded-lg mb-6 bg-white outline-none focus:ring-2 focus:ring-purple-500" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                        <option value="">Selecione...</option>
                        {members.sort((a,b) => a.fullName.localeCompare(b.fullName)).map(m => (<option key={m.id} value={m.id}>{m.fullName}</option>))}
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
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Devolver Território #{currentTerritory.number}?</h3>
                    <div className="flex gap-3 mt-6">
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
                    <div className="flex items-center gap-4 mb-4 text-red-600"><div className="p-3 bg-red-100 rounded-full"><AlertTriangle size={24} /></div><h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3></div>
                    <p className="text-slate-600 mb-6">Tem certeza que deseja excluir o território <strong>#{territoryToDelete.number} - {territoryToDelete.name}</strong>?</p>
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
