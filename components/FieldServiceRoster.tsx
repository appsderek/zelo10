import React, { useState } from 'react';
import { FieldServiceMeeting } from '../types';
import { Plus, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { handlePrint } from '../services/notificationService';
import { Member } from '../types';

interface FieldServiceRosterProps {
  meetings: FieldServiceMeeting[];
  onSaveMeetings: (newMeetings: FieldServiceMeeting[]) => void;
  isReadOnly?: boolean;
  members?: Member[]; 
}

const FieldServiceRoster: React.FC<FieldServiceRosterProps & { members?: Member[] }> = ({ meetings, onSaveMeetings, isReadOnly = false, members = [] }) => {
  const [localMeetings, setLocalMeetings] = useState<FieldServiceMeeting[]>(meetings);
  
  // Header Editable State
  const [headerTitle, setHeaderTitle] = useState('PROGRAMAÇÃO SEMANAL PARA O SERVIÇO DE CAMPO');
  const [headerCongregation, setHeaderCongregation] = useState('Congregação: _______________________');
  const [headerGroup, setHeaderGroup] = useState('Grupo: _______');

  const [meetingToDelete, setMeetingToDelete] = useState<FieldServiceMeeting | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Ordena membros
  const sortedMembers = [...(members || [])].sort((a, b) => a.fullName.localeCompare(b.fullName));

  const WEEKDAYS = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
    'Feriado'
  ];

  const handleAddRow = () => {
    if(isReadOnly) return;
    const newMeeting: FieldServiceMeeting = {
      id: crypto.randomUUID(),
      dayOfWeek: 'Sábado',
      territory: '',
      conductor: '',
      meetingPlace: '',
      time: '09:00'
    };
    const updated = [...localMeetings, newMeeting];
    setLocalMeetings(updated);
    onSaveMeetings(updated);
  };

  const handleChange = (id: string, field: keyof FieldServiceMeeting, value: string) => {
    if(isReadOnly) return;
    const updated = localMeetings.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    );
    setLocalMeetings(updated);
  };

  const handleBlur = () => {
    if(isReadOnly) return;
    onSaveMeetings(localMeetings);
  };

  const handleRequestDelete = (meeting: FieldServiceMeeting) => {
    if(isReadOnly) return;
    setMeetingToDelete(meeting);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (meetingToDelete) {
      const updated = localMeetings.filter(m => m.id !== meetingToDelete.id);
      setLocalMeetings(updated);
      onSaveMeetings(updated);
      setIsDeleteModalOpen(false);
      setMeetingToDelete(null);
    }
  };

  // Ordenação inteligente por dia da semana
  const sortedMeetings = [...localMeetings].sort((a, b) => {
    const idxA = WEEKDAYS.indexOf(a.dayOfWeek);
    const idxB = WEEKDAYS.indexOf(b.dayOfWeek);
    if (idxA === idxB) {
        return a.time.localeCompare(b.time);
    }
    return idxA - idxB;
  });

  const inputBaseClass = `w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none font-medium text-slate-700 placeholder:text-slate-300 transition-colors ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Saídas de Campo</h2>
          <p className="text-slate-500">Programação semanal das reuniões para o serviço de campo.</p>
        </div>
        <div className="flex gap-3">
            <button 
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
                <Printer size={18} /> Imprimir
            </button>
            {!isReadOnly && (
                <button 
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors cursor-pointer"
                >
                    <Plus size={18} /> Adicionar Saída
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden printable-content p-8">
        
        {/* CABEÇALHO EDITÁVEL */}
        <div className="mb-6 border-b-2 border-slate-800 pb-4 text-center">
            <input 
                type="text" 
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="w-full text-center text-xl font-black text-slate-900 uppercase bg-transparent border-none focus:ring-0 p-0 mb-2"
            />
            <div className="flex justify-between px-4">
                <input 
                    type="text" 
                    value={headerCongregation}
                    onChange={(e) => setHeaderCongregation(e.target.value)}
                    className="text-left text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 w-1/2"
                />
                <input 
                    type="text" 
                    value={headerGroup}
                    onChange={(e) => setHeaderGroup(e.target.value)}
                    className="text-right text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 w-1/3"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-purple-50 border-b-2 border-slate-800 text-slate-900 uppercase">
                <th className="px-4 py-3 font-black w-40 text-sm">Dia da Semana</th>
                <th className="px-4 py-3 font-black w-24 text-sm">Horário</th>
                <th className="px-4 py-3 font-black text-sm">Local de Saída</th>
                <th className="px-4 py-3 font-black text-sm">Território / Atividade</th>
                <th className="px-4 py-3 font-black text-sm">Dirigente</th>
                {!isReadOnly && <th className="px-4 py-3 font-bold w-16 text-center print-hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedMeetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 align-middle">
                    <select
                      className={`${inputBaseClass} cursor-pointer appearance-none font-bold`}
                      value={meeting.dayOfWeek}
                      onChange={(e) => handleChange(meeting.id, 'dayOfWeek', e.target.value)}
                      onBlur={handleBlur}
                      disabled={isReadOnly}
                    >
                        {WEEKDAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <input 
                      type="time" 
                      className={inputBaseClass}
                      value={meeting.time}
                      onChange={(e) => handleChange(meeting.id, 'time', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <input 
                      type="text"
                      placeholder={isReadOnly ? "" : "Ex: Salão do Reino"}
                      className={inputBaseClass}
                      value={meeting.meetingPlace}
                      onChange={(e) => handleChange(meeting.id, 'meetingPlace', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <input 
                      type="text"
                      placeholder={isReadOnly ? "" : "Ex: Residencial ou Testemunho Público"}
                      className={inputBaseClass}
                      value={meeting.territory}
                      onChange={(e) => handleChange(meeting.id, 'territory', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2 align-middle">
                     {members && members.length > 0 ? (
                        <select
                            className={`${inputBaseClass} cursor-pointer appearance-none`}
                            value={meeting.conductor}
                            onChange={(e) => handleChange(meeting.id, 'conductor', e.target.value)}
                            onBlur={handleBlur}
                            disabled={isReadOnly}
                        >
                            <option value="">Selecione...</option>
                            {sortedMembers.map(m => (
                                <option key={m.id} value={m.fullName}>{m.fullName}</option>
                            ))}
                        </select>
                     ) : (
                         <input 
                            type="text"
                            placeholder="Nome do Dirigente"
                            className={inputBaseClass}
                            value={meeting.conductor}
                            onChange={(e) => handleChange(meeting.id, 'conductor', e.target.value)}
                            onBlur={handleBlur}
                            readOnly={isReadOnly}
                        />
                     )}
                  </td>
                  {!isReadOnly && (
                      <td className="px-4 py-2 text-center align-middle print-hidden relative z-20">
                        <button 
                          type="button"
                          onClick={(e) => {
                             e.stopPropagation();
                             handleRequestDelete(meeting);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Excluir Linha"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                  )}
                </tr>
              ))}
              {localMeetings.length === 0 && (
                 <tr>
                     <td colSpan={isReadOnly ? 5 : 6} className="text-center py-8 text-slate-400 italic">
                         {isReadOnly ? "Nenhuma saída de campo programada." : "Clique em 'Adicionar Saída' para configurar a programação."}
                     </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeleteModalOpen && meetingToDelete && !isReadOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm print-hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="p-3 bg-red-100 rounded-full">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Tem certeza que deseja excluir esta saída de campo de <strong>{meetingToDelete.dayOfWeek}</strong> às <strong>{meetingToDelete.time}</strong>? 
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

export default FieldServiceRoster;