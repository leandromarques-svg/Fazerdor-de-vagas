export interface JobData {
  jobCode: string;
  jobTitle: string;
  tagline: string;
  sector: string;
  contractType: string; // e.g., CLT, PJ
  modality: string; // e.g., Presencial, Híbrido
  location: string; // e.g., Valinhos, SP
  websiteUrl: string;
  imageUrl: string; // Base64 or URL
  logoUrl: string | null; // Logo Principal (Topo Esquerdo - Opcional/Removido da UI)
  footerLogoUrl: string | null; // Logo Símbolo Branco (Rodapé)
}

export const INITIAL_JOB_DATA: JobData = {
  jobCode: '9015',
  jobTitle: 'Pessoa Estagiária Técnica em Produção e Qualidade',
  tagline: 'TRABALHE EM UMA EMPRESA MULTINACIONAL',
  sector: 'SETOR INDUSTRIAL',
  contractType: 'Estágio',
  modality: 'Presencial',
  location: 'APARECIDA DE GOIÂNIA - GO',
  websiteUrl: 'www.metarh.com.br/vagas-metarh',
  imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80', 
  logoUrl: null, 
  footerLogoUrl: 'https://metarh.com.br/wp-content/uploads/2025/11/logo_METARH.png', // Logo fixa solicitada
};