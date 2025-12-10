import React, { useEffect, useState } from 'react';
import { Member, AttendanceRecord, MemberStatus, Group, WeekSchedule, DutyAssignment, CleaningAssignment, ChairmanReaderAssignment, FieldServiceMeeting, InboxMessage } from '../types';
import { Users, UserCheck, UserMinus, Activity, Map, User, Bell, Send, Check, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { getPendingNotifications, NotificationItem, openWhatsAppNotification, createAssignmentMessage } from '../services/notificationService';

interface DashboardProps {
  members: Member[];
  attendance: AttendanceRecord[];
  groups: Group[];
  // Dados adicionais para notificações
  schedules?: WeekSchedule[];
  duties?: DutyAssignment[];
  cleaning?: CleaningAssignment[];
  chairmanReaders?: ChairmanReaderAssignment[];
  fieldService?: FieldServiceMeeting[];
  // Persistência de notificações
  sentIds?: string[];
  onRegisterNotification?: (id: string) => void;
  // Mensagens do Sistema
  inboxMessages?: InboxMessage[];
  onMarkMessageRead?: (id: string) => void;
  currentUser?: Member;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  members, attendance, groups,
  schedules = [], duties = [], cleaning = [], chairmanReaders = [], fieldService = [],
  sentIds = [], onRegisterNotification,
  inboxMessages = [], onMarkMessageRead, currentUser
}) => {
  // Calculated Stats
  const totalMembers = members.length;
  const activeCount = members.filter(m => m.status === MemberStatus.ACTIVE).length;
  const irregularCount = members.filter(m => m.status === MemberStatus.IRREGULAR).length;
  const inactiveCount = members.filter(m => m.status === MemberStatus.INACTIVE).length;
  const totalGroups = groups.length;
  
  const avgAttendance = attendance.length > 0 
    ? Math.round(attendance.reduce((sum, rec) => sum + rec.count, 0) / attendance.length)
    : 0;

  // Notificações State (Lista Gerada)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Busca notificações para o intervalo de Hoje até +2 dias (48h)
    const pending = getPendingNotifications(2, members, schedules, duties, cleaning, chairmanReaders, fieldService);
    setNotifications(pending);
  }, [members, schedules, duties, cleaning, chairmanReaders, fieldService]);

  const handleSendNotification = (item: NotificationItem) => {
    const message = createAssignmentMessage(item.member.fullName, item.date, item.description, true);
    openWhatsAppNotification(item.member, message);
    if (onRegisterNotification) {
        onRegisterNotification(item.id);
    }
  };

  // Lógica de Filtro de Mensagens (Novas)
  const isTargetUser = (msg: InboxMessage) => {
      // Se for admin total, vê tudo. Se for seletivo, vê só se for o alvo.
      if (currentUser?.customRole === 'Seletivo') {
          return msg.targetOverseerName === currentUser.fullName || !msg.targetOverseerName;
      }
      return true;
  };

  const myNewMessages = inboxMessages.filter(msg => !msg.read && isTargetUser(msg))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const StatCard = ({ label, value, icon: Icon, subText, colorClass = "text-purple-300" }: any) => (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg flex items-start justify-between hover:bg-white/15 transition-all group">
      <div>
        <p className="text-sm font-medium text-purple-200 mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">{value}</h3>
        {subText && <p className="text-xs text-purple-300/70 mt-2">{subText}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-white/10 ${colorClass}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">Visão Geral</h2>
        <p className="text-purple-200">Resumo estatístico da congregação.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
          label="Total de Publicadores" 
          value={totalMembers} 
          icon={Users} 
        />
        <StatCard 
          label="Grupos de Campo" 
          value={totalGroups} 
          icon={Map}
          subText={totalGroups > 0 ? `~${Math.round(totalMembers / totalGroups)} pubs/grupo` : ''}
        />
        <StatCard 
          label="Ativos" 
          value={activeCount} 
          icon={UserCheck} 
          colorClass="text-emerald-300"
          subText={`${totalMembers > 0 ? ((activeCount / totalMembers) * 100).toFixed(1) : 0}% do total`}
        />
        <StatCard 
          label="Irregulares" 
          value={irregularCount} 
          icon={Activity} 
          colorClass="text-amber-300"
        />
        <StatCard 
          label="Média de Assistência" 
          value={avgAttendance} 
          icon={UserMinus} 
          subText="Últimas reuniões"
        />
      </div>

      {/* NOTIFICAÇÕES DE RELATÓRIOS (NOVOS) */}
      {myNewMessages.length > 0 && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-500/30 p-6 rounded-xl shadow-lg animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <MessageSquare size={100} className="text-white" />
              </div>
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <MessageSquare size={24} className="text-blue-300" />
                      Relatórios Recebidos (Novos)
                  </h3>
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {myNewMessages.length} novos
                  </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                  {myNewMessages.map(msg => (
                      <div key={msg.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/20 transition-all">
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-blue-200">{msg.fromMemberName}</span>
                              <span className="text-[10px] text-white/50">{new Date(msg.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-sm text-white mb-2">{msg.content}</p>
                          {msg.reportData && (
                             <div className="flex gap-2 text-xs text-blue-200 mb-2 bg-black/20 p-1.5 rounded">
                                 <span>Hs: {msg.reportData.hours}</span> • <span>Est: {msg.reportData.studies}</span>
                             </div>
                          )}
                          <button 
                             onClick={() => onMarkMessageRead && onMarkMessageRead(msg.id)}
                             className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                          >
                              <Check size={12} /> Marcar como Visto
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* AUTOMATIC REMINDERS SECTION */}
      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bell size={20} className={notifications.length > 0 ? "text-amber-400 animate-bounce" : "text-purple-300"} /> 
                    Central de Lembretes (Hoje + 48h)
                </h3>
                <p className="text-sm text-purple-200">
                    Designações de: <strong>Hoje ({new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}) até {new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</strong>
                </p>
            </div>
            {notifications.length > 0 && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {notifications.length - (sentIds?.length || 0)} Pendentes
                </span>
            )}
        </div>
        
        <div className="bg-black/20 rounded-lg overflow-hidden border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
           {notifications.length > 0 ? (
               <table className="w-full text-left text-sm text-purple-100">
                   <thead className="bg-black/20 uppercase text-xs font-bold text-purple-300">
                       <tr>
                           <th className="p-3">Data</th>
                           <th className="p-3">Publicador</th>
                           <th className="p-3">Designação</th>
                           <th className="p-3 text-right">Ação</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-white/10">
                       {notifications.map(item => {
                           // Verifica se o ID desta notificação está na lista de enviados persistida
                           const isSent = sentIds?.includes(item.id);
                           const hasPhone = !!item.member.phone;
                           const itemDate = new Date(item.date);
                           // Correção visual de timezone apenas para exibição
                           const displayDate = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
                           
                           return (
                               <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                   <td className="p-3 text-xs font-mono text-purple-300 whitespace-nowrap">
                                      {displayDate}
                                   </td>
                                   <td className="p-3">
                                       <div className="font-bold text-white">{item.member.fullName}</div>
                                       <div className="text-xs opacity-70">{item.member.serviceGroup}</div>
                                   </td>
                                   <td className="p-3">
                                       <div className="text-white">{item.description}</div>
                                       <div className="text-xs text-emerald-300">{item.type}</div>
                                   </td>
                                   <td className="p-3 text-right">
                                       {isSent ? (
                                           <span className="inline-flex items-center gap-1 text-green-400 text-xs font-bold bg-green-900/30 px-2 py-1 rounded">
                                               <Check size={14} /> Enviado
                                           </span>
                                       ) : (
                                           <button 
                                               onClick={() => handleSendNotification(item)}
                                               disabled={!hasPhone}
                                               className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                   hasPhone 
                                                   ? 'bg-green-600 hover:bg-green-500 text-white shadow-md hover:shadow-green-500/20' 
                                                   : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                               }`}
                                               title={!hasPhone ? "Sem telefone cadastrado" : "Enviar WhatsApp"}
                                           >
                                               <Send size={14} /> {hasPhone ? 'Avisar' : 'Sem Tel'}
                                           </button>
                                       )}
                                   </td>
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           ) : (
               <div className="p-8 text-center text-purple-300 italic flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} className="text-green-400/50" />
                  <p>Tudo tranquilo! Nenhuma designação encontrada para os próximos 3 dias.</p>
               </div>
           )}
        </div>
      </div>

      {/* Groups Summary Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
           <Map size={20} className="text-purple-300" /> Resumo dos Grupos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map(group => {
            const memberCount = members.filter(m => m.serviceGroup === group.name).length;
            return (
              <div key={group.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm flex flex-col gap-3 hover:bg-white/20 transition-all group">
                 <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-lg">{group.name}</h4>
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-md font-bold">
                      {memberCount} pubs
                    </span>
                 </div>
                 
                 <div className="space-y-1">
                   <div className="flex items-center gap-2 text-sm text-purple-200 group-hover:text-white transition-colors">
                      <User size={14} className="text-purple-400" />
                      <span className="truncate font-medium">{group.overseer || 'Sem Dirigente'}</span>
                   </div>
                   {group.assistant && (
                     <div className="flex items-center gap-2 text-xs text-purple-300/70 pl-6">
                        <span className="truncate">Aj: {group.assistant}</span>
                     </div>
                   )}
                 </div>
              </div>
            )
          })}
          
          {groups.length === 0 && (
            <div className="col-span-full p-6 text-center border border-dashed border-purple-500/30 rounded-xl bg-white/5">
              <p className="text-purple-300">Nenhum grupo cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;