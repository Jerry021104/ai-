import React, { useState, useEffect, useRef } from 'react';
import { 
  Gender, 
  UserProfile, 
  FaceAnalysisResult, 
  HairstyleRequest, 
  HairLength, 
  LightingCondition,
  GeneratedHairstyle,
  Language,
  FaceDimensions
} from './types';
import { 
  analyzeFaceShape, 
  refineFaceAnalysis,
  generateHairstyleImage, 
  generateBarberInstructions, 
  fileToGenerativePart,
  getMoreStyleRecommendations,
  modifyHairstyleWithChat
} from './services/geminiService';
import { StepIndicator } from './components/StepIndicator';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { Camera, Loader2, Scissors, Globe, ArrowLeft, RefreshCw, Search, Send, MessageSquare, ChevronRight, User, Palette, Download, Sparkles } from 'lucide-react';

// --- Translation Dictionary ---
const TRANSLATIONS = {
  en: {
    title: "AI Hairstyle Architect",
    poweredBy: "Powered by Gemini 2.5",
    back: "Back",
    steps: ['Profile', 'Upload', 'Analysis', 'Style', 'Result'],
    profile: {
      title: "Tell us about yourself",
      subtitle: "This helps the AI tailor recommendations specifically for you.",
      gender: "Gender Identity",
      age: "Age",
      hairCurl: "Hair Texture",
      hairThickness: "Hair Density",
      currentColor: "Current Color",
      nextStep: "Continue",
      curlOptions: {
        Straight: "Straight",
        Wavy: "Wavy",
        Curly: "Curly",
        Coily: "Coily"
      },
      thicknessOptions: {
        Fine: "Fine",
        Medium: "Medium",
        Thick: "Thick"
      },
      genderOptions: {
        [Gender.MALE]: "Male",
        [Gender.FEMALE]: "Female",
        [Gender.NON_BINARY]: "Non-Binary"
      },
      colorPlaceholder: "e.g., Dark Brown"
    },
    upload: {
      title: "Upload Photo",
      desc: "For the best analysis, use a clear, front-facing photo with natural lighting.",
      cta: "Click to Upload",
      analyzing: "Analyzing Facial Structure..."
    },
    style: {
      title: "Design Your Look",
      recommended: "AI Suggestions",
      shuffle: "Refresh",
      searchPlaceholder: "Search or enter any style...",
      lengthLabel: "Length",
      colorLabel: "Color",
      colorPlaceholder: "e.g. Platinum",
      generate: "Visualize Style",
      generating: "Creating Masterpiece...",
      tipsTitle: "Style Tips for {shape} Face",
      tipsDesc: "Based on your analysis, aim for styles that {summary}.",
      lengthOptions: {
        [HairLength.BUZZ]: 'Buzz / Very Short',
        [HairLength.SHORT]: 'Short (Above Ear)',
        [HairLength.MEDIUM]: 'Medium (Shoulder)',
        [HairLength.LONG]: 'Long (Below Shoulder)'
      }
    },
    result: {
      title: "Your New Look",
      download: "Save to Album",
      refineTitle: "Refine Result",
      barber: "Barber's Guide",
      tryAnother: "Create Another Look",
      disclaimer: "Visualizations are AI approximations. Consult a professional.",
      chat: {
        title: "Refine Look",
        placeholder: "e.g., Make it shorter, add highlights...",
        send: "Update",
        processing: "Refining..."
      }
    }
  },
  zh: {
    title: "AI 发型设计师",
    poweredBy: "由 Gemini 2.5 驱动",
    back: "返回",
    steps: ['档案', '上传', '分析', '设计', '成果'],
    profile: {
      title: "建立您的档案",
      subtitle: "这有助于 AI 为您量身定制发型方案。",
      gender: "性别",
      age: "年龄",
      hairCurl: "发质卷度",
      hairThickness: "头发密度",
      currentColor: "当前发色",
      nextStep: "下一步",
      curlOptions: {
        Straight: "直发",
        Wavy: "波浪",
        Curly: "卷发",
        Coily: "自然卷"
      } as Record<string, string>,
      thicknessOptions: {
        Fine: "细软",
        Medium: "中等",
        Thick: "粗硬"
      } as Record<string, string>,
      genderOptions: {
        [Gender.MALE]: "男性",
        [Gender.FEMALE]: "女性",
        [Gender.NON_BINARY]: "其他"
      },
      colorPlaceholder: "例如：深棕色"
    },
    upload: {
      title: "上传照片",
      desc: "请上传一张光线充足、五官清晰的正脸照片。",
      cta: "点击上传照片",
      analyzing: "正在分析面部特征..."
    },
    style: {
      title: "定制发型",
      recommended: "AI 推荐",
      shuffle: "换一批",
      searchPlaceholder: "搜索或输入发型名称...",
      lengthLabel: "长度",
      colorLabel: "发色",
      colorPlaceholder: "例如：亚麻色",
      generate: "生成预览",
      generating: "正在生成...",
      tipsTitle: "{shape}脸型建议",
      tipsDesc: "根据您的特征，建议尝试能够{summary}的发型。",
      lengthOptions: {
        [HairLength.BUZZ]: '超短 / 寸头',
        [HairLength.SHORT]: '短发 (耳上)',
        [HairLength.MEDIUM]: '中发 (及肩)',
        [HairLength.LONG]: '长发 (过肩)'
      }
    },
    result: {
      title: "设计完成",
      download: "保存到相册",
      refineTitle: "微调设计",
      barber: "理发师指南",
      tryAnother: "尝试新风格",
      disclaimer: "效果图仅供参考，具体请咨询专业发型师。",
      chat: {
        title: "微调效果",
        placeholder: "例如：刘海短一点，换个颜色...",
        send: "发送",
        processing: "调整中..."
      }
    }
  }
};

