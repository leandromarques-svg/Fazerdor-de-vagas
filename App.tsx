

import React, { useState, useEffect, useMemo } from 'react';
import { fetchJobs } from './services/selectyService';
import { SelectyJobResponse, JobFilterState } from './types';
import { JobCard } from './components/JobCard';
import { JobModal } from './components/JobModal';
import { JobImageGenerator } from './components/JobImageGenerator';
import { Filters } from './components/Filters';
import { Loader2, Briefcase, CircleAlert, RefreshCw, Plus, Wand2, Palette, Clock, HeartHandshake, Sparkles } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

export default function App() {
  const [jobs, setJobs] = useState<SelectyJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<SelectyJobResponse | null>(null);
  const [jobForGenerator, setJobForGenerator] = useState<SelectyJobResponse | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState<JobFilterState>({
    keyword: '',
    location: '',
    jobCode: '',
    specificDate: ''
  });

  // Stats State
  const [stats, setStats] = useState({ count: 0, hoursSaved: 0 });

  // Visible Count State (Load More logic)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // --- Stats Logic ---
  useEffect(() => {
    // Tenta pegar do localStorage ou inicia com um número base "fake" para dar sensação de uso
    const savedCount = localStorage.getItem('metarh_gen_count');
    const initialCount = savedCount ? parseInt(savedCount, 10) : 0;
    
    // 15 minutos = 0.25 horas
    const hours = Math.floor(initialCount * 0.25);
    
    setStats({ count: initialCount, hoursSaved: hours });
  }, []);

  const handleImageGeneratedSuccess = () => {
    const newCount = stats.count + 1;
    const newHours = Math.floor(newCount * 0.25); // 15 min por imagem
    
    localStorage.setItem('metarh_gen_count', String(newCount));
    setStats({ count: newCount, hoursSaved: newHours });
  };

  // --- Iframe Resizer Logic ---
  useEffect(() => {
    let lastHeight = 0;
    let resizeTimer: ReturnType<typeof setTimeout>;

    const sendHeight = () => {
      const root = document.getElementById('root');
      if (!root) return;

      const height = root.scrollHeight;
      
      if (Math.abs(height - lastHeight) > 2) {
        lastHeight = height;
        window.parent.postMessage({ type: 'setHeight', height: height }, '*');
      }
    };

    const debouncedSendHeight = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sendHeight, 50);
    };

    debouncedSendHeight();

    const resizeObserver = new ResizeObserver(debouncedSendHeight);
    const root = document.getElementById('root');
    if (root) {
      resizeObserver.observe(root);
    }
    
    window.addEventListener('resize', debouncedSendHeight);
    window.addEventListener('load', debouncedSendHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedSendHeight);
      window.removeEventListener('load', debouncedSendHeight);
      clearTimeout(resizeTimer);
    };
  }, [visibleCount, jobs, loading, filters, selectedJob, jobForGenerator, stats]); 

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs();
      setJobs(data || []);
    } catch (err: any) {
      console.error("Error loading jobs", err);
      setError(err.message || "Erro desconhecido ao conectar com Selecty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset visible count to initial when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters]);

  const handleShowDetails = (job: SelectyJobResponse) => {
    setJobForGenerator(null); 
    setSelectedJob(job);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        window.parent.postMessage({ type: 'scrollToTop' }, '*');
    } catch (e) { /* ignore */ }
  };

  const handleCloseDetails = () => {
    setSelectedJob(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenGenerator = (job: SelectyJobResponse) => {
    setSelectedJob(null); 
    setJobForGenerator(job);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        window.parent.postMessage({ type: 'scrollToTop' }, '*');
    } catch (e) { /* ignore */ }
  };

  const handleCloseGenerator = () => {
    setJobForGenerator(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const locations = useMemo(() => {
    const locs = new Set<string>();
    jobs.forEach(job => {
      if(job.remote) locs.add("Trabalho Remoto");
      else if(job.city) locs.add(job.state ? `${job.city} - ${job.state}` : job.city || "Local não informado");
    });
    return Array.from(locs).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const searchMatch = filters.keyword === '' || 
        job.title.toLowerCase().includes(filters.keyword.toLowerCase());
        
      const locMatch = filters.location === '' || 
        (filters.location === "Trabalho Remoto" ? job.remote : 
         (job.city && filters.location.includes(job.city)));

      const codeMatch = filters.jobCode === '' || 
        String(job.id).toLowerCase().includes(filters.jobCode.toLowerCase());

      let dateMatch = true;
      if (filters.specificDate && job.published_at) {
        const jobDate = new Date(job.published_at);
        const jobDateString = jobDate.toISOString().split('T')[0]; 
        
        if (jobDateString !== filters.specificDate) {
            dateMatch = false;
        }
      }

      return searchMatch && locMatch && codeMatch && dateMatch;
    });
  }, [jobs, filters]);

  const visibleJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  const hasMore = visibleCount < filteredJobs.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  // Reusable Layout Components
  const headerContent = (
    <>
       {/* Header Image Banner */}
       <div className="w-full bg-white">
            <img 
            src="https://metarh.com.br/wp-content/uploads/2025/11/banner_app.png" 
            alt="MetaRH Banner" 
            className="w-full h-auto block"
            style={{ minWidth: '320px' }}
            />
        </div>

        {/* Título Fazedor de Vaga e Stats */}
        <div className="w-full bg-white pt-6 px-4 pb-6">
            <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Título */}
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-full">
                        <Wand2 className="w-6 h-6 text-brand-600" />
                    </div>
                    <h1 className="text-3xl font-sans font-black text-slate-900 tracking-tight uppercase">
                        Fazedor de Vaga
                    </h1>
                </div>

                {/* Stats Dashboard */}
                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3 min-w-[160px]">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Palette className="w-4 h-4 text-brand-500" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900 leading-none">{stats.count}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Artes Geradas</div>
                            </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3 min-w-[160px]">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Clock className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-900 leading-none">
                                    {Math.floor(stats.count * 15 / 60)}h {(stats.count * 15) % 60}m
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tempo Poupado</div>
                            </div>
                    </div>

                    <div className="bg-brand-50 rounded-2xl p-3 border border-brand-100 flex items-center gap-3 min-w-[200px]">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <Sparkles className="w-4 h-4 text-brand-600" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-brand-700 leading-none">
                                    {Math.floor(stats.count * 15 / 60)} horas
                                </div>
                                <div className="text-[10px] font-bold text-brand-600/80 uppercase tracking-wide">de terapia poupada</div>
                            </div>
                    </div>
                </div>

            </div>
            </div>
        </div>
    </>
  );

  const footerContent = (
    <footer className="w-full py-8 border-t border-slate-100 mt-auto bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-400">
        <span className="text-xs font-bold uppercase tracking-wider">Produzido por</span>
        <img 
            src="https://metarh.com.br/wp-content/uploads/2025/11/logo-metarh-azul.png" 
            alt="MetaRH" 
            className="w-[65px] h-auto opacity-80 hover:opacity-100 transition-opacity"
        />
        </div>
    </footer>
  );

  const renderContent = () => {
    if (jobForGenerator) {
        return (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <JobImageGenerator 
                    job={jobForGenerator} 
                    onClose={handleCloseGenerator} 
                    onSuccess={handleImageGeneratedSuccess}
                />
            </div>
        );
    }

    if (selectedJob) {
        return (
            <div className="max-w-4xl mx-auto w-full px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <JobModal 
                  job={selectedJob} 
                  onClose={handleCloseDetails} 
                />
            </div>
        );
    }

    return (
        <>
          {headerContent}

          {/* Filtros */}
          <div className="w-full z-20 bg-white border-b border-slate-200 shadow-sm sticky top-0">
            <div className="max-w-7xl mx-auto px-4 pt-4 pb-4">
                <Filters 
                filters={filters}
                setFilters={setFilters}
                locations={locations}
                />
            </div>
          </div>

          {/* Área de Conteúdo */}
          <main id="jobs-container" className="px-4 py-8 w-full">
              <div className="max-w-7xl mx-auto">
                
                <div className="flex items-baseline justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                        Vagas Publicadas
                        <span className="ml-3 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full lowercase normal-case">
                            {filteredJobs.length} encontradas
                        </span>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
                        <p className="text-slate-600 font-semibold">Carregando oportunidades...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto my-10">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                        <CircleAlert className="h-7 w-7 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Não foi possível carregar as vagas</h3>
                        <p className="text-red-700 mb-6 text-sm max-w-md mx-auto">
                        Houve um problema ao conectar com a plataforma de vagas.
                        </p>
                        <button 
                        onClick={loadData}
                        className="inline-flex items-center justify-center bg-white text-red-700 border border-red-200 hover:bg-red-50 font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
                        >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                        </button>
                    </div>
                ) : filteredJobs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {visibleJobs.map(job => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                onShowDetails={handleShowDetails}
                                onGenerateImage={handleOpenGenerator}
                            />
                            ))}
                        </div>
                        
                        {hasMore && (
                            <div className="flex justify-center pb-10">
                                <button 
                                    onClick={handleLoadMore}
                                    className="group flex items-center px-8 py-4 bg-white border border-brand-200 text-brand-700 font-bold rounded-full shadow-sm hover:shadow-md hover:border-brand-400 hover:bg-brand-50 transition-all duration-300"
                                >
                                    <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    Carregar mais vagas
                                </button>
                            </div>
                        )}

                        {!hasMore && filteredJobs.length > ITEMS_PER_PAGE && (
                            <div className="text-center pb-10 text-slate-400 text-sm font-medium">
                                Você visualizou todas as vagas disponíveis.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-sm mb-5">
                            <Briefcase className="h-7 w-7 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Nenhuma vaga encontrada</h3>
                        <p className="mt-2 text-slate-500 max-w-sm mx-auto text-center">
                        Tente ajustar os filtros de busca acima.
                        </p>
                        <button 
                        onClick={() => setFilters({ keyword: '', location: '', jobCode: '', specificDate: '' })}
                        className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-full text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-md"
                        >
                        Limpar filtros
                        </button>
                    </div>
                )}
              </div>
          </main>

          {footerContent}
        </>
    );
  };

  return (
    <div className="bg-transparent font-sans w-full flex flex-col text-slate-900 min-h-[100px]">
      {renderContent()}
    </div>
  );
}