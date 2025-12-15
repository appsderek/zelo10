
import React, { useState } from 'react';
import { WeekSchedule, Member, MeetingPart } from '../types';
import { Plus, Save, Trash2, ArrowLeft, Printer, Copy, Edit, Eye, X, AlertTriangle, List, UserPlus } from 'lucide-react';
import { handlePrint } from '../services/notificationService';

// --- COMPONENTE AUXILIAR (Extraído para manter estado de foco e modo manual) ---
interface MemberSelectProps {
  members: Member[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  isReadOnly?: boolean;
}

const MemberSelect: React.FC<MemberSelectProps> = ({ members, value, onChange, placeholder = "Selecione...", className = "", isReadOnly = false }) => {
    const sortedMembers = [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    // Verifica se é um valor customizado (não está na lista de membros)
    // Se tiver valor e não bater com nenhum nome da lista, assume que é manual.
    const isCustomValue = value && value !== '' && !sortedMembers.some(m => m.fullName === value);
    
    // Estado local para controlar o modo de input
    const [isManualMode, setIsManualMode] = useState(!!isCustomValue);

    // Sincroniza o modo manual se o valor mudar externamente (ex: carregar dados salvos)
    React.useEffect(() => {
        if (value && !sortedMembers.some(m => m.fullName === value)) {
            setIsManualMode(true);
        } else if (value && sortedMembers.some(m => m.fullName === value)) {
            setIsManualMode(false);
        }
    }, [value, sortedMembers]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '___CUSTOM___') {
            setIsManualMode(true);
            onChange(''); // Limpa valor para começar a digitar
        } else {
            setIsManualMode(false);
            onChange(val);
        }
    };

    const handleManualCancel = () => {
        setIsManualMode(false);
        onChange('');
    };

    if (isManualMode) {
        return (
            <div className="flex gap-1 items-center">
                <div className="relative w-full">
                    <input 
                        type="text"
                        className={`w-full p-1.5 border border-purple-300 rounded text-sm bg-purple-50 text-purple-900 outline-none focus:border-purple-500 font-medium ${className}`}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Digite o nome..."
                        autoFocus={!value} 
                        disabled={isReadOnly}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-purple-400 font-bold pointer-events-none">MANUAL</span>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={handleManualCancel}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1.5 rounded transition-colors"
                        title="Voltar para Lista"
                    >
                        <List size={16} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            <select 
                className={`w-full p-1.5 border rounded text-sm bg-white outline-none focus:border-purple-500 ${className}`}
                value={value}
                onChange={handleSelectChange}
                disabled={isReadOnly}
            >
                <option value="">{placeholder}</option>
                {sortedMembers.map(m => (
                    <option key={m.id} value={m.fullName}>{m.fullName}</option>
                ))}
                <option value="___CUSTOM___" className="font-bold text-purple-600 bg-purple-50">
                    + Outro / Convidado (Digitar)
                </option>
            </select>
        </div>
    );
};

interface MeetingScheduleProps {
  members: Member[];
  schedules: WeekSchedule[];
  onSaveSchedule: (schedule: WeekSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  isReadOnly?: boolean;
}

const MeetingSchedule: React.FC<MeetingScheduleProps> = ({ members, schedules, onSaveSchedule, onDeleteSchedule, isReadOnly = false }) => {
  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
  const [currentSchedule, setCurrentSchedule] = useState<WeekSchedule | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- TEMPLATES ---
  const emptySchedule: WeekSchedule = {
    id: '',
    date: new Date().toISOString().slice(0, 10),
    congregationName: '',
    chairman: '',
    auxClassCounselor: '',
    
    openingSongTime: '19:30',
    openingSong: '',
    openingPrayer: '',
    openingCommentsTime: '19:35',
    openingComments: 'Comentários iniciais (1 min)',
    
    treasuresParts: [
      { id: 't1', time: '19:36', duration: '10 min', theme: 'Discurso', assignedTo: '' },
      { id: 't2', time: '19:46', duration: '10 min', theme: 'Joias espirituais', assignedTo: '' },
      { id: 't3', time: '19:56', duration: '4 min', theme: 'Leitura da Bíblia', assignedTo: '', isBHall: true, assignedToB: '' }
    ],
    ministryParts: [
      { id: 'm1', time: '20:01', duration: '3 min', theme: 'Iniciando Conversas', assignedTo: '', assistant: '', isBHall: true, assignedToB: '', assistantB: '' },
      { id: 'm2', time: '20:05', duration: '4 min', theme: 'Cultivando o Interesse', assignedTo: '', assistant: '', isBHall: true, assignedToB: '', assistantB: '' },
      { id: 'm3', time: '20:10', duration: '5 min', theme: 'Explicando Nossas Crenças', assignedTo: '', assistant: '', isBHall: true, assignedToB: '', assistantB: '' },
    ],
    middleSongTime: '20:15',
    middleSong: '',
    livingParts: [
      { id: 'l1', time: '20:20', duration: '15 min', theme: 'Necessidades locais', assignedTo: '' },
    ],
    congregationStudyTime: '20:35',
    congregationStudy: {
      theme: 'Estudo bíblico de congregação',
      conductor: '',
      reader: '',
    },
    closingCommentsTime: '21:05',
    closingComments: 'Comentários finais (3 min)',
    closingSongTime: '21:08',
    closingSong: '',
    closingPrayerTime: '21:13',
    closingPrayer: '',
  };

  // --- HANDLERS ---
  const handleView = (schedule: WeekSchedule) => {
    setCurrentSchedule(schedule);
    setView('preview');
  };

  const handleEdit = () => {
    setView('editor');
  };

  const handleNew = () => {
    if (isReadOnly) return;
    setCurrentSchedule({ ...emptySchedule, id: crypto.randomUUID() });
    setView('editor');
  };

  const handleSave = () => {
    if (isReadOnly || !currentSchedule) return;
    onSaveSchedule(currentSchedule);
    setView('preview'); // Vai para o preview após salvar para conferência
  };

  const handleRequestDelete = () => {
    if (isReadOnly || !currentSchedule) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (currentSchedule) {
      onDeleteSchedule(currentSchedule.id);
      setIsDeleteModalOpen(false);
      setCurrentSchedule(null);
      setView('list');
    }
  };

  const handleCopy = () => {
    if (!currentSchedule) return;
    const newId = crypto.randomUUID();
    const copiedSchedule = { ...currentSchedule, id: newId, date: '' };
    setCurrentSchedule(copiedSchedule);
    setView('editor');
    alert('Programação copiada. Por favor, defina uma nova data e salve.');
  };

  const handlePartChange = (partId: string, field: keyof MeetingPart, value: string, partType: 'treasures' | 'ministry' | 'living') => {
    if (!currentSchedule) return;
    const partKeyMap = {
      treasures: 'treasuresParts',
      ministry: 'ministryParts',
      living: 'livingParts'
    };
    const key = partKeyMap[partType];
    const updatedParts = (currentSchedule[key] as MeetingPart[]).map(p =>
      p.id === partId ? { ...p, [field]: value } : p
    );
    setCurrentSchedule({ ...currentSchedule, [key]: updatedParts });
  };
  
  const handleCongregationStudyChange = (field: 'theme' | 'conductor' | 'reader', value: string) => {
    if (!currentSchedule) return;
    setCurrentSchedule({
      ...currentSchedule,
      congregationStudy: { ...currentSchedule.congregationStudy, [field]: value }
    });
  };

  const handleAddPart = (type: 'ministry' | 'living') => {
    if (!currentSchedule || isReadOnly) return;
    
    const newPart: MeetingPart = {
        id: crypto.randomUUID(),
        time: '',
        duration: '',
        theme: '',
        assignedTo: '',
        // Defaults específicos por tipo
        ...(type === 'ministry' ? { isBHall: true, assistant: '', assistantB: '', assignedToB: '' } : {})
    };

    if (type === 'ministry') {
        setCurrentSchedule({
            ...currentSchedule,
            ministryParts: [...currentSchedule.ministryParts, newPart]
        });
    } else {
        setCurrentSchedule({
            ...currentSchedule,
            livingParts: [...currentSchedule.livingParts, newPart]
        });
    }
  };

  const handleRemovePart = (id: string, type: 'ministry' | 'living') => {
    if (!currentSchedule || isReadOnly) return;

    if (type === 'ministry') {
        setCurrentSchedule({
            ...currentSchedule,
            ministryParts: currentSchedule.ministryParts.filter(p => p.id !== id)
        });
    } else {
        setCurrentSchedule({
            ...currentSchedule,
            livingParts: currentSchedule.livingParts.filter(p => p.id !== id)
        });
    }
  };

  // --- RENDERERS ---

  // 1. LIST VIEW
  const renderList = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vida e Ministério Cristão</h2>
          <p className="text-slate-500">Gerenciamento da programação semanal.</p>
        </div>
        {!isReadOnly && (
          <button onClick={handleNew} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            <Plus size={18} /> Nova Programação
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...schedules].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
          <div key={s.id} onClick={() => handleView(s)} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-purple-300 transition-all group">
             <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-600 uppercase">
                    {new Date(s.date).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })}
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })}
                  </p>
                </div>
                <span className="text-slate-400 font-bold">{new Date(s.date).getFullYear()}</span>
             </div>
             <p className="mt-4 text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Presidente: <span className="font-medium text-slate-800">{s.chairman}</span></p>
          </div>
        ))}
        {schedules.length === 0 && <p className="text-slate-400 col-span-full text-center py-8">Nenhuma programação cadastrada.</p>}
      </div>
    </div>
  );

  // 2. DOCUMENT PREVIEW (PDF STYLE)
  const renderDocumentPreview = () => {
    if (!currentSchedule) return null;

    const formattedDate = new Date(currentSchedule.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print-hidden">
           <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
             <ArrowLeft size={20} /> Voltar
           </button>
           <div className="flex gap-2">
             <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium shadow-sm">
                <Printer size={16} /> Imprimir
             </button>
             {!isReadOnly && (
               <>
                 <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium">
                    <Copy size={16} /> Copiar
                 </button>
                 <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium shadow-sm">
                    <Edit size={16} /> Editar
                 </button>
               </>
             )}
           </div>
        </div>

        {/* DOCUMENTO OFICIAL */}
        <div className="printable-content bg-white shadow-lg p-8 max-w-[210mm] mx-auto w-full text-black print:shadow-none print:p-0 print:w-full font-inter text-[11px] leading-tight">
           
           {/* Header */}
           <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-end uppercase font-bold tracking-tight">
              <span className="text-sm">{currentSchedule.congregationName || '[NOME DA CONGREGAÇÃO]'}</span>
              <span className="text-lg">Programação da reunião do meio de semana</span>
           </div>

           {/* Sub Header */}
           <div className="grid grid-cols-2 gap-x-4 mb-4">
              <div className="font-bold uppercase text-xs flex items-center">
                 <span className="bg-gray-100 px-1">{formattedDate}</span> <span className="mx-2">|</span> LEITURA SEMANAL DA BÍBLIA
              </div>
              <div className="text-right flex justify-end gap-2">
                 <span className="font-bold text-gray-600 text-[10px] uppercase">Presidente:</span>
                 <span className="font-bold border-b border-gray-300 min-w-[100px] text-center">{currentSchedule.chairman}</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                 <span className="font-bold w-10 text-right">{currentSchedule.openingSongTime}</span>
                 <span className="font-bold">• Cântico {currentSchedule.openingSong}</span>
              </div>
              <div className="mt-2 text-right flex justify-end gap-2">
                 <span className="font-bold text-gray-600 text-[10px] uppercase">Oração:</span>
                 <span className="font-bold border-b border-gray-300 min-w-[100px] text-center">{currentSchedule.openingPrayer}</span>
              </div>

              <div className="flex items-center gap-2">
                 <span className="font-bold w-10 text-right">{currentSchedule.openingCommentsTime}</span>
                 <span>• {currentSchedule.openingComments}</span>
              </div>
           </div>

           {/* TESOUROS */}
           <div className="mb-4">
              <div className="bg-slate-700 text-white font-bold uppercase text-xs px-2 py-1.5 flex justify-between items-center rounded-sm print:bg-slate-700 print:text-white mb-1">
                 <span>TESOUROS DA PALAVRA DE DEUS</span>
                 <span className="font-normal normal-case text-[10px] opacity-90">Salão principal</span>
              </div>
              
              <div className="space-y-1">
                 {currentSchedule.treasuresParts.map((part, index) => (
                    <div key={part.id} className="flex items-baseline gap-2 py-1 border-b border-dotted border-gray-200 last:border-0">
                       <span className="font-bold w-10 text-right shrink-0">{part.time}</span>
                       <span className="font-bold text-slate-700 w-4 text-center shrink-0">{index + 1}.</span>
                       <div className="flex-grow">
                          <span className="font-bold text-slate-900">{part.theme}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">({part.duration})</span>
                       </div>
                       <div className="w-1/3 text-right font-semibold text-slate-800">
                          {part.assignedTo}
                          {part.isBHall && part.assignedToB && <div className="text-[9px] text-slate-500">B: {part.assignedToB}</div>}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* MINISTÉRIO */}
           <div className="mb-4">
              <div className="bg-[#b45309] text-white font-bold uppercase text-xs px-2 py-1.5 flex justify-between items-center rounded-sm print:bg-[#b45309] print:text-white mb-1">
                 <span>FAÇA SEU MELHOR NO MINISTÉRIO</span>
                 <span className="font-normal normal-case text-[10px] opacity-90">Salão principal</span>
              </div>

              <div className="space-y-1">
                 {currentSchedule.ministryParts.map((part, index) => (
                    <div key={part.id} className="flex items-baseline gap-2 py-1 border-b border-dotted border-gray-200 last:border-0">
                       <span className="font-bold w-10 text-right shrink-0">{part.time}</span>
                       <span className="font-bold text-[#b45309] w-4 text-center shrink-0">{index + 4}.</span>
                       <div className="flex-grow">
                          <span className="font-bold text-slate-900">{part.theme}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">({part.duration})</span>
                       </div>
                       <div className="w-1/3 text-right">
                          <div className="flex justify-end items-center gap-1">
                              <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Estudante/ajudante:</span>
                              <span className="font-semibold text-slate-800">
                                  {part.assignedTo} {part.assistant ? `/ ${part.assistant}` : ''}
                              </span>
                          </div>
                          {part.isBHall && (part.assignedToB || part.assistantB) && (
                              <div className="flex justify-end items-center gap-1 text-slate-500">
                                  <span className="text-[9px] uppercase tracking-tighter">(Sala B):</span>
                                  <span className="text-[10px]">{part.assignedToB} {part.assistantB ? `/ ${part.assistantB}` : ''}</span>
                              </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* VIDA CRISTÃ */}
           <div className="mb-0">
              <div className="bg-[#991b1b] text-white font-bold uppercase text-xs px-2 py-1.5 flex justify-between items-center rounded-sm print:bg-[#991b1b] print:text-white mb-1">
                 <span>NOSSA VIDA CRISTÃ</span>
              </div>

              <div className="space-y-1">
                 {/* Cântico do Meio */}
                 <div className="flex items-baseline gap-2 py-1">
                     <span className="font-bold w-10 text-right shrink-0">{currentSchedule.middleSongTime}</span>
                     <span className="font-bold text-[#991b1b]">• Cântico {currentSchedule.middleSong}</span>
                 </div>

                 {/* Partes Vida Cristã */}
                 {currentSchedule.livingParts.map((part, index) => (
                    <div key={part.id} className="flex items-baseline gap-2 py-1 border-b border-dotted border-gray-200 last:border-0">
                       <span className="font-bold w-10 text-right shrink-0">{part.time}</span>
                       <span className="font-bold text-[#991b1b] w-4 text-center shrink-0">{index + 4 + currentSchedule.ministryParts.length}.</span>
                       <div className="flex-grow">
                          <span className="font-bold text-slate-900">{part.theme}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">({part.duration})</span>
                       </div>
                       <div className="w-1/3 text-right font-semibold text-slate-800">
                          {part.assignedTo}
                       </div>
                    </div>
                 ))}

                 {/* Estudo Bíblico */}
                 <div className="flex items-baseline gap-2 py-1 border-b border-dotted border-gray-200">
                     <span className="font-bold w-10 text-right shrink-0">{currentSchedule.congregationStudyTime}</span>
                     <span className="font-bold text-[#991b1b] w-4 text-center shrink-0">{4 + currentSchedule.ministryParts.length + currentSchedule.livingParts.length}.</span>
                     <div className="flex-grow">
                        <span className="font-bold text-slate-900">{currentSchedule.congregationStudy.theme}</span>
                        <span className="text-slate-500 ml-1 text-[10px]">(30 min)</span>
                     </div>
                     <div className="w-1/3 text-right">
                         <div className="flex justify-end items-center gap-1">
                             <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Dirigente/leitor:</span>
                             <span className="font-semibold text-slate-800">
                                 {currentSchedule.congregationStudy.conductor} / {currentSchedule.congregationStudy.reader}
                             </span>
                         </div>
                     </div>
                 </div>

                 {/* Comentários Finais */}
                 <div className="flex items-center gap-2 py-1">
                     <span className="font-bold w-10 text-right">{currentSchedule.closingCommentsTime}</span>
                     <span>• {currentSchedule.closingComments}</span>
                 </div>

                 {/* Cântico Final e Oração */}
                 <div className="grid grid-cols-2 mt-1">
                    <div className="flex items-center gap-2">
                       <span className="font-bold w-10 text-right">{currentSchedule.closingSongTime}</span>
                       <span className="font-bold">• Cântico {currentSchedule.closingSong}</span>
                    </div>
                    <div className="text-right flex justify-end gap-2 items-center">
                       <span className="font-bold text-gray-600 text-[10px] uppercase">Oração:</span>
                       <span className="font-bold border-b border-gray-300 min-w-[100px] text-center">{currentSchedule.closingPrayer}</span>
                    </div>
                 </div>

              </div>
           </div>

           <div className="mt-8 text-[9px] text-gray-400">
              S-140-T 11/23
           </div>

        </div>
      </div>
    );
  };

  // 3. EDITOR VIEW
  const renderEditor = () => {
    if (!currentSchedule) return null;

    const renderPartInputs = (part: MeetingPart, type: 'treasures' | 'ministry' | 'living') => {
        const isMinistry = type === 'ministry';
        const bgColor = type === 'treasures' ? 'bg-slate-50 border-slate-200' : type === 'ministry' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
        
        return (
            <div key={part.id} className={`p-4 rounded-lg border ${bgColor} relative grid grid-cols-1 md:grid-cols-12 gap-3 items-end group`}>
                {type !== 'treasures' && (
                    <button 
                        onClick={() => handleRemovePart(part.id, type)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remover Parte"
                    >
                        <Trash2 size={14} />
                    </button>
                )}

                <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Horário</label>
                    <input type="time" className="w-full p-1 border rounded text-sm bg-white" value={part.time} onChange={e => handlePartChange(part.id, 'time', e.target.value, type)} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Duração</label>
                    <input type="text" className="w-full p-1 border rounded text-sm bg-white" value={part.duration} onChange={e => handlePartChange(part.id, 'duration', e.target.value, type)} placeholder="Ex: 5 min" />
                </div>
                <div className="md:col-span-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tema</label>
                    <input type="text" className="w-full p-1 border rounded text-sm bg-white font-medium" value={part.theme} onChange={e => handlePartChange(part.id, 'theme', e.target.value, type)} />
                </div>
                <div className={isMinistry ? "md:col-span-2" : "md:col-span-4"}>
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Designado {isMinistry ? '(Estudante)' : ''}</label>
                     <MemberSelect 
                        members={members}
                        value={part.assignedTo} 
                        onChange={val => handlePartChange(part.id, 'assignedTo', val, type)} 
                        placeholder={isMinistry ? "Estudante..." : "Designado..."}
                     />
                     {part.isBHall && (
                        <div className="mt-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Sala B</label>
                          <MemberSelect 
                            members={members}
                            value={part.assignedToB || ''} 
                            onChange={val => handlePartChange(part.id, 'assignedToB', val, type)} 
                            placeholder="Designado Sala B..."
                          />
                        </div>
                     )}
                </div>
                {isMinistry && (
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Ajudante</label>
                        <MemberSelect 
                            members={members}
                            value={part.assistant || ''} 
                            onChange={val => handlePartChange(part.id, 'assistant', val, type)} 
                            placeholder="Ajudante..."
                        />
                        {part.isBHall && (
                            <div className="mt-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Sala B</label>
                              <MemberSelect 
                                members={members}
                                value={part.assistantB || ''} 
                                onChange={val => handlePartChange(part.id, 'assistantB', val, type)} 
                                placeholder="Ajudante Sala B..."
                              />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('preview')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><ArrowLeft /></button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Editar Programação</h2>
              <input type="date" className="p-1 border-b-2 border-transparent focus:border-purple-500 outline-none text-slate-500 font-medium" value={currentSchedule.date} onChange={e => setCurrentSchedule({...currentSchedule, date: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isReadOnly && <button onClick={handleRequestDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium"><Trash2 size={16}/> Excluir</button>}
            {!isReadOnly && <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium shadow-sm"><Save size={16}/> Salvar e Visualizar</button>}
          </div>
        </div>
        
        {/* Main Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-purple-900 border-b border-purple-100 pb-2">Cabeçalho</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Nome da Congregação</label>
                    <input type="text" className="w-full p-2 border rounded" value={currentSchedule.congregationName} onChange={e => setCurrentSchedule({...currentSchedule, congregationName: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Presidente</label>
                    <MemberSelect members={members} value={currentSchedule.chairman} onChange={val => setCurrentSchedule({...currentSchedule, chairman: val})} placeholder="Selecione o Presidente..." />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Conselheiro Sala B</label>
                    <MemberSelect members={members} value={currentSchedule.auxClassCounselor} onChange={val => setCurrentSchedule({...currentSchedule, auxClassCounselor: val})} placeholder="Selecione o Conselheiro..." />
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Horário Início</label>
                    <input type="time" className="w-full p-1 border rounded text-sm" value={currentSchedule.openingSongTime} onChange={e => setCurrentSchedule({...currentSchedule, openingSongTime: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Cântico Inicial</label>
                    <input type="text" className="w-full p-1 border rounded text-sm" value={currentSchedule.openingSong} onChange={e => setCurrentSchedule({...currentSchedule, openingSong: e.target.value})} />
                 </div>
                 <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-500">Oração Inicial</label>
                    <MemberSelect members={members} value={currentSchedule.openingPrayer} onChange={val => setCurrentSchedule({...currentSchedule, openingPrayer: val})} placeholder="Selecione..." />
                 </div>
            </div>
        </div>

        {/* Parts List */}
         <div className="space-y-4">
            <h3 className="text-sm font-bold bg-slate-700 text-white p-2 rounded">TESOUROS DA PALAVRA DE DEUS</h3>
            {currentSchedule.treasuresParts.map(p => renderPartInputs(p, 'treasures'))}

            <div className="flex items-center justify-between mt-6 bg-[#b45309] text-white p-2 rounded">
                 <h3 className="text-sm font-bold">FAÇA SEU MELHOR NO MINISTÉRIO</h3>
            </div>
            {currentSchedule.ministryParts.map(p => renderPartInputs(p, 'ministry'))}
            {!isReadOnly && (
                <button 
                    onClick={() => handleAddPart('ministry')}
                    className="w-full py-2 border-2 border-dashed border-yellow-200 text-yellow-700 hover:bg-yellow-50 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={16} /> Adicionar Parte
                </button>
            )}

            <div className="flex items-center justify-between mt-6 bg-[#991b1b] text-white p-2 rounded">
                 <h3 className="text-sm font-bold">NOSSA VIDA CRISTÃ</h3>
            </div>
            
            {/* Middle Song Input */}
            <div className="grid grid-cols-2 gap-4 bg-red-50 p-3 rounded border border-red-100">
                <div>
                     <label className="text-[10px] font-bold text-red-800 uppercase">Horário Cântico</label>
                     <input type="time" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.middleSongTime} onChange={e => setCurrentSchedule({...currentSchedule, middleSongTime: e.target.value})} />
                </div>
                <div>
                     <label className="text-[10px] font-bold text-red-800 uppercase">Número Cântico</label>
                     <input type="text" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.middleSong} onChange={e => setCurrentSchedule({...currentSchedule, middleSong: e.target.value})} />
                </div>
            </div>

            {currentSchedule.livingParts.map(p => renderPartInputs(p, 'living'))}
            {!isReadOnly && (
                <button 
                    onClick={() => handleAddPart('living')}
                    className="w-full py-2 border-2 border-dashed border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={16} /> Adicionar Parte
                </button>
            )}

            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                 <label className="text-xs font-bold text-red-900 uppercase">Estudo Bíblico de Congregação</label>
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mt-1">
                    <div className="md:col-span-2">
                         <label className="text-[10px] font-bold text-slate-500 uppercase">Horário</label>
                         <input type="time" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.congregationStudyTime} onChange={e => setCurrentSchedule({...currentSchedule, congregationStudyTime: e.target.value})} />
                    </div>
                    <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tema / Livro</label>
                         <input type="text" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.congregationStudy.theme} onChange={e => handleCongregationStudyChange('theme', e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Dirigente</label>
                        <MemberSelect members={members} value={currentSchedule.congregationStudy.conductor} onChange={val => handleCongregationStudyChange('conductor', val)} placeholder="Dirigente..." />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Leitor</label>
                        <MemberSelect members={members} value={currentSchedule.congregationStudy.reader} onChange={val => handleCongregationStudyChange('reader', val)} placeholder="Leitor..." />
                    </div>
                 </div>
            </div>

            {/* Closing */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase">Encerramento</h3>
                
                {/* Comentários Finais */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Horário</label>
                        <input type="time" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.closingCommentsTime} onChange={e => setCurrentSchedule({...currentSchedule, closingCommentsTime: e.target.value})} />
                     </div>
                     <div className="md:col-span-10">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Texto (Comentários Finais)</label>
                        <input type="text" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.closingComments} onChange={e => setCurrentSchedule({...currentSchedule, closingComments: e.target.value})} />
                     </div>
                </div>

                {/* Cântico e Oração */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Horário Cântico</label>
                        <input type="time" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.closingSongTime || ''} onChange={e => setCurrentSchedule({...currentSchedule, closingSongTime: e.target.value})} />
                     </div>
                     <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cântico Final</label>
                        <input type="text" className="w-full p-1 border rounded text-sm bg-white" value={currentSchedule.closingSong} onChange={e => setCurrentSchedule({...currentSchedule, closingSong: e.target.value})} />
                     </div>
                     <div className="md:col-span-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Oração Final</label>
                        <MemberSelect members={members} value={currentSchedule.closingPrayer} onChange={val => setCurrentSchedule({...currentSchedule, closingPrayer: val})} placeholder="Selecione..." />
                     </div>
                </div>
            </div>

         </div>
      </div>
    );
  };

  return (
    <div>
      {view === 'list' && renderList()}
      {view === 'preview' && renderDocumentPreview()}
      {view === 'editor' && renderEditor()}
      
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && currentSchedule && !isReadOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm print-hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="p-3 bg-red-100 rounded-full">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Tem certeza que deseja excluir a programação de <strong>{currentSchedule.date ? new Date(currentSchedule.date).toLocaleDateString('pt-BR') : 'Data não definida'}</strong>? 
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

export default MeetingSchedule;
