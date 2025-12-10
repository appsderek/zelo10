import { GoogleGenAI } from "@google/genai";
import { Member, AttendanceRecord, MemberStatus } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCongregationReport = async (
  members: Member[], 
  attendance: AttendanceRecord[]
): Promise<string> => {
  if (!apiKey) {
    return "Chave de API não configurada. Não é possível gerar a análise inteligente.";
  }

  try {
    // Summarize data to avoid sending PII where possible, or keep it minimal.
    // In a real app, strictly anonimize. Here we keep names for the 'secretariat' simulation context locally.
    const summaryData = {
      membersSummary: {
        total: members.length,
        active: members.filter(m => m.status === MemberStatus.ACTIVE).length,
        irregular: members.filter(m => m.status === MemberStatus.IRREGULAR).length,
        inactive: members.filter(m => m.status === MemberStatus.INACTIVE).length,
        groups: members.reduce((acc, curr) => {
          acc[curr.serviceGroup] = (acc[curr.serviceGroup] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      recentAttendance: attendance.slice(-10) // Last 10 records
    };

    const prompt = `
      Atue como um assistente especialista para o Secretário de uma congregação.
      Analise os seguintes dados (em formato JSON) e forneça um relatório conciso e encorajador em Português.
      
      Dados:
      ${JSON.stringify(summaryData, null, 2)}

      O relatório deve conter:
      1. Uma visão geral da "Saúde da Congregação" (baseado nos status e assistência).
      2. Tendências observadas na assistência às reuniões recentes.
      3. Sugestões práticas para ajudar os irregulares ou inativos (genericamente).
      4. Um breve ponto de elogio sobre os pontos fortes observados.

      Use formatação Markdown simples. Seja respeitoso, organizado e direto.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Erro ao gerar relatório com Gemini:", error);
    return "Ocorreu um erro ao comunicar com a IA de análise.";
  }
};

/**
 * Agente de IA para o "Banco de Ideias" dos Anciãos.
 * Restrito estritamente a conteúdo teocrático (JW.org).
 */
export const askIdeaBank = async (topic: string): Promise<string> => {
    if (!apiKey) {
        return "Chave de API (Gemini) não configurada. Por favor, configure a API_KEY.";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Por favor, forneça ilustrações e analogias para um discurso público sobre o tema: "${topic}".`,
            config: {
                systemInstruction: `
                    Você é um assistente de pesquisa teocrático experiente, projetado para ajudar anciãos das Testemunhas de Jeová na preparação de discursos.
                    
                    DIRETRIZES RIGOROSAS:
                    1. Use APENAS conceitos, princípios e exemplos encontrados no site JW.ORG e na Bíblia (Tradução do Novo Mundo).
                    2. NÃO utilize fontes seculares, filosofias humanas, política ou materiais de outras religiões.
                    3. Mantenha um tom respeitoso, digno, encorajador e modesto.
                    
                    FORMATO DA RESPOSTA:
                    Apresente 3 opções de ilustrações distintas para o tema solicitado:
                    
                    # Opção 1: Ilustração do Cotidiano
                    (Uma analogia simples e prática da vida moderna que explica o ponto espiritual)
                    
                    # Opção 2: Ilustração Bíblica
                    (Um relato ou personagem bíblico que serve como exemplo ou aviso sobre o tema)
                    
                    # Opção 3: Ilustração da Criação (Natureza)
                    (Algo na natureza que ensina uma lição sobre as qualidades de Jeová ou princípios de vida, similar ao estilo "Teve um Projeto?")
                    
                    Se o tema for inapropriado ou não tiver base teocrática, informe educadamente que não pode auxiliar com esse assunto específico.
                `,
                temperature: 0.7 // Criativo, mas focado
            }
        });

        return response.text || "Não foi possível gerar as ilustrações no momento.";
    } catch (error) {
        console.error("Erro ao consultar Banco de Ideias:", error);
        return "Ocorreu um erro ao conectar com o Banco de Ideias. Verifique sua conexão.";
    }
};