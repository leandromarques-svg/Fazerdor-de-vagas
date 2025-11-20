import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Upload, Layout, MapPin, Briefcase, Image as ImageIcon, Palette, Loader2, Database, RefreshCw, Eye, X, ChevronDown, Search } from 'lucide-react';
import { JobCard } from './components/JobCard';
import { JobData, INITIAL_JOB_DATA } from './types';
import { fetchVacancyFromSelecty, fetchActiveVacancies, VacancySummary } from './services/selectyService';

// Scale factor for the sidebar preview to fit comfortably on standard screens
const PREVIEW_SCALE = 0.45;

// Common Brazilian Cities for Autocomplete
const MAJOR_CITIES = [
  "São Paulo - SP", "Rio de Janeiro - RJ", "Belo Horizonte - MG", "Brasília - DF",
  "Curitiba - PR", "Porto Alegre - RS", "Salvador - BA", "Recife - PE", "Fortaleza - CE",
  "Manaus - AM", "Goiânia - GO", "Campinas - SP", "São José dos Campos - SP", 
  "Vitória - ES", "Florianópolis - SC", "Belém - PA", "São Luís - MA", "Maceió - AL",
  "Natal - RN", "João Pessoa - PB", "Aracaju - SE", "Cuiabá - MT", "Campo Grande - MS",
  "Palmas - TO", "Porto Velho - RO", "Rio Branco - AC", "Macapá - AP", "Boa Vista - RR",
  "Valinhos - SP", "Vinhedo - SP", "Jundiaí - SP", "Sorocaba - SP", "Ribeirão Preto - SP",
  "Uberlândia - MG", "Joinville - SC", "Londrina - PR", "Niterói - RJ", "Santos - SP"
].sort();

const CONTRACT_TYPES = [
    "CLT (Efetivo)",
    "PJ",
    "Estágio",
    "Temporário",
    "Terceirizado",
    "Trainee",
    "Jovem Aprendiz"
];

const MODALITIES = [
    "Presencial",
    "Híbrido",
    "Remoto"
];

