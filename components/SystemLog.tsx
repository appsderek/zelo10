
import React, { useState } from 'react';
import { LogEntry } from '../types';
import { ScrollText, Search, Clock, User, Activity, Trash2, Filter } from 'lucide-react';

interface SystemLogProps {
  logs: LogEntry[];
}

const SystemLog: React.FC<SystemLogProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  // Obter lista única de módulos para o filtro
  const modules = Array.from(new Set(logs.map(log => log.module)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = filterModule === 'all' || log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-700 border-green-200';
      case 'update': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Criação';
      case 'update': return 'Edição';
      case 'delete': return 'Exclusão';
      default: return 'Ação';
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScrollText className="text-purple-600" /> Log do Sistema
          </h2>
          <p className="text-slate-500">Histórico das últimas 50 ações realizadas por administradores e usuários.</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por usuário ou descrição..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <Filter size={18} className="text-slate-400" />
           <select 
             className="p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-48 bg-white"
             value={filterModule}
             onChange={(e) => setFilterModule(e.target.value)}
           >
             <option value="all">Todos os Módulos</option>
             {modules.map(m => (
               <option key={m} value={m}>{m}</option>
             ))}
           </select>
        </div>
      </div>

      {/* TABELA DE LOGS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Módulo</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')} <span className="opacity-50">|</span> {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <User size={16} className="text-purple-400" />
                        {log.userName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit ${getActionColor(log.action)}`}>
                        {log.action === 'delete' && <Trash2 size={12} />}
                        {log.action === 'create' && <Activity size={12} />}
                        {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.description}>
                    {log.description}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                        <ScrollText size={32} className="opacity-20" />
                        <p>Nenhum registro encontrado no histórico recente.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemLog;
