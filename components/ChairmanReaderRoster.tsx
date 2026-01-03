
import React, { useState } from 'react';
import { ChairmanReaderAssignment } from '../types';
import { Plus, Trash2, Printer, AlertTriangle, Calendar, FileDown } from 'lucide-react';
import { Member } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // --- PDF GENERATION LOGIC ---
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Configurações de Fonte e Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(headerTitle.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(headerSubtitle.toUpperCase(), pageWidth / 2, 28, { align: 'center' });

    // 2. Preparar Dados da Tabela
    const tableColumn = ["Data", "Presidente da Reunião", "Leitor de A Sentinela"];
    const tableRows = sortedAssignments.map(item => [
      item.date ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-',
      item.chairman,
      item.reader
    ]);

    // 3. Gerar Tabela (AutoTable)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { 
        fillColor: [88, 28, 135], // Roxo Z-Elo
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: 50,
        fontSize: 12,
        cellPadding: 5,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }, // Data
        1: { cellWidth: 'auto' }, // Presidente
        2: { cellWidth: 'auto' }  // Leitor
      },
      styles: {
        overflow: 'linebreak',
      }
    });

    // 4. Rodapé
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado pelo sistema Z-Elo em ${new Date().toLocaleDateString('pt-BR')}`, 14, doc.internal.pageSize.getHeight() - 10);

    // 5. Salvar Arquivo
    doc.save('presidentes_leitores.pdf');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Presidentes e Leitores</h2>
          <p className="text-slate-500">Escala para reuniões de fim de semana.</p>
        </div>
        <div className="flex gap-3">
            <button 
                type="button"
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium transition-colors cursor-pointer shadow-sm"
            >
                <FileDown size={18} /> Baixar PDF
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

      {/* --- LAYOUT DE TELA (Interativo) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-8">
        
        {/* Cabeçalho Editável (Tela - Configura Título do PDF) */}
        <div className="mb-8 border-b-2 border-slate-800 pb-4 text-center">
            <input 
                type="text" 
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="w-full text-center text-3xl font-black text-slate-900 uppercase bg-transparent border-none focus:ring-0 p-0 mb-1 placeholder:text-slate-300"
                placeholder="TÍTULO DO PDF"
            />
            <input 
                type="text" 
                value={headerSubtitle}
                onChange={(e) => setHeaderSubtitle(e.target.value)}
                className="w-full text-center text-lg font-bold text-slate-600 uppercase bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
                placeholder="SUBTÍTULO DO PDF"
            />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-purple-50 border-b-2 border-slate-800 text-slate-900 uppercase">
                <th className="px-6 py-4 font-black min-w-[150px] text-base whitespace-nowrap">Data</th>
                <th className="px-6 py-4 font-black min-w-[200px] text-base whitespace-nowrap">Presidente</th>
                <th className="px-6 py-4 font-black min-w-[200px] text-base whitespace-nowrap">Leitor</th>
                {!isReadOnly && <th className="px-6 py-4 font-bold w-16 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 align-top">
                    {/* Componente de Data Inteligente */}
                    <div className="relative w-full">
                        <div className={`flex items-center gap-2 py-2 px-1 font-bold text-base border-b border-transparent ${!isReadOnly ? 'group-hover:border-purple-300' : ''} transition-colors ${!assignment.date ? 'text-slate-400 italic font-normal' : 'text-slate-800'}`}>
                            <Calendar size={16} className={`${!assignment.date ? 'opacity-50' : 'text-purple-600'}`} />
                            {assignment.date 
                                ? new Date(assignment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                                : 'Selecionar Data'}
                        </div>
                        {!isReadOnly && (
                            <input 
                                type="date" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                value={assignment.date}
                                onChange={(e) => handleChange(assignment.id, 'date', e.target.value)}
                                onBlur={handleBlur}
                            />
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-3 align-top">
                    {members && members.length > 0 ? (
                        <select
                            className={`w-full bg-transparent border border-transparent rounded px-2 py-2 outline-none font-medium text-slate-700 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white cursor-pointer' : ''}`}
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
                        className={`w-full bg-transparent border border-transparent rounded px-2 py-2 outline-none text-base placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white' : ''}`}
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
                            className={`w-full bg-transparent border border-transparent rounded px-2 py-2 outline-none font-medium text-slate-700 text-base ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white cursor-pointer' : ''}`}
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
                        className={`w-full bg-transparent border border-transparent rounded px-2 py-2 outline-none text-base placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white' : ''}`}
                        value={assignment.reader}
                        onChange={(e) => handleChange(assignment.id, 'reader', e.target.value)}
                        onBlur={handleBlur}
                        readOnly={isReadOnly}
                        />
                    )}
                  </td>
                  {!isReadOnly && (
                      <td className="px-6 py-3 text-center align-middle relative z-20">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDelete(assignment);
                          }}
                          className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 cursor-pointer"
                          title="Excluir Linha"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                  )}
                </tr>
              ))}
              {localAssignments.length === 0 && (
                 <tr>
                     <td colSpan={4} className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200 m-4">
                         {isReadOnly ? "Nenhuma designação definida." : "Clique em 'Adicionar Data' acima para começar a lista."}
                     </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && assignmentToDelete && !isReadOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
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
