import React, { useState } from 'react';
import { Sparkles, Send, Zap } from 'lucide-react';
import { StorefrontProfile, StorefrontProduct } from '../types';
import { useT } from '../i18n/LanguageContext';

export interface AIStorefrontDeployerProps {
  onDeploy?: (payload: {
    name: string;
    description: string;
    style: 'tech' | 'retail' | 'wellness' | 'minimalist';
    fontFamily: 'sans' | 'serif' | 'round' | 'mono';
    headerLayout: 'minimalist' | 'centered' | 'asymmetric';
    isDeployed: boolean;
    virtualUrl: string;
  }) => void;
  isLoading?: boolean;
  stores?: StorefrontProfile[];
  setStores?: (updater: StorefrontProfile[] | ((current: StorefrontProfile[]) => StorefrontProfile[])) => void;
  products?: StorefrontProduct[];
  setProducts?: (updater: StorefrontProduct[] | ((current: StorefrontProduct[]) => StorefrontProduct[])) => void;
}

export default function AIStorefrontDeployer({
  onDeploy,
  isLoading = false,
  stores = [],
  setStores,
  products = [],
  setProducts
}: AIStorefrontDeployerProps) {
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'tech' | 'retail' | 'wellness' | 'minimalist'>('tech');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'round' | 'mono'>('sans');
  const [headerLayout, setHeaderLayout] = useState<'minimalist' | 'centered' | 'asymmetric'>('minimalist');
  const t = useT();

  const handleDeploy = () => {
    const fallbackName = t('deployer.pbDefaultName');
    const cleanName = storeName.trim() || fallbackName;
    const cleanDescription = description.trim() || t('deployer.pbDefaultDescription', { name: cleanName });
    onDeploy?.({
      name: cleanName,
      description: cleanDescription,
      style: selectedStyle,
      fontFamily,
      headerLayout,
      isDeployed: true,
      virtualUrl: `https://${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.invowise.shop`
    });
    setStoreName('');
    setDescription('');
  };

  const handleQuickDeploy = (style: string) => {
    const templates = {
      tech: t('deployer.pbTemplateTech'),
      retail: t('deployer.pbTemplateRetail'),
      wellness: t('deployer.pbTemplateWellness')
    } as const;
    const presetName = style === 'tech' ? t('deployer.pbPresetTech') : style === 'retail' ? t('deployer.pbPresetRetail') : t('deployer.pbPresetWellness');
    setSelectedStyle(style as 'tech' | 'retail' | 'wellness');
    setStoreName(presetName);
    setDescription(templates[style as keyof typeof templates]);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t('deployer.pbTitle')}</h3>
        </div>
        <p className="text-gray-600 text-xs">{t('deployer.pbSubtitle')}</p>
      </div>

      {/* Main Input */}
      <div className="flex-1 flex flex-col gap-4">
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder={t('deployer.pbStoreName')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
        />

        <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as any)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          <option value="tech">{t('deployer.pbStyleTech')}</option>
          <option value="retail">{t('deployer.pbStyleRetail')}</option>
          <option value="wellness">{t('deployer.pbStyleWellness')}</option>
          <option value="minimalist">{t('deployer.pbStyleMinimalist')}</option>
        </select>

        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value as any)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          <option value="sans">{t('deployer.pbFontSans')}</option>
          <option value="serif">{t('deployer.pbFontSerif')}</option>
          <option value="round">{t('deployer.pbFontRound')}</option>
          <option value="mono">{t('deployer.pbFontMono')}</option>
        </select>

        <select value={headerLayout} onChange={(e) => setHeaderLayout(e.target.value as any)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          <option value="minimalist">{t('deployer.pbHeaderMinimalist')}</option>
          <option value="centered">{t('deployer.pbHeaderCentered')}</option>
          <option value="asymmetric">{t('deployer.pbHeaderAsymmetric')}</option>
        </select>

        <div className="relative flex-1">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('deployer.pbDescriptionPlaceholder')}
            className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
          />
        </div>

        {/* Character Count */}
        <div className="text-gray-500 text-xs">
          {t('deployer.pbCharCount', { count: description.length })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDeploy}
            disabled={isLoading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {t('deployer.pbDeploy')}
          </button>
          <button
            disabled={isLoading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
            title={t('deployer.pbQuickTooltip')}
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Templates */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-gray-600 text-xs font-semibold mb-3">{t('deployer.pbQuickTemplates')}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'tech', label: t('deployer.pbQuickTech'), emoji: '💻' },
              { id: 'retail', label: t('deployer.pbQuickRetail'), emoji: '🛍️' },
              { id: 'wellness', label: t('deployer.pbQuickWellness'), emoji: '🧘' }
            ].map((template) => (
              <button
                key={template.id}
                onClick={() => handleQuickDeploy(template.id)}
                disabled={isLoading}
                className="p-2 bg-gray-50 hover:bg-orange-50 disabled:opacity-50 rounded-lg text-xs font-medium text-gray-700 hover:text-orange-600 transition-colors flex flex-col items-center gap-1"
              >
                <span className="text-lg">{template.emoji}</span>
                <span>{template.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <p className="text-blue-700 text-xs font-medium">{t('deployer.pbDeploying')}</p>
        </div>
      )}
    </div>
  );
}
