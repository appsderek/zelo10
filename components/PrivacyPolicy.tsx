
import React from 'react';
import { X, ShieldCheck, Lock, Eye, Trash2 } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-purple-600" /> Política de Privacidade e LGPD
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 text-slate-700 space-y-6 text-sm leading-relaxed">
          <p className="font-medium text-slate-500 italic">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Lock size={18} className="text-purple-500" /> 1. Introdução e Objetivo
            </h3>
            <p>
              O sistema <strong>Z-Elo</strong> é uma ferramenta de gestão eclesiástica e pastoral. Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>, reafirmamos nosso compromisso com a privacidade e a segurança das informações dos membros da congregação. Os dados aqui coletados têm como única finalidade a organização das atividades religiosas, designações voluntárias e assistência pastoral.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Eye size={18} className="text-purple-500" /> 2. Dados Coletados
            </h3>
            <p>Para o funcionamento das atividades teocráticas, coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li><strong>Identificação:</strong> Nome completo, data de nascimento, data de batismo.</li>
              <li><strong>Contato:</strong> Endereço residencial, telefone (WhatsApp), e-mail e contato de emergência.</li>
              <li><strong>Vida Congregacional:</strong> Grupo de serviço de campo, privilégios (publicador, pioneiro, ancião, etc.) e registros de atividades voluntárias (relatórios de campo).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Finalidade do Tratamento</h3>
            <p>Os dados são utilizados estritamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li>Organização de grupos de pregação e pastoreio.</li>
              <li>Elaboração de escalas de limpeza, indicadores e partes mecânicas.</li>
              <li>Agendamento da reunião Vida e Ministério e Discursos Públicos.</li>
              <li>Compilação estatística da atividade da congregação (sem fins comerciais).</li>
              <li>Comunicação de avisos e designações via aplicativos de mensagem.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Armazenamento e Segurança</h3>
            <p>
              Os dados são armazenados utilizando criptografia padrão (AES-256) antes de serem sincronizados com o banco de dados em nuvem. O acesso é restrito a usuários autorizados (Administradores, Secretário e Superintendentes) mediante autenticação.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Trash2 size={18} className="text-purple-500" /> 5. Seus Direitos (Titular dos Dados)
            </h3>
            <p>De acordo com o Art. 18 da LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li><strong>Acesso:</strong> Visualizar seus dados cadastrais no painel "Meu Painel".</li>
              <li><strong>Correção:</strong> Solicitar a atualização de dados incompletos ou errados.</li>
              <li><strong>Portabilidade:</strong> Baixar seus dados em formato legível (JSON) através do seu painel.</li>
              <li><strong>Eliminação:</strong> Solicitar a exclusão de seus dados pessoais do sistema, ressalvados os registros históricos necessários para fins canônicos/administrativos da organização religiosa.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2">6. Consentimento</h3>
            <p>
              Ao utilizar este sistema, você consente de forma livre, informada e inequívoca com o tratamento de seus dados pessoais para as finalidades religiosas descritas acima.
            </p>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-colors"
          >
            Entendi e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
