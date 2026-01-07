
import { createClient } from '@supabase/supabase-js';
import { encryptData, decryptData } from './securityService';

// PROCESSO DE SEGURANÇA:
// Prioriza o uso de variáveis de ambiente para não expor chaves no repositório.
// Se não encontrar (ambiente de dev local simples), usa um fallback (que deve ser removido em produção real).

export const PROJECT_URL = process.env.SUPABASE_URL || 'https://bflymvpgysqibankftvm.supabase.co';
export const PROJECT_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbHltdnBneXNxaWJhbmtmdHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDI2NTQsImV4cCI6MjA4MDQxODY1NH0.jiMQYeOMVwilcl3K7LfP_DLqAW-NrKcPKX_NrQk2Ss0';

let supabase: any = null;

export const initSupabase = (url: string = PROJECT_URL, key: string = PROJECT_KEY) => {
  try {
    if (url && key) {
      supabase = createClient(url, key);
      return true;
    }
  } catch (e) {
    console.error("Erro ao inicializar Supabase:", e);
    return false;
  }
  return false;
};

export const getSupabaseClient = () => supabase;

export const isSupabaseConfigured = () => !!supabase;

// Save specific key - COM CRIPTOGRAFIA
export const saveToCloud = async (key: string, data: any) => {
  if (!supabase) {
    if (PROJECT_URL && PROJECT_KEY) {
      initSupabase(PROJECT_URL, PROJECT_KEY);
    }
    if (!supabase) return { error: 'Not connected' };
  }
  
  // CRIPTOGRAFA O DADO ANTES DE ENVIAR
  // O Supabase receberá apenas uma string ininteligível
  const secureValue = encryptData(data);
  
  const { error } = await supabase
    .from('jw_data')
    .upsert({ key, value: secureValue }, { onConflict: 'key' });
    
  return { error };
};

// Load specific key - COM DESCRIPTOGRAFIA
export const loadFromCloud = async (key: string) => {
  if (!supabase) {
    if (PROJECT_URL && PROJECT_KEY) {
      initSupabase(PROJECT_URL, PROJECT_KEY);
    }
    if (!supabase) return { data: null, error: 'Not connected' };
  }
  
  const { data, error } = await supabase
    .from('jw_data')
    .select('value')
    .eq('key', key)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null };
    return { data: null, error };
  }

  // DESCRIPTOGRAFA O DADO RECEBIDO
  // Se for dado antigo (não criptografado), a função decryptData lida com isso automaticamente
  const originalData = decryptData(data.value);
  
  return { data: originalData, error: null };
};

/**
 * Inscreve-se para mudanças em tempo real na tabela jw_data.
 * Retorna uma função para cancelar a inscrição.
 */
export const subscribeToDataChanges = (callback: (payload: any) => void) => {
  if (!supabase) {
    if (PROJECT_URL && PROJECT_KEY) {
      initSupabase(PROJECT_URL, PROJECT_KEY);
    }
    if (!supabase) return () => {};
  }

  const channel = supabase.channel('jw_data_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE', // Escuta updates
        schema: 'public',
        table: 'jw_data',
      },
      (payload: any) => {
        // Descriptografa o dado recebido no payload antes de passar para o callback
        if (payload.new && payload.new.value) {
            const decryptedValue = decryptData(payload.new.value);
            // Cria um payload enriquecido com o valor descriptografado
            const enrichedPayload = {
                ...payload,
                new: {
                    ...payload.new,
                    value: decryptedValue
                }
            };
            callback(enrichedPayload);
        } else {
            callback(payload);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
