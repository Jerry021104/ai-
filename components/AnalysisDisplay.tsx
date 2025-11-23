import React, { useState } from 'react';
import { FaceAnalysisResult, Language, FaceDimensions } from '../types';
import { User, Sparkles, Ruler, RefreshCw, ChevronDown, ChevronUp, Loader2, Fingerprint } from 'lucide-react';

interface AnalysisDisplayProps {
  data: FaceAnalysisResult;
  onContinue: () => void;
  lang: Language;
  onRefine: (dimensions: FaceDimensions) => void;
  isRefining: boolean;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data, onContinue, lang, onRefine, isRefining }) => {
  const [showRefine, setShowRefine] = useState(false);
  const [dimensions, setDimensions] = useState<FaceDimensions>({
    faceLength: '',
    cheekboneWidth: '',
    jawlineWidth: '',
    foreheadWidth: ''
  });

  const t = {
    en: {
      title: "Analysis Complete",
      subtitle: "AI has detected your facial structure.",
      faceShape: "Face Shape",
      jawline: "Jawline",
      skinTone: "Skin Tone",
      stylistNotes: "Stylist Notes",
      recommended: "Recommended Styles",
      button: "Proceed to Styling",
      refine: {
        toggleOpen: "Incorrect? Refine with measurements",
        toggleClose: "Close Measurements",
        desc: "Provide actual measurements to recalibrate the AI model.",
        faceLength: "Length",
        cheekWidth: "Cheek Width",
        jawWidth: "Jaw Width",
        foreheadWidth: "Forehead",
        placeholder: "e.g. 18cm",
        submit: "Recalculate",
        analyzing: "Analyzing..."
      }
    },
    zh: {
      title: "分析完成",
      subtitle: "AI 已识别您的面部特征",
      faceShape: "脸型判断",
      jawline: "下颌特征",
      skinTone: "肤色分析",
      stylistNotes: "AI 造型建议",
      recommended: "推荐风格",
      button: "开始设计发型",
      refine: {
        toggleOpen: "结果不准？输入数据微调",
        toggleClose: "收起测量",
        desc: "输入实际面部尺寸以帮助 AI 校准分析结果。",
        faceLength: "脸长",
        cheekWidth: "脸宽/颧骨",
        jawWidth: "下颌宽",
        foreheadWidth: "额头宽",
        placeholder: "例: 20cm",
        submit: "重新计算",
        analyzing: "分析中..."
      }
    }
  }[lang];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-10">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t.title}</h2>
        <p className="text-gray-500 font-light">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Main Face Shape Card */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/50" />
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
               <Fingerprint size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.faceShape}</h3>
            <p className="text-2xl font-bold text-gray-800">{data.faceShape}</p>
          </div>

          {/* Secondary Stats */}
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.jawline}</h4>
              <p className="text-sm font-medium text-gray-700">{data.jawlineCharacteristics}</p>
            </div>
            <div className="w-full h-px bg-gray-100" />
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.skinTone}</h4>
              <p className="text-sm font-medium text-gray-700">{data.skinToneDescription}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Narrative */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
             {/* Decorative blob */}
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 text-accent">
                  <Sparkles size={24} />
                  <h3 className="text-lg font-semibold">{t.stylistNotes}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed text-lg font-light mb-8">
                  {data.featuresSummary}
                </p>

                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 block">{t.recommended}</span>
                  <div className="flex flex-wrap gap-2">
                    {data.recommendedStyles.map((style, idx) => (
                      <span key={idx} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium text-white transition-colors cursor-default border border-white/5">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
             </div>
          </div>

          {/* Refine Toggle */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden transition-all duration-300">
             <button 
              onClick={() => setShowRefine(!showRefine)}
              className="w-full flex items-center justify-between p-4 text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Ruler size={16} />
                <span className="text-sm font-medium">{showRefine ? t.refine.toggleClose : t.refine.toggleOpen}</span>
              </div>
              {showRefine ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showRefine && (
              <div className="p-5 pt-0 animate-fade-in bg-gray-50/50">
                <p className="text-xs text-gray-400 mb-4">{t.refine.desc}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { key: 'faceLength', label: t.refine.faceLength },
                    { key: 'cheekboneWidth', label: t.refine.cheekWidth },
                    { key: 'jawlineWidth', label: t.refine.jawWidth },
                    { key: 'foreheadWidth', label: t.refine.foreheadWidth }
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.label}</label>
                      <input 
                        type="text" 
                        value={dimensions[field.key as keyof FaceDimensions]}
                        onChange={(e) => setDimensions({...dimensions, [field.key]: e.target.value})}
                        placeholder={t.refine.placeholder}
                        className="w-full text-sm border-0 bg-white ring-1 ring-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none transition-shadow"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onRefine(dimensions)}
                  disabled={isRefining}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
                >
                  {isRefining ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  {isRefining ? t.refine.analyzing : t.refine.submit}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onContinue}
          className="bg-primary hover:bg-gray-900 text-white text-lg px-12 py-4 rounded-xl font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          {t.button}
        </button>
      </div>
    </div>
  );
};