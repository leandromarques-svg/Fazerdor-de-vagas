

import React, { useState, useRef, useEffect } from 'react';
import { SelectyJobResponse } from '../types';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, ChevronLeft, Monitor, Hash, Type, Loader2, Upload, Link as LinkIcon, Copy, CheckCircle, ChevronDown, Check } from 'lucide-react';

interface JobImageGeneratorProps {
  job: SelectyJobResponse;
  onClose: () => void;
  onSuccess?: () => void; // Adicionado prop de sucesso
}

// Imagens de escritório expandidas (Foco em Pessoas e Portrait/Vertical)
const STOCK_IMAGES = [
  // Mulheres Corporativo / Retrato
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1598550832205-d416966b840e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1664575602554-2087b04935a5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  
  // Homens Corporativo / Retrato
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1480429370139-e0132c086e2a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80",
  
  // Equipes / Reuniões / Colaboração
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1573164574572-cb8f5647d857?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1559523182-a284c3fb7cff?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
  
  // Ambiente Criativo / Moderno / Casual
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1568992687947-86c22da06ea0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1593642632823-8f785e67ac73?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  
  // Conceitual / Close-up
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1553877606-3c9cb40559dc?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"
];

// Helper para hashtags padrão
const getTags = (job: SelectyJobResponse) => {
    const cityTag = job.city ? `#${job.city.replace(/\s+/g, '').toLowerCase()}` : '';
    const deptTag = job.department ? `#${job.department.replace(/\s+/g, '').toLowerCase()}` : '';
    // Remove duplicatas e espaços vazios
    return [...new Set(['#vagas', '#emprego', '#METARH', '#carreira', '#oportunidade', cityTag, deptTag])].filter(Boolean).join(' ');
};

