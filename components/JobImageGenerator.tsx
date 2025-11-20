

import React, { useState, useRef, useEffect } from 'react';
import { SelectyJobResponse } from '../types';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, ChevronLeft, Monitor, Hash, Type, Loader2, Upload, Link as LinkIcon, Copy, CheckCircle } from 'lucide-react';

interface JobImageGeneratorProps {
  job: SelectyJobResponse;
  onClose: () => void;
}

// Imagens de escritório genéricas para o frame da foto (Expandido)
const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", // Office Moderno
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80", // Team Meeting
  "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=800&q=80", // Red brick office
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80", // Meeting Hall
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80", // Standing meeting
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80", // Professional woman
  "https://images.unsplash.com/photo-1664575602554-2087b04935a5?auto=format&fit=crop&w=800&q=80", // Corporate Woman
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", // High rise building
  "https://images.unsplash.com/photo-1568992687947-86c22da06ea0?auto=format&fit=crop&w=800&q=80", // Modern Meeting
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80", // Brainstorming
  "https://images.unsplash.com/photo-1593642632823-8f785e67ac73?auto=format&fit=crop&w=800&q=80", // Desk setup
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80", // Startup vibe
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80", // Analytics / Dashboard
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80", // Industrial / Tech
  "https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&w=800&q=80", // Industrial
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"  // Warehouse / Logistics
];

// Cores da Especificação
const COLORS = {
  purple: '#481468', // Roxo Institucional (Texto)
  vibrantPurple: '#7730d8', // Roxo Vibrante (Tagline)
  pink: '#F42C9F', // Rosa Neon (Setor)
  green: '#a3e635', // Verde Lima (Cursor)
  black: '#1a1a1a', // Títulos
  white: '#FFFFFF'
};

// Opções para selects
const CONTRACT_OPTIONS = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Freelance', 'Trainee'];
const MODALITY_OPTIONS = ['Presencial', 'Híbrido', 'Remoto'];

// Hook para converter URL externa em Base64 para evitar problemas de CORS no canvas
const useBase64Image = (url: string | null) => {
  const [dataSrc, setDataSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setDataSrc(undefined);
      return;
    }

    // Se já for base64, usa direto
    if (url.startsWith('data:')) {
      setDataSrc(url);
      return;
    }

    let isMounted = true;

    const loadImage = async () => {
      try {
        // Usa o proxy para evitar bloqueio de CORS
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setDataSrc(reader.result as string);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Erro ao converter imagem (fallback para url original):", error);
        if (isMounted) setDataSrc(url);
      }
    };

    loadImage();

    return () => { isMounted = false; };
  }, [url]);

  return dataSrc;
};

