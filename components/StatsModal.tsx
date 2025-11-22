
import React from 'react';
import { X, Zap, Clock, TrendingUp } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  hoursSaved: number;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, count, hoursSaved }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Pattern */}
        <div className="bg-brand-600 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-brand-500/50 rounded-full blur-xl"></div>
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 text-center mt-2">
                <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-md shadow-lg border border-white/10">
                    <Zap className="w-8 h-8 text-white fill-yellow-400" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Impacto do Gerador</h2>
                <p className="text-brand-100 text-sm font-medium">Otimizando o tempo da METARH</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center hover:border-brand-200 transition-colors">
                    <div className="text-brand-600 mb-2 flex justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{count}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vagas Geradas</div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center hover:border-brand-200 transition-colors">
                    <div className="text-blue-500 mb-2 flex justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{hoursSaved}h</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tempo Poupado</div>
                </div>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex gap-3 items-start">
                <div className="mt-1 bg-white p-1 rounded-full shadow-sm">
                    <Zap className="w-3 h-3 text-brand-600" />
                </div>
                <p className="text-xs text-brand-800 leading-relaxed">
                    <span className="font-bold">Curiosidade:</span> Considerando que cada arte levaria em média 15 minutos para ser criada manualmente, nós já economizamos mais de {hoursSaved} horas de trabalho produtivo.
                </p>
            </div>

            <button 
                onClick={onClose}
                className="w-full mt-6 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
                Incrível, fechar
            </button>
        </div>
      </div>
    </div>
  );
};
