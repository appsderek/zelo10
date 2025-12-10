import React, { useState } from 'react';
import { Member, WeekSchedule, DutyAssignment, ChairmanReaderAssignment, ServiceReport, PioneerStatus, Group } from '../types';
import { User, Calendar, CheckCircle2, XCircle, Clock, BookOpenCheck, CalendarCheck, ShieldCheck, Send, AlertTriangle } from 'lucide-react';

interface PublisherDashboardProps {
  member: Member;
  schedules: WeekSchedule[];
  duties: DutyAssignment[];
  chairmanReaders: ChairmanReaderAssignment[];
  reports: ServiceReport[];
  onSaveReport: (report: ServiceReport) => void;
  groups: Group[];
}

const PublisherDashboard: React.FC<PublisherDashboardProps> = ({ member, schedules, duties, chairmanReaders, reports, onSaveReport, groups }) => {
  const today = new Date();
  
  // Calcula o mês passado (que é o mês do relatório)
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const reportMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const reportMonthDisplay = lastMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Verifica se já enviou
  const existingReport = reports.find(r => r.memberId === member.id && r.month === reportMonth);
  const isPioneer = member.pioneerStatus !== PioneerStatus.NONE;

  // Estado do Formulário
  const [participated, setParticipated] = useState(true);
  const [hours, setHours] = useState('');
  const [studies, setStudies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar Designações Futuras
  const todayStr = today.toISOString().slice(0, 10);
  
  const myAssignments: { date: string, type: string, description: string }[] = [];

  // 1. Vida e Ministério
  schedules.forEach(s => {
      if (s.date >= todayStr) {
          if (s.chairman === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: 'Presidente da Reunião' });
          if (s.auxClassCounselor === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: 'Conselheiro Sala B' });
          if (s.openingPrayer === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: 'Oração Inicial' });
          if (s.closingPrayer === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: 'Oração Final' });
          if (s.congregationStudy.conductor === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: 'Dirigente Estudo Bíblico' });
          if (s.congregationStudy.reader === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: 'Leitor Estudo Bíblico' });

          s.treasuresParts.forEach(p => {
              if (p.assignedTo === member.fullName || p.assignedToB === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: p.theme });
          });
          s.ministryParts.forEach(p => {
              if (p.assignedTo === member.fullName || p.assignedToB === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: `Estudante: ${p.theme}` });
              if (p.assistant === member.fullName || p.assistantB === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: `Ajudante: ${p.theme}` });
          });
          s.livingParts.forEach(p => {
              if (p.assignedTo === member.fullName) myAssignments.push({ date: s.date, type: 'Vida e Ministério', description: p.theme });
          });
      }
  });

  // 2. Presidentes e Leitores
  chairmanReaders.forEach(c => {
      if (c.date >= todayStr) {
          if (c.chairman === member.fullName) myAssignments.push({ date: c.date, type: 'Fim de Semana', description: 'Presidente da Reunião' });
          if (c.reader === member.fullName) myAssignments.push({ date: c.date, type: 'Fim de Semana', description: 'Leitor de A Sentinela' });
      }
  });

  // 3. Designações de Apoio (Busca textual simples)
  duties.forEach(d => {
      if (d.date >= todayStr) {
          if (d.attendants.includes(member.fullName)) myAssignments.push({ date: d.date, type: 'Apoio', description: 'Indicador' });
          if (d.microphones.includes(member.fullName)) myAssignments.push({ date: d.date, type: 'Apoio', description: 'Microfone Volante' });
          if (d.soundVideo.includes(member.fullName)) myAssignments.push({ date: d.date, type: 'Apoio', description: 'Áudio e Vídeo' });
      }
  });

  // Ordenar
  myAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Handle Submit
  const handleSubmitReport = () => {
    setIsSubmitting(true);

    const newReport: ServiceReport = {
        id: `${reportMonth}-${member.id}`,
        month: reportMonth,
        memberId: member.id,
        participated: participated,
        hours: participated && isPioneer ? parseInt(hours) || 0 : 0,
        bibleStudies: participated && isPioneer ? parseInt(studies) || 0 : 0,
        remarks: 'Enviado via Painel do Publicador'
    };

    onSaveReport(newReport);
    
    setTimeout(() => {
        setIsSubmitting(false);
    }, 1000);
  };

  // Nome do Secretário para exibição fixa
  const overseerName = 'Cristiano Santos (Secretário)';

  return (
    <div className="space-y-6">
      <div>
         <h2 className="text-3xl font-bold text-white mb-2">Meu Painel</h2>
         <p className="text-purple-200">Bem-vindo, {member.fullName}.</p>
      </div>

      {/* MÓDULO DE RELATÓRIO DESTACADO */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl shadow-xl overflow-hidden border border-white/20 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
              <Send size={150} className="text-white" />
          </div>
          
          <div className="p-6 md:p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <CalendarCheck size={32} className="text-white" />
                  </div>
                  <div>
                      <h3 className="text-2xl font-bold text-white">Enviar Relatório</h3>
                      <p className="text-purple-200 text-sm">Referente ao mês de <strong className="text-white uppercase">{reportMonthDisplay}</strong></p>
                  </div>
              </div>

              {existingReport ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 flex flex-col items-center justify-center text-center animate-fade-in">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-900/20">
                          <CheckCircle2 size={40} className="text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-1">Relatório Enviado!</h4>
                      <p className="text-purple-200 text-sm mb-4">
                          Enviado para: <strong>{overseerName}</strong>
                      </p>
                      <div className="flex gap-4 text-sm text-white/80 bg-black/20 px-6 py-2 rounded-lg">
                          <span>Horas: <strong>{existingReport.hours}</strong></span>
                          <span>|</span>
                          <span>Estudos: <strong>{existingReport.bibleStudies}</strong></span>
                      </div>
                  </div>
              ) : (
                  <div className="bg-white rounded-xl p-6 shadow-lg text-slate-800 animate-fade-in">
                      <div className="mb-6">
                          <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                              <input 
                                  type="checkbox" 
                                  className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                                  checked={participated}
                                  onChange={(e) => setParticipated(e.target.checked)}
                              />
                              <div>
                                  <span className="block font-bold text-lg text-slate-800">Participei no Ministério?</span>
                                  <span className="text-sm text-slate-500">Marque se você participou na pregação este mês.</span>
                              </div>
                          </label>
                      </div>

                      {/* Campos para PIONEIROS (Só aparecem se for pioneiro E participou) */}
                      {isPioneer && participated && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in">
                              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                  <label className="block text-sm font-bold text-purple-800 uppercase mb-2">Total de Horas</label>
                                  <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg p-2">
                                      <Clock className="text-purple-400" />
                                      <input 
                                          type="number" 
                                          min="0"
                                          placeholder="0"
                                          className="w-full outline-none text-lg font-bold text-purple-900"
                                          value={hours}
                                          onChange={(e) => setHours(e.target.value)}
                                      />
                                  </div>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                  <label className="block text-sm font-bold text-blue-800 uppercase mb-2">Estudos Bíblicos</label>
                                  <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg p-2">
                                      <BookOpenCheck className="text-blue-400" />
                                      <input 
                                          type="number" 
                                          min="0"
                                          placeholder="0"
                                          className="w-full outline-none text-lg font-bold text-blue-900"
                                          value={studies}
                                          onChange={(e) => setStudies(e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      {!isPioneer && participated && (
                          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl border border-green-100 flex items-center gap-2">
                              <CheckCircle2 size={20} />
                              <p className="font-medium">Obrigado por sua participação no campo!</p>
                          </div>
                      )}

                      <button 
                          onClick={handleSubmitReport}
                          disabled={isSubmitting}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 text-lg"
                      >
                          {isSubmitting ? (
                              <span>Enviando...</span>
                          ) : (
                              <>
                                  <Send size={24} /> Enviar Relatório
                              </>
                          )}
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-3">
                          O relatório será enviado diretamente para <strong>{overseerName}</strong>.
                      </p>
                  </div>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARTÃO DO PUBLICADOR */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="text-purple-600" /> Meus Dados
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Grupo</span>
                    <span className="font-bold text-slate-800">{member.serviceGroup}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Privilégio</span>
                    <span className="font-bold text-slate-800">{member.privilege}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Pioneiro</span>
                    <span className="font-bold text-slate-800">{member.pioneerStatus}</span>
                </div>
            </div>
        </div>

        {/* PRÓXIMAS DESIGNAÇÕES */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
           <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpenCheck className="text-purple-600" /> Minhas Próximas Designações
           </h3>

           {myAssignments.length > 0 ? (
               <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {myAssignments.map((assign, idx) => (
                       <div key={idx} className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                           <div className="bg-white p-2 rounded-md shadow-sm text-center min-w-[60px]">
                               <span className="block text-xs text-purple-600 font-bold uppercase">
                                 {new Date(assign.date).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')}
                               </span>
                               <span className="block text-xl font-bold text-slate-800">
                                 {new Date(assign.date).getUTCDate()}
                               </span>
                           </div>
                           <div>
                               <h4 className="font-bold text-slate-800">{assign.description}</h4>
                               <p className="text-sm text-purple-600 flex items-center gap-1">
                                   <ShieldCheck size={14} /> {assign.type}
                               </p>
                           </div>
                       </div>
                   ))}
               </div>
           ) : (
               <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                   <p>Nenhuma designação encontrada para os próximos dias.</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PublisherDashboard;