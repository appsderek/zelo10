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
import Territories from './components/Territories';
import PublicWitnessing from './components/PublicWitnessing';
import LGPDBanner from './components/LGPDBanner';
import SystemLog from './components/SystemLog'; // Novo componente

import { Member, AttendanceRecord, Group, ServiceReport, WeekSchedule, DutyAssignment, CleaningAssignment, ChairmanReaderAssignment, FieldServiceMeeting, PublicTalk, SystemRole, AppSettings, ModuleKey, PublicTalkOutline, InboxMessage, Territory, TerritoryHistory, CartLocation, CartShift, LogEntry } from './types';
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
  const [currentUser, setCurrentUser] = useState<Member | { fullName: string, customRole: SystemRole, permissions: Partial<Record<ModuleKey, boolean>>, roles?: string[] } | undefined>(undefined);

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
  
  // Novos Estados para Módulos Extras
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [territoryHistory, setTerritoryHistory] = useState<TerritoryHistory[]>([]);
  const [cartLocations, setCartLocations] = useState<CartLocation[]>([]);
  const [cartShifts, setCartShifts] = useState<CartShift[]>([]);

  // Estado para Logs
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);

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
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    if (isAuthenticated) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetIdleTimer();
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
            const [
                mRes, gRes, rRes, aRes, sRes, dRes, cRes, cnRes, crRes, fsRes, ptRes, ptoRes, setRes, notifRes, inboxRes,
                terrRes, terrHistRes, cartLocRes, cartShiftRes, logsRes
            ] = await Promise.all([
              loadFromCloud('members'), loadFromCloud('groups'), loadFromCloud('reports'), loadFromCloud('attendance'),
              loadFromCloud('schedules'), loadFromCloud('duties'), loadFromCloud('cleaning'), loadFromCloud('cleaning_notes'),
              loadFromCloud('chairman_readers'), loadFromCloud('field_service'), loadFromCloud('public_talks'), loadFromCloud('public_talk_outlines'), 
              loadFromCloud('settings'), loadFromCloud('sent_notifications'), loadFromCloud('inbox_messages'),
              loadFromCloud('territories'), loadFromCloud('territory_history'), loadFromCloud('cart_locations'), loadFromCloud('cart_shifts'),
              loadFromCloud('system_logs')
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
            
            // Novos Módulos
            if (terrRes.data) setTerritories(terrRes.data);
            if (terrHistRes.data) setTerritoryHistory(terrHistRes.data);
            if (cartLocRes.data) setCartLocations(cartLocRes.data);
            if (cartShiftRes.data) setCartShifts(cartShiftRes.data);
            
            // Logs
            if (logsRes.data) setSystemLogs(logsRes.data);

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
        
        setTerritories(load('jw_territories', []));
        setTerritoryHistory(load('jw_territory_history', []));
        setCartLocations(load('jw_cart_locations', []));
        setCartShifts(load('jw_cart_shifts', []));
        
        setSystemLogs(load('jw_system_logs', []));
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
        saveToCloud('inbox_messages', inboxMessages),
        saveToCloud('territories', territories), saveToCloud('territory_history', territoryHistory),
        saveToCloud('cart_locations', cartLocations), saveToCloud('cart_shifts', cartShifts),
        saveToCloud('system_logs', systemLogs)
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
      localStorage.setItem('jw_territories', JSON.stringify(territories));
      localStorage.setItem('jw_territory_history', JSON.stringify(territoryHistory));
      localStorage.setItem('jw_cart_locations', JSON.stringify(cartLocations));
      localStorage.setItem('jw_cart_shifts', JSON.stringify(cartShifts));
      localStorage.setItem('jw_system_logs', JSON.stringify(systemLogs));
      setLastSaved(new Date());
    }
  };

  useEffect(() => {
    if (isLoading) return; 
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(saveState, 1500); 
  }, [members, groups, attendance, serviceReports, settings, schedules, duties, cleaningSchedule, cleaningNotes, chairmanReaders, fieldServiceSchedule, publicTalks, publicTalkOutlines, sentNotificationIds, inboxMessages, territories, territoryHistory, cartLocations, cartShifts, systemLogs, isLoading]);

  // --- LOGGING HELPER ---
  const registerLog = (action: 'create' | 'update' | 'delete' | 'other', module: string, description: string) => {
      const newLog: LogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userName: currentUser ? currentUser.fullName : 'Sistema',
          userRole: currentUser ? ('customRole' in currentUser ? currentUser.customRole : 'Publicador') : '',
          module,
          action,
          description
      };
      
      // Mantém apenas os últimos 50 logs (LIFO - Last In First Out visualmente)
      setSystemLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // --- HANDLERS ---
  const handleLogin = (role: SystemRole, member?: Member) => {
    setIsAuthenticated(true);
    setCurrentRole(role);
    setCurrentUser(member || { fullName: 'Administrador', customRole: SystemRole.TOTAL, permissions: {}, roles: ['Coordenador', 'Secretário', 'Sup. Serviço'] });
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

  // Verifica permissão específica para Carrinhos (Admin ou Coordenador/Sup. Serviço)
  const canManageService = (): boolean => {
      if (currentRole === SystemRole.TOTAL) return true;
      if (currentUser && 'roles' in currentUser && currentUser.roles) {
          return currentUser.roles.includes('Coordenador') || currentUser.roles.includes('Sup. Serviço');
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

     registerLog('create', 'Relatórios', `Relatório pessoal enviado: ${report.hours}h`);

     // 2. Lógica de Notificação para o Secretário
     if (currentUser && 'id' in currentUser) {
        const member = currentUser as Member;
        
        // A. Busca primária: Qualquer membro com a tag "Secretário"
        let targetOverseer = members.find(m => m.roles?.includes('Secretário'));
        
        // B. Busca secundária (Legado): Nome específico "Cristiano Santos"
        if (!targetOverseer) {
            targetOverseer = members.find(m => m.fullName.trim().toLowerCase() === 'cristiano santos');
        }
        
        // C. Fallback: Se não achar ninguém, define para "Secretaria"
        const targetName = targetOverseer ? targetOverseer.fullName : 'Secretaria';
        
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
                new Notification('Z-Elo - Novo Relatório', {
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
        registerLog('other', 'Notificações', 'Notificação enviada via WhatsApp');
    }
  };

  const handleMarkMessageRead = (id: string) => {
     setInboxMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: true } : msg));
  };

  const handleDeleteInboxMessage = (id: string) => {
     setInboxMessages(prev => prev.filter(msg => msg.id !== id));
     registerLog('delete', 'Caixa de Entrada', 'Mensagem removida');
  };

  // Função para resetar o repositório (Limpeza de Mensagens)
  const handleResetInbox = async () => {
    if (window.confirm("ATENÇÃO: Isso apagará todas as mensagens e histórico de relatórios recebidos na Caixa de Entrada. Deseja continuar?")) {
      setIsLoading(true); // Bloqueia a UI
      try {
          setInboxMessages([]);
          localStorage.removeItem('jw_inbox_messages');
          localStorage.setItem('jw_inbox_messages', '[]');
          if (cloudStatus === 'connected') {
              await saveToCloud('inbox_messages', []);
          }
          registerLog('delete', 'Sistema', 'Reset completo da Caixa de Entrada');
          alert("Caixa de entrada limpa com sucesso!");
          window.location.reload(); 
      } catch (error) {
          console.error("Erro ao limpar dados:", error);
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
            setServiceReports([]);
            setInboxMessages([]); 
            localStorage.removeItem('jw_reports');
            localStorage.removeItem('jw_inbox_messages');
            localStorage.setItem('jw_reports', '[]');
            localStorage.setItem('jw_inbox_messages', '[]');
            if (cloudStatus === 'connected') {
                await Promise.all([
                    saveToCloud('reports', []),
                    saveToCloud('inbox_messages', [])
                ]);
            }
            registerLog('delete', 'Sistema', 'Exclusão em massa de Relatórios');
            alert("Todos os relatórios e mensagens foram apagados com sucesso.");
            window.location.reload();
        } catch (error) {
            console.error("Erro ao limpar dados:", error);
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
        if (cloudStatus === 'connected') {
           await Promise.all([
             saveToCloud('members', []), saveToCloud('groups', []), saveToCloud('reports', []),
             saveToCloud('attendance', []), saveToCloud('schedules', []), saveToCloud('duties', []),
             saveToCloud('cleaning', []), saveToCloud('cleaning_notes', ''),
             saveToCloud('chairman_readers', []), saveToCloud('field_service', []),
             saveToCloud('public_talks', []), saveToCloud('public_talk_outlines', []),
             saveToCloud('settings', { adminPassword: '1234' }), 
             saveToCloud('sent_notifications', []), saveToCloud('inbox_messages', []),
             saveToCloud('territories', []), saveToCloud('territory_history', []),
             saveToCloud('cart_locations', []), saveToCloud('cart_shifts', []),
             saveToCloud('system_logs', [])
           ]);
        }
        localStorage.clear();
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
            case 'territories': // Publicadores podem ver territórios (Read Only)
                return <Territories territories={territories} members={members} history={territoryHistory} onSaveTerritories={()=>{}} onSaveHistory={()=>{}} isReadOnly={true} />;
            case 'public_witnessing': // Publicador pode ver e se inscrever
                return <PublicWitnessing locations={cartLocations} shifts={cartShifts} members={members} onSaveLocations={()=>{}} onSaveShifts={(s) => {setCartShifts(s); registerLog('update', 'Carrinhos', 'Inscrição/Cancelamento em turno')}} isReadOnly={true} currentUser={currentUser as Member} />;
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
         if (currentRole === SystemRole.SELECTIVE && !canEdit('report_inbox')) return <div className="p-8 text-center text-gray-500">Acesso negado. Consulte o administrador.</div>;
         return <ReportInbox messages={inboxMessages} onMarkRead={handleMarkMessageRead} onDeleteMessage={handleDeleteInboxMessage} currentUser={currentUser as Member} isReadOnly={!canEdit('report_inbox')} members={members} groups={groups} />;
      case 'members':
        return <Members 
            members={members} 
            groups={groups} 
            onAddMember={m => { setMembers(p => [...p, m]); registerLog('create', 'Publicadores', `Adicionado: ${m.fullName}`); }} 
            onUpdateMember={m => { setMembers(p => p.map(i => i.id === m.id ? m : i)); registerLog('update', 'Publicadores', `Editado: ${m.fullName}`); }} 
            onDeleteMember={id => { const m = members.find(i => i.id === id); setMembers(p => p.filter(i => i.id !== id)); registerLog('delete', 'Publicadores', `Excluído: ${m?.fullName || id}`); }} 
            isReadOnly={!canEdit('members')} 
        />;
      case 'groups':
        return <Groups 
            groups={groups} 
            members={members} 
            reports={serviceReports} 
            inboxMessages={inboxMessages} 
            onAddGroup={g => { setGroups(p => [...p, g]); registerLog('create', 'Grupos', `Adicionado: ${g.name}`); }} 
            onUpdateGroup={g => { setGroups(p => p.map(i => i.id === g.id ? g : i)); registerLog('update', 'Grupos', `Editado: ${g.name}`); }} 
            onDeleteGroup={id => { const g = groups.find(i => i.id === id); setGroups(p => p.filter(i => i.id !== id)); registerLog('delete', 'Grupos', `Excluído: ${g?.name || id}`); }} 
            isReadOnly={!canEdit('groups')} 
        />;
      case 'territories':
        // Lógica de visualização para Todos, Edição apenas para quem tem permissão
        return <Territories 
            territories={territories} 
            members={members} 
            history={territoryHistory} 
            onSaveTerritories={(t) => { setTerritories(t); registerLog('update', 'Territórios', 'Atualização de territórios'); }} 
            onSaveHistory={(h) => setTerritoryHistory(h)} 
            isReadOnly={!canEdit('territories')} 
        />;
      case 'public_witnessing':
        return <PublicWitnessing 
            locations={cartLocations} 
            shifts={cartShifts} 
            members={members} 
            onSaveLocations={(l) => { setCartLocations(l); registerLog('update', 'Carrinhos', 'Atualização de Locais'); }} 
            onSaveShifts={(s) => { setCartShifts(s); registerLog('update', 'Carrinhos', 'Atualização de Turnos'); }} 
            isReadOnly={!canManageService()} 
            currentUser={currentUser as Member} 
        />;
      case 'attendance':
        return <Attendance 
            records={attendance} 
            onAddRecord={r => { setAttendance(p => [...p, r]); registerLog('create', 'Assistência', `Registro: ${r.count}`); }} 
            onDeleteRecord={id => { setAttendance(p => p.filter(i => i.id !== id)); registerLog('delete', 'Assistência', 'Registro excluído'); }} 
            isReadOnly={!canEdit('attendance')} 
        />;
      case 'reports':
        return <ServiceReports 
            members={members} 
            groups={groups} 
            reports={serviceReports} 
            onSaveReports={newR => { 
                setServiceReports(p => [...p.filter(pr => !newR.some(nr => nr.id === pr.id)), ...newR]);
                registerLog('update', 'Relatórios', `Atualização em massa (${newR.length} itens)`);
            }} 
            isReadOnly={!canEdit('reports')} 
        />;
      case 'data':
        if (currentRole !== SystemRole.TOTAL) return <div className="p-8 text-center text-gray-500">Acesso restrito ao Administrador Geral.</div>;
        return <DataManagement 
            members={members} 
            groups={groups} 
            reports={serviceReports} 
            attendance={attendance} 
            onImportData={(data) => { 
                // Lógica simples de importação
                if(data.members) setMembers(data.members); 
                registerLog('create', 'Backup', 'Importação de Backup realizada');
            }} 
            onResetInbox={handleResetInbox} 
            onDeleteAllReports={handleDeleteAllReports} 
            onMasterReset={handleMasterReset} 
        />;
      case 'schedule':
        return <MeetingSchedule 
            members={members} 
            schedules={schedules} 
            onSaveSchedule={s => { 
                setSchedules(p => { const exists = p.some(ps => ps.id === s.id); return exists ? p.map(ps => ps.id === s.id ? s : ps) : [...p, s]; });
                registerLog('update', 'Vida e Ministério', `Semana de ${s.date}`);
            }} 
            onDeleteSchedule={id => { setSchedules(p => p.filter(s => s.id !== id)); registerLog('delete', 'Vida e Ministério', 'Semana excluída'); }} 
            isReadOnly={!canEdit('schedule')} 
        />;
      case 'duties':
        return <DutyRoster 
            assignments={duties} 
            members={members} 
            onSaveAssignments={(a) => { setDuties(a); registerLog('update', 'Apoio', 'Atualização de escala'); }} 
            isReadOnly={!canEdit('duties')} 
        />;
      case 'cleaning':
        return <CleaningRoster 
            assignments={cleaningSchedule} 
            groups={groups} 
            onSaveAssignments={(a) => { setCleaningSchedule(a); registerLog('update', 'Limpeza', 'Atualização de escala'); }} 
            globalObservations={cleaningNotes} 
            onSaveGlobalObservations={(n) => setCleaningNotes(n)} 
            isReadOnly={!canEdit('cleaning')} 
        />;
      case 'chairman_readers':
        return <ChairmanReaderRoster 
            assignments={chairmanReaders} 
            onSaveAssignments={(a) => { setChairmanReaders(a); registerLog('update', 'Presidentes', 'Atualização de escala'); }} 
            isReadOnly={!canEdit('chairman_readers')} 
            members={members} 
        />;
      case 'field_service':
        return <FieldServiceRoster 
            meetings={fieldServiceSchedule} 
            onSaveMeetings={(m) => { setFieldServiceSchedule(m); registerLog('update', 'Saídas de Campo', 'Atualização de escala'); }} 
            isReadOnly={!canEdit('field_service')} 
            members={members} 
        />;
      case 'public_talks':
        return <PublicTalks 
            talks={publicTalks} 
            outlines={publicTalkOutlines} 
            onSaveTalks={(t) => { setPublicTalks(t); registerLog('update', 'Discursos', 'Agenda atualizada'); }} 
            onSaveOutlines={(o) => setPublicTalkOutlines(o)} 
            isReadOnly={!canEdit('public_talks')} 
        />;
      case 'idea_bank':
        return <IdeaBank />;
      case 'access':
        if (currentRole !== SystemRole.TOTAL) return <div className="p-8 text-center text-gray-500">Acesso restrito ao Administrador Geral.</div>;
        return <AccessControl 
            members={members} 
            settings={settings} 
            onUpdateMember={m => { setMembers(p => p.map(i => i.id === m.id ? m : i)); registerLog('update', 'Acesso', `Permissões de ${m.fullName}`); }} 
            onUpdateSettings={setSettings} 
        />;
      case 'logs':
        if (currentRole !== SystemRole.TOTAL) return <div className="p-8 text-center text-gray-500">Acesso restrito ao Administrador Geral.</div>;
        return <SystemLog logs={systemLogs} />;
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
      <LGPDBanner />
      <SideMenu 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
        userRole={currentRole}
        currentUserRoles={(currentUser && 'roles' in currentUser) ? currentUser.roles : []}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden p-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 print-hidden">
            <button onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="flex flex-col items-center">
               <span className="font-bold text-lg text-purple-900 leading-none">Z-Elo</span>
               <span className="text-[10px] text-purple-600 font-medium leading-none">Gestão de Congregação</span>
            </div>
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