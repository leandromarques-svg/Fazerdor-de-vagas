import React, { forwardRef, useEffect, useState } from 'react';
import { JobData } from '../types';
import { MousePointer2 } from 'lucide-react';

interface JobCardProps {
  data: JobData;
  scale?: number;
}

// Hook customizado para converter URLs externas em Base64
// Isso é CRUCIAL para o html-to-image funcionar com imagens de domínios externos (WP, Unsplash)
// sem causar erros de CORS (Tainted Canvas).
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
        // Usamos um proxy para garantir que conseguimos pegar o binário da imagem
        // sem ser bloqueado pelo servidor de origem.
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
        console.error("Erro ao converter imagem para base64:", error);
        // Fallback: Tenta usar a URL original se o proxy falhar (pode funcionar visualmente, mas falhar no download)
        if (isMounted) setDataSrc(url);
      }
    };

    loadImage();

    return () => { isMounted = false; };
  }, [url]);

  return dataSrc;
};

// Helper para abreviar cidades longas visualmente
const getDisplayLocation = (location: string) => {
    if (!location) return '';
    if (location.length <= 22) return location;

    // Tenta abreviar "São" para "S." e "Santo" para "Sto."
    let abbrev = location
        .replace(/^São\s/g, 'S. ')
        .replace(/^Santo\s/g, 'Sto. ')
        .replace(/^Santa\s/g, 'Sta. ')
        .replace(/\sde\s/g, ' ')
        .replace(/\sdos\s/g, ' ')
        .replace(/\sda\s/g, ' ')
        .replace(/\sdo\s/g, ' ');
    
    // Se ainda for muito grande, trunca
    if (abbrev.length > 25) {
        return abbrev.substring(0, 24) + '...';
    }
    return abbrev;
};

