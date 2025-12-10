import React, { useRef, useState } from 'react';
import { Member, Group, ServiceReport, AttendanceRecord } from '../types';
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, FileJson, Cloud, Database, Copy, RefreshCw, Trash2, FileX, ShieldAlert } from 'lucide-react';
import { PROJECT_URL, PROJECT_KEY } from '../services/supabaseService';

interface DataManagementProps {
  members: Member[];
  groups: Group[];
  reports: ServiceReport[];
  attendance: AttendanceRecord[];
  onImportData: (data: any) => void;
  onResetInbox?: () => void;
  onDeleteAllReports?: () => void;
  onMasterReset?: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ members, groups, reports, attendance, onImportData, onResetInbox, onDeleteAllReports, onMasterReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // Supabase Config State - agora fixo
  const supabaseUrl = PROJECT_URL;
  const supabaseKey = PROJECT_KEY;
  
  const handleReload = () => {
    window.location.reload();
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMembersCSV = () => {
    const headers = ['Nome Completo', 'Grupo', 'Situação', 'Privilégio', 'Pioneiro', 'Telefone', 'Endereço', 'Nascimento', 'Batismo'];
    const rows = members.map(m => [
      m.fullName,
      m.serviceGroup,
      m.status,
      m.privilege,
      m.pioneerStatus,
      m.phone,
      m.address,
      m.birthDate,
      m.baptismDate
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(field => `"${field || ''}"`).join(';'))
    ].join('\n');

    downloadCSV(csvContent, 'Publicadores_JW_Secretariado');
  };

  const exportReportsCSV = () => {
    const headers = ['Mês', 'Publicador', 'Grupo', 'Participou', 'Horas', 'Estudos'];
    const rows = reports.map(r => {
      const memberName = members.find(m => m.id === r.memberId)?.fullName || 'Desconhecido';
      const memberGroup = members.find(m => m.id === r.memberId)?.serviceGroup || '-';
      return [
        r.month,
        memberName,
        memberGroup,
        r.participated ? 'Sim' : 'Não',
        r.hours,
        r.bibleStudies
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(field => `"${field || ''}"`).join(';'))
    ].join('\n');

    downloadCSV(csvContent, 'Relatorios_Campo_JW_Secretariado');
  };

  const exportFullBackup = () => {
    // Busca dados extras do localStorage para incluir no backup já que não são passados como props aqui
    const schedules = localStorage.getItem('jw_schedules');
    const duties = localStorage.getItem('jw_duties');
    const cleaning = localStorage.getItem('jw_cleaning');
    const cleaningNotes = localStorage.getItem('jw_cleaning_notes');
    const chairmanReaders = localStorage.getItem('jw_chairman_readers');
    const fieldService = localStorage.getItem('jw_field_service');
    const publicTalks = localStorage.getItem('jw_public_talks');
    const publicTalkOutlines = localStorage.getItem('jw_public_talk_outlines');

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      data: { 
          members, 
          groups, 
          reports, 
          attendance,
          schedules: schedules ? JSON.parse(schedules) : [],
          duties: duties ? JSON.parse(duties) : [],
          cleaning: cleaning ? JSON.parse(cleaning) : [],
          cleaningNotes: cleaningNotes || '',
          chairmanReaders: chairmanReaders ? JSON.parse(chairmanReaders) : [],
          fieldService: fieldService ? JSON.parse(fieldService) : [],
          publicTalks: publicTalks ? JSON.parse(publicTalks) : [],
          publicTalkOutlines: publicTalkOutlines ? JSON.parse(publicTalkOutlines) : []
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BACKUP_SISTEMA_JW_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data || !json.data.members) throw new Error("Formato inválido.");
        onImportData(json.data);
        setImportStatus('success');
        setImportMessage(`Backup restaurado! ${json.data.members.length} membros.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        setImportStatus('error');
        setImportMessage("Erro ao ler o arquivo.");
      }
    };
    reader.readAsText(file);
  };

  const SQL_SCRIPT = `
-- COPIE ESTE CÓDIGO E RODE NO "SQL EDITOR" DO SUPABASE
create table if not exists jw_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table jw_data enable row level security;

-- Política de acesso total para o aplicativo funcionar via API Key
create policy "Acesso Total App" on jw_data
for all
using (true)
with check (true);
  `.trim();

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dados e Backup</h2>
        <p className="text-slate-500">Configuração de nuvem e exportação.</p>
      </div>

      {/* CLOUD CONFIGURATION */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-green-100 text-green-700`}>
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Sincronização na Nuvem (Supabase)</h3>
              <p className="text-sm text-slate-500">Banco de dados configurado no sistema.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleReload}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-xs font-bold transition-colors"
          >
            <RefreshCw size={14} /> Atualizar Conexão
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-6">
              
            <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Database size={18} /> Instruções Iniciais (Se necessário)
              </h4>
              <p className="text-sm text-purple-800 mb-3">
                Se os dados não estiverem salvando, certifique-se de ter rodado o script SQL abaixo no Painel do Supabase.
              </p>
              
              <div className="relative">
                <pre className="bg-slate-800 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto shadow-inner border border-slate-700">
                  {SQL_SCRIPT}
                </pre>
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SQL_SCRIPT);
                    alert('Código copiado!');
                  }}
                  className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-1.5 rounded-md transition-colors"
                  title="Copiar Código"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 mb-3">Credenciais do Sistema</h4>
              <p className="text-sm text-slate-500 mb-4">
                As credenciais abaixo já estão configuradas no código.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Project URL</label>
                  <input 
                    type="text" 
                    readOnly
                    className="w-full p-3 border border-slate-200 bg-slate-100 rounded-lg text-slate-500 cursor-not-allowed outline-none"
                    value={supabaseUrl}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">API Key</label>
                  <input 
                    type="password" 
                    readOnly
                    className="w-full p-3 border border-slate-200 bg-slate-100 rounded-lg text-slate-500 cursor-not-allowed outline-none"
                    value={supabaseKey}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartão de Exportação Planilhas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg text-green-700">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Exportar para Planilha</h3>
              <p className="text-xs text-slate-500">Gerar arquivos CSV</p>
            </div>
          </div>
          <div className="space-y-3">
            <button type="button" onClick={exportMembersCSV} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg transition-colors">
              <Download size={18} /> Baixar Lista de Publicadores
            </button>
            <button type="button" onClick={exportReportsCSV} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg transition-colors">
              <Download size={18} /> Baixar Relatórios de Campo
            </button>
          </div>
        </div>

        {/* Cartão de Backup JSON */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-700">
              <FileJson size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Backup Local (Arquivo)</h3>
              <p className="text-xs text-slate-500">Salvar ou restaurar arquivo .json</p>
            </div>
          </div>
          <div className="space-y-3">
            <button type="button" onClick={exportFullBackup} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg shadow-sm transition-colors">
              <Download size={18} /> Baixar Backup Completo
            </button>
            <div className="relative">
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium py-2 rounded-lg border-dashed transition-colors">
                <Upload size={18} /> Restaurar Backup
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* MAINTENANCE ZONE */}
      <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden mt-8">
            <div className="p-6 border-b border-red-200 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-red-900">Manutenção / Zona de Perigo</h3>
                    <p className="text-sm text-red-700">Ações irreversíveis para limpeza do sistema.</p>
                </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {onResetInbox && (
                  <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between">
                      <div className="mb-4">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                             <Trash2 size={16} className="text-red-500" /> Limpar Caixa de Entrada
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">Apaga permanentemente o histórico de mensagens recebidas dos publicadores.</p>
                      </div>
                      <button 
                          type="button"
                          onClick={(e) => {
                             e.preventDefault();
                             onResetInbox();
                          }}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                          <Trash2 size={16} /> Limpar Mensagens
                      </button>
                  </div>
                )}
                
                {onDeleteAllReports && (
                   <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between">
                      <div className="mb-4">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                             <FileX size={16} className="text-red-500" /> Apagar TODOS os Relatórios
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                             Zera as estatísticas, horas e estudos de todos os publicadores e remove as mensagens associadas.
                          </p>
                      </div>
                      <button 
                          type="button"
                          onClick={(e) => {
                             e.preventDefault();
                             onDeleteAllReports();
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                          <FileX size={16} /> Apagar Relatórios
                      </button>
                  </div>
                )}

                {onMasterReset && (
                   <div className="bg-white p-4 rounded-lg border-2 border-red-500 shadow-sm flex flex-col justify-between col-span-1 md:col-span-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <ShieldAlert size={80} className="text-red-600" />
                      </div>
                      <div className="mb-4 relative z-10">
                          <h4 className="font-bold text-red-600 flex items-center gap-2 text-lg">
                             <ShieldAlert size={20} /> RESET MESTRE (FÁBRICA)
                          </h4>
                          <p className="text-xs text-red-500 mt-1 font-bold">
                             ⚠️ CUIDADO: Esta ação apagará TODOS OS DADOS (Nuvem e Local) e reiniciará o sistema como novo.
                          </p>
                      </div>
                      <button 
                          type="button"
                          onClick={(e) => {
                             e.preventDefault();
                             onMasterReset();
                          }}
                          className="px-4 py-3 bg-black border border-red-500 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-600 font-black rounded-lg shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide relative z-10"
                      >
                          <ShieldAlert size={18} /> ZERAR SISTEMA COMPLETO
                      </button>
                  </div>
                )}
            </div>
        </div>

      {importStatus !== 'idle' && (
        <div className={`p-4 rounded-lg flex items-start gap-3 animate-fade-in ${importStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          {importStatus === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" /> : <AlertTriangle className="shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold">{importStatus === 'success' ? 'Sucesso!' : 'Erro na Importação'}</p>
            <p className="text-sm">{importMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;