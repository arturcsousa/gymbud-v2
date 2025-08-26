import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'pt-BR' ? t('languages.pt-BR') : t('languages.en');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200 shadow-lg border border-white/20 rounded-xl"
        >
          <Globe className="h-4 w-4" />
          {getCurrentLanguageLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-xl text-slate-800"
      >
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={`hover:bg-slate-100 cursor-pointer rounded-lg ${
            i18n.language === 'en' ? 'bg-slate-200 font-semibold' : ''
          }`}
        >
          {t('languages.en')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('pt-BR')}
          className={`hover:bg-slate-100 cursor-pointer rounded-lg ${
            i18n.language === 'pt-BR' ? 'bg-slate-200 font-semibold' : ''
          }`}
        >
          {t('languages.pt-BR')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { LanguageSwitcher };
export default LanguageSwitcher;
