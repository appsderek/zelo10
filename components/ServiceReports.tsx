import React, { useState, useEffect, useMemo } from 'react';
import { Member, Group, ServiceReport, PioneerStatus, MemberStatus } from '../types';
import { Save, Calendar, CheckCircle2, Circle, Clock, BookOpenCheck, BarChart3, ListChecks, PieChart, AlertTriangle, Filter, XCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';

interface ServiceReportsProps {
  members: Member[];
  groups: Group[];
  reports: ServiceReport[];
  onSaveReports: (newReports: ServiceReport[]) => void;
  isReadOnly?: boolean;
}

const ServiceReports: React.FC<ServiceReportsProps> = ({ members, groups, reports, onSaveReports, isReadOnly = false }) => {
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [viewMode, setViewMode] = useState<'input' | 'analytics'>('input');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [localReports, setLocalReports] = useState<Record<string, ServiceReport>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [filterPending, setFilterPending] = useState(false);

  // Analytics State
  const [filterStart, setFilterStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterEnd, setFilterEnd] = useState(getCurrentMonth());

  useEffect(() => {
    const monthReports = reports.filter(r => r.month === selectedMonth);
    const reportsMap: Record<string, ServiceReport> = {};
    monthReports.forEach(report => {
      reportsMap[report.memberId] = report;
    });
    setLocalReports(reportsMap);
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
  }, [selectedMonth, reports]);

  const handleInputChange = (memberId: string, field: keyof ServiceReport, value: any) => {
    if(isReadOnly) return;
    setLocalReports(prev => {
      const existing = prev[memberId] || {
        id: `${selectedMonth}-${memberId}`,
        month: selectedMonth,
        memberId,
        participated: false,
        hours: 0,
        bibleStudies: 0
      };
      return { ...prev, [memberId]: { ...existing, [field]: value } };
    });
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    if(isReadOnly) return;
    setSaveStatus('saving');
    const reportsToSave = Object.values(localReports);
    onSaveReports(reportsToSave);
    setTimeout(() => {
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const chartData = useMemo(() => {
    const data = [];
    let current = new Date(filterStart + '-01'); 
    const end = new Date(filterEnd + '-01');

    while (current <= end) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthReports = reports.filter(r => r.month === monthStr);
      
      let participatedCount = 0;
      let regularPioneersCount = 0;
      let auxPioneersCount = 0;
      let publishersCount = 0;
      let totalStudies = 0;
      let totalPioneerHours = 0;

      members.forEach(member => {
        const report = monthReports.find(r => r.memberId === member.id);
        const didParticipate = report?.participated || false;

        if (didParticipate) {
          participatedCount++;
          if (member.pioneerStatus === PioneerStatus.REGULAR) {
            regularPioneersCount++;
            totalPioneerHours += (report?.hours || 0);
          } else if (member.pioneerStatus === PioneerStatus.AUXILIARY) {
            auxPioneersCount++;
            totalPioneerHours += (report?.hours || 0);
          } else {
            publishersCount++;
          }
          totalStudies += (report?.bibleStudies || 0);
        }
      });

      const notParticipated = members.length - participatedCount;
      data.push({
        month: monthStr,
        displayDate: new Date(current.getFullYear(), current.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        participated: participatedCount,
        notParticipated: notParticipated < 0 ? 0 : notParticipated,
        regularPioneers: regularPioneersCount,
        auxPioneers: auxPioneersCount,
        publishers: publishersCount,
        bibleStudies: totalStudies,
        pioneerHours: totalPioneerHours,
        totalMembers: members.length
      });
      current.setMonth(current.getMonth() + 1);
    }
    return data;
  }, [filterStart, filterEnd, reports, members]);

  const getPioneerBadge = (status: PioneerStatus) => {
    if (status === PioneerStatus.REGULAR) return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium border border-purple-200">Regular</span>;
    if (status === PioneerStatus.AUXILIARY) return <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium border border-pink-200">Auxiliar</span>;
    return null;
  };

  const membersByGroup = groups.map(group => ({
    group,
    members: members.filter(m => m.serviceGroup === group.name)
  })).filter(g => g.members.length > 0);

  const membersNoGroup = members.filter(m => !groups.some(g => g.name === m.serviceGroup));
  if (membersNoGroup.length > 0) {
    membersByGroup.push({
      group: { id: 'ungrouped', name: 'Sem Grupo', overseer: '-', assistant: '-' },
      members: membersNoGroup
    });
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 sticky top-0 z-20">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Relatórios de Campo
          </h2>
          <p className="text-slate-500 text-sm">Gerenciamento e Análise de Atividade</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setViewMode('input')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'input' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <ListChecks size={18} /> Lançamento
          </button>
          <button onClick={() => setViewMode('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'analytics' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <BarChart3 size={18} /> Análise
          </button>
        </div>
      </div>

      {viewMode === 'input' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
             <div className="p-1 bg-amber-100 rounded-full text-amber-600">
               <AlertTriangle size={20} />
             </div>
             <div>
               <h4 className="font-bold text-amber-900">Lembrete de Prazo</h4>
               <p className="text-sm text-amber-800 mt-1">
                 Os relatórios referem-se ao mês anterior. Prazo: dia <strong>15</strong>.
               </p>
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium whitespace-nowrap">Mês:</span>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-purple-900 font-medium outline-none"
                />
              </div>
              <button 
                onClick={() => setFilterPending(!filterPending)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${filterPending ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                {filterPending ? <XCircle size={18} /> : <Filter size={18} />}
                {filterPending ? 'Mostrar Todos' : 'Filtrar Pendentes'}
              </button>
            </div>

            {!isReadOnly && (
              <button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm w-full md:w-auto justify-center ${hasUnsavedChanges ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {saveStatus === 'saved' ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {saveStatus === 'saved' ? 'Salvo!' : 'Salvar Alterações'}
              </button>
            )}
          </div>

          <div className="space-y-8">
            {membersByGroup.map(({ group, members }) => {
              const filteredMembers = members.filter(member => {
                if (!filterPending) return true;
                const report = localReports[member.id];
                return !report || !report.participated;
              });

              if (filterPending && filteredMembers.length === 0) return null;

              return (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">{group.name}</h3>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:block">
                        {group.overseer && `Dirigente: ${group.overseer}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {filteredMembers.map(member => {
                      const report = localReports[member.id] || { participated: false, hours: 0, bibleStudies: 0 };
                      const isPioneer = member.pioneerStatus !== PioneerStatus.NONE;

                      return (
                        <div key={member.id} className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${report.participated ? 'bg-purple-50/30' : 'hover:bg-slate-50'}`}>
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-800">{member.fullName}</span>
                              {getPioneerBadge(member.pioneerStatus)}
                            </div>
                            <span className="text-xs text-slate-400">{member.privilege}</span>
                          </div>

                          <div className="flex items-center gap-6 w-full md:w-auto">
                            {!isPioneer ? (
                              <label className={`flex items-center gap-3 cursor-pointer px-4 py-2 rounded-lg border transition-all select-none w-full md:w-auto justify-center ${report.participated ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'} ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={report.participated}
                                  disabled={isReadOnly}
                                  onChange={(e) => handleInputChange(member.id, 'participated', e.target.checked)}
                                />
                                {report.participated ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                <span className="font-medium">Participou</span>
                              </label>
                            ) : (
                              <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
                                <label className={`flex items-center gap-2 cursor-pointer mr-2 ${isReadOnly ? 'pointer-events-none' : ''}`}>
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                                      checked={report.participated}
                                      disabled={isReadOnly}
                                      onChange={(e) => handleInputChange(member.id, 'participated', e.target.checked)}
                                    />
                                    <span className="text-sm text-slate-600 md:hidden lg:inline">Participou</span>
                                </label>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                    <Clock size={16} className="text-purple-400" />
                                    <input 
                                      type="number" 
                                      placeholder="Hs" 
                                      min="0"
                                      disabled={isReadOnly}
                                      className="w-16 text-sm outline-none text-slate-700 placeholder:text-slate-300 font-medium bg-transparent"
                                      value={report.hours || ''}
                                      onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                                        handleInputChange(member.id, 'hours', val);
                                        if (val > 0 && !report.participated) handleInputChange(member.id, 'participated', true);
                                      }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                    <BookOpenCheck size={16} className="text-blue-400" />
                                    <input 
                                      type="number" 
                                      placeholder="Est" 
                                      min="0"
                                      disabled={isReadOnly}
                                      className="w-14 text-sm outline-none text-slate-700 placeholder:text-slate-300 font-medium bg-transparent"
                                      value={report.bibleStudies || ''}
                                      onChange={(e) => handleInputChange(member.id, 'bibleStudies', e.target.value ? parseInt(e.target.value) : 0)}
                                    />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4">
            <span className="text-slate-600 font-medium flex items-center gap-2">
              <BarChart3 size={18} /> Período de Análise:
            </span>
            <input type="month" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm" />
            <input type="month" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Participação vs. Não Participação</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="displayDate" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="participated" name="Participaram" stackId="a" fill="#9333EA" barSize={40} />
                  <Bar dataKey="notParticipated" name="Não Relataram" stackId="a" fill="#E2E8F0" barSize={40} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceReports;