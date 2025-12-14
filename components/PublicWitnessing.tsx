
import React, { useState, useEffect } from 'react';
import { CartLocation, CartShift, Member, CartAssignment } from '../types';
import { Store, Plus, Calendar, Clock, MapPin, Trash2, X, UserPlus, UserMinus, Users, CheckCircle2, RefreshCw, ShoppingCart, Monitor, AlertCircle } from 'lucide-react';

interface PublicWitnessingProps {
  locations: CartLocation[];
  shifts: CartShift[];
  members: Member[];
  onSaveLocations: (locs: CartLocation[]) => void;
  onSaveShifts: (shifts: CartShift[]) => void;
  isReadOnly?: boolean; 
  currentUser: Member;
}

const PublicWitnessing: React.FC<PublicWitnessingProps> = ({ locations, shifts, members, onSaveLocations, onSaveShifts, isReadOnly = true, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'locations'>('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  
  // States Locais
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');

  // States para o Gerador de Turnos (Generator)
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [genData, setGenData] = useState({
      locationId: '',
      dayOfWeek: '6', // Sábado padrão
      weekOfMonth: 'all', // all, 1, 2, 3, 4, 5
      startTime: '08:00',
      endTime: '10:00',
      monthsToGenerate: 3
  });

  // Effect para pré-selecionar o primeiro local se houver apenas um ou nenhum selecionado
  useEffect(() => {
      if (isGeneratorModalOpen && !genData.locationId && locations.length > 0) {
          setGenData(prev => ({ ...prev, locationId: locations[0].id }));
      }
  }, [isGeneratorModalOpen, locations]);

  const WEEKDAYS = [
      { val: '0', label: 'Domingo' },
      { val: '1', label: 'Segunda-feira' },
      { val: '2', label: 'Terça-feira' },
      { val: '3', label: 'Quarta-feira' },
      { val: '4', label: 'Quinta-feira' },
      { val: '5', label: 'Sexta-feira' },
      { val: '6', label: 'Sábado' },
  ];

  const WEEK_PATTERNS = [
      { val: 'all', label: 'Todas as Semanas' },
      { val: '1', label: '1ª Semana do Mês' },
      { val: '2', label: '2ª Semana do Mês' },
      { val: '3', label: '3ª Semana do Mês' },
      { val: '4', label: '4ª Semana do Mês' },
      { val: '5', label: '5ª Semana (se houver)' },
  ];

  // --- LOCATIONS MANAGEMENT ---
  const handleAddLocation = () => {
      if (!newLocationName) return;
      const newLoc: CartLocation = {
          id: crypto.randomUUID(),
          name: newLocationName,
          address: newLocationAddress
      };
      onSaveLocations([...locations, newLoc]);
      setIsLocationModalOpen(false);
      setNewLocationName('');
      setNewLocationAddress('');
  };

  const handleDeleteLocation = (id: string) => {
      if (confirm('Excluir este ponto?')) {
          onSaveLocations(locations.filter(l => l.id !== id));
      }
  };

  // --- GENERATOR LOGIC ---
  const handleGenerateShifts = () => {
      if (!genData.locationId) {
          alert('Por favor, selecione um Ponto (Local) para gerar os turnos.');
          return;
      }
      if (!genData.startTime || !genData.endTime) {
          alert('Defina o horário de início e fim.');
          return;
      }

      const newShifts: CartShift[] = [];
      const startDate = new Date();
      const targetDay = parseInt(genData.dayOfWeek, 10); // 0-6
      
      // Zera hora de hoje para comparação (evitar criar turnos no passado de hoje)
      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);

      let firstGeneratedDate = '';
      
      // Itera pelos próximos X meses
      for (let m = 0; m < genData.monthsToGenerate; m++) {
          const currentMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
          const year = currentMonthDate.getFullYear();
          const month = currentMonthDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          let weekCount = 0;

          // Itera por todos os dias do mês
          for (let day = 1; day <= daysInMonth; day++) {
              const dateObj = new Date(year, month, day);
              
              // Verifica se é o dia da semana correto
              if (dateObj.getDay() === targetDay) {
                  weekCount++;
                  
                  // Ignora datas passadas
                  if (dateObj < todayZero) continue;

                  // Verifica se a semana corresponde ao padrão escolhido
                  const matchesPattern = genData.weekOfMonth === 'all' || parseInt(genData.weekOfMonth) === weekCount;

                  if (matchesPattern) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      
                      // Verifica se já existe turno neste horário/local para não duplicar
                      const exists = shifts.some(s => s.locationId === genData.locationId && s.date === dateStr && s.startTime === genData.startTime);
                      
                      if (!exists) {
                          newShifts.push({
                              id: crypto.randomUUID(),
                              locationId: genData.locationId,
                              date: dateStr,
                              startTime: genData.startTime,
                              endTime: genData.endTime,
                              assignments: [] // Array vazio de assignments
                          });

                          // Salva a primeira data gerada para navegar até ela
                          if (!firstGeneratedDate) firstGeneratedDate = dateStr;
                      }
                  }
              }
          }
      }

      if (newShifts.length === 0) {
          alert('Nenhuma data futura encontrada para este padrão. Tente aumentar o período ou verificar o dia da semana.');
          return;
      }

      onSaveShifts([...shifts, ...newShifts]);
      setIsGeneratorModalOpen(false);
      
      // UX: Navega para a primeira data gerada
      if (firstGeneratedDate) {
          setSelectedDate(firstGeneratedDate);
      }
      
      alert(`${newShifts.length} turnos gerados com sucesso!`);
  };

  const handleDeleteShift = (id: string) => {
      if (confirm('Remover este turno da agenda?')) {
          onSaveShifts(shifts.filter(s => s.id !== id));
      }
  };

  // --- SLOT MANAGEMENT ---
  const handleAssignSlot = (shiftId: string, slotType: 'carrinho' | 'display', slotNumber: number) => {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) return;

      // Verifica se o usuário já está em algum slot deste turno
      const isAlreadyInShift = shift.assignments?.some(a => a.publisherId === currentUser.id);
      if (isAlreadyInShift) {
          alert('Você já está inscrito neste turno.');
          return;
      }

      const newAssignment: CartAssignment = {
          slotType,
          slotNumber,
          publisherId: currentUser.id,
          publisherName: currentUser.fullName
      };

      const updatedAssignments = [...(shift.assignments || []), newAssignment];
      const updatedShift = { ...shift, assignments: updatedAssignments };
      
      onSaveShifts(shifts.map(s => s.id === shiftId ? updatedShift : s));
  };

  const handleRemoveSlot = (shiftId: string, slotType: 'carrinho' | 'display', slotNumber: number, assignedId: string) => {
      // Regra: Só pode remover a si mesmo, a menos que seja um admin (não em readOnly)
      if (assignedId !== currentUser.id && isReadOnly) return;
      if (isReadOnly && !confirm('Tem certeza que deseja cancelar sua inscrição?')) return;
      if (!isReadOnly && !confirm('Remover este publicador do turno?')) return;

      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) return;

      const updatedAssignments = (shift.assignments || []).filter(
          a => !(a.slotType === slotType && a.slotNumber === slotNumber)
      );
      
      const updatedShift = { ...shift, assignments: updatedAssignments };
      onSaveShifts(shifts.map(s => s.id === shiftId ? updatedShift : s));
  };

  // Filter shifts for selected date
  const todaysShifts = shifts.filter(s => s.date === selectedDate).sort((a,b) => a.startTime.localeCompare(b.startTime));

  // Render Slot Helper
  const renderSlot = (shift: CartShift, type: 'carrinho' | 'display', number: number) => {
      const assignment = shift.assignments?.find(a => a.slotType === type && a.slotNumber === number);
      const isAssigned = !!assignment;
      const isMe = assignment?.publisherId === currentUser.id;

      return (
          <div className={`
              relative flex flex-col items-center justify-center p-2 rounded-lg border text-xs text-center h-16 w-full transition-all
              ${isAssigned 
                  ? (isMe ? 'bg-green-100 border-green-300 text-green-800' : 'bg-purple-50 border-purple-200 text-purple-800') 
                  : 'bg-white border-dashed border-slate-300 text-slate-400 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'}
          `}
          onClick={() => !isAssigned ? handleAssignSlot(shift.id, type, number) : handleRemoveSlot(shift.id, type, number, assignment.publisherId)}
          >
              {isAssigned ? (
                  <>
                      <span className="font-bold line-clamp-2 leading-tight">{assignment.publisherName.split(' ')[0]}</span>
                      {isMe && <span className="text-[9px] uppercase font-black opacity-70 mt-1">(Você)</span>}
                      {(!isReadOnly || isMe) && (
                          <div className="absolute top-0 right-0 p-0.5 text-red-400 hover:text-red-600 bg-white rounded-full shadow-sm m-0.5">
                              <X size={10} />
                          </div>
                      )}
                  </>
              ) : (
                  <span className="font-bold flex flex-col items-center gap-1">
                      <Plus size={14} />
                      Vaga {number}
                  </span>
              )}
          </div>
      );
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Store className="text-purple-600" /> Testemunho Público
                </h2>
                <p className="text-slate-500">Agendamento de carrinhos e displays.</p>
            </div>
            
            {!isReadOnly && (
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('schedule')} 
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'schedule' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Agenda
                    </button>
                    <button 
                        onClick={() => setActiveTab('locations')} 
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'locations' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Pontos
                    </button>
                </div>
            )}
        </div>

        {/* --- TAB: LOCATIONS (ADMIN ONLY) --- */}
        {activeTab === 'locations' && !isReadOnly && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button onClick={() => setIsLocationModalOpen(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold">
                        <Plus size={18} /> Adicionar Ponto
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.map(loc => (
                        <div key={loc.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800">{loc.name}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={14} /> {loc.address || 'Sem endereço'}</p>
                            </div>
                            <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {locations.length === 0 && <p className="text-center text-slate-400 col-span-2 py-8">Nenhum ponto cadastrado.</p>}
                </div>
            </div>
        )}

        {/* --- TAB: SCHEDULE --- */}
        {activeTab === 'schedule' && (
            <div className="space-y-6">
                {/* DATE SELECTOR */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Calendar className="text-purple-500" />
                        <input 
                            type="date" 
                            className="font-bold text-slate-700 outline-none bg-transparent w-full sm:w-auto"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    {!isReadOnly && (
                        <div className="ml-auto w-full sm:w-auto">
                            <button onClick={() => setIsGeneratorModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-purple-700">
                                <RefreshCw size={16} /> Gerar Turnos
                            </button>
                        </div>
                    )}
                </div>

                {/* SHIFTS LIST */}
                <div className="space-y-4">
                    {todaysShifts.map(shift => {
                        const location = locations.find(l => l.id === shift.locationId);
                        
                        return (
                            <div key={shift.id} className="bg-white border-l-4 border-purple-500 rounded-r-xl shadow-sm p-5 flex flex-col gap-4 animate-fade-in">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm">
                                                {shift.startTime} - {shift.endTime}
                                            </span>
                                            <span className="font-bold text-purple-900 text-lg">{location?.name || 'Local Desconhecido'}</span>
                                        </div>
                                    </div>
                                    {!isReadOnly && (
                                        <button onClick={() => handleDeleteShift(shift.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* RESOURCES GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Carrinhos */}
                                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold text-xs uppercase tracking-wide">
                                            <ShoppingCart size={14} /> 4 Carrinhos
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 3, 4].map(num => renderSlot(shift, 'carrinho', num))}
                                        </div>
                                    </div>

                                    {/* Displays */}
                                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-xs uppercase tracking-wide">
                                            <Monitor size={14} /> 3 Displays
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[1, 2, 3].map(num => renderSlot(shift, 'display', num))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {todaysShifts.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center">
                            <Clock size={40} className="text-slate-300 mb-2" />
                            <p className="text-slate-500 font-medium">Nenhum turno agendado para esta data.</p>
                            <p className="text-xs text-slate-400 mt-1">Selecione outra data no calendário ou gere novos turnos.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* MODAL: ADD LOCATION */}
        {isLocationModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Novo Ponto de Testemunho</h3>
                    <div className="space-y-3">
                        <input type="text" placeholder="Nome (Ex: Praça Central)" className="w-full p-2 border rounded-lg" value={newLocationName} onChange={e => setNewLocationName(e.target.value)} />
                        <input type="text" placeholder="Endereço/Referência" className="w-full p-2 border rounded-lg" value={newLocationAddress} onChange={e => setNewLocationAddress(e.target.value)} />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setIsLocationModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                        <button onClick={handleAddLocation} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold">Salvar</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: GENERATOR */}
        {isGeneratorModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-purple-900 mb-1">Gerador de Turnos</h3>
                            <p className="text-sm text-slate-500">Crie turnos recorrentes automaticamente.</p>
                        </div>
                        <button onClick={() => setIsGeneratorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    
                    <div className="space-y-4">
                        {locations.length === 0 && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2 text-sm text-red-700 items-start">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p>Você precisa cadastrar pelo menos um <strong>Ponto (Local)</strong> na aba "Pontos" antes de gerar a agenda.</p>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Local</label>
                            <select 
                                className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                value={genData.locationId}
                                onChange={e => setGenData({...genData, locationId: e.target.value})}
                            >
                                <option value="">Selecione um local...</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dia da Semana</label>
                                <select 
                                    className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                    value={genData.dayOfWeek}
                                    onChange={e => setGenData({...genData, dayOfWeek: e.target.value})}
                                >
                                    {WEEKDAYS.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Recorrência</label>
                                <select 
                                    className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                    value={genData.weekOfMonth}
                                    onChange={e => setGenData({...genData, weekOfMonth: e.target.value})}
                                >
                                    {WEEK_PATTERNS.map(w => <option key={w.val} value={w.val}>{w.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Início</label>
                                <input type="time" className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500" value={genData.startTime} onChange={e => setGenData({...genData, startTime: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Fim</label>
                                <input type="time" className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500" value={genData.endTime} onChange={e => setGenData({...genData, endTime: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Gerar Para</label>
                            <select 
                                className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                value={genData.monthsToGenerate}
                                onChange={e => setGenData({...genData, monthsToGenerate: parseInt(e.target.value)})}
                            >
                                <option value="1">Próximo Mês</option>
                                <option value="3">Próximos 3 Meses</option>
                                <option value="6">Próximos 6 Meses</option>
                                <option value="12">Este Ano Completo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setIsGeneratorModalOpen(false)} className="flex-1 py-2.5 text-slate-500 font-bold border rounded-lg hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleGenerateShifts} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-sm disabled:opacity-50" disabled={locations.length === 0}>
                            Gerar Agenda
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default PublicWitnessing;
