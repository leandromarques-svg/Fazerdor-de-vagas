
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// ------------------------------------------------------------------

// Eu extraí este ID da sua chave API (payload: "ref": "vtuebdkbgrdybdegspbm")
const PROJECT_ID = 'vtuebdkbgrdybdegspbm';

const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dWViZGtiZ3JkeWJkZWdzcGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTI1MDAsImV4cCI6MjA3OTM4ODUwMH0.vmsCCZ_8jK3NWz5Pl74iSdsul7CS1oip20Q-HW6MCxQ';

// Verifica se as chaves foram configuradas para evitar erros silenciosos
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('SUA_PROJECT_URL');

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = isConfigured;
