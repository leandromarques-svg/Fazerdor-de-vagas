
import React from 'react';
import { SelectyJobResponse } from '../types';
import { MapPin, Briefcase, Hash, Image as ImageIcon, Calendar, Eye, CheckCircle, Circle } from 'lucide-react';

interface JobCardProps {
  job: SelectyJobResponse;
  onShowDetails: (job: SelectyJobResponse) => void;
  onGenerateImage?: (job: SelectyJobResponse) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (job: SelectyJobResponse) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ 
    job, 
    onShowDetails, 
    onGenerateImage, 
    isSelectionMode = false, 
    isSelected = false, 
    onToggleSelect 
}) => {
  
  const handleCardClick = (e: React.MouseEvent) => {
      if (isSelectionMode && onToggleSelect) {
          e.stopPropagation();
          onToggleSelect(job);
      } else {
          onShowDetails(job);
      }
  };

  return (
    <div 
        onClick={handleCardClick} 
        className={`cursor-pointer flex flex-col bg-white rounded-3xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 group h-full overflow-hidden relative
            ${isSelected 
                ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-[0_10px_25px_rgba(170,63,254,0.15)]' 
                : 'border-slate-100 hover:shadow-[0_10px_25px_rgba(170,63,254,0.15)] hover:border-brand-200'
            }
        `}
    >
      
      {isSelectionMode && (
          <div className="absolute top-4 right-4 z-10">
              {isSelected ? (
                  <div className="bg-brand-600 text-white rounded-full p-1 shadow-md transform scale-110 transition-transform">
                      <CheckCircle className="w-6 h-6 fill-brand-600 text-white" />
                  </div>
              ) : (
                  <div className="bg-white text-slate-300 rounded-full p-1 shadow-sm border-2 border-slate-200 hover:border-brand-400 hover:text-brand-400 transition-colors">
                       <Circle className="w-6 h-6" />
                  </div>
              )}
          </div>
      )}

      <div className="p-7 flex-grow">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-4 pr-8">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors uppercase tracking-wide">
              {job.department || 'Geral'}
            </span>
            <span className="inline-flex items-center px-2 py-1 text-slate-400 text-xs font-mono border border-slate-200 rounded-full bg-white" title="Cód. Vaga">
                <Hash className="w-3 h-3 mr-1" />
                {job.id}
            </span>
          </div>
          
          {job.remote && (
             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 uppercase tracking-wide">
               Remoto
             </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-5 group-hover:text-brand-600 transition-colors leading-tight">
          {job.title}
        </h3>

        <div className="flex flex-col gap-2.5">
           <div className="flex items-center text-sm text-slate-500 font-medium">
             <MapPin className="w-4 h-4 mr-2 text-brand-400 shrink-0" />
             <span className="truncate">{job.remote ? 'Qualquer lugar (Remoto)' : `${job.city}, ${job.state}`}</span>
           </div>
           {job.contract_type && (
             <div className="flex items-center text-sm text-slate-500 font-medium">
               <Briefcase className="w-4 h-4 mr-2 text-brand-400 shrink-0" />
               <span>{job.contract_type}</span>
             </div>
           )}
           {job.published_at && (
            <div className="flex items-center text-sm text-slate-500 font-medium">
               <Calendar className="w-4 h-4 mr-2 text-brand-400 shrink-0" />
               <span>{new Date(job.published_at).toLocaleDateString('pt-BR')}</span>
             </div>
           )}
        </div>
      </div>

      <div className="px-7 pb-7 pt-0 mt-auto flex gap-3">
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onShowDetails(job);
            }}
            className={`flex-1 bg-white text-brand-600 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 py-3 px-3 rounded-2xl font-bold text-sm flex items-center justify-center transition-all duration-300 shadow-sm ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`}
            title="Ver Detalhes"
        >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
        </button>

        {onGenerateImage && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onGenerateImage(job);
                }}
                className={`flex-1 bg-brand-600 text-white border border-transparent hover:bg-brand-700 py-3 px-3 rounded-2xl font-bold text-sm flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`}
                title="Criar Post Social"
            >
                <ImageIcon className="w-4 h-4 mr-2" />
                Criar Post
            </button>
        )}
      </div>
    </div>
  );
};