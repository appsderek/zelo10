import CryptoJS from 'crypto-js';

// Chave secreta interna para criptografia de dados (Nunca exponha isso publicamente em apps reais front-end, 
// mas para este PWA sem backend próprio, é a camada de ofuscação necessária).
const SECRET_DATA_KEY = "GESCONG_SECURE_KEY_V1_2024";

/**
 * Gera um hash SHA-256 da senha.
 * Isso torna impossível reverter a senha original a partir do banco de dados.
 */
export const hashPassword = (password: string): string => {
  if (!password) return '';
  return CryptoJS.SHA256(password).toString();
};

/**
 * Verifica se uma senha em texto puro corresponde ao hash armazenado.
 * Tenta verificar primeiro como hash, e faz fallback para texto puro para suportar migração.
 */
export const verifyPassword = (inputPassword: string, storedPasswordOrHash: string): boolean => {
  if (!inputPassword || !storedPasswordOrHash) return false;

  // 1. Tenta comparar hash com hash
  const inputHash = hashPassword(inputPassword);
  if (inputHash === storedPasswordOrHash) return true;

  // 2. Fallback: Se a senha armazenada for antiga (texto puro), compara direto
  // Um hash SHA256 tem 64 caracteres hexadecimais. Se for menor, provavelmente é texto puro.
  if (storedPasswordOrHash.length < 64 && inputPassword === storedPasswordOrHash) {
    return true; 
  }

  return false;
};

/**
 * Criptografa um objeto JSON em uma string AES.
 */
export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_DATA_KEY).toString();
  } catch (error) {
    console.error("Erro ao criptografar dados:", error);
    return "";
  }
};

/**
 * Descriptografa uma string AES de volta para objeto JSON.
 * Possui tratamento de erro para suportar dados legados (não criptografados).
 */
export const decryptData = (ciphertext: any): any => {
  try {
    // Se não for string, ou for um objeto JSON direto (legado), retorna como está
    if (typeof ciphertext !== 'string') return ciphertext;

    // Tenta descriptografar
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_DATA_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      // Se falhar (string vazia), pode ser que o dado original era apenas uma string não criptografada
      // Tenta fazer o parse direto do ciphertext caso seja um JSON legado salvo como string
      try {
        return JSON.parse(ciphertext);
      } catch {
        return ciphertext; // Retorna o valor original se tudo falhar
      }
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    // Se der erro de parse ou decrypt, assume que é dado legado (texto puro/JSON antigo)
    // Isso garante que o sistema não quebre durante a migração
    console.warn("Aviso de migração de segurança: Lendo dado não criptografado.");
    return ciphertext; 
  }
};