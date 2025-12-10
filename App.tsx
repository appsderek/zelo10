
import React, { useState, useEffect, useRef } from 'react';
import SideMenu from './components/SideMenu';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Attendance from './components/Attendance';
import Groups from './components/Groups';
import ServiceReports from './components/ServiceReports';
import DataManagement from './components/DataManagement';
import MeetingSchedule from './components/MeetingSchedule';
import DutyRoster from './components/DutyRoster';
import CleaningRoster from './components/CleaningRoster';
import ChairmanReaderRoster from './components/ChairmanReaderRoster';
import FieldServiceRoster from './components/FieldServiceRoster';
import Login from './components/Login';
import AccessControl from './components/AccessControl';
import PublisherDashboard from './components/PublisherDashboard';
import PublicTalks from './components/PublicTalks';
import IdeaBank from './components/IdeaBank';
import ReportInbox from './components/ReportInbox';

import { Member, AttendanceRecord, Group, ServiceReport, WeekSchedule, DutyAssignment, CleaningAssignment, ChairmanReaderAssignment, FieldServiceMeeting, PublicTalk, SystemRole, AppSettings, ModuleKey, PublicTalkOutline, InboxMessage } from './types';
import { Menu, Loader2, CloudOff, Cloud, ShieldCheck } from 'lucide-react';
import { initSupabase, loadFromCloud, saveToCloud, PROJECT_URL, PROJECT_KEY } from './services/supabaseService';

