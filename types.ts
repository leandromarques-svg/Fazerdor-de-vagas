
export enum JobType {
  FULL_TIME = 'Tempo Integral',
  PART_TIME = 'Meio Período',
  CONTRACT = 'Contrato',
  INTERNSHIP = 'Estágio',
  REMOTE = 'Remoto'
}

export interface SelectyJobResponse {
  id: number | string;
  title: string;
  description: string; // Full HTML content
  summary: string;     // Plain text short description
  city?: string;
  state?: string;
  department?: string;
  contract_type?: string; // CLT, PJ, etc.
  published_at?: string;
  url_apply?: string;
  remote?: boolean;
}

export interface JobFilterState {
  keyword: string;
  location: string;
  jobCode: string;
  specificDate: string; // YYYY-MM-DD format
}

export type ImageTag = 'Homem' | 'Mulher' | 'Negros' | '50+' | 'LGBTQIAPN+' | 'PCD' | 'Indígenas' | 'Jovem';

export interface LibraryImage {
    id: string;
    url: string;
    tags: ImageTag[];
    isCustom?: boolean; // Flag para identificar imagens do usuário
}