
import React, { useEffect, useState, useRef } from 'react';
import { SelectyJobResponse, LibraryImage } from '../types';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { Loader2, ChevronLeft, Download, RefreshCw, Image as ImageIcon, CheckCircle, X, Eye, Layers, Edit3, Type, Copy, Check, HeartHandshake, Sparkles } from 'lucide-react';

interface CarouselGeneratorProps {
    selectedJobs: SelectyJobResponse[];
    libraryImages: LibraryImage[];
    onDownload: (generatedCount: number) => void;
    mode: 'zip' | 'pdf' | null;
    onCancel: () => void;
}

// --- Constants ---
const COLORS = {
  purple: '#481468', 
  vibrantPurple: '#aa3ffe', 
  pink: '#F42C9F', 
  green: '#a3e635', 
  orange: '#ff6b00', 
  white: '#FFFFFF',
  
  // Cores Específicas Vaga Afirmativa
  affirmativePurple: '#b24eec',
  affirmativeText1: '#9c5cf5',
  affirmativeText2: '#7b28bb',
  affirmativeBox: '#b25af6',
  affirmativeContract: '#ed2bf4',
  affirmativeModality: '#9932d8',
  affirmativeLocation: '#7730d8',
};

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

// Layout Constants for Affirmative
const HEADER_HEIGHT = 569;
const FOOTER_HEIGHT = 249;
const PHOTO_WIDTH = 436;
const PHOTO_TOP = 411;
const PHOTO_BOTTOM = 1101; 
const PHOTO_HEIGHT = PHOTO_BOTTOM - PHOTO_TOP;
const PHOTO_LEFT = 80; 
const FLOATING_CARD_WIDTH = 424;
const FLOATING_CARD_HEIGHT = 201;
const FLOATING_CARD_RIGHT = 60;
const FLOATING_CARD_TOP = HEADER_HEIGHT - 60 - FLOATING_CARD_HEIGHT; 
const LOGO_HEIGHT = 100;
const LOGO_MARGIN_BOTTOM = 60;
const LOGO_TOP = FLOATING_CARD_TOP - LOGO_MARGIN_BOTTOM - LOGO_HEIGHT; 

// Options
const CONTRACT_OPTIONS = ['CLT (Efetivo)', 'PJ', 'Estágio', 'Temporário', 'Freelance', 'Trainee'];
const MODALITY_OPTIONS = ['Presencial', 'Híbrido', 'Remoto'];
const DIVERSITY_OPTIONS = ['Mulheres', 'Pessoas Negras', 'Pessoas com Deficiência', 'LGBTQIAPN+', '50+', 'Pessoas Indígenas', 'Jovem', 'Amarelos', 'Afirmativa (Geral)'];

const useBase64Image = (url: string | null) => {
  const [dataSrc, setDataSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!url) { setDataSrc(undefined); return; }
    if (url.startsWith('data:')) { setDataSrc(url); return; }
    let isMounted = true;
    const loadImage = async () => {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Network response');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => { if (isMounted) setDataSrc(reader.result as string); };
        reader.readAsDataURL(blob);
      } catch (error) { if (isMounted) setDataSrc(url); }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [url]);
  return dataSrc;
};

const getTitleFontSize = (text: string) => {
    const len = text.length;
    if (len > 100) return '32px';
    if (len > 70) return '40px';
    if (len > 35) return '48px';
    return '56px';
};

const getCategoryFontSize = (text: string) => {
      const len = text.length;
      if (len > 35) return '18px';
      if (len > 25) return '22px';
      return '30px';
}

const getDiversityTitleSize = (text: string) => { if (text.length > 20) return '72px'; return '80px'; }

interface SlideOverrides {
    title?: string;
    category?: string;
    location?: string;
    contract?: string;
    modality?: string;
    tagline?: string;
    companyType?: 'multinacional' | 'nacional' | 'custom';
    isAffirmative?: boolean;
    affirmativeType?: string;
}

interface SlideConfig {
    type: 'cover' | 'job' | 'back';
    job?: SelectyJobResponse;
    image?: string; 
    id: string;
    overrides?: SlideOverrides;
}

interface SlideProps {
    config: SlideConfig;
    assets: {
        logo: string | undefined;
        background: string | undefined;
        cover: string | undefined;
        back: string | undefined;
    };
    scale?: number;
}