export const JobImageGenerator: React.FC<JobImageGeneratorProps> = ({ job, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado editável do card
  // Remove potential location info from title (common pattern "Role - City")
  const initialTitle = job.title.split(' - ')[0].trim();
  const [title, setTitle] = useState(initialTitle);
  
  const [tag1, setTag1] = useState(job.contract_type || 'CLT'); // Contrato
  const [tag2, setTag2] = useState(job.remote ? 'Remoto' : 'Presencial'); // Modalidade
  const [location, setLocation] = useState(job.city ? `${job.city}-${job.state}` : 'Brasil');
  const [jobId, setJobId] = useState(String(job.id));
  const [category, setCategory] = useState('SETOR ADMINISTRATIVO'); 
  const [companyType, setCompanyType] = useState<'multinacional' | 'nacional' | 'custom'>('multinacional');
  const [tagline, setTagline] = useState('TRABALHE EM UMA EMPRESA MULTINACIONAL');
  const [jobImage, setJobImage] = useState(STOCK_IMAGES[0]);
  const [footerUrl, setFooterUrl] = useState('metarh.com.br/vagas-metarh');
  
  // Caption State
  const [captionText, setCaptionText] = useState('');
  const [copied, setCopied] = useState(false);

  // URLs processadas para Base64
  const bgImageBase64 = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/Fundo_Vagas.jpg");
  const logoBase64 = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/metarh-bola-branca.png");
  const jobImageBase64 = useBase64Image(jobImage);

  // Pré-preencher categoria se disponível
  useEffect(() => {
    if (job.department && job.department !== 'Geral') {
      setCategory(job.department.toUpperCase());
    }
    generateCaption();
  }, [job]);

  // Atualizar tagline baseada no tipo de empresa
  useEffect(() => {
    if (companyType === 'multinacional') {
        setTagline('TRABALHE EM UMA EMPRESA MULTINACIONAL');
    } else if (companyType === 'nacional') {
        setTagline('TRABALHE EM UMA EMPRESA NACIONAL');
    }
    // Custom mantém o valor digitado
  }, [companyType]);

  const generateCaption = () => {
      const text = `🚀 OPORTUNIDADE DE CARREIRA\n\nEstamos buscando talentos para atuar como ${job.title}!\n\n📍 Local: ${job.city || 'Brasil'} (${job.remote ? 'Remoto' : 'Presencial'})\n💼 Tipo: ${job.contract_type || 'CLT'}\n🏢 Setor: ${job.department || 'Geral'}\n\nSe você busca desenvolvimento profissional e novos desafios, essa vaga é para você.\n\n🔗 Inscreva-se agora: ${job.url_apply || footerUrl}\n\n#vagas #emprego #metarh #carreira #oportunidade #${job.city?.replace(/\s/g, '').toLowerCase() || 'brasil'}`;
      setCaptionText(text);
  };

  const handleCopyCaption = () => {
      navigator.clipboard.writeText(captionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    setIsGenerating(true);

    try {
      // Aguarda um momento para garantir que o render cycle terminou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2, // Qualidade alta
        width: 1080,
        height: 1350,
        skipAutoScale: true,
        style: {
            transform: 'none', // Garante que não capture transformações CSS
            boxShadow: 'none'  // Garante que não capture sombras externas
        }
      });
      
      const link = document.createElement('a');
      link.download = `vaga-metarh-${job.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomImage = () => {
    const random = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
    setJobImage(random);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setJobImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Função para calcular o tamanho da fonte do título dinamicamente
  const getTitleFontSize = (text: string) => {
    const len = text.length;
    // Lógica mais agressiva para garantir que caiba se tiver muitas quebras de linha
    if (len > 100) return '32px';
    if (len > 70) return '40px';
    if (len > 35) return '48px';
    return '56px';
  };

  // Função para calcular o tamanho da fonte da pílula rosa dinamicamente
  const getCategoryFontSize = (text: string) => {
    // Se for muito longo (ex: > 25 caracteres), diminui a fonte para evitar 3 linhas
    if (text.length > 25) return '22px';
    return '30px';
  }

  const isReady = bgImageBase64 && logoBase64 && jobImageBase64;

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen relative">
      
      {/* Sidebar de Edição - Com Scroll Independente na visualização Mobile, mas fluxo normal no Desktop */}
      {/* Removido flex-row do pai e ajustado padding para permitir full-width na direita */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 order-2 lg:order-1 p-4 lg:p-8 relative z-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <Monitor className="w-6 h-6 mr-2 text-brand-600" />
                Editor de Post
            </h2>

            {/* Content Container */}
            <div className="space-y-6 pr-2">
                
                {/* Form Fields */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título da Vaga</label>
                    <textarea 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 border border-slate-200 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                        rows={2}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                        {title.length} caracteres (Auto-ajuste de tamanho)
                    </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                        <Type className="w-3 h-3 mr-1" /> Frase de Efeito
                    </label>
                    
                    <div className="flex gap-2 mb-3">
                        <button 
                            onClick={() => setCompanyType('multinacional')}
                            className={`flex-1 py-2 px-2 rounded-full text-xs font-bold border transition-colors ${companyType === 'multinacional' ? 'bg-brand-100 border-brand-300 text-brand-800' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            Multinacional
                        </button>
                        <button 
                            onClick={() => setCompanyType('nacional')}
                            className={`flex-1 py-2 px-2 rounded-full text-xs font-bold border transition-colors ${companyType === 'nacional' ? 'bg-brand-100 border-brand-300 text-brand-800' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            Nacional
                        </button>
                    </div>

                    <input 
                        type="text" 
                        value={tagline} 
                        onChange={(e) => {
                            setCompanyType('custom');
                            setTagline(e.target.value);
                        }}
                        className="w-full p-3 border border-slate-200 rounded-full text-sm font-medium"
                        placeholder="Texto da frase de efeito..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor (Pílula Rosa)</label>
                        <input 
                            type="text" 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-full text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                value={jobId} 
                                onChange={(e) => setJobId(e.target.value)}
                                className="w-full pl-9 p-3 border border-slate-200 rounded-full text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contrato</label>
                        <select 
                            value={tag1} 
                            onChange={(e) => setTag1(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-full text-xs bg-white"
                        >
                            {CONTRACT_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value={tag1}>Outro...</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modalidade</label>
                        <select 
                            type="text" 
                            value={tag2} 
                            onChange={(e) => setTag2(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-full text-xs bg-white"
                        >
                             {MODALITY_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                             <option value={tag2}>Outro...</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Local</label>
                        <input 
                            type="text" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-full text-xs"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Rodapé</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={footerUrl} 
                            onChange={(e) => setFooterUrl(e.target.value)}
                            className="w-full pl-9 p-3 border border-slate-200 rounded-full text-sm text-slate-600"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Foto da Vaga</label>
                    <div className="flex gap-2 flex-col">
                        <div className="flex gap-2">
                             <button 
                                onClick={triggerFileInput}
                                className="flex-1 py-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-full text-sm font-bold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Subir Imagem
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button 
                                onClick={handleRandomImage}
                                className="px-6 bg-slate-100 border border-slate-200 rounded-full hover:bg-slate-200 transition-colors"
                                title="Trocar imagem aleatória"
                            >
                                <RefreshCw className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Caption Generator Section */}
                <div className="bg-brand-50 rounded-3xl p-5 border border-brand-100 mt-4">
                    <label className="block text-xs font-bold text-brand-700 uppercase mb-2">Sugestão de Legenda (Linkedin/Instagram)</label>
                    <textarea 
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        className="w-full p-4 text-xs border border-brand-200 rounded-3xl text-slate-600 h-32 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-white"
                    />
                    <button 
                        onClick={handleCopyCaption}
                        className="mt-3 w-full py-2.5 bg-white border border-brand-200 text-brand-700 rounded-full text-xs font-bold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copiado!" : "Copiar Legenda"}
                    </button>
                </div>

            </div>

            {/* Action Buttons Footer */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button 
                    onClick={onClose}
                    className="py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Voltar para Vagas
                </button>

                <button 
                    onClick={handleDownload}
                    disabled={isGenerating || !isReady}
                    className="py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-full shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gerando...
                        </>
                    ) : !isReady ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           Carregando...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Baixar Imagem
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* Área de Preview - Container Pai (Visualização apenas) */}
      {/* Mobile: Ordem 1, Scroll normal. Desktop: Fixo na lateral direita (Popup like) ocupando 2/3 */}
      <div className="w-full lg:w-2/3 flex items-center justify-center bg-slate-200/50 rounded-none lg:rounded-none border-b lg:border-b-0 lg:border-l border-slate-300 p-4 order-1 lg:order-2 overflow-hidden min-h-[500px] lg:fixed lg:top-0 lg:right-0 lg:h-screen z-20">
        
        {/* Container de Escala Visual */}
        <div 
            style={{ 
                transform: 'scale(0.38)', // Reduzido
                transformOrigin: 'center center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
            }}
        >
            {/* ================= CANVAS START (CAPTURA LIMPA) ================= */}
            <div 
                ref={cardRef}
                className="relative overflow-hidden flex flex-col shrink-0 bg-slate-900"
                style={{ 
                    width: '1080px', 
                    height: '1350px',
                }}
            >
                {/* Background Image Layer */}
                {bgImageBase64 && (
                    <img 
                        src={bgImageBase64}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    />
                )}

                {/* ================== HEADER BRANCO (42% Height) ================== */}
                <div 
                    className="relative bg-white w-full z-10"
                    style={{ 
                        height: '42%', // aprox 567px
                        borderBottomLeftRadius: '80px',
                        borderBottomRightRadius: '80px',
                    }}
                >
                    {/* Safe Area Container */}
                    <div className="absolute inset-0 flex justify-between" style={{
                        paddingTop: '145px',
                        paddingLeft: '135px',
                        paddingRight: '135px',
                        paddingBottom: '40px' 
                    }}>
                        
                        {/* Coluna Esquerda: Textos */}
                        <div className="flex flex-col items-start h-full z-20 max-w-[400px]">
                            
                            {/* GRUPO TOPO: Temos Vagas + Tagline */}
                            <div className="flex flex-col items-start">
                                {/* 1. Stack #Temos Vagas */}
                                <div className="relative leading-none mb-0 flex-shrink-0">
                                    <h1 className="font-condensed italic font-bold text-[100px] tracking-tighter text-[#1a1a1a] transform -translate-x-2">
                                        #Temos
                                    </h1>
                                    <h1 
                                        className="font-condensed italic font-black text-[130px] text-[#1a1a1a] -mt-10 leading-[0.75] transform -translate-x-2 translate-y-[12px]"
                                        style={{ letterSpacing: '0.01em' }}
                                    >
                                        Vagas
                                    </h1>
                                </div>

                                {/* 2. Tagline Roxa - Com margem aumentada (mt-[76px]) para descer +10px */}
                                <div className="w-full mt-[76px]">
                                    <h2 
                                        className="font-condensed italic font-bold text-[32px] uppercase leading-tight w-full"
                                        style={{ color: COLORS.vibrantPurple }}
                                    >
                                        {tagline}
                                    </h2>
                                </div>
                            </div>

                            {/* 3. Base: Pílula Setor Rosa */}
                            {/* Margem aumentada (mt-[76px]) para descer +10px */}
                            <div className="mt-[76px] w-full"> 
                                <div 
                                    className="px-8 py-3 rounded-full shadow-lg inline-flex items-center justify-center"
                                    style={{ backgroundColor: COLORS.pink, minWidth: '200px' }}
                                >
                                    <span 
                                        className="font-condensed font-black text-white uppercase tracking-wide text-center leading-tight"
                                        style={{ fontSize: getCategoryFontSize(category) }}
                                    >
                                        {category}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Código e Foto */}
                        <div className="flex flex-col items-center relative z-10" style={{ width: '448px' }}>
                            {/* Código */}
                            <span className="font-sans font-medium text-[27px] text-black mb-3 block text-center w-full">
                                Cód.: {jobId}
                            </span>

                            {/* Moldura da Foto */}
                            <div 
                                className="relative overflow-hidden shadow-2xl shrink-0 flex-shrink-0"
                                style={{ 
                                    width: '448px',
                                    height: '534px',
                                    borderRadius: '32px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                {jobImageBase64 && (
                                    <img 
                                        src={jobImageBase64} 
                                        alt="Foto da Vaga" 
                                        className="w-full h-full object-cover block"
                                    />
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ================== BODY (FUNDO ROXO / IMAGEM) ================== */}
                <div className="flex-1 relative flex flex-col items-center w-full z-0">
                    
                    {/* Conteúdo Centralizado */}
                    <div 
                        className="flex flex-col items-center w-full px-[135px]"
                        style={{ marginTop: '240px' }} 
                    >
                        {/* Título da Vaga */}
                        <h1 
                            className="font-sans font-extrabold text-white text-center leading-tight mb-12 drop-shadow-lg w-full"
                            style={{ fontSize: getTitleFontSize(title) }}
                        >
                            {title}
                        </h1>

                        {/* Pílulas de Informação */}
                        <div className="flex flex-wrap justify-center gap-5 w-full">
                            {tag1 && (
                                <div className="bg-white px-6 py-2 rounded-full shadow-md flex items-center justify-center min-w-[160px]">
                                    <span className="font-sans font-extrabold text-[24px] uppercase text-[#F42C9F]">
                                        {tag1}
                                    </span>
                                </div>
                            )}
                            {tag2 && (
                                <div className="bg-white px-6 py-2 rounded-full shadow-md flex items-center justify-center min-w-[160px]">
                                    <span 
                                        className="font-sans font-extrabold text-[24px] uppercase"
                                        style={{ color: COLORS.purple }}
                                    >
                                        {tag2}
                                    </span>
                                </div>
                            )}
                            {location && (
                                <div className="bg-white px-6 py-2 rounded-full shadow-md flex items-center justify-center min-w-[160px] max-w-[400px]">
                                    <span 
                                        className="font-sans font-extrabold text-[24px] uppercase truncate"
                                        style={{ color: COLORS.purple }}
                                    >
                                        {location}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ================== FOOTER ================== */}
                    <div className="absolute bottom-0 w-full px-[135px] pb-[145px]">
                        <div className="w-full h-[1px] bg-white opacity-30 mb-10"></div>

                        <div className="flex items-center justify-between w-full">
                            <div className="h-[100px] w-[100px] flex items-center justify-start flex-shrink-0">
                                {logoBase64 && (
                                    <img 
                                        src={logoBase64} 
                                        alt="MetaRH" 
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>

                            <div className="flex flex-col items-end text-right relative mr-12">
                                <span className="text-white font-sans font-medium text-[24px] opacity-90 mb-1">
                                    Candidate-se gratuitamente em
                                </span>
                                <span className="text-white font-sans font-bold text-[27px]">
                                    {footerUrl}
                                </span>

                                <div className="absolute -right-12 top-[52px] transform -rotate-12 drop-shadow-lg">
                                    <svg 
                                        width="42" 
                                        height="42" 
                                        viewBox="0 0 24 24" 
                                        fill={COLORS.green} 
                                        stroke="white" 
                                        strokeWidth="1.5"
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                                        <path d="M13 13l6 6"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
             {/* ================= CANVAS END ================= */}
        </div>
      </div>
    </div>
  );
}
