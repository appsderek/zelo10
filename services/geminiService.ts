
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
export type IdeaMode = 'general' | 'audience' | 'conclusion' | 'ministry' | 'rare';

export const askIdeaBank = async (topic: string, mode: IdeaMode = 'general', context?: string): Promise<string> => {
    if (!apiKey) {
        return "Chave de API (Gemini) não configurada. Por favor, configure a API_KEY.";
    }

    try {
        let specificInstruction = "";
        let userPrompt = "";

        switch (mode) {
            case 'audience':
                const target = context || "Crianças";
                specificInstruction = `ADAPTAÇÃO DE PÚBLICO: O usuário precisa explicar este tema especificamente para: ${target}. Use linguagem apropriada, analogias simples que esse grupo entenda e foque na aplicação prática para a realidade deles.`;
                userPrompt = `Explique e crie ilustrações sobre o tema "${topic}" adaptadas para: ${target}.`;
                break;
            
            case 'conclusion':
                specificInstruction = `ESTRUTURA DE CONCLUSÃO: O objetivo é fornecer uma conclusão impactante. Sugira 3 formas diferentes de concluir o discurso: 1) Com uma pergunta reflexiva, 2) Com um resumo motivador, 3) Com uma chamada à ação (aplicação prática imediata).`;
                userPrompt = `Sugira conclusões motivadoras para um discurso com o tema: "${topic}".`;
                break;

            case 'ministry':
                specificInstruction = `APLICAÇÃO NO MINISTÉRIO: Transforme este tema em uma apresentação para o serviço de campo. Crie: 1) Uma introdução simples (quebra-gelo), 2) Uma pergunta de ponto de vista, 3) Um texto bíblico de ligação, 4) Uma transição para oferecer uma publicação ou vídeo.`;
                userPrompt = `Como usar o tema "${topic}" no ministério de campo? Crie uma apresentação.`;
                break;

            case 'rare':
                specificInstruction = `EXEMPLOS INÉDITOS (FUGIR DO ÓBVIO): O usuário quer evitar os exemplos bíblicos mais comuns (ex: se for Fé, NÃO use Abraão; se for Coragem, NÃO use Davi). Busque personagens bíblicos menos citados, relatos secundários ou detalhes específicos de profecias que ilustrem o ponto de forma fresca e profunda.`;
                userPrompt = `Forneça exemplos bíblicos pouco conhecidos ou "lados B" sobre o tema: "${topic}".`;
                break;

            case 'general':
            default:
                specificInstruction = `FORMATO PADRÃO: Apresente 3 opções de ilustrações: 1) Cotidiano, 2) Bíblica, 3) Criação (Natureza).`;
                userPrompt = `Por favor, forneça ilustrações e analogias para um discurso público sobre o tema: "${topic}".`;
                break;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: `
                    Você é um assistente de pesquisa teocrático experiente, projetado para ajudar anciãos das Testemunhas de Jeová na preparação de discursos.
                    
                    DIRETRIZES RIGOROSAS:
                    1. Use APENAS conceitos, princípios e exemplos encontrados no site JW.ORG e na Bíblia (Tradução do Novo Mundo).
                    2. NÃO utilize fontes seculares, filosofias humanas, política ou materiais de outras religiões.
                    3. Mantenha um tom respeitoso, digno, encorajador e modesto.
                    
                    MODO ATUAL: ${specificInstruction}
                    
                    Se o tema for inapropriado ou não tiver base teocrática, informe educadamente que não pode auxiliar com esse assunto específico.
                `,
                temperature: 0.7 
            }
        });

        return response.text || "Não foi possível gerar as ideias no momento.";
    } catch (error) {
        console.error("Erro ao consultar Banco de Ideias:", error);
        return "Ocorreu um erro ao conectar com o Banco de Ideias. Verifique sua conexão.";
    }
};