// Templates de Legenda (10 Variações)
const CAPTION_TEMPLATES = [
    // 1. Clássica
    (job: SelectyJobResponse, link: string) => 
`🚀 OPORTUNIDADE DE CARREIRA

Estamos buscando talentos para atuar como ${job.title}!

📍 Local: ${job.city || 'Brasil'} (${job.remote ? 'Remoto' : 'Presencial'})
💼 Tipo: ${job.contract_type || 'CLT'}
🏢 Setor: ${job.department || 'Geral'}

Se você busca desenvolvimento profissional e novos desafios, essa vaga é para você.

🔗 Inscreva-se agora: ${link}

${getTags(job)}`,

    // 2. Entusiasta
    (job: SelectyJobResponse, link: string) =>
`🌟 VEM PRO TIME!

Tem vaga nova na área para ${job.title}. Se você é apaixonado pelo que faz e quer crescer em um ambiente dinâmico, queremos te conhecer!

✅ O que oferecemos:
- Ambiente colaborativo
- Oportunidade de crescimento
- Atuação ${job.remote ? '100% Remota' : `em ${job.city}`}

👉 Curtiu? Corre pra se inscrever: ${link}

${getTags(job)}`,

    // 3. Minimalista / Direta
    (job: SelectyJobResponse, link: string) =>
`Vaga aberta: ${job.title} 🎯

Estamos contratando profissionais para compor o time de um de nossos parceiros.

📍 ${job.city || 'Local a definir'}
📝 ${job.contract_type || 'Contrato'}

Link para aplicação nos comentários e abaixo:
🔗 ${link}

${getTags(job)}`,

    // 4. Focada em Perfil (Pergunta)
    (job: SelectyJobResponse, link: string) =>
`Você é um ${job.title} em busca de novos desafios? 🤔

Estamos com uma posição aberta que pode ser o próximo passo na sua carreira! 

Buscamos alguém proativo para atuar em ${job.city || 'nossa sede'}.

Confira os detalhes completos e aplique aqui:
👉 ${link}

Marque um amigo que manda bem nessa área! 👇
${getTags(job)}`,

    // 5. Urgente / Ação
    (job: SelectyJobResponse, link: string) =>
`🚨 PROCESSO SELETIVO ABERTO

Vaga: ${job.title}
Regime: ${job.contract_type || 'CLT'}
Local: ${job.remote ? 'Remoto 🏠' : `${job.city} 🏢`}

Não perca tempo! As inscrições estão abertas e queremos fechar essa vaga com alguém incrível (você?).

Acesse o link e cadastre seu currículo:
📲 ${link}

${getTags(job)}`,

    // 6. Focada na METARH (Corrigido Maiúsculas)
    (job: SelectyJobResponse, link: string) =>
`A METARH conecta você às melhores oportunidades! 🌐

Nova posição disponível para: ${job.title}.

Faça parte de empresas que valorizam o capital humano.
📍 Atuação: ${job.city || 'Brasil'}

Detalhes e inscrição:
${link}

${getTags(job)}`,

    // 7. Networking (Você ou Indicação)
    (job: SelectyJobResponse, link: string) =>
`Networking é tudo! 🤝

Estamos com vaga aberta para ${job.title}.

Você é essa pessoa ou conhece alguém com esse perfil? Ajude essa oportunidade chegar no talento certo marcando nos comentários.

🔗 Link da vaga: ${link}

${getTags(job)}`,

    // 8. Detalhada (Bullets)
    (job: SelectyJobResponse, link: string) =>
`OPORTUNIDADE: ${job.title} 💼

📌 Detalhes da vaga:
▪️ Setor: ${job.department || 'Geral'}
▪️ Modelo: ${job.remote ? 'Remoto' : 'Presencial'}
▪️ Contrato: ${job.contract_type || 'A combinar'}
▪️ Cidade: ${job.city || 'Não informado'}

Buscamos profissionais engajados e prontos para somar.

Inscreva-se: ${link}

${getTags(job)}`,

    // 9. Vaga no Radar (Melhorada)
    (job: SelectyJobResponse, link: string) =>
`VAGA NO RADAR! 🎯

Oportunidade para ${job.title} em ${job.city || 'aberto'}.

Se você busca uma recolocação ou um novo desafio profissional, essa é a hora. Processo seletivo ágil conduzido pela METARH.

Acesse e candidate-se:
${link}

${getTags(job)}`,

    // 10. Foco no Cliente/Parceiro (Reescrita)
    (job: SelectyJobResponse, link: string) =>
`A METARH conecta você a grandes empresas! 🌐

Estamos selecionando ${job.title} para atuar em um de nossos clientes parceiros.

Uma excelente chance de alavancar sua carreira no mercado.

📍 ${job.city || 'Brasil'}
🔗 Candidate-se: ${link}

${getTags(job)}`
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
const CONTRACT_OPTIONS = ['CLT (Efetivo)', 'PJ', 'Estágio', 'Temporário', 'Freelance', 'Trainee'];
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

// Custom Select Component Local
interface GeneratorSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

const GeneratorSelect: React.FC<GeneratorSelectProps> = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full pl-4 pr-8 py-2.5 border rounded-full text-left transition-all focus:outline-none text-xs bg-white
          ${isOpen 
            ? 'border-[#aa3ffe] ring-2 ring-[#aa3ffe]/20 shadow-sm' 
            : 'border-slate-200 hover:border-brand-300'
          }
        `}
      >
        <span className="block truncate font-medium text-slate-700">
          {value || "Selecione..."}
        </span>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#aa3ffe]' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-48 overflow-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                }}
                className={`px-4 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors
                  ${value === option 
                    ? 'bg-brand-50 text-brand-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                  }
                `}
              >
                <span className="truncate">{option}</span>
                {value === option && <Check className="w-3 h-3 text-brand-600" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const JobImageGenerator: React.FC<JobImageGeneratorProps> = ({ job, onClose, onSuccess }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado editável do card
  // Remove potential location info from title (common pattern "Role - City")
  const initialTitle = job.title.split(' - ')[0].trim();
  const [title, setTitle] = useState(initialTitle);
  
  const [tag1, setTag1] = useState(job.contract_type === 'CLT' ? 'CLT (Efetivo)' : (job.contract_type || 'CLT (Efetivo)')); // Contrato
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
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
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
    // Gera a primeira legenda ao abrir
    generateCaption(0);
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

  const generateCaption = (index: number) => {
      const template = CAPTION_TEMPLATES[index];
      // Garante que o link esteja atualizado caso o usuário tenha mudado o footerUrl,
      // mas preferencialmente usa o link oficial da vaga se disponível.
      const link = job.url_apply || footerUrl;
      
      const text = template(job, link);
      setCaptionText(text);
      setCurrentCaptionIndex(index);
  };

  const handleNextCaption = () => {
      const nextIndex = (currentCaptionIndex + 1) % CAPTION_TEMPLATES.length;
      generateCaption(nextIndex);
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
      
      // Incrementa contador no componente pai
      if (onSuccess) {
        onSuccess();
      }

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
    <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen relative items-start">
      
      {/* Sidebar de Edição - Rolagem normal */}
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
                            className="w-full p-3 border border-slate-200 rounded-full text-sm font-sans font-bold"
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
                        <GeneratorSelect 
                            label="Contrato"
                            value={tag1}
                            options={CONTRACT_OPTIONS}
                            onChange={setTag1}
                        />
                    </div>
                    <div className="col-span-1">
                        <GeneratorSelect 
                            label="Modalidade"
                            value={tag2}
                            options={MODALITY_OPTIONS}
                            onChange={setTag2}
                        />
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

                {/* Caption Generator Section - UPDATED */}
                <div className="bg-brand-50 rounded-3xl p-5 border border-brand-100 mt-4">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-bold text-brand-700 uppercase">
                            Legenda ({currentCaptionIndex + 1}/{CAPTION_TEMPLATES.length})
                        </label>
                        <button 
                            onClick={handleNextCaption}
                            className="px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-full text-[10px] font-bold hover:bg-brand-100 transition-colors flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Próxima Ideia
                        </button>
                    </div>

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

      {/* Área de Preview - Fixed no Desktop (Pop up style behavior) */}
      <div className="w-full lg:w-2/3 flex items-center justify-center bg-slate-200/50 border-b lg:border-b-0 lg:border-l border-slate-300 p-4 order-1 lg:order-2 min-h-[500px] lg:fixed lg:right-0 lg:top-0 lg:h-screen z-20">
        
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
                                        className="font-sans font-bold text-white uppercase tracking-wide text-center leading-tight"
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

                            {/* REMOVIDO: Cursor Verde Superior (Código limpo) */}
                            
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