// Tempo de inatividade para logout automático (15 minutos em milissegundos)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; 

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<SystemRole | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | { fullName: string, customRole: SystemRole, permissions: Partial<Record<ModuleKey, boolean>> } | undefined>(undefined);

  // Data State
  const [settings, setSettings] = useState<AppSettings>({ adminPassword: '1234' });
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [schedules, setSchedules] = useState<WeekSchedule[]>([]);
  const [duties, setDuties] = useState<DutyAssignment[]>([]);
  const [cleaningSchedule, setCleaningSchedule] = useState<CleaningAssignment[]>([]);
  const [cleaningNotes, setCleaningNotes] = useState<string>('');
  const [chairmanReaders, setChairmanReaders] = useState<ChairmanReaderAssignment[]>([]);
  const [fieldServiceSchedule, setFieldServiceSchedule] = useState<FieldServiceMeeting[]>([]); 
  const [publicTalks, setPublicTalks] = useState<PublicTalk[]>([]);
  const [publicTalkOutlines, setPublicTalkOutlines] = useState<PublicTalkOutline[]>([]);
  
  // Estado para persistência de notificações
  const [sentNotificationIds, setSentNotificationIds] = useState<string[]>([]);
  // Estado para Mensagens Internas (Inbox do Dirigente)
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);

  // System State
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'off' | 'connected' | 'error'>('off');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- NOTIFICATION REQUEST ---
  useEffect(() => {
    // Solicita permissão para notificar assim que logar
    if (isAuthenticated && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated]);

  // --- IDLE TIMER LOGIC ---
  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (isAuthenticated) {
      idleTimer.current = setTimeout(() => {
        alert("Sessão expirada por inatividade. Por favor, faça login novamente.");
        handleLogout();
      }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Monitora eventos de atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    if (isAuthenticated) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetIdleTimer(); // Inicia o timer
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [isAuthenticated]);
  // ------------------------

  // Initialize Data
  useEffect(() => {
    const initializeSystem = async () => {
      setIsLoading(true);
      let connected = false;
      if (PROJECT_URL && PROJECT_KEY) {
        connected = initSupabase(PROJECT_URL, PROJECT_KEY);
      }
      
      let loadedFromCloud = false;

      if (connected) {
        setCloudStatus('connected');
        try {
            const [mRes, gRes, rRes, aRes, sRes, dRes, cRes, cnRes, crRes, fsRes, ptRes, ptoRes, setRes, notifRes, inboxRes] = await Promise.all([
              loadFromCloud('members'), loadFromCloud('groups'), loadFromCloud('reports'), loadFromCloud('attendance'),
              loadFromCloud('schedules'), loadFromCloud('duties'), loadFromCloud('cleaning'), loadFromCloud('cleaning_notes'),
              loadFromCloud('chairman_readers'), loadFromCloud('field_service'), loadFromCloud('public_talks'), loadFromCloud('public_talk_outlines'), 
              loadFromCloud('settings'), loadFromCloud('sent_notifications'), loadFromCloud('inbox_messages')
            ]);

            if (mRes.data) setMembers(mRes.data);
            if (gRes.data) setGroups(gRes.data);
            if (rRes.data) setServiceReports(rRes.data);
            if (aRes.data) setAttendance(aRes.data);
            if (sRes.data) setSchedules(sRes.data);
            if (dRes.data) setDuties(dRes.data);
            if (cRes.data) setCleaningSchedule(cRes.data);
            if (cnRes.data) setCleaningNotes(cnRes.data);
            if (crRes.data) setChairmanReaders(crRes.data);
            if (fsRes.data) setFieldServiceSchedule(fsRes.data);
            if (ptRes.data) setPublicTalks(ptRes.data);
            if (ptoRes.data && Array.isArray(ptoRes.data) && ptoRes.data.length > 0) {
                 setPublicTalkOutlines(ptoRes.data);
            } else {
                 const initialOutlines = Array.from({ length: 194 }, (_, i) => ({
                    number: (i + 1).toString(),
                    theme: '',
                    hasImage: false,
                    hasVideo: false
                 }));
                 setPublicTalkOutlines(initialOutlines);
            }
            if (setRes.data) setSettings(setRes.data);
            if (notifRes.data) setSentNotificationIds(notifRes.data);
            if (inboxRes.data) setInboxMessages(inboxRes.data);

            loadedFromCloud = true;
        } catch (e) { 
          console.error("Erro ao carregar da nuvem", e); 
          setCloudStatus('error');
        }
      }

      if (!loadedFromCloud) {
        console.log("Carregando do localStorage (fallback)");
        const load = (key: string, initial: any = []) => JSON.parse(localStorage.getItem(key) || 'null') || initial;
        setMembers(load('jw_members'));
        setGroups(load('jw_groups'));
        setAttendance(load('jw_attendance'));
        setServiceReports(load('jw_reports'));
        setSchedules(load('jw_schedules'));
        setDuties(load('jw_duties'));
        setCleaningSchedule(load('jw_cleaning'));
        setCleaningNotes(localStorage.getItem('jw_cleaning_notes') || '');
        setChairmanReaders(load('jw_chairman_readers'));
        setFieldServiceSchedule(load('jw_field_service'));
        setPublicTalks(load('jw_public_talks'));
        
        const loadedOutlines = load('jw_public_talk_outlines', []);
        if (loadedOutlines.length === 0) {
            const initialOutlines = Array.from({ length: 194 }, (_, i) => ({
                number: (i + 1).toString(),
                theme: '',
                hasImage: false,
                hasVideo: false
            }));
            setPublicTalkOutlines(initialOutlines);
        } else {
            setPublicTalkOutlines(loadedOutlines);
        }
        
        setSettings(load('jw_settings', { adminPassword: '1234' }));
        setSentNotificationIds(load('jw_sent_notifications', []));
        setInboxMessages(load('jw_inbox_messages', []));
      }

      setIsLoading(false);
    };
    initializeSystem();
  }, []);

  // --- PERSISTENCE ---
  const saveState = () => {
    if (cloudStatus === 'connected') {
      Promise.all([
        saveToCloud('members', members), saveToCloud('groups', groups), saveToCloud('reports', serviceReports),
        saveToCloud('attendance', attendance), saveToCloud('schedules', schedules), saveToCloud('duties', duties),
        saveToCloud('cleaning', cleaningSchedule), saveToCloud('cleaning_notes', cleaningNotes),
        saveToCloud('chairman_readers', chairmanReaders), saveToCloud('field_service', fieldServiceSchedule),
        saveToCloud('public_talks', publicTalks), saveToCloud('public_talk_outlines', publicTalkOutlines),
        saveToCloud('settings', settings), saveToCloud('sent_notifications', sentNotificationIds),
        saveToCloud('inbox_messages', inboxMessages)
      ]).then(() => setLastSaved(new Date())).catch(e => console.error("Falha ao salvar na nuvem:", e));
    } else {
      localStorage.setItem('jw_members', JSON.stringify(members));
      localStorage.setItem('jw_groups', JSON.stringify(groups));
      localStorage.setItem('jw_attendance', JSON.stringify(attendance));
      localStorage.setItem('jw_reports', JSON.stringify(serviceReports));
      localStorage.setItem('jw_schedules', JSON.stringify(schedules));
      localStorage.setItem('jw_duties', JSON.stringify(duties));
      localStorage.setItem('jw_cleaning', JSON.stringify(cleaningSchedule));
      localStorage.setItem('jw_cleaning_notes', cleaningNotes);
      localStorage.setItem('jw_chairman_readers', JSON.stringify(chairmanReaders));
      localStorage.setItem('jw_field_service', JSON.stringify(fieldServiceSchedule));
      localStorage.setItem('jw_public_talks', JSON.stringify(publicTalks));
      localStorage.setItem('jw_public_talk_outlines', JSON.stringify(publicTalkOutlines));
      localStorage.setItem('jw_settings', JSON.stringify(settings));
      localStorage.setItem('jw_sent_notifications', JSON.stringify(sentNotificationIds));
      localStorage.setItem('jw_inbox_messages', JSON.stringify(inboxMessages));
      setLastSaved(new Date());
    }
  };

  useEffect(() => {
    if (isLoading) return; 
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(saveState, 1500); 
  }, [members, groups, attendance, serviceReports, settings, schedules, duties, cleaningSchedule, cleaningNotes, chairmanReaders, fieldServiceSchedule, publicTalks, publicTalkOutlines, sentNotificationIds, inboxMessages, isLoading]);

  // --- HANDLERS ---
  const handleLogin = (role: SystemRole, member?: Member) => {
    setIsAuthenticated(true);
    setCurrentRole(role);
    setCurrentUser(member || { fullName: 'Administrador', customRole: SystemRole.TOTAL, permissions: {} });
    setActiveTab('dashboard'); 
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUser(undefined);
  };
  
  // Função Central de Permissões
  const canEdit = (module: ModuleKey): boolean => {
    if (!currentUser) return false;
    if ('customRole' in currentUser && currentUser.customRole === SystemRole.TOTAL) return true;
    if ('customRole' in currentUser && currentUser.customRole === SystemRole.SELECTIVE) {
        return !!currentUser.permissions?.[module];
    }
    return false;
  };
  
  // Função para salvar relatório pessoal E GERAR NOTIFICAÇÃO PRO SECRETÁRIO
  const handleSavePersonalReport = (report: ServiceReport) => {
     // 1. Salva o relatório
     setServiceReports(prev => {
         const filtered = prev.filter(r => r.id !== report.id);
         return [...filtered, report];
     });

     // 2. Lógica de Notificação para o Secretário (Cristiano Santos)
     if (currentUser && 'id' in currentUser) {
        const member = currentUser as Member;
        
        // Busca prioritária por nome "Cristiano Santos" (insensível a case)
        let targetOverseer = members.find(m => m.fullName.trim().toLowerCase() === 'cristiano santos');
        
        // Se não encontrar, busca alguém com a tag "Secretário"
        if (!targetOverseer) {
            targetOverseer = members.find(m => m.roles?.includes('Secretário'));
        }
        
        // Fallback final se não achar ninguém
        const targetName = targetOverseer ? targetOverseer.fullName : 'Cristiano Santos';
        
        const newMessage: InboxMessage = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            fromMemberId: member.id,
            fromMemberName: member.fullName,
            targetOverseerName: targetName,
            content: `Relatório de ${member.fullName} recebido.`,
            read: false,
            type: 'report',
            reportData: {
                month: report.month,
                hours: report.hours,
                studies: report.bibleStudies,
                participated: report.participated
            }
        };

        setInboxMessages(prev => [newMessage, ...prev]);

        // GERA NOTIFICAÇÃO DO NAVEGADOR SE PERMITIDO
        if ('Notification' in window && Notification.permission === 'granted') {
             try {
                new Notification('Secretariado JW - Novo Relatório', {
                    body: `${member.fullName} enviou o relatório de campo.`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/2666/2666505.png'
                });
             } catch (e) {
                 console.log("Notificação nativa falhou", e);
             }
        }
     }
  };

  const handleRegisterNotification = (id: string) => {
    if (!sentNotificationIds.includes(id)) {
        setSentNotificationIds(prev => [...prev, id]);
    }
  };

  const handleMarkMessageRead = (id: string) => {
     setInboxMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: true } : msg));
  };

  const handleDeleteInboxMessage = (id: string) => {
     setInboxMessages(prev => prev.filter(msg => msg.id !== id));
  };

  // Função para resetar o repositório (Limpeza de Mensagens)
  const handleResetInbox = async () => {
    if (window.confirm("ATENÇÃO: Isso apagará todas as mensagens e histórico de relatórios recebidos na Caixa de Entrada. Deseja continuar?")) {
      setIsLoading(true); // Bloqueia a UI
      try {
          // 1. Limpa Estado
          setInboxMessages([]);
          
          // 2. Limpa Local Storage
          localStorage.removeItem('jw_inbox_messages');
          localStorage.setItem('jw_inbox_messages', '[]');

          // 3. Limpa Nuvem
          if (cloudStatus === 'connected') {
              await saveToCloud('inbox_messages', []);
          }

          alert("Caixa de entrada limpa com sucesso!");
          window.location.reload(); 
      } catch (error) {
          console.error("Erro ao limpar dados:", error);
          // Mesmo com erro na nuvem, força limpeza local
          localStorage.setItem('jw_inbox_messages', '[]');
          window.location.reload();
      }
    }
  };

  // Função para apagar TODOS os relatórios de campo E limpar a caixa de entrada
  const handleDeleteAllReports = async () => {
     if (window.confirm("PERIGO: Isso apagará TODOS os relatórios de campo de TODOS os publicadores e limpará a Caixa de Entrada. Esta ação é irreversível. Deseja continuar?")) {
        setIsLoading(true); // Bloqueia a UI
        try {
            // 1. Limpa Estado
            setServiceReports([]);
            setInboxMessages([]); 

            // 2. Limpa Local Storage
            localStorage.removeItem('jw_reports');
            localStorage.removeItem('jw_inbox_messages');
            localStorage.setItem('jw_reports', '[]');
            localStorage.setItem('jw_inbox_messages', '[]');

            // 3. Limpa Nuvem
            if (cloudStatus === 'connected') {
                await Promise.all([
                    saveToCloud('reports', []),
                    saveToCloud('inbox_messages', [])
                ]);
            }
            
            alert("Todos os relatórios e mensagens foram apagados com sucesso.");
            window.location.reload();
        } catch (error) {
            console.error("Erro ao limpar dados:", error);
            // Mesmo com erro, tenta limpar local
            localStorage.setItem('jw_reports', '[]');
            localStorage.setItem('jw_inbox_messages', '[]');
            window.location.reload();
        }
     }
  };

  // Função de Reset Mestre (Fábrica)
  const handleMasterReset = async () => {
    if (confirm("ATENÇÃO: RESET MESTRE (FÁBRICA)\n\nIsso apagará TODO o banco de dados na nuvem, limpará o armazenamento local e reiniciará o sistema como novo.\n\nTem certeza absoluta?")) {
      setIsLoading(true);
      try {
        // 1. Limpa Nuvem (envia listas vazias para tudo)
        if (cloudStatus === 'connected') {
           await Promise.all([
             saveToCloud('members', []), saveToCloud('groups', []), saveToCloud('reports', []),
             saveToCloud('attendance', []), saveToCloud('schedules', []), saveToCloud('duties', []),
             saveToCloud('cleaning', []), saveToCloud('cleaning_notes', ''),
             saveToCloud('chairman_readers', []), saveToCloud('field_service', []),
             saveToCloud('public_talks', []), saveToCloud('public_talk_outlines', []),
             saveToCloud('settings', { adminPassword: '1234' }), 
             saveToCloud('sent_notifications', []), saveToCloud('inbox_messages', [])
           ]);
        }
        
        // 2. Limpa Local
        localStorage.clear();
        
        // 3. Limpa Service Workers (Cache PWA)
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
             await registration.unregister();
          }
        }

        alert("Sistema resetado com sucesso. Reiniciando...");
        window.location.href = '/';
      } catch (e) {
        console.error(e);
        // Fallback: garante que pelo menos o local seja limpo
        localStorage.clear();
        window.location.href = '/';
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-purple-900 text-white">
        <Loader2 className="animate-spin mr-3" /> Carregando sistema...
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Login members={members} settings={settings} onLogin={handleLogin} />;
  }
  
  const renderContent = () => {
    // 1. Visão Restrita (Publicador Comum)
    if (currentRole === SystemRole.RESTRICTED && currentUser && 'id' in currentUser) {
        switch (activeTab) {
            case 'dashboard':
                return <PublisherDashboard member={currentUser as Member} schedules={schedules} duties={duties} chairmanReaders={chairmanReaders} reports={serviceReports} onSaveReport={handleSavePersonalReport} groups={groups} />;
            case 'schedule':
                return <MeetingSchedule members={members} schedules={schedules} onSaveSchedule={()=>{}} onDeleteSchedule={()=>{}} isReadOnly={true} />;
            case 'chairman_readers':
                return <ChairmanReaderRoster assignments={chairmanReaders} onSaveAssignments={()=>{}} isReadOnly={true} members={members} />;
            case 'field_service':
                return <FieldServiceRoster meetings={fieldServiceSchedule} onSaveMeetings={()=>{}} isReadOnly={true} members={members} />;
            case 'duties':
                return <DutyRoster assignments={duties} members={members} onSaveAssignments={()=>{}} isReadOnly={true} />;
            case 'cleaning':
                return <CleaningRoster assignments={cleaningSchedule} groups={groups} onSaveAssignments={()=>{}} globalObservations={cleaningNotes} onSaveGlobalObservations={()=>{}} isReadOnly={true} />;
            case 'public_talks':
                return <PublicTalks talks={publicTalks} outlines={publicTalkOutlines} onSaveTalks={()=>{}} onSaveOutlines={()=>{}} isReadOnly={true} />;
            default:
                return <PublisherDashboard member={currentUser as Member} schedules={schedules} duties={duties} chairmanReaders={chairmanReaders} reports={serviceReports} onSaveReport={handleSavePersonalReport} groups={groups} />;
        }
    }

    // 2. Visão Admin e Seletivo
    switch (activeTab) {
      case 'dashboard':
        // SE for Seletivo (e tiver ID de membro), mostra o Dashboard Pessoal para ver notificações
        if (currentRole === SystemRole.SELECTIVE && currentUser && 'id' in currentUser) {
            return (
                <PublisherDashboard 
                    member={currentUser as Member} 
                    schedules={schedules} 
                    duties={duties} 
                    chairmanReaders={chairmanReaders} 
                    reports={serviceReports} 
                    onSaveReport={handleSavePersonalReport}
                    groups={groups}
                />
            );
        }
        // Se for Admin Total, mostra o Dashboard Geral
        return (
          <Dashboard 
            members={members} 
            attendance={attendance} 
            groups={groups}
            schedules={schedules}
            duties={duties}
            cleaning={cleaningSchedule}
            chairmanReaders={chairmanReaders}
            fieldService={fieldServiceSchedule}
            sentIds={sentNotificationIds}
            onRegisterNotification={handleRegisterNotification}
            inboxMessages={inboxMessages}
            onMarkMessageRead={handleMarkMessageRead}
            currentUser={currentUser as Member}
          />
        );
      case 'report_inbox':
         // Acesso restrito via canEdit para seletivos
         if (currentRole === SystemRole.SELECTIVE && !canEdit('report_inbox')) {
             return <div className="p-8 text-center text-gray-500">Acesso negado. Consulte o administrador.</div>;
         }
         return <ReportInbox messages={inboxMessages} onMarkRead={handleMarkMessageRead} onDeleteMessage={handleDeleteInboxMessage} currentUser={currentUser as Member} isReadOnly={!canEdit('report_inbox')} members={members} groups={groups} />;
      case 'members':
        return <Members members={members} groups={groups} onAddMember={m => setMembers(p => [...p, m])} onUpdateMember={m => setMembers(p => p.map(i => i.id === m.id ? m : i))} onDeleteMember={id => setMembers(p => p.filter(i => i.id !== id))} isReadOnly={!canEdit('members')} />;
      case 'groups':
        return <Groups groups={groups} members={members} reports={serviceReports} inboxMessages={inboxMessages} onAddGroup={g => setGroups(p => [...p, g])} onUpdateGroup={g => setGroups(p => p.map(i => i.id === g.id ? g : i))} onDeleteGroup={id => setGroups(p => p.filter(i => i.id !== id))} isReadOnly={!canEdit('groups')} />;
      case 'attendance':
        return <Attendance records={attendance} onAddRecord={r => setAttendance(p => [...p, r])} onDeleteRecord={id => setAttendance(p => p.filter(i => i.id !== id))} isReadOnly={!canEdit('attendance')} />;
      case 'reports':
        return <ServiceReports members={members} groups={groups} reports={serviceReports} onSaveReports={newR => setServiceReports(p => [...p.filter(pr => !newR.some(nr => nr.id === pr.id)), ...newR])} isReadOnly={!canEdit('reports')} />;
      case 'data':
        // Acesso restrito apenas para TOTAL
        if (currentRole !== SystemRole.TOTAL) return <div className="p-8 text-center text-gray-500">Acesso restrito ao Administrador Geral.</div>;
        return <DataManagement 
            members={members} 
            groups={groups} 
            reports={serviceReports} 
            attendance={attendance} 
            onImportData={() => {}} 
            onResetInbox={handleResetInbox}
            onDeleteAllReports={handleDeleteAllReports}
            onMasterReset={handleMasterReset}
        />;
      case 'schedule':
        return <MeetingSchedule members={members} schedules={schedules} onSaveSchedule={s => setSchedules(p => { const exists = p.some(ps => ps.id === s.id); return exists ? p.map(ps => ps.id === s.id ? s : ps) : [...p, s]; })} onDeleteSchedule={id => setSchedules(p => p.filter(s => s.id !== id))} isReadOnly={!canEdit('schedule')} />;
      case 'duties':
        return <DutyRoster assignments={duties} members={members} onSaveAssignments={setDuties} isReadOnly={!canEdit('duties')} />;
      case 'cleaning':
        return <CleaningRoster assignments={cleaningSchedule} groups={groups} onSaveAssignments={setCleaningSchedule} globalObservations={cleaningNotes} onSaveGlobalObservations={setCleaningNotes} isReadOnly={!canEdit('cleaning')} />;
      case 'chairman_readers':
        return <ChairmanReaderRoster assignments={chairmanReaders} onSaveAssignments={setChairmanReaders} isReadOnly={!canEdit('chairman_readers')} members={members} />;
      case 'field_service':
        return <FieldServiceRoster meetings={fieldServiceSchedule} onSaveMeetings={setFieldServiceSchedule} isReadOnly={!canEdit('field_service')} members={members} />;
      case 'public_talks':
        return <PublicTalks talks={publicTalks} outlines={publicTalkOutlines} onSaveTalks={setPublicTalks} onSaveOutlines={setPublicTalkOutlines} isReadOnly={!canEdit('public_talks')} />;
      case 'idea_bank':
        return <IdeaBank />;
      case 'access':
        // Acesso restrito apenas para TOTAL
        if (currentRole !== SystemRole.TOTAL) return <div className="p-8 text-center text-gray-500">Acesso restrito ao Administrador Geral.</div>;
        return <AccessControl members={members} settings={settings} onUpdateMember={m => setMembers(p => p.map(i => i.id === m.id ? m : i))} onUpdateSettings={setSettings} />;
      default:
        // Fallback seguro
        if (currentRole === SystemRole.SELECTIVE && currentUser && 'id' in currentUser) {
             return <PublisherDashboard member={currentUser as Member} schedules={schedules} duties={duties} chairmanReaders={chairmanReaders} reports={serviceReports} onSaveReport={handleSavePersonalReport} groups={groups} />;
        }
        return <Dashboard members={members} attendance={attendance} groups={groups} sentIds={sentNotificationIds} onRegisterNotification={handleRegisterNotification} inboxMessages={inboxMessages} onMarkMessageRead={handleMarkMessageRead} currentUser={currentUser as Member} />;
    }
  };

  const isPublisherView = currentRole === SystemRole.RESTRICTED || (currentRole === SystemRole.SELECTIVE && activeTab === 'dashboard');
  const isDashboard = activeTab === 'dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
        userRole={currentRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden p-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 print-hidden">
            <button onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-purple-900">Secretariado JW</span>
            <div className={`flex items-center gap-1.5 text-xs ${cloudStatus === 'connected' ? 'text-green-600' : 'text-red-500'}`}>
                {cloudStatus === 'connected' ? <Cloud size={16} /> : <CloudOff size={16} />}
                <span className="hidden sm:inline">{cloudStatus === 'connected' ? 'Nuvem' : 'Offline'}</span>
            </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${isPublisherView || isDashboard ? 'bg-gradient-to-b from-purple-900 to-indigo-900' : 'bg-gray-50'}`}>
          <div className="lg:pl-64">
             <div className="printable-content">
                {renderContent()}
             </div>
             {/* Security Badge */}
             {isAuthenticated && (
                <div className="text-center mt-6 text-xs text-purple-300 opacity-60 flex items-center justify-center gap-1">
                   <ShieldCheck size={12} />
                   Ambiente Seguro & Monitorado
                </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
