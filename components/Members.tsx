import React, { useState } from 'react';
import { Member, MemberStatus, MemberPrivilege, PioneerStatus, Group, ADMIN_ROLES } from '../types';
import { Search, Plus, Edit2, Trash2, X, Phone, MapPin, Calendar, HeartPulse, Clock, StickyNote, AlertTriangle, Mail, Eye, Tag } from 'lucide-react';

interface MembersProps {
  members: Member[];
  groups: Group[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  isReadOnly?: boolean;
}

const Members: React.FC<MembersProps> = ({ members, groups, onAddMember, onUpdateMember, onDeleteMember, isReadOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const [formData, setFormData] = useState<Partial<Member>>({
    fullName: '',
    birthDate: '',
    baptismDate: '',
    address: '',
    phone: '',
    email: '',
    emergencyContact: '',
    serviceGroup: '',
    status: MemberStatus.ACTIVE,
    privilege: MemberPrivilege.PUBLISHER,
    pioneerStatus: PioneerStatus.NONE,
    auxiliaryPioneerPeriod: '',
    observations: '',
    roles: []
  });

  const formatDateDisplay = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      const parts = dateString.split('-'); // [YYYY, MM, DD]
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const handleOpenFormModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        ...member,
        roles: member.roles || [] // Garante array vazio se undefined
      });
    } else {
      if(isReadOnly) return; // Prevent creating new if readonly
      setEditingMember(null);
      setFormData({
        fullName: '',
        birthDate: '',
        baptismDate: '',
        address: '',
        phone: '',
        email: '',
        emergencyContact: '',
        status: MemberStatus.ACTIVE,
        serviceGroup: groups.length > 0 ? groups[0].name : '',
        privilege: MemberPrivilege.PUBLISHER,
        pioneerStatus: PioneerStatus.NONE,
        auxiliaryPioneerPeriod: '',
        observations: '',
        roles: []
      });
    }
    setIsFormModalOpen(true);
  };

  const handleToggleRole = (role: string) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const currentRoles = prev.roles || [];
      if (currentRoles.includes(role)) {
        return { ...prev, roles: currentRoles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (editingMember) {
      onUpdateMember({ ...editingMember, ...formData } as Member);
    } else {
      onAddMember({ ...formData, id: crypto.randomUUID() } as Member);
    }
    setIsFormModalOpen(false);
  };

  const handleRequestDelete = (member: Member) => {
    if(isReadOnly) return;
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (memberToDelete && memberToDelete.id) {
      onDeleteMember(memberToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.serviceGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: MemberStatus) => {
    switch(status) {
      case MemberStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case MemberStatus.IRREGULAR: return 'bg-amber-100 text-amber-800 border-amber-200';
      case MemberStatus.INACTIVE: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrivilegeBadge = (member: Member) => {
    const badges = [];
    if (member.privilege === MemberPrivilege.ELDER) badges.push({ text: 'Ancião', color: 'bg-indigo-100 text-indigo-700' });
    if (member.privilege === MemberPrivilege.MINISTERIAL_SERVANT) badges.push({ text: 'Servo Min.', color: 'bg-blue-100 text-blue-700' });
    if (member.privilege === MemberPrivilege.UNBAPTIZED_PUBLISHER) badges.push({ text: 'Pub. Ñ Batizado', color: 'bg-slate-200 text-slate-700' });
    
    if (member.pioneerStatus === PioneerStatus.REGULAR) badges.push({ text: 'Pioneiro Regular', color: 'bg-purple-100 text-purple-700' });
    if (member.pioneerStatus === PioneerStatus.AUXILIARY) badges.push({ text: 'Pioneiro Auxiliar', color: 'bg-pink-100 text-pink-700' });
    
    return badges;
  };

  const inputClass = `w-full p-2.5 bg-white border border-purple-200 rounded-lg text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow ${isReadOnly ? 'cursor-not-allowed bg-slate-50 text-slate-600' : ''}`;
  const labelClass = "text-sm font-semibold text-purple-800 mb-1 block";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Publicadores</h2>
          <p className="text-slate-500">Gerenciamento de registros e designações.</p>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => handleOpenFormModal()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Novo Cadastro
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou grupo..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-purple-100 rounded-xl text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between hover:border-purple-300 transition-all group">
            
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">{member.fullName}</h3>
              <p className="text-sm text-purple-600 font-medium mb-3">{member.serviceGroup}</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {getPrivilegeBadge(member).map((b, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-md font-medium ${b.color}`}>
                    {b.text}
                  </span>
                ))}
                {member.pioneerStatus === PioneerStatus.AUXILIARY && member.auxiliaryPioneerPeriod && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-pink-50 text-pink-600 border border-pink-100 flex items-center gap-1">
                    <Clock size={10} /> {member.auxiliaryPioneerPeriod}
                  </span>
                )}
              </div>

              {/* Tags de Funções Administrativas */}
              {member.roles && member.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {member.roles.map((role, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-700 text-white border border-slate-600">
                      {role}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm text-slate-600 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Nasc: {formatDateDisplay(member.birthDate)}</span>
                  <span className="text-slate-300">|</span>
                  <span>Bat: {formatDateDisplay(member.baptismDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span>{member.phone}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="truncate">{member.address}</span>
                </div>
                 <div className="flex items-center gap-2 text-red-500 bg-red-50 p-1.5 rounded-md text-xs mt-2">
                  <HeartPulse size={14} />
                  <span className="font-medium truncate">Emergência: {member.emergencyContact}</span>
                </div>
                {member.observations && (
                   <div className="flex items-start gap-2 text-slate-500 bg-slate-50 p-2 rounded-md text-xs mt-2 italic border border-slate-100">
                    <StickyNote size={14} className="shrink-0 mt-0.5" />
                    <span>{member.observations}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 justify-end relative z-10">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenFormModal(member); }} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border cursor-pointer ${isReadOnly ? 'text-slate-500 bg-slate-50 border-slate-200' : 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-100'}`}
                >
                   {isReadOnly ? <Eye size={16} /> : <Edit2 size={16} />}
                   {isReadOnly ? 'Ver' : 'Editar'}
                </button>
                {!isReadOnly && (
                  <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleRequestDelete(member); 
                    }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 cursor-pointer"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>Nenhum publicador encontrado.</p>
        </div>
      )}

      {/* Modal de Formulário */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-purple-100 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-purple-900">
                {isReadOnly ? 'Detalhes do Publicador' : (editingMember ? 'Editar Publicador' : 'Novo Publicador')}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-purple-300 hover:text-purple-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informações Pessoais */}
              <div>
                <h4 className="text-sm uppercase tracking-wide text-purple-400 font-bold mb-4 border-b border-purple-100 pb-2">Informações Pessoais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Nome Completo</label>
                    <input required type="text" className={inputClass} disabled={isReadOnly}
                      value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Grupo de Serviço</label>
                    <select className={inputClass} disabled={isReadOnly}
                      value={formData.serviceGroup || ''} onChange={e => setFormData({...formData, serviceGroup: e.target.value})}>
                      <option value="">Selecione...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Data de Nascimento</label>
                    <input type="date" className={inputClass} disabled={isReadOnly}
                      value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Data de Batismo</label>
                    <input type="date" className={inputClass} disabled={isReadOnly}
                      value={formData.baptismDate || ''} onChange={e => setFormData({...formData, baptismDate: e.target.value})} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className={labelClass}>Endereço</label>
                    <input type="text" className={inputClass} disabled={isReadOnly}
                      value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Telefone (WhatsApp)</label>
                    <input type="tel" className={inputClass} placeholder="(99) 99999-9999" disabled={isReadOnly}
                      value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Email (Opcional)</label>
                    <input type="email" className={inputClass} placeholder="exemplo@email.com" disabled={isReadOnly}
                      value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Contato de Emergência</label>
                    <input type="text" className={inputClass} disabled={isReadOnly}
                      value={formData.emergencyContact || ''} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Informações Espirituais */}
              <div>
                <h4 className="text-sm uppercase tracking-wide text-purple-400 font-bold mb-4 border-b border-purple-100 pb-2">Dados Teocráticos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className={labelClass}>Situação</label>
                    <div className="flex gap-4 p-2 bg-purple-50 rounded-lg border border-purple-100">
                      {Object.values(MemberStatus).map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="status" 
                            disabled={isReadOnly}
                            checked={formData.status === status} 
                            onChange={() => setFormData({...formData, status})}
                            className="text-purple-600 focus:ring-purple-500 border-purple-300"
                          />
                          <span className="text-sm text-purple-900 font-medium">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>Privilégio / Designação</label>
                    <select className={inputClass} disabled={isReadOnly}
                      value={formData.privilege || MemberPrivilege.PUBLISHER} 
                      onChange={e => setFormData({...formData, privilege: e.target.value as MemberPrivilege})}>
                      {Object.values(MemberPrivilege).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={labelClass}>Pioneiro</label>
                    <select className={inputClass} disabled={isReadOnly}
                      value={formData.pioneerStatus || PioneerStatus.NONE} 
                      onChange={e => setFormData({...formData, pioneerStatus: e.target.value as PioneerStatus})}>
                      {Object.values(PioneerStatus).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.pioneerStatus === PioneerStatus.AUXILIARY && (
                    <div className="space-y-1 md:col-span-2 bg-white p-3 rounded-lg border border-pink-200 shadow-sm">
                      <label className="text-sm font-semibold text-pink-700 flex items-center gap-2 mb-1">
                        <Clock size={16} /> Período de Pioneiro Auxiliar
                      </label>
                      <input 
                        type="text" 
                        disabled={isReadOnly}
                        placeholder="Ex: Março 2024 ou Indeterminado" 
                        className={`w-full p-2.5 bg-pink-50 border border-pink-200 rounded-lg text-pink-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                        value={formData.auxiliaryPioneerPeriod || ''} 
                        onChange={e => setFormData({...formData, auxiliaryPioneerPeriod: e.target.value})} 
                      />
                    </div>
                  )}

                  {/* SEÇÃO DE FUNÇÕES ADMINISTRATIVAS */}
                  <div className="space-y-1 md:col-span-2 mt-2">
                     <label className={`${labelClass} flex items-center gap-2`}>
                        <Tag size={16} /> Funções e Supervisões Adicionais
                     </label>
                     <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {ADMIN_ROLES.map(role => {
                           const isSelected = formData.roles?.includes(role);
                           return (
                             <button
                               type="button"
                               key={role}
                               disabled={isReadOnly}
                               onClick={() => handleToggleRole(role)}
                               className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                 isSelected 
                                 ? 'bg-slate-700 text-white border-slate-800 shadow-md' 
                                 : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                               } ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                             >
                                {role}
                             </button>
                           );
                        })}
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1 pl-1">Clique para adicionar ou remover funções.</p>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className={labelClass}>Observações</label>
                    <textarea 
                      className={inputClass}
                      disabled={isReadOnly}
                      rows={3}
                      placeholder="Informações adicionais, mudanças, saúde, etc."
                      value={formData.observations || ''}
                      onChange={e => setFormData({...formData, observations: e.target.value})}
                    ></textarea>
                  </div>

                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-purple-100">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition-colors">
                  {isReadOnly ? 'Fechar' : 'Cancelar'}
                </button>
                {!isReadOnly && (
                  <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                    Salvar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && memberToDelete && !isReadOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="p-3 bg-red-100 rounded-full">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
             </div>
             <p className="text-slate-600 mb-6">
               Tem certeza que deseja excluir o publicador <strong>{memberToDelete.fullName}</strong>? 
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

export default Members;