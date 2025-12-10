import React, { useState } from 'react';
import { AttendanceRecord, MeetingType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Trash2, CalendarCheck } from 'lucide-react';

interface AttendanceProps {
  records: AttendanceRecord[];
  onAddRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  isReadOnly?: boolean;
}

const Attendance: React.FC<AttendanceProps> = ({ records, onAddRecord, onDeleteRecord, isReadOnly = false }) => {
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newDate, setNewDate] = useState(getTodayString());
  const [newCount, setNewCount] = useState('');
  const [newType, setNewType] = useState<MeetingType>(MeetingType.MIDWEEK);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newDate || !newCount) return;

    onAddRecord({
      id: crypto.randomUUID(),
      date: newDate,
      count: parseInt(newCount),
      type: newType
    });
    
    setNewDate(getTodayString());
    setNewCount('');
  };

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const inputClass = "w-full p-2.5 bg-white border border-purple-200 rounded-lg text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow";
  const labelClass = "block text-sm font-semibold text-purple-800 mb-1";

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold text-slate-800">Assistência às Reuniões</h2>
        <p className="text-slate-500">Histórico e lançamento de assistência.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form - Só exibe se NÃO for readOnly */}
        {!isReadOnly && (
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-lg mb-4 text-purple-900 flex items-center gap-2">
              <CalendarCheck size={20} /> Novo Lançamento
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={labelClass}>Data da Reunião</label>
                <input 
                  type="date" 
                  required
                  className={inputClass}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo de Reunião</label>
                <select 
                  className={inputClass}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MeetingType)}
                >
                  <option value={MeetingType.MIDWEEK}>{MeetingType.MIDWEEK}</option>
                  <option value={MeetingType.WEEKEND}>{MeetingType.WEEKEND}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Total de Assistência</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className={inputClass}
                  value={newCount}
                  onChange={(e) => setNewCount(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={18} /> Adicionar
              </button>
            </form>
          </div>
        )}

        {/* Chart - Ocupa mais espaço se não tiver o formulário */}
        <div className={`${isReadOnly ? 'col-span-3' : 'lg:col-span-2'} bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]`}>
          <h3 className="font-bold text-lg mb-6 text-slate-800">Evolução da Assistência</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedRecords}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', timeZone: 'UTC'})} 
                  stroke="#94A3B8"
                  tick={{fontSize: 12}}
                />
                <YAxis stroke="#94A3B8" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{color: '#64748B'}}
                  labelFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year: 'numeric', timeZone: 'UTC'})}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Assistência" 
                  stroke="#9333EA" 
                  strokeWidth={3} 
                  dot={{ fill: '#9333EA', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 font-medium text-slate-700">
          Últimos Registros
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 font-semibold bg-white">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Total</th>
                {!isReadOnly && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...sortedRecords].reverse().map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {new Date(record.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${record.type === MeetingType.WEEKEND ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{record.count}</td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDeleteRecord(record.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Excluir registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 3 : 4} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Nenhum registro de assistência encontrado.
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

export default Attendance;