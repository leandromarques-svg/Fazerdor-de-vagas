import { JobData } from "../types";

const API_URL = 'https://api.selecty.app/v2';
const API_TOKEN = 'eyJpdiI6IjlRRENGQ0hVMWkwWDZSYlFsVFRaeEE9PSIsInZhbHVlIjoiaTFkaTd2TnhndHlnb2tNVC9jcU1MWDVvN1hGSVBVcDFiczZqZE9MMHdHRT0iLCJtYWMiOiIwODZhNjAwMDU2ODE0OWMyYTIyMTIxZGYyZGUyMTY3MjQ0MzQyMGQ4NGJlZjNhMTcxZGI3NmVmNzM0ZjVkNDA1IiwidGFnIjoiIn0=';

export interface VacancySummary {
    id: string;
    title: string;
}

export const fetchActiveVacancies = async (): Promise<VacancySummary[]> => {
    try {
        // Tentativa de buscar com parâmetros padrão
        const response = await fetch(`${API_URL}/vacancy?sort=-creation_date&per_page=100&status=active`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Selecty API Error: ${response.status} - ${response.statusText}`);
            throw new Error(`Erro ao listar vagas: ${response.statusText}`);
        }

        const json = await response.json();
        
        // Normalização robusta: A API pode retornar um array direto ou um objeto com a propriedade 'data'
        let rawList = [];
        if (Array.isArray(json)) {
            rawList = json;
        } else if (json.data && Array.isArray(json.data)) {
            rawList = json.data;
        } else if (json.items && Array.isArray(json.items)) {
            rawList = json.items;
        }

        return rawList.map((item: any) => ({
            id: String(item.vacancy_id || item.id),
            title: item.title || `Vaga #${item.vacancy_id || item.id}`
        }));

    } catch (error) {
        console.error("Erro crítico ao buscar lista de vagas:", error);
        // Retorna array vazio para não quebrar a UI, mas loga o erro
        return [];
    }
};

export const fetchVacancyFromSelecty = async (vacancyId: string): Promise<Partial<JobData>> => {
  try {
    const response = await fetch(`${API_URL}/vacancy/${vacancyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na API Selecty: ${response.statusText}`);
    }

    const json = await response.json();
    const data = json; 

    if (data.error) {
        throw new Error(data.message || "Vaga não encontrada");
    }

    const result: Partial<JobData> = {};

    if (data.title) result.jobTitle = data.title;
    if (data.vacancy_id) result.jobCode = String(data.vacancy_id);
    
    // Localização Formatada
    if (data.workplace) {
        const city = data.workplace.city || '';
        const state = data.workplace.state || '';
        if (city && state) {
            result.location = `${city} - ${state}`;
        } else {
            result.location = city || state;
        }
    }

    // Setor
    if (data.department_name) {
        result.sector = data.department_name.toUpperCase();
    } else if (data.occupation) {
        result.sector = data.occupation.toUpperCase();
    }

    // Tipo de Contrato - Mapeamento Inteligente para as opções do App
    if (data.contract_type) {
        let contract = Array.isArray(data.contract_type) ? data.contract_type[0] : data.contract_type;
        contract = String(contract).toLowerCase().replace(/['"]+/g, '');
        
        if (contract.includes('clt') || contract.includes('efetivo')) result.contractType = 'CLT (Efetivo)';
        else if (contract.includes('pj')) result.contractType = 'PJ';
        else if (contract.includes('estagi') || contract.includes('estagi')) result.contractType = 'Estágio';
        else if (contract.includes('temporar') || contract.includes('temporár')) result.contractType = 'Temporário';
        else if (contract.includes('terceir')) result.contractType = 'Terceirizado';
        else result.contractType = 'CLT (Efetivo)'; // Fallback
    }

    // Modalidade - Mapeamento
    if (data.work_model || data.modality) { // Supondo campos possíveis, a API real pode variar
         const mod = String(data.work_model || data.modality || '').toLowerCase();
         if (mod.includes('hibrido') || mod.includes('híbrido')) result.modality = 'Híbrido';
         else if (mod.includes('remoto') || mod.includes('home')) result.modality = 'Remoto';
         else result.modality = 'Presencial';
    }

    return result;

  } catch (error) {
    console.error("Erro ao buscar vaga no Selecty:", error);
    throw error;
  }
};