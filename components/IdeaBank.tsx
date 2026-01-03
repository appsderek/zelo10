
import React, { useState } from 'react';
import { Lightbulb, Sparkles, Send, Loader2, BookOpen, AlertTriangle, Users, Flag, Briefcase, Gem, Baby, GraduationCap, Accessibility } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askIdeaBank, IdeaMode } from '../services/geminiService';

const IdeaBank: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Novos Estados para Modos
  const [searchMode, setSearchMode] = useState<IdeaMode>('general');
  const [targetAudience, setTargetAudience] = useState('Crianças'); // Default context

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setResult('');
    setError('');

    try {
      // Passa o modo e o contexto (se for audience)
      const context = searchMode === 'audience' ? targetAudience : undefined;
      const response = await askIdeaBank(topic, searchMode, context);
      setResult(response);
    } catch (err) {
      setError('Ocorreu um erro ao buscar as ilustrações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const ModeButton = ({ mode, label, icon: Icon, colorClass }: { mode: IdeaMode, label: string, icon: any, colorClass: string }) => (
      <button
        type="button"
        onClick={() => setSearchMode(mode)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${searchMode === mode ? `${colorClass} ring-2 ring-offset-1` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
      >
          <Icon size={20} className="mb-1" />
          <span className="text-[10px] font-bold uppercase">{label}</span>
      </button>
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-amber-100 rounded-full text-amber-600 mb-4 shadow-sm">
           <Lightbulb size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Banco de Ideias Teocrático</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Ferramenta auxiliar para oradores. Gere ilustrações, aplicações e ideias baseadas nos princípios do <span className="font-bold text-purple-700">JW.ORG</span>.
        </p>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
        <form onSubmit={handleSearch} className="relative space-y-4">
          
          {/* MÓDULO DE SELEÇÃO DE TIPO */}
          <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                 O que você precisa hoje?
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  <ModeButton mode="general" label="Ilustrações" icon={Sparkles} colorClass="bg-purple-100 border-purple-300 text-purple-700 ring-purple-400" />
                  <ModeButton mode="audience" label="Adaptar Público" icon={Users} colorClass="bg-blue-100 border-blue-300 text-blue-700 ring-blue-400" />
                  <ModeButton mode="conclusion" label="Conclusão" icon={Flag} colorClass="bg-green-100 border-green-300 text-green-700 ring-green-400" />
                  <ModeButton mode="ministry" label="Para o Campo" icon={Briefcase} colorClass="bg-orange-100 border-orange-300 text-orange-700 ring-orange-400" />
                  <ModeButton mode="rare" label="Fugir do Óbvio" icon={Gem} colorClass="bg-pink-100 border-pink-300 text-pink-700 ring-pink-400" />
              </div>
          </div>

          {/* SELEÇÃO DE PÚBLICO (CONDICIONAL) */}
          {searchMode === 'audience' && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-fade-in">
                  <label className="block text-xs font-bold text-blue-800 mb-2 uppercase flex items-center gap-2">
                      <Users size={14} /> Selecione o Público-Alvo:
                  </label>
                  <div className="flex flex-wrap gap-2">
                      {['Crianças', 'Jovens/Adolescentes', 'Idosos', 'Estudantes da Bíblia', 'Maridos/Esposas'].map(aud => (
                          <button
                            key={aud}
                            type="button"
                            onClick={() => setTargetAudience(aud)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${targetAudience === aud ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                          >
                              {aud}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          <div className="relative">
            <input 
              type="text" 
              placeholder="Digite o tema (Ex: Fé, Perseverança, Resgate...)" 
              className="w-full p-4 pr-32 bg-slate-50 border border-slate-200 rounded-xl text-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
            <div className="absolute right-2 top-2 bottom-2">
                <button 
                type="submit" 
                disabled={isLoading || !topic.trim()}
                className="h-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-6 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                <span className="hidden sm:inline">Gerar</span>
                </button>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 justify-center">
             <ShieldCheckIcon size={12} />
             O assistente utiliza apenas fontes teocráticas e princípios bíblicos.
          </p>
        </form>
      </div>

      {/* RESULTS AREA */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
           <div className={`p-4 border-b flex items-center gap-2 font-bold ${
               searchMode === 'audience' ? 'bg-blue-50 text-blue-800 border-blue-100' :
               searchMode === 'conclusion' ? 'bg-green-50 text-green-800 border-green-100' :
               searchMode === 'ministry' ? 'bg-orange-50 text-orange-800 border-orange-100' :
               searchMode === 'rare' ? 'bg-pink-50 text-pink-800 border-pink-100' :
               'bg-purple-50 text-purple-800 border-purple-100'
           }`}>
              <BookOpen size={20} />
              Resultados da Pesquisa
              {searchMode === 'audience' && <span className="text-xs bg-white/50 px-2 py-0.5 rounded ml-auto">Para: {targetAudience}</span>}
           </div>
           <div className="p-8 prose prose-purple max-w-none prose-headings:font-bold prose-h1:text-xl prose-p:text-slate-600">
              <ReactMarkdown>{result}</ReactMarkdown>
           </div>
           <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
              * Lembre-se sempre de verificar os raciocínios com a Bíblia e as publicações recentes.
           </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!result && !isLoading && !error && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 opacity-60">
            <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
               <h4 className="font-bold text-slate-600 mb-2 flex items-center justify-center gap-2"><Baby size={16} /> Adaptação</h4>
               <p className="text-xs text-slate-400">Torne conceitos complexos simples para crianças ou idosos.</p>
            </div>
            <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
               <h4 className="font-bold text-slate-600 mb-2 flex items-center justify-center gap-2"><Briefcase size={16} /> Prática</h4>
               <p className="text-xs text-slate-400">Transforme temas de discursos em apresentações para o campo.</p>
            </div>
            <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
               <h4 className="font-bold text-slate-600 mb-2 flex items-center justify-center gap-2"><Gem size={16} /> Profundidade</h4>
               <p className="text-xs text-slate-400">Descubra pérolas escondidas e exemplos bíblicos menos usados.</p>
            </div>
         </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
           <AlertTriangle />
           {error}
        </div>
      )}
    </div>
  );
};

// Helper Icon for internal use
const ShieldCheckIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default IdeaBank;