// --- Sub-components ---

const SelectionCard: React.FC<{
  selected: boolean;
  label: string;
  onClick: () => void;
}> = ({ selected, label, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all duration-200
      ${selected 
        ? 'bg-primary text-white border-primary shadow-md transform scale-[1.02]' 
        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
    `}
  >
    {label}
  </button>
);

const UserProfileForm: React.FC<{ 
  data: UserProfile, 
  onChange: (d: UserProfile) => void, 
  onNext: () => void,
  lang: Language
}> = ({ data, onChange, onNext, lang }) => {
  const t = TRANSLATIONS[lang].profile;

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-soft border border-gray-100 space-y-6">
        
        {/* Gender & Age Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.gender}</label>
            <div className="flex gap-2">
              {Object.values(Gender).map((g) => (
                <button
                  key={g}
                  onClick={() => onChange({ ...data, gender: g })}
                  className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${
                    data.gender === g 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.genderOptions[g]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.age}</label>
            <div className="relative">
              <input
                type="number"
                value={data.age}
                onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || 25 })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
            </div>
          </div>
        </div>

        {/* Hair Characteristics */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.hairCurl}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(t.curlOptions).map(([key, label]) => (
              <SelectionCard 
                key={key} 
                selected={data.hairCurl === key} 
                label={label} 
                onClick={() => onChange({ ...data, hairCurl: key })} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.hairThickness}</label>
           <div className="grid grid-cols-3 gap-2">
            {Object.entries(t.thicknessOptions).map(([key, label]) => (
              <SelectionCard 
                key={key} 
                selected={data.hairThickness === key} 
                label={label} 
                onClick={() => onChange({ ...data, hairThickness: key })} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.currentColor}</label>
          <div className="relative">
             <input
              type="text"
              placeholder={t.colorPlaceholder}
              value={data.currentColor}
              onChange={(e) => onChange({ ...data, currentColor: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-4 hover:bg-gray-900 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {t.nextStep} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

const ImageUploader: React.FC<{
  onImageSelected: (file: File) => void;
  isLoading: boolean;
  lang: Language;
}> = ({ onImageSelected, isLoading, lang }) => {
  const t = TRANSLATIONS[lang].upload;
  return (
    <div className="max-w-lg mx-auto animate-slide-up text-center">
      <div className="bg-white p-10 rounded-3xl shadow-soft border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900">{t.title}</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {t.desc}
        </p>

        <div className="relative group">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) onImageSelected(e.target.files[0]);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isLoading}
          />
          <button className={`
            w-full py-4 rounded-xl font-bold border-2 border-dashed transition-all flex items-center justify-center gap-3
            ${isLoading 
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait' 
              : 'border-primary text-primary hover:bg-primary hover:text-white hover:border-solid hover:shadow-lg'}
          `}>
             {isLoading ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
             <span>{isLoading ? t.analyzing : t.cta}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StyleConfigurator: React.FC<{
  analysis: FaceAnalysisResult;
  onGenerate: (req: HairstyleRequest) => void;
  isGenerating: boolean;
  lang: Language;
}> = ({ analysis, onGenerate, isGenerating, lang }) => {
  const [styleName, setStyleName] = useState('');
  const [length, setLength] = useState<HairLength>(HairLength.MEDIUM);
  const [color, setColor] = useState('Natural');
  
  const [recommendations, setRecommendations] = useState<string[]>(analysis.recommendedStyles);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const t = TRANSLATIONS[lang].style;

  useEffect(() => {
    if (analysis.recommendedStyles.length > 0 && !styleName) {
      setStyleName(analysis.recommendedStyles[0]);
    }
  }, [analysis]);

  const handleShuffle = async () => {
    setIsLoadingMore(true);
    const newStyles = await getMoreStyleRecommendations(analysis, recommendations, lang);
    if (newStyles.length > 0) {
      setRecommendations(newStyles);
    }
    setIsLoadingMore(false);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 animate-slide-up">
      {/* Configuration Panel */}
      <div className="flex-1 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
          <Scissors className="text-accent opacity-50" size={24} />
        </div>

        <div className="space-y-8">
           {/* Inspiration / Chips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.recommended}</label>
              <button 
                onClick={handleShuffle}
                disabled={isLoadingMore}
                className="text-xs flex items-center gap-1.5 text-accent font-medium hover:text-accent-hover transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isLoadingMore ? "animate-spin" : ""} />
                {t.shuffle}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {recommendations.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyleName(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    styleName === s 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Style Name Input */}
          <div>
             <div className="relative">
               <input 
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-11 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t.lengthLabel}</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as HairLength)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-gray-700 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  style={{ backgroundImage: 'none' }} // Remove default arrow if needed, but browser default is fine for accessibility
                >
                  {Object.values(HairLength).map((l) => (
                    <option key={l} value={l}>{t.lengthOptions[l]}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t.colorLabel}</label>
                <input 
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t.colorPlaceholder}
                />
             </div>
          </div>

          <button
            disabled={isGenerating || !styleName}
            onClick={() => onGenerate({ styleName, length, color, lighting: LightingCondition.STUDIO })}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-3
              ${isGenerating || !styleName ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-gray-900'}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> {t.generating}
              </>
            ) : (
              t.generate
            )}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-full lg:w-80 h-fit bg-gradient-to-b from-blue-50 to-white p-6 rounded-3xl border border-blue-100">
        <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
           <User size={18} />
           {t.tipsTitle.replace('{shape}', analysis.faceShape)}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {t.tipsDesc.replace('{summary}', analysis.featuresSummary.toLowerCase())}
        </p>
        <div className="w-full h-px bg-blue-100 mb-6" />
        <ul className="text-sm text-gray-600 space-y-3">
          <li className="flex gap-2">
            <span className="text-accent">•</span>
            {lang === 'en' ? "Consider daily maintenance." : "选择前请考虑打理难度。"}
          </li>
          <li className="flex gap-2">
            <span className="text-accent">•</span>
            {lang === 'en' ? "Shorter sides enhance jawlines." : "两侧剪短通常能突出下颌线。"}
          </li>
          <li className="flex gap-2">
             <span className="text-accent">•</span>
             {lang === 'en' ? "Fringe balances forehead height." : "刘海可以平衡额头高度。"}
          </li>
        </ul>
      </div>
    </div>
  );
};

const ChatInterface: React.FC<{
  onSend: (message: string) => void;
  isProcessing: boolean;
  lang: Language;
}> = ({ onSend, isProcessing, lang }) => {
  const [input, setInput] = useState('');
  const t = TRANSLATIONS[lang].result.chat;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          disabled={isProcessing}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 pr-14 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-gray-800 placeholder-gray-400 transition-all"
        />
        <button 
          type="submit" 
          disabled={isProcessing || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh'); 
  const [step, setStep] = useState(1);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    gender: Gender.MALE,
    age: 25,
    hairCurl: 'Straight',
    hairThickness: 'Medium',
    currentColor: 'Brown'
  });
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  
  const [generatedResult, setGeneratedResult] = useState<GeneratedHairstyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRequest, setLastRequest] = useState<HairstyleRequest | null>(null);
  
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatResponse, setChatResponse] = useState<string>('');

  const t = TRANSLATIONS[lang];

  const handleImageUpload = async (file: File) => {
    try {
      setIsAnalyzing(true);
      const base64 = await fileToGenerativePart(file);
      setOriginalImage(base64);
      
      const analysis = await analyzeFaceShape(base64, userProfile, lang);
      setFaceAnalysis(analysis);
      setStep(3); 
    } catch (error) {
      alert(lang === 'zh' ? "图像分析失败，请尝试使用更清晰的照片。" : "Failed to analyze image. Please try again with a clearer photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefineAnalysis = async (dimensions: FaceDimensions) => {
    if (!originalImage) return;

    try {
      setIsRefining(true);
      const newAnalysis = await refineFaceAnalysis(originalImage, userProfile, dimensions, lang);
      setFaceAnalysis(newAnalysis);
    } catch (error) {
      alert(lang === 'zh' ? "重新分析失败，请重试。" : "Re-analysis failed. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async (request: HairstyleRequest, isLightingChange: boolean = false) => {
    if (!originalImage || !faceAnalysis) return;
    
    try {
      setIsGenerating(true);
      setLastRequest(request);
      setChatResponse(''); 
      
      const sourceImage = originalImage;
      
      const [imgUrl, instructions] = await Promise.all([
        generateHairstyleImage(sourceImage, faceAnalysis, request, lang, isLightingChange),
        generateBarberInstructions(faceAnalysis, request, lang)
      ]);

      setGeneratedResult({
        imageUrl: imgUrl,
        barberInstructions: instructions
      });
      
      setStep(5); 
    } catch (error) {
      alert(lang === 'zh' ? "生成失败，请检查API Key。" : "Failed to generate hairstyle.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatModification = async (instruction: string) => {
    if (!generatedResult) return;
    
    try {
      setChatProcessing(true);
      const { imageUrl, reply } = await modifyHairstyleWithChat(generatedResult.imageUrl, instruction, lang);
      
      setGeneratedResult(prev => prev ? { ...prev, imageUrl } : null);
      setChatResponse(reply);
      
    } catch (error) {
      console.error(error);
      alert(lang === 'zh' ? "修改失败。" : "Modification failed.");
    } finally {
      setChatProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    const link = document.createElement('a');
    link.href = generatedResult.imageUrl;
    link.download = `ai-hairstyle-architect-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleLang = () => {
    setLang(l => l === 'en' ? 'zh' : 'en');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-800">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary to-gray-700 text-white p-2 rounded-xl shadow-lg shadow-primary/20">
              <Scissors size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">{t.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-primary transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200"
            >
              <Globe size={14} />
              {lang === 'en' ? '中文' : 'ENG'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-24">
        {step !== 5 && (
           <StepIndicator 
            currentStep={step} 
            totalSteps={5} 
            stepNames={t.steps} 
          />
        )}

        <div className="mt-4 relative">
          {/* Back Button */}
          {step > 1 && step !== 5 && (
            <button 
              onClick={handleBack}
              disabled={isGenerating || isAnalyzing || chatProcessing || isRefining}
              className="mb-6 flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-medium text-sm px-2"
            >
              <ArrowLeft size={16} />
              {t.back}
            </button>
          )}

          {step === 1 && (
            <UserProfileForm 
              data={userProfile} 
              onChange={setUserProfile} 
              onNext={() => setStep(2)} 
              lang={lang}
            />
          )}

          {step === 2 && (
            <ImageUploader 
              onImageSelected={handleImageUpload} 
              isLoading={isAnalyzing} 
              lang={lang}
            />
          )}

          {step === 3 && faceAnalysis && (
            <AnalysisDisplay 
              data={faceAnalysis} 
              onContinue={() => setStep(4)} 
              lang={lang}
              onRefine={handleRefineAnalysis}
              isRefining={isRefining}
            />
          )}

          {step === 4 && faceAnalysis && (
            <StyleConfigurator 
              analysis={faceAnalysis} 
              onGenerate={(req) => handleGenerate(req, false)} 
              isGenerating={isGenerating} 
              lang={lang}
            />
          )}

          {step === 5 && generatedResult && lastRequest && (
            <div className="max-w-6xl mx-auto animate-slide-up pb-10">
              {/* Top Nav for Step 5 */}
              <div className="flex items-center justify-between mb-6 px-2">
                <button 
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium text-sm"
                >
                  <ArrowLeft size={16} />
                  {t.back}
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">{t.result.title}</h2>
                </div>
                <button 
                  onClick={handleDownload}
                  className="hidden sm:flex items-center gap-2 text-accent font-semibold text-sm hover:text-accent-hover bg-accent/5 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  {t.result.download}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Left Column: Image Card & Refinement (Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Image Card */}
                  <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-100">
                     <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-[3/4] sm:aspect-auto">
                        <img 
                          src={generatedResult.imageUrl} 
                          alt="Generated Hairstyle" 
                          className="w-full h-full object-cover"
                        />
                        {/* Mobile Download Button Overlay */}
                        <button 
                          onClick={handleDownload}
                          className="sm:hidden absolute top-4 right-4 bg-white/90 text-gray-800 p-2.5 rounded-full shadow-lg backdrop-blur-sm"
                        >
                          <Download size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Refinement Card */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
                     <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-accent" />
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{t.result.refineTitle}</h3>
                     </div>
                     
                     {/* Chat Response Display */}
                     {chatResponse && (
                       <div className="bg-blue-50/50 rounded-xl p-4 mb-4 text-sm text-gray-700 border border-blue-50 flex gap-3 items-start animate-fade-in">
                          <MessageSquare size={16} className="text-accent mt-0.5 shrink-0" />
                          <p>{chatResponse}</p>
                       </div>
                     )}
                     
                     <ChatInterface 
                        onSend={handleChatModification} 
                        isProcessing={chatProcessing}
                        lang={lang}
                     />
                  </div>
                </div>

                {/* Right Column: Info & Actions (Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Instructions Card */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex-1 flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                      <Scissors className="text-primary" size={20} />
                      <h3 className="font-bold text-gray-900">{t.result.barber}</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                      <div className="prose prose-sm prose-slate text-gray-600 font-sans leading-7 whitespace-pre-line">
                         {generatedResult.barberInstructions}
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer & Reset */}
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed">
                      {t.result.disclaimer}
                    </div>
                    
                    <button 
                      onClick={() => setStep(4)}
                      className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:text-primary transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} />
                      {t.result.tryAnother}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;