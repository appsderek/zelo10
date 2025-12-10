import React, { useState } from 'react';
import { ChairmanReaderAssignment } from '../types';
import { Plus, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { handlePrint } from '../services/notificationService';

// Importando Member type para usar no Select
import { Member } from '../types';

interface ChairmanReaderRosterProps {
  assignments: ChairmanReaderAssignment[];
  onSaveAssignments: (newAssignments: ChairmanReaderAssignment[]) => void;
  isReadOnly?: boolean;
  members?: Member[]; 
}

const ChairmanReaderRoster: React.FC<ChairmanReaderRosterProps & { members?: Member[] }> = ({ assignments, onSaveAssignments, isReadOnly = false, members = [] }) => {
  const [localAssignments, setLocalAssignments] = useState<ChairmanReaderAssignment[]>(assignments);

  // Header Editable State
  const [headerTitle, setHeaderTitle] = useState('PRESIDENTES E LEITORES');
  const [headerSubtitle, setHeaderSubtitle] = useState('PROGRAMAÇÃO MENSAL');

  // Delete Modal State
  const [assignmentToDelete, setAssignmentToDelete] = useState<ChairmanReaderAssignment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Ordena membros para o Select
  const sortedMembers = [...(members || [])].sort((a, b) => a.fullName.localeCompare(b.fullName));

  const handleAddRow = () => {
    if(isReadOnly) return;
    const newAssignment: ChairmanReaderAssignment = {
      id: crypto.randomUUID(),
      date: '',
      chairman: '',
      reader: ''
    };
    const updated = [...localAssignments, newAssignment];
    setLocalAssignments(updated);
    onSaveAssignments(updated);
  };

  const handleChange = (id: string, field: keyof ChairmanReaderAssignment, value: string) => {
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

  const handleRequestDelete = (assignment: ChairmanReaderAssignment) => {
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
          <h2 className="text-2xl font-bold text-slate-800">Presidentes e Leitores</h2>
          <p className="text-slate-500">Escala para reuniões de fim de semana.</p>
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
                placeholder="TÍTULO DO RELATÓRIO"
            />
            <input 
                type="text" 
                value={headerSubtitle}
                onChange={(e) => setHeaderSubtitle(e.target.value)}
                className="w-full text-center text-lg font-bold text-slate-600 uppercase bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
                placeholder="SUBTÍTULO / MÊS / ANO"
            />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="printable-roster">
            <thead>
              <tr className="bg-purple-50 border-b-2 border-slate-800 text-slate-900 uppercase">
                <th className="px-6 py-4 font-black w-48 text-base">Data</th>
                <th className="px-6 py-4 font-black text-base">Presidente</th>
                <th className="px-6 py-4 font-black text-base">Leitor</th>
                {!isReadOnly && <th className="px-6 py-4 font-bold w-16 text-center print-hidden">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 align-top">
                    <input 
                      type="date" 
                      className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none font-bold text-slate-800 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                      value={assignment.date}
                      onChange={(e) => handleChange(assignment.id, 'date', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-6 py-3 align-top">
                    {members && members.length > 0 ? (
                        <select
                            className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none font-medium text-slate-700 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                            value={assignment.chairman}
                            onChange={(e) => handleChange(assignment.id, 'chairman', e.target.value)}
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
                        placeholder="Nome do Presidente"
                        className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none text-base placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                        value={assignment.chairman}
                        onChange={(e) => handleChange(assignment.id, 'chairman', e.target.value)}
                        onBlur={handleBlur}
                        readOnly={isReadOnly}
                        />
                    )}
                  </td>
                  <td className="px-6 py-3 align-top">
                    {members && members.length > 0 ? (
                        <select
                            className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none font-medium text-slate-700 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                            value={assignment.reader}
                            onChange={(e) => handleChange(assignment.id, 'reader', e.target.value)}
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
                        placeholder="Nome do Leitor"
                        className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none text-base placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500' : ''}`}
                        value={assignment.reader}
                        onChange={(e) => handleChange(assignment.id, 'reader', e.target.value)}
                        onBlur={handleBlur}
                        readOnly={isReadOnly}
                        />
                    )}
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
                     <td colSpan={isReadOnly ? 3 : 4} className="text-center py-8 text-slate-400 italic">
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
               Tem certeza que deseja excluir a designação de <strong>{assignmentToDelete.date ? new Date(assignmentToDelete.date).toLocaleDateString('pt-BR') : 'Data não definida'}</strong>? 
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

export default ChairmanReaderRoster;