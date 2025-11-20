

import React, { useState, useRef, useEffect } from 'react';
import { JobFilterState } from '../types';
import { Search, MapPin, ChevronDown, Check, Hash, SlidersHorizontal, X, Calendar } from 'lucide-react';

interface FiltersProps {
  filters: JobFilterState;
  setFilters: React.Dispatch<React.SetStateAction<JobFilterState>>;
  locations: string[];
}

// Custom Select Component to replace native Select and avoid default blue highlight
interface CustomSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { label: string; value: string }[] | string[];
  onChange: (val: string) => void;
  defaultText: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, icon, value, options, onChange, defaultText }) => {
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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Helper to get display label
  const getLabel = (val: string) => {
    if (!val) return defaultText;
    const found = options.find(opt => (typeof opt === 'string' ? opt === val : opt.value === val));
    if (!found) return val;
    return typeof found === 'string' ? found : found.label;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-full pl-10 pr-8 py-2.5 border rounded-full text-left transition-all focus:outline-none text-sm
            ${isOpen 
              ? 'border-[#aa3ffe] ring-2 ring-[#aa3ffe]/20 bg-white shadow-md' 
              : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-brand-300'
            }
          `}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 text-brand-400" })}
          </div>
          <span className={`block truncate ${value && value !== 'all' ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
            {getLabel(value)}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#aa3ffe]' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
            <ul className="py-1">
              {/* Default Option (All/Clear) */}
               <li 
                onClick={() => handleSelect('')}
                className={`px-4 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors
                  ${(value === '' || value === 'all')
                    ? 'bg-brand-50 text-brand-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                  }
                `}
              >
                <span>{defaultText}</span>
                {(value === '' || value === 'all') && <Check className="w-4 h-4 text-brand-600" />}
              </li>

              {options.map((option) => {
                const optValue = typeof option === 'string' ? option : option.value;
                const optLabel = typeof option === 'string' ? option : option.label;
                return (
                  <li
                    key={optValue}
                    onClick={() => handleSelect(optValue)}
                    className={`px-4 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors
                      ${value === optValue 
                        ? 'bg-brand-50 text-brand-700 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                      }
                    `}
                  >
                    <span className="truncate">{optLabel}</span>
                    {value === optValue && <Check className="w-4 h-4 text-brand-600" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export const Filters: React.FC<FiltersProps> = ({ filters, setFilters, locations }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleChange = (field: keyof JobFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const activeFiltersCount = [filters.location, filters.keyword, filters.jobCode, filters.specificDate].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ keyword: '', location: '', jobCode: '', specificDate: '' });
  };

  return (
    <div className="w-full">
      {/* Container principal com padding reduzido para mobile */}
      <div className="bg-white rounded-3xl md:rounded-[2rem] shadow-sm border border-slate-100 p-4 md:p-6 transition-all duration-300">
        
        {/* Row 1: Always Visible (Search + Mobile Toggle) */}
        <div className="flex gap-3 items-end w-full">
          
           {/* Job Code - Moved to first position */}
           <div className="w-24 hidden md:block">
                <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Cód.</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-3 w-3 text-brand-400" />
                    </div>
                    <input
                        type="text"
                        value={filters.jobCode}
                        onChange={(e) => handleChange('jobCode', e.target.value)}
                        placeholder="#"
                        className="block w-full pl-8 pr-2 py-2.5 border border-slate-200 rounded-full bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#aa3ffe]/20 focus:border-[#aa3ffe] transition-all"
                    />
                </div>
            </div>

          {/* Keyword Search (Title) */}
          <div className="flex-1 relative min-w-[200px]">
            <label className="block md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Título da Vaga</label>
            <label className="hidden md:block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Título da Vaga</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-400" />
              </div>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => handleChange('keyword', e.target.value)}
                placeholder="Busque pelo nome do cargo..."
                className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#aa3ffe]/20 focus:border-[#aa3ffe] transition-all"
              />
            </div>
          </div>

          {/* Mobile Toggle Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`md:hidden shrink-0 h-[42px] w-[42px] mb-[1px] flex items-center justify-center rounded-full border transition-colors
              ${isExpanded || activeFiltersCount > 0
                ? 'bg-brand-600 border-brand-600 text-white' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300'
              }`}
            title="Mais filtros"
          >
            {isExpanded ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
            {activeFiltersCount > 0 && !isExpanded && (
              <span className="absolute top-0 right-0 -mr-1 -mt-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
            )}
          </button>

          {/* Desktop: Inline Filters */}
          <div className="hidden md:flex items-end gap-2 shrink-0">
             
             {/* Specific Date Filter */}
             <div className="w-44 lg:w-48">
                <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Data</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-brand-400" />
                    </div>
                    <input
                        type="date"
                        value={filters.specificDate}
                        onChange={(e) => handleChange('specificDate', e.target.value)}
                        className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#aa3ffe]/20 focus:border-[#aa3ffe] transition-all cursor-pointer"
                    />
                </div>
             </div>

             {/* Location */}
             <div className="w-52 lg:w-64">
                <CustomSelect 
                    label="Localização"
                    icon={<MapPin />}
                    value={filters.location}
                    options={locations}
                    onChange={(val) => handleChange('location', val)}
                    defaultText="Todas as cidades"
                />
             </div>

             {/* Clean Button */}
             <div className="pb-0.5 pl-1">
                <button 
                    onClick={clearFilters}
                    className="p-2.5 rounded-full text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Limpar filtros"
                >
                    <Search className="w-5 h-5 hidden" />
                    <span className="text-xs font-bold uppercase tracking-wide text-center">Limpar</span>
                </button>
             </div>
          </div>
        </div>

        {/* Mobile: Collapsible Filters Area */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100">
                
                {/* Mobile Date */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Data de Publicação</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-brand-400" />
                        </div>
                        <input
                            type="date"
                            value={filters.specificDate}
                            onChange={(e) => handleChange('specificDate', e.target.value)}
                            className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#aa3ffe]/20 focus:border-[#aa3ffe] transition-all"
                        />
                    </div>
                </div>

                <CustomSelect 
                    label="Localização"
                    icon={<MapPin />}
                    value={filters.location}
                    options={locations}
                    onChange={(val) => handleChange('location', val)}
                    defaultText="Todas as cidades"
                />
                
                <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Cód. Vaga</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-4 w-4 text-brand-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.jobCode}
                                onChange={(e) => handleChange('jobCode', e.target.value)}
                                placeholder="#"
                                className="block w-full pl-9 pr-2 py-2.5 border border-slate-200 rounded-full bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#aa3ffe]/20 focus:border-[#aa3ffe] transition-all"
                            />
                        </div>
                     </div>
                     
                     <div className="flex items-end">
                        <button 
                        onClick={clearFilters}
                        className="w-full py-2.5 border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wide rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Limpar
                        </button>
                     </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};