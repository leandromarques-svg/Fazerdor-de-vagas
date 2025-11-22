
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchJobs } from './services/selectyService';
import { SelectyJobResponse, JobFilterState, LibraryImage, ImageTag } from './types';
import { INITIAL_LIBRARY_IMAGES } from './constants';
import { JobCard } from './components/JobCard';
import { JobModal } from './components/JobModal';
import { JobImageGenerator } from './components/JobImageGenerator';
import { CarouselGenerator } from './components/CarouselGenerator';
import { Filters } from './components/Filters';
import { StatsModal } from './components/StatsModal';
import { Loader2, Briefcase, CircleAlert, RefreshCw, Plus, Wand2, Palette, Clock, HeartHandshake, Sparkles, Image as ImageIcon, Upload, Trash2, X, CheckCircle, Settings, Database, FileCode, Tag, Layers, Download, TrendingUp, CloudUpload } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const ITEMS_PER_PAGE = 9;
const AVAILABLE_TAGS: ImageTag[] = ['Homem', 'Mulher', 'Negros', '50+', 'LGBTQIAPN+', 'PCD', 'Indígenas', 'Jovem', 'Amarelos', '+pessoas'];

// Helper: Converte Base64 para Blob
const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};

// Helper para compressão de imagem
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 900;
                const MAX_HEIGHT = 1400;

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(event.target?.result as string);
                    return;
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function App() {
  const [jobs, setJobs] = useState<SelectyJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<SelectyJobResponse | null>(null);
  const [jobForGenerator, setJobForGenerator] = useState<SelectyJobResponse | null>(null);
  
  // Carousel / Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedJobsForCarousel, setSelectedJobsForCarousel] = useState<SelectyJobResponse[]>([]);
  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState<null | 'zip' | 'pdf'>(null);

  // Library State
  const [customImages, setCustomImages] = useState<LibraryImage[]>([]);
  const [showImageAdmin, setShowImageAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload States
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [tempUploadImages, setTempUploadImages] = useState<string[]>([]);
  const [newImageTags, setNewImageTags] = useState<ImageTag[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Edit Tags State
  const [editingImage, setEditingImage] = useState<LibraryImage | null>(null);
  const [editingTags, setEditingTags] = useState<ImageTag[]>([]);
  const [isSavingTags, setIsSavingTags] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<JobFilterState>({
    keyword: '',
    location: '',
    jobCode: '',
    specificDate: ''
  });

  // Stats State
  const [stats, setStats] = useState({ count: 0, hoursSaved: 0 });
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Visible Count State (Load More logic)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // --- Initialization Logic ---
  useEffect(() => {
    loadStats();
    loadCustomImages();
  }, []);

  const loadStats = async () => {
      // Tenta carregar do Supabase para ter contagem global
      if (isSupabaseConfigured && supabase) {
          try {
              const { data, error } = await supabase
                  .from('app_statistics')
                  .select('total_generated')
                  .eq('id', 1) // Assume single row for global stats
                  .single();
              
              if (data) {
                  const count = data.total_generated;
                  setStats({ count, hoursSaved: Math.floor(count * 0.25) });
                  return;
              }
          } catch (e) {
              console.warn("Failed to fetch global stats, falling back to local", e);
          }
      }

      // Fallback Local
      const savedCount = localStorage.getItem('metarh_gen_count');
      const initialCount = savedCount ? parseInt(savedCount, 10) : 0;
      setStats({ count: initialCount, hoursSaved: Math.floor(initialCount * 0.25) });
  };

  const incrementStats = async (amount: number = 1) => {
      const newCount = stats.count + amount;
      const newHours = Math.floor(newCount * 0.25);
      
      // Update State immediately
      setStats({ count: newCount, hoursSaved: newHours });
      
      // Update Local
      localStorage.setItem('metarh_gen_count', String(newCount));

      // Update Global (Supabase)
      if (isSupabaseConfigured && supabase) {
          try {
              // Simple increment via update if we have the value, purely optimistic for this demo
              // In production, use an RPC function: await supabase.rpc('increment_stats', { row_id: 1, amount: amount })
              const { error } = await supabase
                .from('app_statistics')
                .update({ total_generated: newCount })
                .eq('id', 1);
          } catch (e) {
              console.warn("Failed to update global stats", e);
          }
      }
  };

  const loadCustomImages = async () => {
      if (isSupabaseConfigured && supabase) {
          try {
            setSupabaseError(null);
            const { data, error } = await supabase
                .from('library_images')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            if (data) {
                const formattedImages: LibraryImage[] = data.map((item: any) => ({
                    id: item.id,
                    url: item.url,
                    tags: item.tags || [],
                    isCustom: true
                }));
                setCustomImages(formattedImages);
            }
          } catch (err: any) {
              console.error("Erro ao carregar imagens do Supabase:", err);
              if (err.code === '42P01' || err.message?.includes('relation "library_images" does not exist')) {
                  setSupabaseError("A tabela 'library_images' ainda não existe no Supabase. Por favor, execute o script SQL 'supabase_schema.sql' no painel do Supabase.");
              } else {
                  setSupabaseError(`Erro ao conectar no banco: ${err.message}`);
              }
          }
      } else {
        const savedImages = localStorage.getItem('metarh_custom_images');
        if (savedImages) {
            try {
                const parsed = JSON.parse(savedImages);
                setCustomImages(parsed);
            } catch (e) {
                console.error("Failed to load local images", e);
            }
        }
      }
  };

  // --- Image Management Logic (Add/Remove/Update) ---
  const allLibraryImages = useMemo(() => {
      return [...INITIAL_LIBRARY_IMAGES, ...customImages];
  }, [customImages]);

  const handleAddImage = async (base64Images: string[], tags: ImageTag[]) => {
      if (isSupabaseConfigured && supabase) {
          setIsUploadingToCloud(true);
          let successCount = 0;
          const newEntries: LibraryImage[] = [];
          try {
            for (let i = 0; i < base64Images.length; i++) {
                const base64 = base64Images[i];
                setProcessingStatus(`Enviando ${i + 1} de ${base64Images.length}...`);
                try {
                    const blob = base64ToBlob(base64);
                    const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                    const { data: insertData, error: insertError } = await supabase.from('library_images').insert([{ url: publicUrl, tags: tags, is_custom: true }]).select().single();
                    if (insertError) throw insertError;
                    if (insertData) {
                        newEntries.push({ id: insertData.id, url: insertData.url, tags: insertData.tags, isCustom: true });
                        successCount++;
                    }
                } catch (singleErr) { console.error("Erro individual:", singleErr); }
            }
            if (newEntries.length > 0) setCustomImages(prev => [...newEntries, ...prev]);
            setSupabaseError(null);
          } catch (err: any) { alert(`Erro crítico: ${err.message}`); } finally { setIsUploadingToCloud(false); setProcessingStatus(''); }
      } else {
          const newEntries: LibraryImage[] = base64Images.map((url, idx) => ({ id: `custom-${Date.now()}-${idx}`, url, tags: tags, isCustom: true }));
          const updated = [...customImages, ...newEntries];
          setCustomImages(updated);
          try { localStorage.setItem('metarh_custom_images', JSON.stringify(updated)); } catch (e) { alert("Limite de armazenamento local atingido."); }
      }
  };

  const handleRemoveImage = async (id: string, url: string) => {
      if (!confirm('Tem certeza que deseja excluir esta imagem permanentemente?')) return;
      if (isSupabaseConfigured && supabase) {
        try {
            const { error: dbError } = await supabase.from('library_images').delete().eq('id', id);
            if (dbError) throw dbError;
            const fileName = url.substring(url.lastIndexOf('/') + 1);
            const decodedFileName = decodeURIComponent(fileName);
            if (decodedFileName) await supabase.storage.from('images').remove([decodedFileName]);
            setCustomImages(prev => prev.filter(img => img.id !== id));
        } catch (err: any) { alert("Erro ao deletar: " + err.message); }
      } else {
        const updated = customImages.filter(img => img.id !== id);
        setCustomImages(updated);
        localStorage.setItem('metarh_custom_images', JSON.stringify(updated));
      }
  };
  
  const handleUpdateTags = async () => {
    if (!editingImage) return;
    setIsSavingTags(true);
    try {
        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase.from('library_images').update({ tags: editingTags }).eq('id', editingImage.id);
            if (error) throw error;
        } 
        const updatedImages = customImages.map(img => img.id === editingImage.id ? { ...img, tags: editingTags } : img);
        setCustomImages(updatedImages);
        if (!isSupabaseConfigured || !supabase) localStorage.setItem('metarh_custom_images', JSON.stringify(updatedImages));
        setEditingImage(null);
    } catch (e: any) { alert("Erro ao atualizar tags: " + e.message); } finally { setIsSavingTags(false); }
  };

  const handleOpenEditTags = (img: LibraryImage) => { setEditingImage(img); setEditingTags(img.tags); };
  const toggleEditingTag = (tag: ImageTag) => { setEditingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); };
  
  // --- Drag & Drop and File Processing Logic ---
  const processFiles = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setIsProcessingImages(true);
      setNewImageTags([]);
      const processed: string[] = [];
      try {
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (!file.type.startsWith('image/')) continue;

              setProcessingStatus(`Processando imagem ${i + 1} de ${files.length}...`);
              await new Promise(resolve => setTimeout(resolve, 10)); 
              const base64 = await compressImage(file);
              processed.push(base64);
          }
          if (processed.length > 0) {
              setTempUploadImages(processed);
          }
      } catch (e) { alert("Erro ao processar as imagens."); } finally { setIsProcessingImages(false); setProcessingStatus(''); }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(event.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isProcessingImages) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!isProcessingImages) {
          processFiles(e.dataTransfer.files);
      }
  };

  const confirmUpload = async () => { await handleAddImage(tempUploadImages, newImageTags); setTempUploadImages([]); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const toggleNewImageTag = (tag: ImageTag) => { setNewImageTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); };

  // --- Selection & Carousel Logic ---
  const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      setSelectedJobsForCarousel([]);
  };
  const toggleJobSelection = (job: SelectyJobResponse) => {
      const isSelected = selectedJobsForCarousel.find(j => j.id === job.id);
      if (isSelected) setSelectedJobsForCarousel(prev => prev.filter(j => j.id !== job.id));
      else {
          if (selectedJobsForCarousel.length >= 18) { alert("Máximo de 18 vagas atingido."); return; }
          setSelectedJobsForCarousel(prev => [...prev, job]);
      }
  };

  // Handler for when user downloads generated content (Increments stats only, does not close modal)
  const handleCarouselDownload = (generatedCount: number) => {
      incrementStats(generatedCount);
  };

  // Handler to fully close the carousel generator and clear selection
  const handleCloseCarouselGenerator = () => {
    setIsGeneratingCarousel(null);
    setIsSelectionMode(false);
    setSelectedJobsForCarousel([]);
  };

  const handleImageGeneratedSuccess = () => { incrementStats(1); };

  // --- Iframe Resizer ---
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
    const debouncedSendHeight = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(sendHeight, 50); };
    debouncedSendHeight();
    const resizeObserver = new ResizeObserver(debouncedSendHeight);
    const root = document.getElementById('root');
    if (root) resizeObserver.observe(root);
    window.addEventListener('resize', debouncedSendHeight);
    window.addEventListener('load', debouncedSendHeight);
    return () => { resizeObserver.disconnect(); window.removeEventListener('resize', debouncedSendHeight); window.removeEventListener('load', debouncedSendHeight); clearTimeout(resizeTimer); };
  }, [visibleCount, jobs, loading, filters, selectedJob, jobForGenerator, stats, showImageAdmin, customImages, supabaseError, editingImage, isSelectionMode, selectedJobsForCarousel, isGeneratingCarousel]); 

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try { const data = await fetchJobs(); setJobs(data || []); } catch (err: any) { setError(err.message || "Erro desconhecido"); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [filters]);

  const handleShowDetails = (job: SelectyJobResponse) => { setJobForGenerator(null); setSelectedJob(job); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCloseDetails = () => { setSelectedJob(null); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const handleOpenGenerator = (job: SelectyJobResponse) => { setSelectedJob(null); setJobForGenerator(job); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleCloseGenerator = () => { setJobForGenerator(null); window.scrollTo({ top: 0, behavior: 'auto' }); };

  const locations = useMemo(() => {
    const locs = new Set<string>();
    jobs.forEach(job => { if(job.remote) locs.add("Trabalho Remoto"); else if(job.city) locs.add(job.state ? `${job.city} - ${job.state}` : job.city || "Local não informado"); });
    return Array.from(locs).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const searchMatch = filters.keyword === '' || job.title.toLowerCase().includes(filters.keyword.toLowerCase());
      const locMatch = filters.location === '' || (filters.location === "Trabalho Remoto" ? job.remote : (job.city && filters.location.includes(job.city)));
      const codeMatch = filters.jobCode === '' || String(job.id).toLowerCase().includes(filters.jobCode.toLowerCase());
      let dateMatch = true;
      if (filters.specificDate && job.published_at) {
        const jobDate = new Date(job.published_at);
        const jobDateString = jobDate.toISOString().split('T')[0]; 
        if (jobDateString !== filters.specificDate) dateMatch = false;
      }
      return searchMatch && locMatch && codeMatch && dateMatch;
    });
  }, [jobs, filters]);

  const visibleJobs = useMemo(() => { return filteredJobs.slice(0, visibleCount); }, [filteredJobs, visibleCount]);
  const hasMore = visibleCount < filteredJobs.length;
  const handleLoadMore = () => setVisibleCount(prev => prev + ITEMS_PER_PAGE);

  const headerContent = (
    <>
       <div className="w-full bg-white">
            <img src="https://metarh.com.br/wp-content/uploads/2025/11/banner_app.png" alt="MetaRH Banner" className="w-full h-auto block" style={{ minWidth: '320px' }} />
        </div>

        <div className="w-full bg-white pt-6 px-4 pb-6">
            <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 rounded-full">
                        <Wand2 className="w-6 h-6 text-brand-600" />
                    </div>
                    <h1 className="text-3xl font-sans font-black text-slate-900 tracking-tight uppercase">Fazedor de Vaga</h1>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {/* Stats Button */}
                    <button 
                        onClick={() => setShowStatsModal(true)}
                        className="rounded-2xl p-3 border border-slate-200 bg-white hover:bg-brand-50 hover:border-brand-300 text-slate-600 transition-all flex items-center gap-3 min-w-[160px]"
                    >
                        <div className="bg-brand-50 p-2 rounded-full shadow-sm"><TrendingUp className="w-4 h-4 text-brand-600" /></div>
                        <div className="text-left">
                            <div className="text-sm font-bold leading-none">Ver Impacto</div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">Estatísticas</div>
                        </div>
                    </button>

                    {/* Carousel Toggle Button */}
                    <button 
                        onClick={toggleSelectionMode}
                        className={`rounded-2xl p-3 border flex items-center gap-3 min-w-[160px] transition-all ${isSelectionMode ? 'bg-brand-600 border-brand-600 text-white ring-2 ring-brand-200' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50'}`}
                    >
                            <div className={`p-2 rounded-full shadow-sm ${isSelectionMode ? 'bg-white/20' : 'bg-brand-50'}`}>
                               <Layers className={`w-4 h-4 ${isSelectionMode ? 'text-white' : 'text-brand-600'}`} />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold leading-none">Modo Carrossel</div>
                                <div className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${isSelectionMode ? 'text-brand-100' : 'text-slate-400'}`}>
                                    {isSelectionMode ? 'Ativado' : 'Desativado'}
                                </div>
                            </div>
                    </button>
                    
                    <button 
                        onClick={() => setShowImageAdmin(!showImageAdmin)}
                        className={`rounded-2xl p-3 border flex items-center gap-3 min-w-[160px] transition-all ${showImageAdmin ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50'}`}
                    >
                            <div className={`p-2 rounded-full shadow-sm ${showImageAdmin ? 'bg-white/20' : 'bg-brand-50'}`}>
                                {supabaseError ? (
                                   <CircleAlert className={`w-4 h-4 ${showImageAdmin ? 'text-white' : 'text-red-500'}`} /> 
                                ) : (
                                   <Settings className={`w-4 h-4 ${showImageAdmin ? 'text-white' : 'text-brand-600'}`} />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold leading-none">Banco de Imagens</div>
                                <div className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${showImageAdmin ? 'text-brand-100' : (supabaseError ? 'text-red-500' : 'text-slate-400')}`}>
                                    {supabaseError ? 'Requer Configuração' : 'Gerenciar'}
                                </div>
                            </div>
                    </button>
                </div>
            </div>
            </div>
        </div>

        {/* --- ADMIN PANEL --- */}
        {showImageAdmin && (
            <div className="w-full bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-4 fade-in duration-300 relative">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-brand-600" />
                                Gerenciar Biblioteca
                                <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500">
                                    {customImages.length} imagens
                                </span>
                            </h3>
                            <div className="flex items-center gap-1 mt-1 ml-7">
                                <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured && !supabaseError ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">
                                    {isSupabaseConfigured && !supabaseError ? 'Conectado à Nuvem (Supabase)' : isSupabaseConfigured && supabaseError ? 'Erro na Conexão' : 'Modo Local (Offline)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`mb-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer
                            ${isDragging 
                                ? 'border-brand-500 bg-brand-50 scale-[1.01]' 
                                : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50'
                            }
                        `}
                    >
                         <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                             <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-brand-200 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                                <CloudUpload className="w-8 h-8" />
                             </div>
                             {isProcessingImages ? (
                                 <div className="flex items-center gap-2 text-brand-600 font-bold">
                                     <Loader2 className="w-5 h-5 animate-spin" />
                                     Processando...
                                 </div>
                             ) : (
                                 <>
                                    <h4 className="text-lg font-bold text-slate-700 mb-1">
                                        {isDragging ? 'Solte as imagens aqui!' : 'Arraste e solte ou clique para adicionar'}
                                    </h4>
                                    <p className="text-sm text-slate-500">Suporta JPG e PNG. Múltiplas imagens permitidas.</p>
                                 </>
                             )}
                             <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                disabled={isProcessingImages} 
                                onChange={handleFileSelect} 
                            />
                         </label>
                    </div>
                    
                    {processingStatus && (<div className="mb-4 text-center"><span className="inline-flex items-center px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold animate-pulse">{processingStatus}</span></div>)}
                    
                    {supabaseError && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
                            <Database className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-red-800 text-sm uppercase">Configuração do Banco Necessária</h4>
                                <p className="text-sm text-red-700 mt-1 mb-2">{supabaseError}</p>
                                <div className="bg-white border border-red-100 p-3 rounded-lg">
                                    <p className="text-xs text-slate-600 mb-1 font-bold">Como corrigir:</p>
                                    <ol className="list-decimal list-inside text-xs text-slate-500 space-y-1"><li>Acesse seu painel no Supabase.</li><li>Vá em <strong>SQL Editor</strong> e crie uma <strong>New Query</strong>.</li><li>Copie o conteúdo do arquivo <code>supabase_schema.sql</code> e cole lá.</li><li>Clique em <strong>Run</strong>.</li><li>Recarregue esta página.</li></ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {tempUploadImages.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-brand-200 mb-6 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-brand-800 mb-1">{tempUploadImages.length} imagem(ns) pronta(s) para salvar</h4>
                                    <p className="text-sm text-slate-500 mb-3">Selecione as categorias:</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {AVAILABLE_TAGS.map(tag => (
                                            <button key={tag} onClick={() => toggleNewImageTag(tag)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${newImageTags.includes(tag) ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-brand-300'}`}>{tag} {newImageTags.includes(tag) && <CheckCircle className="w-3 h-3 inline ml-1" />}</button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={confirmUpload} disabled={isUploadingToCloud} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2">{isUploadingToCloud && <Loader2 className="w-4 h-4 animate-spin" />}{isUploadingToCloud ? 'Salvando...' : 'Salvar na Biblioteca'}</button>
                                        <button onClick={() => setTempUploadImages([])} disabled={isUploadingToCloud} className="bg-white text-slate-500 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">Cancelar</button>
                                    </div>
                                </div>
                                <div className="flex gap-2 overflow-x-auto max-w-xs pb-2">{tempUploadImages.slice(0, 3).map((src, idx) => (<img key={idx} src={src} className="h-20 w-20 object-cover rounded-lg border border-slate-200" />))}</div>
                            </div>
                        </div>
                    )}

                    {customImages.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300"><p className="text-slate-400 text-sm">Nenhuma imagem no banco. Adicione imagens para começar.</p></div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {customImages.map((img) => (
                                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm border border-slate-100">
                                    <img src={img.url} alt="Custom" className="w-full h-full object-cover" />
                                    {img.tags.length === 0 && (<div className="absolute top-1 left-1 bg-yellow-100 text-yellow-800 p-1 rounded-full z-10" title="Sem categoria"><CircleAlert className="w-3 h-3" /></div>)}
                                    <button onClick={() => handleOpenEditTags(img)} className="absolute top-1 left-1 bg-white text-brand-600 p-1.5 rounded-full shadow-md border border-slate-100 hover:bg-brand-50 transition-colors z-10 opacity-0 group-hover:opacity-100"><Tag className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleRemoveImage(img.id, img.url)} className="absolute top-1 right-1 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-slate-100 hover:bg-red-50 transition-colors z-10 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 pointer-events-none"><div className="flex flex-wrap gap-1 justify-center">{img.tags.length > 0 ? (<>{img.tags.slice(0, 2).map((t, i) => (<span key={i} className="text-[8px] bg-white/90 text-black px-1 rounded font-bold">{t}</span>))}{img.tags.length > 2 && <span className="text-[8px] bg-white/90 text-black px-1 rounded font-bold">...</span>}</>) : (<span className="text-[8px] bg-red-100 text-red-800 px-1 rounded font-bold">Sem tag</span>)}</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editingImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Editar Categorias</h3>
                                <p className="text-sm text-slate-500 mb-6">Selecione as categorias para facilitar a busca desta imagem no gerador.</p>
                                <div className="flex justify-center mb-6"><img src={editingImage.url} className="h-40 w-auto rounded-xl shadow-md border border-slate-100" /></div>
                                <div className="flex flex-wrap gap-2 mb-8 justify-center">{AVAILABLE_TAGS.map(tag => (<button key={tag} onClick={() => toggleEditingTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${editingTags.includes(tag) ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-brand-300'}`}>{tag} {editingTags.includes(tag) && <CheckCircle className="w-3 h-3 inline ml-1" />}</button>))}</div>
                                <div className="flex gap-3"><button onClick={handleUpdateTags} disabled={isSavingTags} className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center gap-2">{isSavingTags && <Loader2 className="w-4 h-4 animate-spin" />}{isSavingTags ? 'Salvando...' : 'Salvar Alterações'}</button><button onClick={() => setEditingImage(null)} disabled={isSavingTags} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
    </>
  );

  const footerContent = (
    <footer className="w-full py-8 border-t border-slate-100 mt-auto bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-400">
        <span className="text-xs font-bold uppercase tracking-wider">Produzido por</span>
        <img src="https://metarh.com.br/wp-content/uploads/2025/11/logo-metarh-azul.png" alt="MetaRH" className="w-[65px] h-auto opacity-80 hover:opacity-100 transition-opacity" />
        </div>
    </footer>
  );

  const renderContent = () => {
    // 1. Carousel Generation Mode
    if (isGeneratingCarousel) {
        return (
            <CarouselGenerator 
                selectedJobs={selectedJobsForCarousel} 
                libraryImages={allLibraryImages}
                mode={isGeneratingCarousel}
                onDownload={handleCarouselDownload}
                onCancel={handleCloseCarouselGenerator}
            />
        );
    }

    // 2. Single Job Generator
    if (jobForGenerator) {
        return (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <JobImageGenerator 
                    job={jobForGenerator} 
                    onClose={handleCloseGenerator} 
                    onSuccess={handleImageGeneratedSuccess}
                    libraryImages={allLibraryImages}
                />
            </div>
        );
    }

    // 3. Details Modal
    if (selectedJob) {
        return (
            <div className="max-w-4xl mx-auto w-full px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <JobModal job={selectedJob} onClose={handleCloseDetails} onGenerateImage={handleOpenGenerator} />
            </div>
        );
    }

    // 4. Main Dashboard
    return (
        <>
          {headerContent}
          <div className="w-full z-20 bg-white border-b border-slate-200 shadow-sm sticky top-0">
            <div className="max-w-7xl mx-auto px-4 pt-4 pb-4">
                <Filters filters={filters} setFilters={setFilters} locations={locations} />
            </div>
          </div>
          <main id="jobs-container" className="px-4 py-8 w-full relative">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-baseline justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Vagas Publicadas <span className="ml-3 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full lowercase normal-case">{filteredJobs.length} encontradas</span></h2>
                </div>
                
                {isSelectionMode && (
                     <div className="bg-brand-50 border-l-4 border-brand-500 p-4 mb-6 rounded-r-lg flex justify-between items-center sticky top-24 z-30 shadow-md animate-in slide-in-from-top-2">
                        <div>
                            <h3 className="font-bold text-brand-800">Modo Seleção de Carrossel</h3>
                            <p className="text-sm text-brand-700 mt-0.5">Selecione até 18 vagas para gerar o carrossel.</p>
                        </div>
                        <span className="text-2xl font-black text-brand-600">{selectedJobsForCarousel.length}<span className="text-sm text-brand-400 font-normal ml-1">/18</span></span>
                     </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100"><Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" /><p className="text-slate-600 font-semibold">Carregando oportunidades...</p></div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto my-10"><div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4"><CircleAlert className="h-7 w-7 text-red-600" /></div><h3 className="text-xl font-bold text-red-900 mb-2">Não foi possível carregar as vagas</h3><p className="text-red-700 mb-6 text-sm max-w-md mx-auto">Houve um problema ao conectar com a plataforma de vagas.</p><button onClick={loadData} className="inline-flex items-center justify-center bg-white text-red-700 border border-red-200 hover:bg-red-50 font-bold py-3 px-8 rounded-full transition-colors shadow-sm"><RefreshCw className="w-4 h-4 mr-2" />Tentar Novamente</button></div>
                ) : filteredJobs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {visibleJobs.map(job => (
                                <JobCard 
                                    key={job.id} 
                                    job={job} 
                                    onShowDetails={handleShowDetails} 
                                    onGenerateImage={handleOpenGenerator}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={!!selectedJobsForCarousel.find(j => j.id === job.id)}
                                    onToggleSelect={toggleJobSelection}
                                />
                            ))}
                        </div>
                        {hasMore && (<div className="flex justify-center pb-10"><button onClick={handleLoadMore} className="group flex items-center px-8 py-4 bg-white border border-brand-200 text-brand-700 font-bold rounded-full shadow-sm hover:shadow-md hover:border-brand-400 hover:bg-brand-50 transition-all duration-300"><Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />Carregar mais vagas</button></div>)}
                        {!hasMore && filteredJobs.length > ITEMS_PER_PAGE && (<div className="text-center pb-10 text-slate-400 text-sm font-medium">Você visualizou todas as vagas disponíveis.</div>)}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100 border-dashed"><div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-sm mb-5"><Briefcase className="h-7 w-7 text-slate-400" /></div><h3 className="text-xl font-bold text-slate-900">Nenhuma vaga encontrada</h3><p className="mt-2 text-slate-500 max-w-sm mx-auto text-center">Tente ajustar os filtros de busca acima.</p><button onClick={() => setFilters({ keyword: '', location: '', jobCode: '', specificDate: '' })} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-full text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-md">Limpar filtros</button></div>
                )}
              </div>

              {/* Carousel Floating Action Bar */}
              {isSelectionMode && selectedJobsForCarousel.length > 0 && (
                  <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-6">
                      <div className="bg-slate-900 text-white rounded-full px-6 py-4 shadow-2xl flex items-center gap-6 max-w-2xl">
                          <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Selecionadas</span>
                              <span className="font-bold text-lg leading-none">{selectedJobsForCarousel.length} vagas</span>
                          </div>
                          <div className="h-8 w-px bg-slate-700"></div>
                          <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsGeneratingCarousel('zip')}
                                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-brand-900/50"
                                >
                                    <RefreshCw className="w-4 h-4" /> Revisar & Gerar
                                </button>
                          </div>
                          <button 
                                onClick={() => setSelectedJobsForCarousel([])}
                                className="ml-2 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                                title="Limpar seleção"
                            >
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              )}

          </main>
          {footerContent}
          
          {/* Stats Modal */}
          <StatsModal 
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
            count={stats.count}
            hoursSaved={stats.hoursSaved}
          />
        </>
    );
  };

  return <div className="bg-transparent font-sans w-full flex flex-col text-slate-900 min-h-[100px]">{renderContent()}</div>;
}