
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import PrivacyPolicy from './PrivacyPolicy';

const LGPDBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('jw_lgpd_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('jw_lgpd_consent', 'true');
    localStorage.setItem('jw_lgpd_date', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-purple-600 shadow-2xl p-4 md:p-6 z-[60] animate-fade-in print-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-700 hidden md:block">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Sua privacidade é importante</h4>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Utilizamos cookies essenciais e armazenamento local para garantir o funcionamento do sistema e a segurança dos dados da congregação, em conformidade com a <strong>LGPD</strong>. 
                Ao continuar, você concorda com nossa Política de Privacidade.
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowPolicy(true)}
              className="flex-1 md:flex-none px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              Ler Política
            </button>
            <button 
              onClick={handleAccept}
              className="flex-1 md:flex-none px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md transition-colors text-sm"
            >
              Concordar e Continuar
            </button>
          </div>
        </div>
      </div>

      {showPolicy && <PrivacyPolicy onClose={() => setShowPolicy(false)} />}
    </>
  );
};

export default LGPDBanner;