export default function App() {
  const [jobData, setJobData] = useState<JobData>(INITIAL_JOB_DATA);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // ATS Import States
  const [atsId, setAtsId] = useState('');
  const [isAtsImporting, setIsAtsImporting] = useState(false);
  const [vacanciesList, setVacanciesList] = useState<VacancySummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load vacancies on mount
  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    setIsLoadingList(true);
    const list = await fetchActiveVacancies();
    setVacanciesList(list);
    setIsLoadingList(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof JobData) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setJobData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAtsImport = async () => {
    if (!atsId) return;

    setIsAtsImporting(true);
    try {
      const extractedData = await fetchVacancyFromSelecty(atsId);
      setJobData(prev => ({
        ...prev,
        ...extractedData
      }));
    } catch (error) {
      console.error(error);
      alert('Não foi possível carregar os dados desta vaga. Verifique a conexão ou o ID.');
    } finally {
      setIsAtsImporting(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (cardRef.current === null) return;

    setIsDownloading(true);
    try {
      // Export at exact 1080x1350 resolution
      const dataUrl = await toPng(cardRef.current, { 
          quality: 1.0,
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          style: {
             transform: 'scale(1)',
             transformOrigin: 'top left',
          }
      });
      
      const link = document.createElement('a');
      link.download = `METARH-vaga-${jobData.jobCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Falha ao gerar imagem', err);
      alert('Erro ao baixar a imagem. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  }, [jobData.jobCode]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar - Controls */}
      <div className="w-full lg:w-[420px] bg-white shadow-xl flex flex-col h-screen border-r border-gray-200 z-20 relative">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h1 className="font-condensed font-bold text-3xl text-brand-purple flex items-center gap-2">
            <Layout className="w-7 h-7 text-brand-pink" />
            Criador de Vagas
          </h1>
          <p className="text-gray-400 text-xs mt-1 font-medium uppercase tracking-wider">Template Padrão METARH</p>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* 0. Importação (Selecty) */}
          <section className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-[2rem] border border-purple-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-brand-purple font-condensed font-bold text-lg uppercase">
                    <Database className="w-4 h-4" /> Importar do Selecty
                </h3>
                <button 
                    onClick={loadVacancies} 
                    className="text-brand-purple hover:bg-purple-100 p-2 rounded-full transition"
                    title="Atualizar lista"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            {/* Selecty Dropdown Custom */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase px-3">Vagas Disponíveis</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <select 
                            value={atsId}
                            onChange={(e) => setAtsId(e.target.value)}
                            className="w-full pl-5 pr-10 py-3.5 text-sm bg-white border border-purple-100 rounded-[2rem] focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple outline-none appearance-none cursor-pointer shadow-sm text-gray-700 font-medium truncate"
                            disabled={isLoadingList}
                        >
                            <option value="">
                                {isLoadingList ? "Carregando..." : "Selecione uma vaga..."}
                            </option>
                            {vacanciesList.map((vaga) => (
                                <option key={vaga.id} value={vaga.id}>
                                    #{vaga.id} - {vaga.title}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                             <ChevronDown className="w-4 h-4 text-brand-purple" />
                        </div>
                    </div>
                    <button 
                        onClick={handleAtsImport}
                        disabled={isAtsImporting || !atsId}
                        className="bg-brand-purple text-white w-12 h-12 rounded-full hover:bg-brand-lightPurple disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center flex-shrink-0"
                        title="Preencher dados"
                    >
                        {isAtsImporting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
          </section>

          {/* 2. Conteúdo Principal */}
          <section>
             <h3 className="flex items-center gap-2 text-brand-purple font-condensed font-bold text-xl uppercase mb-5 border-b border-gray-100 pb-2">
                <Briefcase className="w-5 h-5" /> Conteúdo da Vaga
            </h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 px-3">Título do Cargo</label>
                    <input
                        type="text"
                        name="jobTitle"
                        value={jobData.jobTitle}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-[2rem] focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple outline-none font-bold text-gray-800 placeholder-gray-300 transition-all"
                        placeholder="Ex: Analista Financeiro"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 px-3">Código</label>
                        <input
                            type="text"
                            name="jobCode"
                            value={jobData.jobCode}
                            onChange={handleInputChange}
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none transition text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 px-3">Setor</label>
                        <input
                            type="text"
                            name="sector"
                            value={jobData.sector}
                            onChange={handleInputChange}
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none transition text-sm font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 px-3">Frase de Efeito (Tagline)</label>
                    
                    {/* Selector Switch */}
                    <div className="flex p-1 bg-gray-100 rounded-full mb-3">
                        <button
                            type="button"
                            onClick={() => setJobData(prev => ({ ...prev, tagline: 'TRABALHE EM UMA EMPRESA NACIONAL' }))}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-full transition-all ${
                                jobData.tagline === 'TRABALHE EM UMA EMPRESA NACIONAL'
                                ? 'bg-white text-brand-purple shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Nacional
                        </button>
                        <button
                            type="button"
                            onClick={() => setJobData(prev => ({ ...prev, tagline: 'TRABALHE EM UMA EMPRESA MULTINACIONAL' }))}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-full transition-all ${
                                jobData.tagline === 'TRABALHE EM UMA EMPRESA MULTINACIONAL'
                                ? 'bg-white text-brand-purple shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Multinacional
                        </button>
                    </div>

                    <input
                        type="text"
                        name="tagline"
                        value={jobData.tagline}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none transition text-sm"
                        placeholder="Ex: FAÇA PARTE DO NOSSO TIME"
                    />
                </div>
            </div>
          </section>

          {/* 3. Detalhes & Local */}
          <section>
            <h3 className="flex items-center gap-2 text-brand-purple font-condensed font-bold text-xl uppercase mb-5 border-b border-gray-100 pb-2">
                <MapPin className="w-5 h-5" /> Detalhes Contratuais
            </h3>
            
            {/* Grid for Contract and Modality (Dropdowns) */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                 <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 px-3">Contrato</label>
                    <div className="relative">
                        <select
                            name="contractType"
                            value={jobData.contractType}
                            onChange={handleInputChange}
                            className="w-full pl-5 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none appearance-none cursor-pointer"
                        >
                            {CONTRACT_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                 <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 px-3">Modalidade</label>
                    <div className="relative">
                        <select
                            name="modality"
                            value={jobData.modality}
                            onChange={handleInputChange}
                            className="w-full pl-5 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none appearance-none cursor-pointer"
                        >
                            {MODALITIES.map(mod => (
                                <option key={mod} value={mod}>{mod}</option>
                            ))}
                        </select>
                         <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Full width City with Datalist */}
            <div className="mb-5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 px-3">Cidade / UF</label>
                <div className="relative group">
                    <input
                        list="cities-list"
                        type="text"
                        name="location"
                        value={jobData.location}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none transition-all group-hover:bg-white"
                        placeholder="Busque a cidade ou digite..."
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
                    
                    <datalist id="cities-list">
                        {MAJOR_CITIES.map(city => (
                            <option key={city} value={city} />
                        ))}
                    </datalist>
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 px-3">Link do Site</label>
                <input
                    type="text"
                    name="websiteUrl"
                    value={jobData.websiteUrl}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-[2rem] focus:border-brand-purple outline-none text-sm text-brand-purple font-medium"
                />
            </div>
          </section>

           {/* 4. Imagem de Fundo */}
          <section>
            <h3 className="flex items-center gap-2 text-brand-purple font-condensed font-bold text-xl uppercase mb-5 border-b border-gray-100 pb-2">
                <ImageIcon className="w-5 h-5" /> Imagem de Destaque
            </h3>
            <div 
                className="border-2 border-dashed border-gray-300 rounded-[2rem] p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-brand-purple transition group bg-white"
                onClick={() => imageInputRef.current?.click()}
            >
                <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover:text-brand-purple transition-colors" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-brand-purple">Clique para trocar a foto</span>
                <input 
                    ref={imageInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'imageUrl')}
                />
            </div>
          </section>

        </div>

        {/* Sidebar Footer */}
        <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] space-y-4">
             <div className="flex gap-3">
                {/* Visualizar button removed */}

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-brand-purple text-white font-condensed font-bold uppercase text-lg py-4 rounded-[2rem] shadow-lg hover:bg-brand-lightPurple hover:shadow-brand-purple/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                    {isDownloading ? (
                        <span className="animate-pulse">Processando...</span>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Baixar Arte
                        </>
                    )}
                </button>
             </div>

             <div className="flex flex-col items-center justify-center pt-2 opacity-80">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Desenvolvido por</span>
                <img 
                    src="https://metarh.com.br/wp-content/uploads/2025/11/logo-metarh-azul.png" 
                    alt="METARH" 
                    className="h-6 w-auto"
                />
             </div>
        </div>
      </div>

      {/* Main Live Preview Area (Desktop) */}
      <div className="hidden lg:flex flex-1 bg-neutral-900 overflow-auto items-center justify-center p-8">
        <div 
            className="relative shadow-2xl bg-white shrink-0" 
            style={{ 
                width: `${1080 * PREVIEW_SCALE}px`, 
                height: `${1350 * PREVIEW_SCALE}px` 
            }}
        >
            <JobCard ref={cardRef} data={jobData} scale={PREVIEW_SCALE} />
        </div>
      </div>

      {/* Full Screen Modal Preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
            <button 
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-4 right-4 bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition"
            >
                <X className="w-6 h-6" />
            </button>
            
            <div className="relative overflow-auto max-h-full custom-scrollbar rounded-[2rem]">
                {/* Render a static copy for view only, scaling based on window height roughly */}
                <div style={{ 
                    transform: 'scale(0.6)', 
                    transformOrigin: 'center',
                    width: '1080px',
                    height: '1350px'
                }}>
                    <JobCard data={jobData} scale={1} />
                </div>
            </div>
        </div>
      )}

    </div>
  );
}