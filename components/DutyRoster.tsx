
import React, { useState } from 'react';
import { DutyAssignment, Member } from '../types';
import { Plus, Trash2, Printer, AlertTriangle, Calendar, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // --- PDF GENERATION LOGIC ---
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Configurações de Fonte
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    
    // 2. Cabeçalho Centralizado
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(headerTitle.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(headerSubtitle.toUpperCase(), pageWidth / 2, 28, { align: 'center' });

    // 3. Preparar Dados da Tabela
    const tableColumn = ["Data", "Indicadores", "Mic. Volantes", "Áudio/Vídeo"];
    const tableRows = sortedAssignments.map(item => [
      item.date ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-',
      item.attendants,
      item.microphones,
      item.soundVideo
    ]);

    // 4. Gerar Tabela (AutoTable)
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
        fontSize: 10,
        cellPadding: 4,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }, // Data
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' }
      },
      styles: {
        overflow: 'linebreak', // Quebra de linha automática
      }
    });

    // 5. Rodapé
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado pelo sistema Z-Elo em ${new Date().toLocaleDateString('pt-BR')}`, 14, doc.internal.pageSize.getHeight() - 10);

    // 6. Salvar Arquivo
    doc.save('designacoes_apoio.pdf');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Designações de Apoio</h2>
          <p className="text-slate-500">Indicadores, Microfones e Áudio/Vídeo.</p>
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

      {/* --- TABELA DE TELA (Interativa) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-8">
        
        {/* Cabeçalho Editável (Apenas para configurar o título do PDF) */}
        <div className="mb-8 border-b-2 border-slate-800 pb-4 text-center">
            <input 
                type="text" 
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="w-full text-center text-3xl font-black text-slate-900 uppercase bg-transparent border-none focus:ring-0 p-0 mb-2 placeholder:text-slate-300"
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
                <th className="px-4 py-3 font-black min-w-[150px] text-base whitespace-nowrap">Data</th>
                <th className="px-4 py-3 font-black min-w-[200px] text-base whitespace-nowrap">Indicadores</th>
                <th className="px-4 py-3 font-black min-w-[200px] text-base whitespace-nowrap">Mic. Volantes</th>
                <th className="px-4 py-3 font-black min-w-[200px] text-base whitespace-nowrap">Operadores A/V</th>
                {!isReadOnly && <th className="px-4 py-3 font-bold w-16 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 align-top">
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
                  <td className="px-4 py-3 align-top">
                    <textarea 
                      rows={2}
                      placeholder={isReadOnly ? "" : "Irmão A, Irmão B..."}
                      className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none resize-none font-medium text-slate-700 placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white' : ''}`}
                      value={assignment.attendants}
                      onChange={(e) => handleChange(assignment.id, 'attendants', e.target.value)}
                      onBlur={handleBlur}
                      readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <textarea 
                       rows={2}
                       placeholder={isReadOnly ? "" : "Irmão C, Irmão D..."}
                       className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none resize-none font-medium text-slate-700 placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white' : ''}`}
                       value={assignment.microphones}
                       onChange={(e) => handleChange(assignment.id, 'microphones', e.target.value)}
                       onBlur={handleBlur}
                       readOnly={isReadOnly}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <textarea 
                       rows={2}
                       placeholder={isReadOnly ? "" : "Som: Irmão E..."}
                       className={`w-full bg-transparent border border-transparent rounded px-2 py-1 outline-none resize-none font-medium text-slate-700 placeholder:text-slate-300 ${!isReadOnly ? 'hover:border-slate-300 focus:border-purple-500 focus:bg-white' : ''}`}
                       value={assignment.soundVideo}
                       onChange={(e) => handleChange(assignment.id, 'soundVideo', e.target.value)}
                       onBlur={handleBlur}
                       readOnly={isReadOnly}
                    />
                  </td>
                  {!isReadOnly && (
                      <td className="px-4 py-3 text-center align-middle relative z-20">
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
                     <td colSpan={5} className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200 m-4">
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
