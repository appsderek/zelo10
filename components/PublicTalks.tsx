import React, { useState } from 'react';
import { PublicTalk, PublicTalkOutline } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar, User, MapPin, Hash, Trash2, X, Search, List, Image, Video, Send, Copy, MessageCircle, AlertTriangle } from 'lucide-react';

interface PublicTalksProps {
  talks: PublicTalk[];
  outlines: PublicTalkOutline[];
  onSaveTalks: (talks: PublicTalk[]) => void;
  onSaveOutlines: (outlines: PublicTalkOutline[]) => void;
  isReadOnly?: boolean;
}

const PublicTalks: React.FC<PublicTalksProps> = ({ talks, outlines, onSaveTalks, onSaveOutlines, isReadOnly = false }) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'history' | 'invites'>('agenda');
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTalk, setSelectedTalk] = useState<PublicTalk | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // History/Outlines State
  const [showOutlinesList, setShowOutlinesList] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Invites State
  const [inviteOpenItem, setInviteOpenItem] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PublicTalk>>({
    date: new Date().toISOString().slice(0, 10),
    speaker: '',
    congregation: '',
    outlineNumber: '',
    theme: ''
  });

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddTalk = (e: React.FormEvent) => {
    e.preventDefault();
    if(isReadOnly) return;
    
    if (!formData.date || !formData.speaker || !formData.outlineNumber) return;

    const newTalk: PublicTalk = {
      id: crypto.randomUUID(),
      date: formData.date!,
      speaker: formData.speaker!,
      congregation: formData.congregation || '',
      outlineNumber: formData.outlineNumber!,
      theme: formData.theme || ''
    };

    const filtered = talks.filter(t => t.date !== formData.date);
    onSaveTalks([...filtered, newTalk]);
    
    setFormData({
        ...formData,
        speaker: '',
        congregation: '',
        outlineNumber: '',
        theme: ''
    });
  };

  const handleDeleteTalk = () => {
    if(isReadOnly || !selectedTalk) return;
    onSaveTalks(talks.filter(t => t.id !== selectedTalk.id));
    setSelectedTalk(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleOutlineNumberChange = (num: string) => {
    const outline = outlines.find(o => o.number === num);
    setFormData({
        ...formData,
        outlineNumber: num,
        theme: outline ? outline.theme : formData.theme
    });
  };

  const updateOutline = (index: number, field: keyof PublicTalkOutline, value: any) => {
    if(isReadOnly) return;
    const newOutlines = [...outlines];
    newOutlines[index] = { ...newOutlines[index], [field]: value };
    onSaveOutlines(newOutlines);
  };

  const openTalkDetails = (talk: PublicTalk) => {
      setSelectedTalk(talk);
      setIsDeleteConfirmOpen(false);
  };

  // --- RENDERERS ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50 border border-gray-100 opacity-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const talk = talks.find(t => t.date === dateStr);
      
      const today = new Date();
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

      days.push(
        <div 
          key={day} 
          onClick={() => {
              if (talk) openTalkDetails(talk);
              else setFormData({ ...formData, date: dateStr });
          }}
          className={`h-24 md:h-32 border border-gray-100 p-2 relative transition-all group cursor-pointer
            ${isToday ? 'bg-purple-50' : 'bg-white hover:bg-gray-50'}
          `}
        >
          <span className={`text-sm font-semibold ${isToday ? 'text-purple-600' : 'text-gray-700'}`}>{day}</span>
          
          {talk && (
            <div className="mt-2 w-full bg-purple-600 text-white text-xs p-1.5 rounded shadow-sm hover:bg-purple-700 transition-colors">
               <div className="font-bold flex justify-between items-center">
                   <span>Esboço {talk.outlineNumber}</span>
               </div>
               <div className="truncate opacity-90 text-[10px] mt-0.5">{talk.speaker}</div>
            </div>
          )}

          {!talk && !isReadOnly && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                 <Plus className="text-purple-300" />
             </div>
          )}
        </div>
      );
    }

    return days;
  };

  // --- GENERATOR LOGIC (INVITES) ---
  const InvitesAccordion = () => {
      const [inviteData, setInviteData] = useState({
          speaker: '',
          date: '',
          theme: '',
          congregation: ''
      });

      const copyToClipboard = (text: string) => {
          navigator.clipboard.writeText(text);
          alert("Texto copiado!");
      };

      const openWhatsapp = (text: string) => {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      };

      const templates = [
          {
              id: 'request',
              title: 'Solicitar Orador a outra Congregação',
              text: `Olá irmão [Coordenador], tudo bem?\n\nGostaria de saber se teria algum orador disponível para nos visitar no dia ${new Date(inviteData.date || Date.now()).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}.\n\nFico no aguardo, obrigado!`
          },
          {
              id: 'invite',
              title: 'Enviar Convite ao Orador',
              text: `Olá irmão ${inviteData.speaker}, tudo bem?\n\nConfirmamos seu discurso em nossa congregação para o dia ${new Date(inviteData.date || Date.now()).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}.\nTema: ${inviteData.theme}\n\nLocal: [Endereço do Salão]\nHorário: [Horário]\n\nQualquer dúvida estamos à disposição!`
          },
          {
              id: 'confirm',
              title: 'Lembrete / Confirmação (Semana)',
              text: `Olá irmão ${inviteData.speaker}.\n\nPassando apenas para confirmar sua visita neste fim de semana (${new Date(inviteData.date || Date.now()).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}) para proferir o discurso público.\n\nAguadamos ansiosamente!`
          }
      ];

      return (
          <div className="space-y-4 max-w-3xl mx-auto">
             <div className="bg-white p-4 rounded-xl border border-purple-100 mb-6">
                 <h4 className="font-bold text-slate-700 mb-3">Dados para o Modelo</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input type="text" placeholder="Nome do Orador" className="p-2 border rounded" value={inviteData.speaker} onChange={e => setInviteData({...inviteData, speaker: e.target.value})} />
                     <input type="date" className="p-2 border rounded" value={inviteData.date} onChange={e => setInviteData({...inviteData, date: e.target.value})} />
                     <input type="text" placeholder="Tema" className="p-2 border rounded" value={inviteData.theme} onChange={e => setInviteData({...inviteData, theme: e.target.value})} />
                 </div>
             </div>

             {templates.map(item => (
                 <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                     <button 
                        onClick={() => setInviteOpenItem(inviteOpenItem === item.id ? null : item.id)}
                        className="w-full px-6 py-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors"
                     >
                         <span className="font-bold text-slate-800 flex items-center gap-2">
                             <MessageCircle size={18} className="text-purple-600" />
                             {item.title}
                         </span>
                         {inviteOpenItem === item.id ? <ChevronLeft className="-rotate-90 text-slate-400" /> : <ChevronLeft className="-rotate-180 text-slate-400" />}
                     </button>
                     
                     {inviteOpenItem === item.id && (
                         <div className="p-6 bg-white animate-fade-in">
                             <textarea 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={6}
                                value={item.text}
                                readOnly
                             />
                             <div className="flex gap-3 mt-4 justify-end">
                                 <button onClick={() => copyToClipboard(item.text)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                                     <Copy size={16} /> Copiar
                                 </button>
                                 <button onClick={() => openWhatsapp(item.text)} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium">
                                     <Send size={16} /> Enviar WhatsApp
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             ))}
          </div>
      );
  };

  // Filter History
  const filteredHistory = talks.filter(t => 
      t.outlineNumber.includes(historySearch) ||
      t.speaker.toLowerCase().includes(historySearch.toLowerCase()) ||
      t.congregation.toLowerCase().includes(historySearch.toLowerCase())
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] pb-10">
      
      {/* TABS HEADER */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm mb-6 w-fit mx-auto md:mx-0 overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'agenda' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             <Calendar size={16} /> Agenda
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             <List size={16} /> {isReadOnly ? 'Histórico' : 'Histórico & Esboços'}
          </button>
          {!isReadOnly && (
            <button 
                onClick={() => setActiveTab('invites')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'invites' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Send size={16} /> Convites
            </button>
          )}
      </div>

      {/* CONTENT: AGENDA */}
      {activeTab === 'agenda' && (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            {/* SIDEBAR - FORMULÁRIO */}
            <div className={`lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col ${isReadOnly ? 'hidden lg:flex lg:w-0 lg:hidden' : ''}`}>
                <div className="p-4 border-b border-slate-100 bg-purple-50 rounded-t-xl">
                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <Calendar size={18} /> Novo Discurso
                </h3>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                <form onSubmit={handleAddTalk} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                        <input 
                            type="date" 
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-700"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do Esboço</label>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-purple-500 bg-white">
                            <Hash size={16} className="text-slate-400" />
                            <input 
                                type="text" 
                                required
                                placeholder="Ex: 5"
                                className="w-full outline-none text-slate-700"
                                value={formData.outlineNumber}
                                onChange={e => handleOutlineNumberChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {formData.theme && (
                        <div className="p-2 bg-purple-50 border border-purple-100 rounded text-xs text-purple-800 font-medium">
                            Tema: {formData.theme}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Orador</label>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-purple-500 bg-white">
                            <User size={16} className="text-slate-400" />
                            <input 
                                type="text" 
                                required
                                placeholder="Nome do Irmão"
                                className="w-full outline-none text-slate-700"
                                value={formData.speaker}
                                onChange={e => setFormData({...formData, speaker: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Congregação</label>
                        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-purple-500 bg-white">
                            <MapPin size={16} className="text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Ex: Central"
                                className="w-full outline-none text-slate-700"
                                value={formData.congregation}
                                onChange={e => setFormData({...formData, congregation: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Agendar
                    </button>
                </form>
                </div>
            </div>

            {/* MAIN CALENDAR */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {/* Calendar Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft size={24} className="text-slate-600" /></button>
                        <h2 className="text-xl font-bold text-slate-800 capitalize">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight size={24} className="text-slate-600" /></button>
                    </div>
                    <div className="hidden sm:block text-sm text-slate-500">
                        {talks.length} discursos agendados
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 bg-white border-b border-slate-100">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-b border-slate-200 min-h-[500px]">
                        {renderCalendar()}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* CONTENT: HISTORY */}
      {activeTab === 'history' && (
         <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200">
             {/* 2. Lista Mestre de Esboços (Collapsible) - Apenas para usuários com permissão de edição */}
             {!isReadOnly && (
                 <div className="border-b border-slate-200">
                     <button 
                        onClick={() => setShowOutlinesList(!showOutlinesList)}
                        className="w-full px-6 py-4 bg-white flex justify-between items-center hover:bg-purple-50 transition-colors sticky top-0 z-10 shadow-sm"
                     >
                         <span className="font-bold text-slate-800 flex items-center gap-2">
                             <List size={20} className="text-purple-600" /> 
                             Lista Mestre de Esboços (1-194)
                         </span>
                         {showOutlinesList ? <ChevronLeft className="-rotate-90" /> : <ChevronLeft className="-rotate-180" />}
                     </button>

                     {showOutlinesList && (
                         <div className="p-4 bg-slate-50 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border-b border-slate-200">
                             {outlines.map((outline, idx) => (
                                 <div key={outline.number} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                     <div className="flex justify-between items-center">
                                         <span className="font-bold text-purple-700 bg-purple-50 px-2 rounded">#{outline.number}</span>
                                         <div className="flex gap-2">
                                             <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-600" title="Possui Imagem">
                                                 <input type="checkbox" checked={outline.hasImage} onChange={(e) => updateOutline(idx, 'hasImage', e.target.checked)} disabled={isReadOnly} />
                                                 <Image size={14} />
                                             </label>
                                             <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-600" title="Possui Vídeo">
                                                 <input type="checkbox" checked={outline.hasVideo} onChange={(e) => updateOutline(idx, 'hasVideo', e.target.checked)} disabled={isReadOnly} />
                                                 <Video size={14} />
                                             </label>
                                         </div>
                                     </div>
                                     <input 
                                        type="text" 
                                        placeholder="Digite o tema..."
                                        className="w-full text-sm border-b border-slate-100 focus:border-purple-500 outline-none py-1"
                                        value={outline.theme}
                                        onChange={(e) => updateOutline(idx, 'theme', e.target.value)}
                                        readOnly={isReadOnly}
                                     />
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             )}

             {/* 3. Histórico de Discursos */}
             <div className="p-6">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                     <h3 className="text-lg font-bold text-slate-800">Histórico de Discursos</h3>
                     <div className="relative w-full md:w-auto">
                         <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                         <input 
                            type="text" 
                            placeholder="Buscar por orador, número ou congregação..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-80"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                         />
                     </div>
                 </div>

                 <div className="overflow-x-auto rounded-lg border border-slate-200">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                             <tr>
                                 <th className="px-6 py-4">Data</th>
                                 <th className="px-6 py-4">Nº</th>
                                 <th className="px-6 py-4">Tema</th>
                                 <th className="px-6 py-4">Orador</th>
                                 <th className="px-6 py-4">Congregação</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 bg-white">
                             {filteredHistory.map(talk => (
                                 <tr key={talk.id} className="hover:bg-purple-50/50 transition-colors">
                                     <td className="px-6 py-4 font-medium text-slate-800">
                                         {new Date(talk.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold text-xs">{talk.outlineNumber}</span>
                                     </td>
                                     <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={talk.theme}>{talk.theme || '-'}</td>
                                     <td className="px-6 py-4 font-medium">{talk.speaker}</td>
                                     <td className="px-6 py-4 text-slate-500">{talk.congregation}</td>
                                 </tr>
                             ))}
                             {filteredHistory.length === 0 && (
                                 <tr>
                                     <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhum histórico encontrado.</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
         </div>
      )}

      {/* CONTENT: INVITES */}
      {activeTab === 'invites' && !isReadOnly && (
          <div className="flex-1 overflow-y-auto">
             <InvitesAccordion />
          </div>
      )}

      {/* MODAL DETALHES (SHARED) */}
      {selectedTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in overflow-hidden transition-all">
                {isDeleteConfirmOpen ? (
                    <div className="p-6 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Discurso?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Você tem certeza que deseja remover o discurso do esboço <strong>#{selectedTalk.outlineNumber}</strong>? Essa ação não pode ser desfeita.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="py-2 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDeleteTalk}
                                className="py-2 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-purple-600 p-6 text-white text-center relative">
                            <button onClick={() => setSelectedTalk(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                                <X size={24} />
                            </button>
                            <div className="inline-block p-3 bg-white/20 rounded-full mb-3">
                                <Hash size={32} />
                            </div>
                            <h3 className="text-3xl font-bold">{selectedTalk.outlineNumber}</h3>
                            <p className="text-purple-200 text-sm uppercase tracking-wide font-bold mt-1">Número do Esboço</p>
                            {selectedTalk.theme && <p className="mt-2 text-white/90 font-medium italic">"{selectedTalk.theme}"</p>}
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="text-purple-500 mt-1" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Data</p>
                                    <p className="text-slate-800 font-medium">
                                    {new Date(selectedTalk.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <User className="text-purple-500 mt-1" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Orador</p>
                                    <p className="text-slate-800 font-bold text-lg">{selectedTalk.speaker}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="text-purple-500 mt-1" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Congregação</p>
                                    <p className="text-slate-800 font-medium">{selectedTalk.congregation || 'Não informada'}</p>
                                </div>
                            </div>

                            {!isReadOnly && (
                                <div className="pt-4 flex flex-col gap-3">
                                    <button 
                                        onClick={() => setIsDeleteConfirmOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors"
                                    >
                                        <Trash2 size={18} /> Excluir Discurso
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default PublicTalks;