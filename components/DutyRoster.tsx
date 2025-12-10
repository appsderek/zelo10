import React, { useState } from 'react';
import { DutyAssignment, Member } from '../types';
import { Plus, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { handlePrint } from '../services/notificationService';

interface DutyRosterProps {
  assignments: DutyAssignment[];
  members: Member[];
  onSaveAssignments: (newAssignments: DutyAssignment[]) => void;
  isReadOnly?: boolean;
}

const DutyRoster: React.FC<DutyRosterProps> = ({ assignments, members, onSaveAssignments, isReadOnly = false }) => {
  const [localAssignments, setLocalAssignments] = useState<DutyAssignment[]>(assignments);

  // Header Editable State
  const [headerTitle, setHeaderTitle] = useState('DESIGNAÇÕES DE APOIO');
  const [headerSubtitle, setHeaderSubtitle] = useState('INDICADORES, MICROFONES E ÁUDIO/VÍDEO');

  // Delete Modal State
  const [assignmentToDelete, setAssignmentToDelete] = useState<DutyAssignment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleAddRow = () => {
    if(isReadOnly) return;
    const newAssignment: DutyAssignment = {
      id: crypto.randomUUID(),
      date: '',
      attendants: '',
      microphones: '',
      soundVideo: ''
    };
    const updated = [...localAssignments, newAssignment];
    setLocalAssignments(updated);
    onSaveAssignments(updated);
  };

  const handleChange = (id: string, field: keyof DutyAssignment, value: string) => {
    if(isReadOnly) return;
    const updated = localAssignments.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    );
    setLocalAssignments(updated);
  };

  const handleBlur = () => {
    if(isReadOnly) return;
    onSaveAssignments(localAssignments);
  };

  const handleRequestDelete = (assignment: DutyAssignment) => {
    if(isReadOnly) return;
    setAssignmentToDelete(assignment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (assignmentToDelete) {
      const updated = localAssignments.filter(a => a.id !== assignmentToDelete.id);
      setLocalAssignments(updated);
      onSaveAssignments(updated);
      setIsDeleteModalOpen(false);
      setAssignmentToDelete(null);
    }
  };

  // Ordenar por data
  const sortedAssignments = [...localAssignments].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Designações de Apoio</h2>
          <p className="text-slate-500">Indicadores, Microfones e Áudio/Vídeo.</p>
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
                    <Plus size={18} /> Adicionar Data
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden printable-content p-8">
        
        {/* CABEÇALHO EDITÁVEL */}
        <div className="mb-8 border-b-2 border-slate-800 pb-4 text-center">
            <input 
                type="text" 
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="w-full text-center text-3xl font-black text-slate-900 uppercase bg-transparent border-none focus:ring-0 p-0 mb-2 placeholder:text-slate-300"
            />
            <input 
                type="text" 
                value={headerSubtitle}
                onChange={(e) => setHeaderSubtitle(e.target.value)}
                className="w-full text-center text-lg font-bold text-slate-600 uppercase bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
            />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-purple-50 border-b-2 border-slate-800 text-slate-900 uppercase">
                <th className="px-4 py-3 font-black w-40 text-base">Data</th>
                <th className="px-4 py-3 font-black text-base">Indicadores</th>
                <th className="px-4 py-3 font-black text-base">Mic. Volantes</th>
                <th className="px-4 py-3 font-black text-base">Operadores A/V</th>
                {!isReadOnly && <th className="px-4 py-3 font-bold w-16 text-center print-hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 align-top">
                    <input 
                      type="date" 
                      className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none font-bold text-slate-800 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                      value={assignment.date}
                      onChange={(e) => handleChange(assignment.id, 'date', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <textarea 
                      rows={2}
                      placeholder={isReadOnly ? "" : "Irmão A, Irmão B..."}
                      className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none resize-none font-medium placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                      value={assignment.attendants}
                      onChange={(e) => handleChange(assignment.id, 'attendants', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <textarea 
                       rows={2}
                       placeholder={isReadOnly ? "" : "Irmão C, Irmão D..."}
                       className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none resize-none font-medium placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                       value={assignment.microphones}
                       onChange={(e) => handleChange(assignment.id, 'microphones', e.target.value)}
                       onBlur={handleBlur}
                       readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <textarea 
                       rows={2}
                       placeholder={isReadOnly ? "" : "Som: Irmão E..."}
                       className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none resize-none font-medium placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                       value={assignment.soundVideo}
                       onChange={(e) => handleChange(assignment.id, 'soundVideo', e.target.value)}
                       onBlur={handleBlur}
                       readOnly={isReadOnly}
                    />
                  </td>
                  {!isReadOnly && (
                      <td className="px-4 py-2 text-center align-middle print-hidden relative z-20">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDelete(assignment);
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
              {localAssignments.length === 0 && (
                 <tr>
                     <td colSpan={isReadOnly ? 4 : 5} className="text-center py-8 text-slate-400 italic">
                         {isReadOnly ? "Nenhuma designação." : "Clique em 'Adicionar Data' para começar a lista."}
                     </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && assignmentToDelete && !isReadOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm print-hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="p-3 bg-red-100 rounded-full">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Tem certeza que deseja excluir as designações de apoio da data <strong>{assignmentToDelete.date ? new Date(assignmentToDelete.date).toLocaleDateString('pt-BR') : 'Não definida'}</strong>? 
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

export default DutyRoster;