export const JobCard = forwardRef<HTMLDivElement, JobCardProps>(({ data, scale = 1 }, ref) => {
  
  // Carrega as imagens como Base64
  const backgroundSrc = useBase64Image("https://metarh.com.br/wp-content/uploads/2025/11/Fundo_Vagas.jpg");
  const footerLogoSrc = useBase64Image(data.footerLogoUrl || null);
  const mainImageSrc = useBase64Image(data.imageUrl);

  // Layout Specs:
  // Size: 1080px x 1350px
  // Safe Area Margin: 145px (Top, Bottom) | 135px (Left, Right)
  
  return (
    <div 
      ref={ref}
      className="relative overflow-hidden bg-white shadow-2xl flex flex-col"
      style={{
        width: '1080px',
        height: '1350px',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        flexShrink: 0,
      }}
    >
      {/* --- BACKGROUND LAYERS --- */}
      
      {/* Background Image - Base Layer */}
      <div className="absolute inset-0 w-full h-full z-0">
        {backgroundSrc && (
            <img 
                src={backgroundSrc}
                alt="Background Pattern" 
                className="w-full h-full object-cover"
            />
        )}
      </div>

      {/* Top White Background - Overlay with Rounded Corners for the specific finish */}
      {/* h-[42%] pushes the content separation line down slightly as requested */}
      <div className="absolute top-0 left-0 w-full h-[42%] bg-white z-10 rounded-b-[80px]"></div>

      {/* --- CONTENT SAFE AREA (Updated Top/Bottom Padding to 145px) --- */}
      <div className="relative z-20 w-full h-full flex flex-col pt-[145px] px-[135px] pb-[145px]">
        
        {/* === TOP SECTION === */}
        {/* Adjusted Ratios: Text 48% | Image 52% */}
        <div className="flex justify-between items-start w-full mb-6">
            
            {/* LEFT COL: Typography (48% width) */}
            <div className="flex flex-col justify-center items-start w-[48%] pr-4 pt-2">
                {/* Headline */}
                <div className="flex flex-col items-start mb-8 transform -ml-1">
                    <span className="font-condensed font-bold italic text-[100px] leading-[0.8] text-[#1a1a1a] tracking-tighter">
                        #Temos
                    </span>
                    {/* Adjusted size to match width of #Temos */}
                    <span className="font-condensed font-black italic text-[130px] leading-[0.75] text-[#1a1a1a] -mt-2">
                        Vagas
                    </span>
                </div>
                
                {/* Tagline */}
                {/* Added mt-[2px] to move it down slightly as requested */}
                <div className="mb-8 w-full mt-[2px]">
                    {/* Cor atualizada para #7730d8 */}
                    <p className="font-condensed font-bold italic text-[#7730d8] text-[36px] leading-[1.05] uppercase max-w-[95%]">
                        {data.tagline}
                    </p>
                </div>

                {/* Sector Pill */}
                {/* Removed rotation, reduced padding slightly, reduced font ~5% (32px -> 30px) */}
                <div className="bg-brand-pink px-7 py-2.5 rounded-full shadow-lg inline-block">
                    <span className="text-white font-condensed font-black text-[30px] uppercase tracking-wider block">
                        {data.sector}
                    </span>
                </div>
            </div>

            {/* RIGHT COL: Code + Image (52% width) */}
            {/* Changed items-end to items-center to center code relative to image */}
            <div className="flex flex-col items-center w-[52%] relative pl-2">
                {/* Code Label - Updated color to black and increased size ~10% */}
                <span className="text-black font-sans text-[27px] mb-3 font-medium tracking-wide">
                    Cód.: {data.jobCode}
                </span>

                {/* Main Image - Adjusted width, removed white border */}
                <div className="w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl bg-gray-200 relative z-10">
                     {mainImageSrc && (
                        <img 
                            src={mainImageSrc} 
                            alt="Imagem Vaga" 
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
            </div>
        </div>

        {/* === BOTTOM SECTION === */}
        <div className="flex-1 flex flex-col w-full text-center relative mt-[-20px]">
            
            {/* TITLE AREA: Uses flex-1 to push apart from top (image) and bottom (pills), effectively centering it */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 min-h-0">
                <h2 className="font-sans font-extrabold text-white text-[56px] leading-[1.1] drop-shadow-lg max-w-full break-words line-clamp-3">
                    {data.jobTitle}
                </h2>
            </div>

            {/* PILLS AREA: Static at the bottom of content area */}
            <div className="flex flex-wrap gap-4 justify-center w-full mb-10 shrink-0">
                <InfoPill text={data.contractType} customColor="#ed2bf4" />
                <InfoPill text={data.modality} />
                <InfoPill text={getDisplayLocation(data.location)} />
            </div>

            {/* FOOTER: Fixed at Bottom of Safe Area */}
            <div className="w-full flex items-center justify-between border-t border-white/30 pt-8 mt-auto shrink-0">
                 
                 {/* Left: Footer Logo */}
                 <div className="flex items-center">
                     {footerLogoSrc ? (
                         // Increased height from h-14 to h-[60px] (+2px visual approx/tweak)
                         <img 
                            src={footerLogoSrc} 
                            alt="Logo Branco" 
                            className="h-[60px] w-auto object-contain"
                         />
                     ) : (
                         /* Fallback Icon */
                         <div className="bg-white/20 rounded-full p-3">
                            <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/>
                            </svg>
                         </div>
                     )}
                 </div>

                 {/* Right: Text + Cursor */}
                 <div className="flex items-center gap-5">
                     <div className="flex flex-col items-end text-right">
                         <span className="text-white text-[22px] font-medium opacity-90 leading-tight">
                            Candidate-se gratuitamente em
                         </span>
                         <span className="text-white text-[22px] font-bold leading-tight">
                            {data.websiteUrl.replace('https://', '').replace('www.', '')}
                         </span>
                     </div>
                     <MousePointer2 className="w-12 h-12 text-brand-lime fill-brand-lime transform -rotate-12 drop-shadow-xl" />
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
});

// Reduced padding and font size ~10% (32px -> 29px)
// customColor prop added to override text color for specific pills
const InfoPill = ({ text, customColor }: { text: string, customColor?: string }) => (
  <div className="bg-white rounded-full px-6 py-3 shadow-xl min-w-[130px]">
    <span 
        className="font-sans font-extrabold text-[29px] uppercase tracking-tight block"
        style={{ color: customColor || '#481468' }}
    >
        {text}
    </span>
  </div>
);

JobCard.displayName = 'JobCard';