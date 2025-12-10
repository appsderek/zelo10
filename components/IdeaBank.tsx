import React, { useState } from 'react';
import { Lightbulb, Sparkles, Send, Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askIdeaBank } from '../services/geminiService';

const IdeaBank: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setResult('');
    setError('');

    try {
      const response = await askIdeaBank(topic);
      setResult(response);
    } catch (err) {
      setError('Ocorreu um erro ao buscar as ilustrações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-amber-100 rounded-full text-amber-600 mb-4 shadow-sm">
           <Lightbulb size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Banco de Ideias Teocrático</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Ferramenta auxiliar para anciãos. Gere ilustrações e analogias para discursos baseadas estritamente nos princípios do <span className="font-bold text-purple-700">JW.ORG</span>.
        </p>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
        <form onSubmit={handleSearch} className="relative">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
             Qual é o tema do seu discurso ou parte?
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ex: A importância do perdão, Paciência na tribulação, Zelo no ministério..." 
              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !topic.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-8 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-200"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              <span className="hidden sm:inline">Gerar</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
             <ShieldCheckIcon size={12} />
             O assistente utiliza apenas fontes teocráticas.
          </p>
        </form>
      </div>

      {/* RESULTS AREA */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
           <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center gap-2 text-purple-800 font-bold">
              <BookOpen size={20} />
              Resultados da Pesquisa
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
               <h4 className="font-bold text-slate-600 mb-2">Vida Cotidiana</h4>
               <p className="text-sm text-slate-400">Exemplos práticos do dia a dia que tocam o coração.</p>
            </div>
            <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
               <h4 className="font-bold text-slate-600 mb-2">Relatos Bíblicos</h4>
               <p className="text-sm text-slate-400">Lições extraídas de personagens fiéis do passado.</p>
            </div>
            <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
               <h4 className="font-bold text-slate-600 mb-2">Criação</h4>
               <p className="text-sm text-slate-400">O que a natureza nos ensina sobre as qualidades de Jeová.</p>
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