// --- Single Slide Component ---
const Slide: React.FC<SlideProps> = ({ config, assets, scale = 1 }) => {
    const style = {
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
    };

    // 1. Cover Slide
    if (config.type === 'cover') {
        return (
            <div id={config.id} className="relative overflow-hidden bg-white flex items-center justify-center" style={style}>
                 {assets.cover ? (
                     <img src={assets.cover} className="w-full h-full object-cover" crossOrigin="anonymous" />
                 ) : (
                     <div className="flex items-center justify-center h-full w-full bg-brand-600 text-white font-bold text-4xl">Carregando Capa...</div>
                 )}
            </div>
        );
    }

    // 2. Back Cover Slide
    if (config.type === 'back') {
        return (
            <div id={config.id} className="relative overflow-hidden bg-white flex items-center justify-center" style={style}>
                {assets.back ? (
                     <img src={assets.back} className="w-full h-full object-cover" crossOrigin="anonymous" />
                 ) : (
                     <div className="flex items-center justify-center h-full w-full bg-brand-600 text-white font-bold text-4xl">Carregando Contra-Capa...</div>
                 )}
            </div>
        );
    }

    // 3. Job Slide
    const job = config.job!;
    const overrides = config.overrides || {};

    const title = overrides.title || job.title.split(' - ')[0].trim();
    const tag1 = overrides.contract || (job.contract_type === 'CLT' ? 'CLT (Efetivo)' : (job.contract_type || 'CLT (Efetivo)'));
    const tag2 = overrides.modality || (job.remote ? 'Remoto' : 'Presencial');
    const location = overrides.location || (job.city ? `${job.city}-${job.state}` : 'Brasil');
    const category = overrides.category || ((job.department && job.department !== 'Geral') ? job.department.toUpperCase() : 'SETOR ADMINISTRATIVO');
    const tagline = overrides.tagline || 'TRABALHE EM UMA EMPRESA MULTINACIONAL';
    const companyType = overrides.companyType || 'multinacional';
    
    const isAffirmative = overrides.isAffirmative || false;
    const affirmativeType = overrides.affirmativeType || DIVERSITY_OPTIONS[0];

    const footerUrl = 'metarh.com.br/vagas-metarh';
    const safeJobImage = useBase64Image(config.image || null);
    
    // --- RENDER: AFFIRMATIVE SLIDE ---
    if (isAffirmative) {
        return (
            <div id={config.id} className="relative overflow-hidden flex flex-col shrink-0 bg-white" style={style}>
                {/* 1. Header (Purple) */}
                <div className="absolute top-0 left-0 w-full z-10" style={{ backgroundColor: COLORS.affirmativePurple, height: `${HEADER_HEIGHT}px`, borderBottomLeftRadius: '80px', borderBottomRightRadius: '80px' }}>
                    <div className="absolute flex items-center justify-center" style={{ right: `${FLOATING_CARD_RIGHT}px`, width: `${FLOATING_CARD_WIDTH}px`, top: `${LOGO_TOP}px`, height: `${LOGO_HEIGHT}px` }}>{assets.logo && <img src={assets.logo} className="h-full w-auto object-contain opacity-90" crossOrigin="anonymous" />}</div>
                    <div className="absolute bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center p-6" style={{ width: `${FLOATING_CARD_WIDTH}px`, height: `${FLOATING_CARD_HEIGHT}px`, right: `${FLOATING_CARD_RIGHT}px`, top: `${FLOATING_CARD_TOP}px` }}>
                        <h2 className="font-sans font-semibold text-[32px] uppercase leading-tight mb-6 text-center">
                            {companyType === 'custom' ? (
                                <span style={{ color: COLORS.affirmativeText2 }}>{tagline}</span>
                            ) : (
                                <><span style={{ color: COLORS.affirmativeText1 }}>Trabalhe em uma<br/>empresa </span><span style={{ color: COLORS.affirmativeText2 }}>{companyType.toUpperCase()}</span></>
                            )}
                        </h2>
                        <div className="rounded-[18px] flex items-center justify-center w-[353px] h-[51px]" style={{ backgroundColor: COLORS.affirmativeBox }}><span className="font-sans font-bold text-white uppercase text-[24px] truncate px-4">{category}</span></div>
                    </div>
                </div>
                {/* 2. Photo Section (Left) */}
                <div className="absolute z-20 overflow-hidden shadow-2xl bg-slate-200" style={{ width: `${PHOTO_WIDTH}px`, height: `${PHOTO_HEIGHT}px`, top: `${PHOTO_TOP}px`, left: `${PHOTO_LEFT}px`, borderRadius: '218px 218px 0 0' }}>{safeJobImage && <img src={safeJobImage} className="w-full h-full object-cover" crossOrigin="anonymous" />}<div className="absolute bottom-[20px] left-0 w-full flex justify-center z-30"><div className="bg-white px-5 py-1 rounded-full shadow-md"><span className="font-sans font-bold text-[24px] text-black">Cód.: {job.id}</span></div></div></div>
                {/* 3. Diversity Title */}
                <div className="absolute z-20 flex flex-col items-center justify-center" style={{ width: `${PHOTO_WIDTH}px`, left: `${PHOTO_LEFT}px`, top: `${LOGO_TOP}px` }}><div className="px-6 py-1.5 rounded-full border-2 border-white inline-flex items-center justify-center bg-transparent"><span className="font-sans font-medium text-white text-[39px] tracking-wide">Vaga Afirmativa</span></div></div>
                <div className="absolute z-20 flex flex-col items-center justify-center" style={{ width: `${PHOTO_WIDTH}px`, left: `${PHOTO_LEFT}px`, top: `${LOGO_TOP + 60 + 30}px` }}><h1 className="font-sans font-black text-white text-center drop-shadow-md" style={{ fontSize: getDiversityTitleSize(affirmativeType), lineHeight: '0.85' }}>{affirmativeType}</h1></div>
                {/* 4. Body Content */}
                <div className="absolute z-10 flex flex-col items-center" style={{ top: `${HEADER_HEIGHT}px`, bottom: `${FOOTER_HEIGHT}px`, left: `${PHOTO_LEFT + PHOTO_WIDTH}px`, right: 0, justifyContent: 'center' }}>
                    <h2 className="font-sans font-extrabold text-[#1a1a1a] leading-tight text-center w-full px-8 mb-[60px] mt-[40px]" style={{ fontSize: getTitleFontSize(title) }}>{title}</h2>
                    <div className="flex flex-col items-center gap-[28px]">
                        <div className="flex gap-4">{tag1 && (<div className="px-8 py-3 rounded-full shadow-md flex items-center justify-center min-w-[200px]" style={{ backgroundColor: COLORS.affirmativeContract }}><span className="font-sans font-bold text-[24px] uppercase text-white">{tag1}</span></div>)}{tag2 && (<div className="px-8 py-3 rounded-full shadow-md flex items-center justify-center min-w-[200px]" style={{ backgroundColor: COLORS.affirmativeModality }}><span className="font-sans font-bold text-[24px] uppercase text-white">{tag2}</span></div>)}</div>
                        {location && (<div className="px-12 py-3 rounded-full shadow-md flex items-center justify-center min-w-[300px]" style={{ backgroundColor: COLORS.affirmativeLocation }}><span className="font-sans font-bold text-[24px] uppercase text-white truncate">{location}</span></div>)}
                    </div>
                </div>
                {/* 5. Footer */}
                <div className="absolute bottom-0 left-0 w-full z-30 flex" style={{ backgroundColor: COLORS.affirmativePurple, height: `${FOOTER_HEIGHT}px`, borderTopLeftRadius: '80px', borderTopRightRadius: '80px', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '30px' }}>
                    <div className="flex flex-row items-center justify-center gap-3 text-center px-10 w-full"><div className="flex items-center gap-3"><span className="font-sans font-medium text-[28px] text-white opacity-90">Candidate-se gratuitamente em</span><span className="font-sans font-bold text-[32px] text-white">{footerUrl}</span><div className="transform rotate-12 translate-y-[10px]"><svg width="36" height="36" viewBox="0 0 24 24" fill={COLORS.green} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg></div></div></div>
                </div>
            </div>
        );
    }

    // --- RENDER: STANDARD SLIDE ---
    return (
        <div id={config.id} className="relative overflow-hidden flex flex-col shrink-0 bg-slate-900" style={style}>
            {assets.background && (<img src={assets.background} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" crossOrigin="anonymous" />)}
            <div className="relative w-full z-10 bg-white" style={{ height: '42%', borderBottomLeftRadius: '80px', borderBottomRightRadius: '80px' }}>
                {/* Header Container */}
                <div className="absolute inset-0 w-full h-full">
                    
                    {/* Left Side: Text (With Max Width constraint) */}
                    <div className="absolute top-[145px] left-[135px] flex flex-col items-start" style={{ maxWidth: '352px' }}>
                        <div className="relative leading-none mb-0 flex-shrink-0"><h1 className="font-condensed italic font-bold text-[100px] tracking-tighter text-[#1a1a1a] transform -translate-x-2">#Temos</h1><h1 className="font-condensed italic font-black text-[130px] text-[#1a1a1a] -mt-10 leading-[0.75] transform -translate-x-2 translate-y-[12px]" style={{ letterSpacing: '0.01em' }}>Vagas</h1></div>
                        <div className="w-full mt-[76px]"><h2 className="font-condensed italic font-bold text-[32px] uppercase leading-tight w-full" style={{ color: COLORS.vibrantPurple }}>{tagline}</h2></div>
                        <div className="mt-[50px] w-full flex flex-col gap-4 items-start">
                            {/* Capsule Category: Multiline allowed, fixed max width */}
                            <div className="px-8 py-3 rounded-[30px] shadow-lg inline-flex items-center justify-center bg-[#F42C9F]" style={{ minWidth: '200px' }}>
                                <span className="font-sans font-bold text-white uppercase tracking-wide text-center leading-tight" style={{ fontSize: getCategoryFontSize(category), whiteSpace: 'normal' }}>{category}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Side: Photo (Absolute fixed position) */}
                    <div className="absolute top-[145px] right-[135px] flex flex-col items-center" style={{ width: '448px' }}>
                        <span className="font-sans font-medium text-[27px] text-black mb-3 block text-center w-full">Cód.: {job.id}</span>
                        <div className="relative overflow-hidden shadow-2xl shrink-0 flex-shrink-0" style={{ width: '448px', height: '534px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                            {safeJobImage && <img src={safeJobImage} alt="Foto da Vaga" className="w-full h-full object-cover block" crossOrigin="anonymous" />}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 relative flex flex-col items-center w-full z-0">
                <div className="flex flex-col items-center w-full px-[135px]" style={{ marginTop: '240px' }}>
                    <h1 className="font-sans font-extrabold text-white text-center leading-tight mb-12 drop-shadow-lg w-full" style={{ fontSize: getTitleFontSize(title) }}>{title}</h1>
                    <div className="flex flex-wrap justify-center gap-5 w-full">{tag1 && (<div className="bg-white px-6 py-2 rounded-full shadow-md flex items-center justify-center min-w-[160px]"><span className="font-sans font-extrabold text-[24px] uppercase text-[#F42C9F]">{tag1}</span></div>)}{tag2 && (<div className="bg-white px-6 py-2 rounded-full shadow-md flex items-center justify-center min-w-[160px]"><span className="font-sans font-extrabold text-[24px] uppercase" style={{ color: COLORS.purple }}>{tag2}</span></div>)}{location && (<div className="bg-white px-6 py-2 rounded-full shadow-md flex items-center justify-center min-w-[160px] max-w-[400px]"><span className="font-sans font-extrabold text-[24px] uppercase truncate" style={{ color: COLORS.purple }}>{location}</span></div>)}</div>
                </div>
                <div className="absolute bottom-0 w-full px-[135px] pb-[145px]"><div className="w-full h-[1px] bg-white opacity-30 mb-10"></div><div className="flex items-center justify-between w-full"><div className="h-[100px] w-[100px] flex items-center justify-start flex-shrink-0">{assets.logo && <img src={assets.logo} alt="MetaRH" className="w-full h-full object-contain" crossOrigin="anonymous" />}</div><div className="flex flex-col items-end text-right relative mr-12"><span className="text-white font-sans font-medium text-[24px] opacity-90 mb-1">Candidate-se gratuitamente em</span><span className="text-white font-sans font-bold text-[27px]">{footerUrl}</span><div className="absolute -right-12 top-[52px] transform -rotate-12 drop-shadow-lg"><svg width="42" height="42" viewBox="0 0 24 24" fill={COLORS.green} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg></div></div></div></div>
            </div>
        </div>
    );
};

// --- Caption Generator ---
const generateCarouselCaption = (jobs: SelectyJobResponse[]) => {
    const jobList = jobs.map((j, i) => `${i + 1}. ${j.title} (${j.city || 'Remoto'})`).join('\n');
    return [
        `🚀 VAGAS DA SEMANA METARH!\n\nConfira as oportunidades que divulgamos esta semana para grandes empresas nacionais e multinacionais:\n\n${jobList}\n\nTem alguma que é a sua cara? Comente abaixo ou acesse o link na bio para se candidatar!\n\n#Vagas #MetaRH #Carreira #Emprego #VagasDaSemana`,
        `🔥 OPORTUNIDADES EM DESTAQUE\n\nA METARH (consultoria de RH que contrata para grandes empresas) separou as melhores vagas da semana pra você:\n\n${jobList}\n\n🔗 Link na bio para se inscrever.\n\nMarque um amigo que está procurando emprego! 👇\n\n#MercadoDeTrabalho #VagasAbertas #MetaRH`,
        `⚡ ATUALIZAÇÃO DE VAGAS\n\nEssas são as vagas que foram divulgadas ao longo da semana pela METARH. Arraste para o lado e confira os detalhes!\n\n${jobList}\n\nNão perca tempo, as inscrições estão abertas no nosso portal (Link na Bio).\n\n#Recrutamento #Seleção #Vagas #MetaRH`,
        `💼 CARREIRA EM MOVIMENTO\n\nSeparamos um mix de oportunidades para diferentes perfis. Arraste para o lado e veja se o seu próximo emprego está aqui!\n\n${jobList}\n\nPara se candidatar, basta acessar o link na bio ou comentar "EU QUERO" que enviamos no direct.\n\n#VagasMetaRH #Empregos #Carreira #Oportunidades`,
        `🌟 SEU NOVO EMPREGO ESTÁ AQUI\n\nGrandes empresas estão contratando através da MetaRH. Confira o resumo da semana:\n\n${jobList}\n\n👉 Gostou de alguma? O link para candidatura está na nossa bio!\n\nCompartilhe esse post nos seus stories para ajudar mais pessoas! 🚀\n\n#Vagas #Trabalho #Recrutamento #MetaRH`,
        `🚀 METARH CONECTA\n\nConectamos talentos às melhores empresas do mercado. Veja as posições abertas:\n\n${jobList}\n\nCandidate-se agora mesmo pelo nosso portal de carreiras (Link na Bio).\n\n#Conexão #Talentos #Vagas #MetaRH`,
        `📢 PLANTÃO DE VAGAS\n\nVocê pediu e nós trouxemos! Confira as vagas mais quentes da semana:\n\n${jobList}\n\nNão deixe para depois, inscreva-se já!\n\n#PlantãoDeVagas #MetaRH #EmpregoNovo`,
        `🎯 MIRE NO SUCESSO\n\nEncontre a oportunidade que vai transformar a sua carreira:\n\n${jobList}\n\nLink para inscrição na bio!\n\n#SucessoProfissional #Vagas #MetaRH`
    ];
};

// --- Main Component ---
export const CarouselGenerator: React.FC<CarouselGeneratorProps> = ({ selectedJobs, libraryImages, onDownload, mode, onCancel }) => {
    const [step, setStep] = useState<'review' | 'generating'>('review');
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    
    // Slide Configuration State
    const [slides, setSlides] = useState<SlideConfig[]>([]);
    const [activeSlideIndex, setActiveSlideIndex] = useState(1);
    
    // Image Picker State
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    // Caption State
    const [captions, setCaptions] = useState<string[]>([]);
    const [selectedCaptionIdx, setSelectedCaptionIdx] = useState(0);
    const [copied, setCopied] = useState(false);

    // Assets
    const bgImageBase64 = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/Fundo_Vagas.jpg");
    const logoBase64 = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/metarh-bola-branca.png");
    const coverUrl = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/1080x1350-frente-carrossel.png");
    const backUrl = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/1080x1350-contra-carrossel.png");

    const assets = {
        background: bgImageBase64,
        logo: logoBase64,
        cover: coverUrl,
        back: backUrl
    };

    // Initialize Slides
    useEffect(() => {
        if (selectedJobs.length > 0 && slides.length === 0) {
            const initialSlides: SlideConfig[] = [];
            initialSlides.push({ type: 'cover', id: 'slide-cover' });
            selectedJobs.forEach((job, idx) => {
                const randomImg = libraryImages.length > 0 
                    ? libraryImages[Math.floor(Math.random() * libraryImages.length)].url 
                    : undefined;
                initialSlides.push({
                    type: 'job',
                    job,
                    image: randomImg,
                    id: `slide-job-${job.id}`,
                    overrides: {}
                });
            });
            initialSlides.push({ type: 'back', id: 'slide-back' });
            setSlides(initialSlides);
            
            // Initialize Captions
            setCaptions(generateCarouselCaption(selectedJobs));
        }
    }, [selectedJobs]);

    const handleImageChange = (newImageUrl: string) => {
        const updatedSlides = [...slides];
        updatedSlides[activeSlideIndex] = { ...updatedSlides[activeSlideIndex], image: newImageUrl };
        setSlides(updatedSlides);
        setIsImagePickerOpen(false);
    };

    const handleOverrideChange = (field: keyof SlideOverrides, value: any) => {
        const updatedSlides = [...slides];
        const currentOverrides = updatedSlides[activeSlideIndex].overrides || {};
        
        // Logic for Tagline Updates based on buttons
        let newOverrides = { ...currentOverrides, [field]: value };
        
        if (field === 'companyType') {
            if (value === 'multinacional') {
                newOverrides.tagline = 'TRABALHE EM UMA EMPRESA MULTINACIONAL';
            } else if (value === 'nacional') {
                newOverrides.tagline = 'TRABALHE EM UMA EMPRESA NACIONAL';
            }
            // If custom, we keep the existing tagline or let the user type
        } else if (field === 'tagline') {
            // If user types manually, switch to custom
            newOverrides.companyType = 'custom';
        }

        updatedSlides[activeSlideIndex] = {
            ...updatedSlides[activeSlideIndex],
            overrides: newOverrides
        };
        setSlides(updatedSlides);
    };

    const copyCaption = () => {
        navigator.clipboard.writeText(captions[selectedCaptionIdx]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerate = async (type: 'zip' | 'pdf') => {
        if (!assets.background || !assets.logo || !assets.cover || !assets.back) return;
        
        setStep('generating');
        setStatus('Preparando renderizador...');
        setProgress(5);
        
        // Short delay to ensure the DOM is fully painted in the generating view
        await new Promise(r => setTimeout(r, 1500));

        try {
            const slideImages: string[] = [];
            // Render loop
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                const label = slide.type === 'cover' ? 'Capa' : slide.type === 'back' ? 'Contra-Capa' : `Vaga ${i}`;
                setStatus(`Renderizando ${label}...`);
                setProgress(5 + ((i / slides.length) * 60));

                const element = document.getElementById(`gen-${slide.id}`);
                if (element) {
                    // Wait a bit for each slide to minimize glitches
                    await new Promise(r => setTimeout(r, 250));
                    
                    const dataUrl = await toPng(element, {
                        cacheBust: true,
                        pixelRatio: 1.5, 
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        skipAutoScale: true,
                        style: { transform: 'none' }
                    });
                    slideImages.push(dataUrl);
                } else {
                    console.error(`Elemento não encontrado: gen-${slide.id}`);
                }
            }

            if (type === 'zip') {
                // 1. Generate ZIP
                setStatus('Criando arquivo ZIP para Instagram...');
                setProgress(80);
                const zip = new JSZip();
                // Flattened structure as requested
                slideImages.forEach((imgData, idx) => {
                    const numberPrefix = (idx + 1).toString().padStart(2, '0');
                    let nameSuffix = '';
                    if (idx === 0) nameSuffix = 'Capa';
                    else if (idx === slideImages.length - 1) nameSuffix = 'Contra-Capa';
                    else nameSuffix = `Vaga_${idx}`; 
                    
                    const filename = `${numberPrefix}_${nameSuffix}.png`;
                    zip.file(filename, imgData.split(',')[1], { base64: true });
                });
                const zipContent = await zip.generateAsync({ type: 'blob' });
                const zipLink = document.createElement('a');
                zipLink.href = URL.createObjectURL(zipContent);
                zipLink.download = `Vagas da Semana.zip`;
                zipLink.click();
            } else {
                 // 2. Generate PDF
                setStatus('Criando arquivo PDF para LinkedIn...');
                setProgress(80);
                const doc = new jsPDF({
                    orientation: 'p',
                    unit: 'px',
                    format: [CANVAS_WIDTH, CANVAS_HEIGHT],
                    hotfixes: ["px_scaling"] 
                });
                slideImages.forEach((imgData, idx) => {
                    if (idx > 0) doc.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
                    doc.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                });
                doc.save(`Vagas da Semana.pdf`);
            }

            setProgress(100);
            setStatus('Concluído! Arquivo baixado.');
            
            // Increment Stats ONLY here (The actual "Taking it out" moment)
            onDownload(selectedJobs.length);

            // Go back to review after a delay, so they can download the other format if they want
            setTimeout(() => {
                 setStep('review');
            }, 2000);

        } catch (e: any) {
            console.error(e);
            alert("Erro na geração: " + e.message);
            setStep('review');
        }
    };

    // --- Renders ---

    if (step === 'generating') {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col items-center justify-center text-white backdrop-blur-md">
                <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-20">
                    <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-2">{status}</h3>
                    <p className="text-slate-500 text-sm mb-6">Isso pode levar alguns segundos...</p>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-brand-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                {/* Container Invisível para Renderização - Opacity 0 mas na tela */}
                <div className="absolute top-0 left-0 pointer-events-none opacity-0" style={{ zIndex: -1 }}>
                    {slides.map(slide => (
                        <Slide key={slide.id} config={{...slide, id: `gen-${slide.id}`}} assets={assets} scale={1} />
                    ))}
                </div>
            </div>
        );
    }

    const activeSlide = slides[activeSlideIndex];
    const activeOverrides = activeSlide?.overrides || {};
    const currentCompanyType = activeOverrides.companyType || 'multinacional';
    
    // Preview Scale Calculation
    const PREVIEW_SCALE = 0.35;
    const PREVIEW_HEIGHT = CANVAS_HEIGHT * PREVIEW_SCALE;
    const PREVIEW_WIDTH = CANVAS_WIDTH * PREVIEW_SCALE;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 lg:px-6 lg:py-4 flex justify-between items-center shadow-sm z-20 flex-wrap gap-2">
                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                    <div>
                        <h2 className="text-lg lg:text-xl font-bold text-slate-900">Revisar Carrossel</h2>
                        <p className="text-xs lg:text-sm text-slate-500 hidden sm:block">{selectedJobs.length} Vagas selecionadas • Edite os textos e imagens antes de baixar.</p>
                    </div>
                </div>
                <div className="flex gap-2 ml-auto">
                    <button onClick={() => handleGenerate('zip')} className="bg-brand-100 hover:bg-brand-200 text-brand-800 px-4 py-2.5 rounded-full font-bold flex items-center gap-2 text-sm transition-colors">
                        <Download className="w-4 h-4" />
                        ZIP (Insta)
                    </button>
                    <button onClick={() => handleGenerate('pdf')} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all text-sm">
                        <Download className="w-4 h-4" />
                        PDF (LinkedIn)
                    </button>
                </div>
            </div>

            {/* Main Workspace - THREE COLUMNS */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* COLUMN 1: SLIDES & CAPTION (Left) */}
                <div className="w-full lg:w-[300px] bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
                    
                    {/* Slide List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                        <div className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center sticky top-0 bg-white py-1 z-10"><Layers className="w-3 h-3 mr-1"/> {slides.length} Slides</div>
                        <div className="flex flex-col gap-2">
                            {slides.map((slide, idx) => (
                                <div key={slide.id} onClick={() => setActiveSlideIndex(idx)} className={`p-2 rounded-lg cursor-pointer border transition-all flex items-center gap-3 ${activeSlideIndex === idx ? 'border-brand-600 bg-brand-50 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}>
                                    <div className="w-8 h-10 bg-slate-200 rounded overflow-hidden shrink-0 border border-slate-300 relative">
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400">{idx + 1}</span>
                                        {slide.type === 'cover' && assets.cover && <img src={assets.cover} className="w-full h-full object-cover absolute inset-0" crossOrigin="anonymous" />}
                                        {slide.type === 'back' && assets.back && <img src={assets.back} className="w-full h-full object-cover absolute inset-0" crossOrigin="anonymous" />}
                                        {slide.type === 'job' && slide.image && <img src={slide.image} className="w-full h-full object-cover absolute inset-0" crossOrigin="anonymous" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-sm font-bold truncate text-slate-900">{slide.type === 'cover' ? 'Capa' : slide.type === 'back' ? 'Contra-Capa' : `${slide.job?.title}`}</div>
                                        <div className="text-xs text-slate-500 truncate">{slide.type === 'job' ? (slide.overrides?.location || slide.job?.city || 'Remoto') : 'Institucional'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Caption Area (Fixed at Bottom of Column 1) */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center"><Type className="w-3 h-3 mr-1"/> Legenda</h3>
                            <button onClick={() => setSelectedCaptionIdx((prev) => (prev + 1) % captions.length)} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600 font-bold hover:bg-brand-50 hover:text-brand-600 flex items-center transition-colors"><RefreshCw className="w-3 h-3 mr-1"/> Trocar</button>
                        </div>
                        <textarea readOnly value={captions[selectedCaptionIdx]} className="w-full h-24 bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 resize-none focus:outline-none mb-2" />
                        <button onClick={copyCaption} className="w-full py-2 bg-brand-600 text-white rounded-lg font-bold text-xs flex items-center justify-center hover:bg-brand-700 transition-colors gap-2 shadow-sm">
                            {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                            {copied ? 'Copiado!' : 'Copiar Legenda'}
                        </button>
                    </div>
                </div>

                {/* COLUMN 2: EDITOR FORM (Middle) */}
                <div className="w-full lg:w-[360px] bg-slate-50/50 border-r border-slate-200 flex flex-col z-20 overflow-y-auto custom-scrollbar shrink-0 p-5">
                     {activeSlide && activeSlide.type === 'job' ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                                <h3 className="text-sm font-bold text-brand-800 flex items-center"><Edit3 className="w-4 h-4 mr-2"/> Editar Slide {activeSlideIndex + 1}</h3>
                                
                                <div className="flex items-center bg-white px-2 py-1 rounded-full border border-slate-200 shadow-sm">
                                    <label className={`text-[10px] font-bold uppercase mr-2 flex items-center ${activeOverrides.isAffirmative ? 'text-purple-600' : 'text-slate-400'}`}>
                                        <HeartHandshake className="w-3 h-3 mr-1" /> Afirmativa
                                    </label>
                                    <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                                        <input 
                                            type="checkbox" 
                                            checked={activeOverrides.isAffirmative || false} 
                                            onChange={(e) => handleOverrideChange('isAffirmative', e.target.checked)} 
                                            className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-purple-500"
                                        />
                                        <label className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer transition-colors duration-200 ${activeOverrides.isAffirmative ? 'bg-purple-500' : 'bg-slate-300'}`}></label>
                                    </div>
                                </div>
                            </div>

                            {/* Tagline */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Frase de Efeito / Tipo de Empresa</label>
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => handleOverrideChange('companyType', 'multinacional')} className={`flex-1 py-1.5 px-2 rounded-full text-[10px] font-bold border transition-colors ${currentCompanyType === 'multinacional' ? 'bg-brand-100 border-brand-300 text-brand-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>Multinacional</button>
                                    <button onClick={() => handleOverrideChange('companyType', 'nacional')} className={`flex-1 py-1.5 px-2 rounded-full text-[10px] font-bold border transition-colors ${currentCompanyType === 'nacional' ? 'bg-brand-100 border-brand-300 text-brand-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>Nacional</button>
                                </div>
                                <input 
                                    type="text" 
                                    value={activeOverrides.tagline || 'TRABALHE EM UMA EMPRESA MULTINACIONAL'} 
                                    onChange={(e) => handleOverrideChange('tagline', e.target.value)} 
                                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500 bg-slate-50"
                                    placeholder="Ex: TRABALHE EM UMA EMPRESA LÍDER"
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título da Vaga</label>
                                    <input type="text" value={activeOverrides.title || activeSlide.job?.title.split(' - ')[0].trim()} onChange={(e) => handleOverrideChange('title', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold focus:ring-1 focus:ring-brand-500 shadow-sm" />
                                </div>
                                
                                {activeOverrides.isAffirmative ? (
                                        <div>
                                        <label className="block text-[10px] font-bold text-purple-500 uppercase mb-1">Público da Vaga</label>
                                        <select value={activeOverrides.affirmativeType || DIVERSITY_OPTIONS[0]} onChange={(e) => handleOverrideChange('affirmativeType', e.target.value)} className="w-full p-3 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold shadow-sm">
                                            {DIVERSITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria (Pílula)</label>
                                        <input type="text" value={activeOverrides.category || (activeSlide.job?.department && activeSlide.job.department !== 'Geral' ? activeSlide.job.department.toUpperCase() : 'SETOR ADMINISTRATIVO')} onChange={(e) => handleOverrideChange('category', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold shadow-sm" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contrato</label>
                                            <select value={activeOverrides.contract || activeSlide.job?.contract_type || 'CLT (Efetivo)'} onChange={(e) => handleOverrideChange('contract', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white">
                                            {CONTRACT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Modalidade</label>
                                            <select value={activeOverrides.modality || (activeSlide.job?.remote ? 'Remoto' : 'Presencial')} onChange={(e) => handleOverrideChange('modality', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white">
                                            {MODALITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Local</label>
                                    <input type="text" value={activeOverrides.location || (activeSlide.job?.city ? `${activeSlide.job.city}-${activeSlide.job.state}` : 'Brasil')} onChange={(e) => handleOverrideChange('location', e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg text-sm shadow-sm" />
                                </div>
                            </div>
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <div className="bg-slate-100 p-4 rounded-full mb-3">
                                <Sparkles className="w-6 h-6 text-brand-300" />
                            </div>
                            <p className="text-sm font-medium">Selecione um slide de vaga na esquerda para editar seus textos.</p>
                        </div>
                     )}
                </div>

                {/* COLUMN 3: PREVIEW (Right) */}
                <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden order-3 relative z-10">
                     <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-200/50 overflow-hidden">
                        <div className="relative shadow-2xl rounded-[20px] bg-white overflow-hidden shrink-0 transition-transform duration-300" style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}>
                            {/* Interactive Layer */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {activeSlide && activeSlide.type === 'job' && (
                                    <div className="absolute top-4 right-4 pointer-events-auto">
                                        <button 
                                            onClick={() => setIsImagePickerOpen(true)}
                                            className="bg-white text-brand-700 px-4 py-2 rounded-full shadow-lg font-bold text-xs border border-brand-200 hover:bg-brand-50 flex items-center gap-2 transition-transform hover:scale-105 group"
                                        >
                                            <ImageIcon className="w-3 h-3 group-hover:text-brand-600" /> Trocar Foto
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Scaled Slide Render */}
                            {activeSlide && (
                                <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left', width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                                    <Slide config={activeSlide} assets={assets} scale={1} />
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>

            {/* Image Picker Modal */}
            {isImagePickerOpen && (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsImagePickerOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Selecionar Imagem para o Slide</h3>
                            <button onClick={() => setIsImagePickerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {libraryImages.map(img => (
                                    <div key={img.id} onClick={() => handleImageChange(img.url)} className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-brand-500 hover:shadow-lg transition-all relative group">
                                        <img src={img.url} className="w-full h-full object-cover" loading="lazy" crossOrigin="anonymous" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                        {activeSlide?.image === img.url && (<div className="absolute top-2 right-2 bg-brand-600 text-white rounded-full p-1"><CheckCircle className="w-4 h-4" /></div>)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
