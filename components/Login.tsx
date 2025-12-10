
import React, { useState, useEffect } from 'react';
import { Member, SystemRole, AppSettings } from '../types';
import { Users, ShieldCheck, Lock, LogIn, BookOpen, Eye, EyeOff, AlertOctagon, Clock, Phone, Link as LinkIcon, Lightbulb } from 'lucide-react';
import { verifyPassword } from '../services/securityService';

interface LoginProps {
  members: Member[];
  settings: AppSettings;
  onLogin: (role: SystemRole, member?: Member) => void;
}

const Login: React.FC<LoginProps> = ({ members, settings, onLogin }) => {
  const [tab, setTab] = useState<'admin' | 'publisher'>('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Alterado de selectedMemberId (select) para identifier (input texto)
  const [identifier, setIdentifier] = useState(''); 
  const [error, setError] = useState('');
  
  // Security States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLocked && lockTimer > 0) {
      timer = setTimeout(() => setLockTimer(prev => prev - 1), 1000);
    } else if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
      setFailedAttempts(0);
      setError('');
    }
    return () => clearTimeout(timer);
  }, [isLocked, lockTimer]);

  const handleFailedAttempt = (msg: string) => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setIsLocked(true);
      setLockTimer(30); // 30 segundos de bloqueio
      setError('Muitas tentativas incorretas. Aguarde para tentar novamente.');
    } else {
      setError(`${msg} (Tentativa ${newAttempts}/3)`);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    // Verifica a senha usando o serviço de segurança
    const adminPass = settings.adminPassword || '1234';
    
    if (verifyPassword(password, adminPass)) {
      onLogin(SystemRole.TOTAL);
    } else {
      handleFailedAttempt('Senha de administrador incorreta.');
    }
  };

  const handlePublisherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (!identifier.trim()) {
        setError('Por favor, digite seu nome ou telefone.');
        return;
    }

    // 1. Normaliza a entrada para busca
    const cleanInput = identifier.trim().toLowerCase();
    const cleanInputPhone = identifier.replace(/\D/g, ''); // Apenas números

    // 2. Busca o membro por Nome Completo OU Telefone
    const member = members.find(m => {
        const mName = m.fullName.toLowerCase();
        const mPhone = m.phone ? m.phone.replace(/\D/g, '') : '';
        
        // Match exato de nome ou match de telefone (se tiver pelo menos 8 digitos para evitar falsos positivos curtos)
        return mName === cleanInput || (cleanInputPhone.length >= 8 && mPhone.includes(cleanInputPhone));
    });
    
    if (!member) {
      setError('Cadastro não encontrado. Verifique se digitou o nome completo ou telefone corretamente.');
      return;
    }

    // 3. Se o membro tiver senha, verifica
    if (member.password) {
       if (!password) {
           setError('Este usuário possui senha protegida. Digite a senha.');
           return;
       }
       const isValid = verifyPassword(password, member.password);
       if (!isValid) {
          handleFailedAttempt('Senha incorreta.');
          return;
       }
    }

    // 4. Determina o papel do usuário
    let role = SystemRole.RESTRICTED; // Padrão
    if (member.customRole === SystemRole.TOTAL) role = SystemRole.TOTAL;
    if (member.customRole === SystemRole.SELECTIVE) role = SystemRole.SELECTIVE;

    onLogin(role, member);
  };

  return (
    <div className="min-h-screen bg-purple-900 flex flex-col items-center justify-center p-4">
      
      <div className="mb-8 text-center animate-fade-in flex flex-col items-center">
        {/* LOGOTIPO CUSTOMIZADO Z-ELO */}
        <div className="relative w-24 h-24 mb-4">
            {/* Fundo do Ícone */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border-4 border-purple-200">
               {/* Corrente (Elo) ao fundo */}
               <LinkIcon 
                  size={60} 
                  className="text-purple-100 absolute -rotate-45 stroke-[3px]" 
               />
               {/* Letra Z Central */}
               <span className="relative z-10 text-6xl font-black text-purple-800 tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                 Z
               </span>
            </div>
            
            {/* Lâmpada (Ideia/Luz) flutuante */}
            <div className="absolute -top-2 -right-2 bg-amber-400 p-2 rounded-full shadow-lg border-2 border-purple-900 z-20 animate-bounce">
               <Lightbulb size={20} className="text-white fill-white" />
            </div>
        </div>

        <h1 className="text-5xl font-bold text-white tracking-tight mb-1">Z-Elo</h1>
        <p className="text-purple-200 text-lg flex items-center gap-2">
           <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
           Cuidado e Ordem
           <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
        </p>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in relative">
        
        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <AlertOctagon size={48} className="text-red-500 mb-4" />
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Acesso Temporariamente Bloqueado</h3>
             <p className="text-slate-600 mb-6">Muitas tentativas falhas. Por segurança, aguarde.</p>
             <div className="flex items-center gap-2 text-2xl font-mono font-bold text-purple-700 bg-purple-100 px-6 py-3 rounded-xl">
                <Clock className="animate-pulse" /> {lockTimer}s
             </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${tab === 'admin' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-400 hover:bg-gray-50'}`}
            onClick={() => { setTab('admin'); setError(''); setPassword(''); setIdentifier(''); setFailedAttempts(0); }}
          >
            <ShieldCheck size={18} /> Administração
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${tab === 'publisher' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-400 hover:bg-gray-50'}`}
            onClick={() => { setTab('publisher'); setError(''); setPassword(''); setIdentifier(''); setFailedAttempts(0); }}
          >
            <Users size={18} /> Sou Publicador
          </button>
        </div>

        <div className="p-8">
          {tab === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Acesso restrito para Secretário, Superintendentes e Administradores.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    autoFocus
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Digite a senha..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg animate-fade-in">{error}</p>}

              <button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2">
                <LogIn size={20} /> Entrar no Sistema
              </button>
            </form>
          ) : (
            <form onSubmit={handlePublisherLogin} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Digite seu nome completo ou telefone para acessar.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Identificação</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Nome completo ou celular"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sua Senha (Opcional)</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Se possuir senha..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                    >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 pl-1">Se você nunca cadastrou uma senha, deixe em branco.</p>
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg animate-fade-in">{error}</p>}

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2">
                <LogIn size={20} /> Acessar Painel
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400">© 2024 Z-Elo v1.0 • Proteção Ativa</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
