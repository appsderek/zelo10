import React, { useState } from 'react';
import { CleaningAssignment, Group } from '../types';
import { Plus, Trash2, Printer, Sparkles, AlertTriangle } from 'lucide-react';
import { handlePrint } from '../services/notificationService';

interface CleaningRosterProps {
  assignments: CleaningAssignment[];
  groups: Group[];
  onSaveAssignments: (newAssignments: CleaningAssignment[]) => void;
  globalObservations: string;
  onSaveGlobalObservations: (notes: string) => void;
  isReadOnly?: boolean;
}

const CleaningRoster: React.FC<CleaningRosterProps> = ({ 
  assignments, 
  groups, 
  onSaveAssignments,
  globalObservations,
  onSaveGlobalObservations,
  isReadOnly = false
}) => {
  const [localAssignments, setLocalAssignments] = useState<CleaningAssignment[]>(assignments);
  
  // Header Editable State
  const [headerTitle, setHeaderTitle] = useState('PROGRAMAÇÃO DE LIMPEZA E MANUTENÇÃO');
  const [headerSubtitle, setHeaderSubtitle] = useState('ESCALA DE GRUPOS');

  // Delete Modal State
  const [assignmentToDelete, setAssignmentToDelete] = useState<CleaningAssignment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleAddRow = () => {
    if(isReadOnly) return;
    const newAssignment: CleaningAssignment = {
      id: crypto.randomUUID(),
      date: '',
      groupId: groups.length > 0 ? groups[0].name : '',
      observations: ''
    };
    const updated = [...localAssignments, newAssignment];
    setLocalAssignments(updated);
    onSaveAssignments(updated);
  };

  const handleChange = (id: string, field: keyof CleaningAssignment, value: string) => {
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

  const handleRequestDelete = (assignment: CleaningAssignment) => {
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

  // Cores fixas para grupos
  const getGroupColor = (groupName: string) => {
    if (!groupName) return 'bg-transparent text-slate-700';
    
    // Paleta de cores baseada no índice do grupo
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
    ];

    let hash = 0;
    for (let i = 0; i < groupName.length; i++) {
      hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
          <h2 className="text-2xl font-bold text-slate-800">Limpeza do Salão</h2>
          <p className="text-slate-500">Escala de grupos para manutenção do salão.</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px] printable-content p-8">
        
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

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-purple-50 border-b-2 border-slate-800 text-slate-900 uppercase">
                <th className="px-6 py-4 font-black w-48 text-base">Data</th>
                <th className="px-6 py-4 font-black text-base">Grupo Responsável</th>
                {!isReadOnly && <th className="px-6 py-4 font-bold w-16 text-center print-hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 align-middle">
                    <input 
                      type="date" 
                      className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none font-bold text-slate-800 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                      value={assignment.date}
                      onChange={(e) => handleChange(assignment.id, 'date', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <select 
                      className={`w-full border border-transparent rounded px-3 py-2 outline-none font-bold transition-colors appearance-none text-base ${getGroupColor(assignment.groupId)} ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 cursor-pointer' : ''}`}
                      value={assignment.groupId}
                      onChange={(e) => handleChange(assignment.id, 'groupId', e.target.value)}
                      onBlur={handleBlur}
                      disabled={isReadOnly}
                    >
                        <option value="" className="bg-white text-slate-500">Selecione um grupo...</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.name} className="bg-white text-slate-800 font-medium">
                              {g.name}
                            </option>
                        ))}
                    </select>
                  </td>
                  {!isReadOnly && (
                      <td className="px-6 py-3 text-center align-middle print-hidden relative z-20">
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
                     <td colSpan={isReadOnly ? 2 : 3} className="text-center py-12 text-slate-400 italic">
                         <div className="flex flex-col items-center gap-2">
                             <Sparkles size={24} className="opacity-50" />
                             <p>{isReadOnly ? "Nenhuma limpeza programada." : "Clique em 'Adicionar Data' para programar a limpeza."}</p>
                         </div>
                     </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t-2 border-slate-800 p-6 bg-slate-50 print-notes-section mt-4">
            <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wide">
                Observações Gerais / Instruções
            </label>
            <textarea 
                rows={4}
                className={`w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-700 resize-none shadow-sm ${!isReadOnly ? 'focus:outline-none focus:ring-2 focus:ring-purple-500' : ''}`}
                placeholder={isReadOnly ? "Nenhuma observação." : "Escreva aqui as instruções de limpeza, lembretes para os grupos ou procedimentos..."}
                value={globalObservations}
                onChange={(e) => onSaveGlobalObservations(e.target.value)}
                readOnly={isReadOnly}
            />
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
               Tem certeza que deseja excluir a designação de limpeza para o grupo <strong>{assignmentToDelete.groupId || 'Não definido'}</strong> na data <strong>{assignmentToDelete.date ? new Date(assignmentToDelete.date).toLocaleDateString('pt-BR') : 'Não definida'}</strong>? 
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

export default CleaningRoster;