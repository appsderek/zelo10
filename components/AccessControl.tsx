import React, { useState } from 'react';
import { Member, SystemRole, AppSettings, ALL_MODULES, ModuleKey } from '../types';
import { Shield, Search, Key, UserCog, Save, AlertCircle } from 'lucide-react';
import { hashPassword } from '../services/securityService';

interface AccessControlProps {
  members: Member[];
  settings: AppSettings;
  onUpdateMember: (member: Member) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const AccessControl: React.FC<AccessControlProps> = ({ members, settings, onUpdateMember, onUpdateSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado local para a senha do admin (não mostramos a senha atual por segurança se já estiver em hash)
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateAdminPassword = () => {
    if (!adminPasswordInput) return;
    // Salva o HASH da senha, não a senha em si
    const hashed = hashPassword(adminPasswordInput);
    onUpdateSettings({ ...settings, adminPassword: hashed });
    alert('Senha de Administrador atualizada e protegida!');
    setAdminPasswordInput('');
  };

  const handleUpdateMemberRole = (member: Member, role: SystemRole) => {
    const updatedMember = { ...member, customRole: role };
    if (role !== SystemRole.SELECTIVE) {
      updatedMember.permissions = {};
    }
    onUpdateMember(updatedMember);
  };

  const handleTogglePermission = (member: Member, moduleKey: ModuleKey) => {
    const currentPermissions = member.permissions || {};
    const updatedPermissions = {
        ...currentPermissions,
        [moduleKey]: !currentPermissions[moduleKey]
    };
    onUpdateMember({ ...member, permissions: updatedPermissions });
  };

  const handleSaveMemberPassword = (member: Member) => {
    if (!newPassword) return;
    // Salva o HASH da senha do membro
    const hashed = hashPassword(newPassword);
    onUpdateMember({ ...member, password: hashed });
    setEditingMemberId(null);
    setNewPassword('');
    alert(`Senha definida para ${member.fullName}.`);
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Controle de Acesso</h2>
        <p className="text-slate-500">Gerenciamento de senhas e permissões do sistema.</p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
           <Shield size={14} /> Segurança Ativada: Criptografia & Hashing
        </div>
      </div>

      {/* ADMIN PASSWORD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
        <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
            <Shield size={20} /> Senha do Administrador
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-1/2">
                <label className="text-xs font-bold text-gray-500 uppercase">Definir Nova Senha Principal</label>
                <div className="flex items-center gap-2 mt-1">
                    <input 
                        type="password" 
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Digite nova senha para alterar..."
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button 
                        onClick={handleUpdateAdminPassword}
                        className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
                        title="Salvar Senha Admin"
                    >
                        <Save size={20} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">A senha será criptografada antes de salvar.</p>
            </div>
        </div>
      </div>

      {/* USER PERMISSIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCog size={20} /> Permissões de Usuários
            </h3>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar publicador..." 
                    className="pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                        <th className="px-6 py-3 font-bold">Nome</th>
                        <th className="px-6 py-3 font-bold">Nível de Acesso</th>
                        <th className="px-6 py-3 font-bold">Senha Pessoal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map(member => (
                        <React.Fragment key={member.id}>
                          <tr className="hover:bg-gray-50">
                              <td className="px-6 py-3 font-medium text-slate-800 align-top">
                                {member.fullName}
                                <p className="text-xs text-slate-400 font-normal">{member.privilege}</p>
                              </td>
                              <td className="px-6 py-3 align-top">
                                  <select 
                                      className={`p-1 rounded border text-xs font-bold w-full
                                          ${member.customRole === SystemRole.TOTAL ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                          ${member.customRole === SystemRole.SELECTIVE ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                          ${member.customRole === SystemRole.RESTRICTED ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                                      `}
                                      value={member.customRole || SystemRole.RESTRICTED}
                                      onChange={(e) => handleUpdateMemberRole(member, e.target.value as SystemRole)}
                                  >
                                      <option value={SystemRole.TOTAL}>Total (Admin)</option>
                                      <option value={SystemRole.SELECTIVE}>Seletivo (Gerenciável)</option>
                                      <option value={SystemRole.RESTRICTED}>Restrito (Visualização)</option>
                                  </select>
                              </td>
                              <td className="px-6 py-3 align-top">
                                  {editingMemberId === member.id ? (
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="text" 
                                              placeholder="Nova senha"
                                              className="w-24 p-1 border rounded text-xs"
                                              value={newPassword}
                                              onChange={(e) => setNewPassword(e.target.value)}
                                          />
                                          <button onClick={() => handleSaveMemberPassword(member)} className="text-green-600 hover:text-green-800"><Save size={16} /></button>
                                          <button onClick={() => setEditingMemberId(null)} className="text-red-500 hover:text-red-700"><AlertCircle size={16} /></button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400 font-mono">
                                              {member.password ? 'Hasheada 🔒' : 'Sem senha'}
                                          </span>
                                          <button 
                                              onClick={() => { setEditingMemberId(member.id); setNewPassword(''); }}
                                              className="text-purple-500 hover:text-purple-700 p-1 bg-purple-50 rounded"
                                              title="Definir Senha"
                                          >
                                              <Key size={14} />
                                          </button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                          
                          {/* PAINEL DE PERMISSÕES SELETIVAS */}
                          {member.customRole === SystemRole.SELECTIVE && (
                            <tr className="bg-blue-50/50">
                                <td colSpan={3} className="px-6 py-4">
                                    <p className="text-xs font-bold text-blue-800 mb-3">Módulos que {member.fullName.split(' ')[0]} pode <span className="underline">EDITAR</span>:</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                                        {Object.entries(ALL_MODULES).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                                                <input 
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={!!member.permissions?.[key as ModuleKey]}
                                                    onChange={() => handleTogglePermission(member, key as ModuleKey)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                          )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AccessControl;