import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Trash2, 
  PlusCircle,
  History,
  GraduationCap,
  X,
  Menu,
  Wand2,
  Brain,
  Trophy,
  AlertCircle,
  Volume2,
  ShieldCheck,
  Flame,
  Star,
  Filter,
  Calendar,
  Award,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from './lib/utils';
import { generateLanguageContent, completeCardDetails, type GeneratedContent } from './services/gemini';

type Tab = 'generator' | 'saved' | 'add' | 'quiz' | 'privacy' | 'achievements';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [savedCards, setSavedCards] = useState<GeneratedContent[]>([]);
  const [contentType, setContentType] = useState<'word' | 'verb' | 'phrase'>('word');
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Manual Entry State
  const [manualEntry, setManualEntry] = useState<GeneratedContent>({
    original: '',
    translation: '',
    example: '',
    exampleTranslation: ''
  });

  // Load saved cards and stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('baz_academy_cards');
    const savedStreak = localStorage.getItem('baz_academy_streak');
    const savedPoints = localStorage.getItem('baz_academy_points');
    const savedLastActive = localStorage.getItem('baz_academy_last_active');

    if (saved) {
      try {
        setSavedCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved cards", e);
      }
    }

    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedPoints) setPoints(parseInt(savedPoints));
    if (savedLastActive) setLastActive(savedLastActive);

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    if (savedLastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (savedLastActive === yesterdayStr) {
        // Streak continues (will update on first action)
      } else if (savedLastActive) {
        // Streak broken
        setStreak(0);
        localStorage.setItem('baz_academy_streak', '0');
      }
      setLastActive(today);
      localStorage.setItem('baz_academy_last_active', today);
    }
  }, []);

  const saveToLocalStorage = (cards: GeneratedContent[]) => {
    localStorage.setItem('baz_academy_cards', JSON.stringify(cards));
  };

  const updateStats = (newPoints: number) => {
    const updatedPoints = points + newPoints;
    setPoints(updatedPoints);
    localStorage.setItem('baz_academy_points', updatedPoints.toString());

    // Simple streak update on action
    const today = new Date().toISOString().split('T')[0];
    if (lastActive !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('baz_academy_streak', newStreak.toString());
      setLastActive(today);
      localStorage.setItem('baz_academy_last_active', today);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    window.speechSynthesis.speak(utterance);
  };

  const getRecentOriginals = () => {
    const recentGenerated = generated?.original ? [generated.original] : [];
    const recentSaved = savedCards.map(card => card.original).slice(0, 10);
    return [...new Set([...recentGenerated, ...recentSaved])].slice(0, 12);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateLanguageContent(contentType, 'German', getRecentOriginals());
      setGenerated(result);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIComplete = async () => {
    if (!manualEntry.original.trim()) return;
    setLoading(true);
    try {
      const result = await completeCardDetails(manualEntry.original, 'German');
      setManualEntry(result);
    } catch (error) {
      console.error("AI Completion failed", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCard = (card: GeneratedContent) => {
    const newCard = {
      ...card,
      category: card.category || (contentType === 'word' ? 'مفردات' : contentType === 'verb' ? 'أفعال' : 'تراكيب'),
      nextReview: new Date().toISOString(),
      streak: 0
    };
    const newCards = [newCard, ...savedCards];
    setSavedCards(newCards);
    saveToLocalStorage(newCards);
    updateStats(10); // 10 points for saving a card
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEntry.original || !manualEntry.translation) return;
    saveCard(manualEntry);
    setManualEntry({
      original: '',
      translation: '',
      example: '',
      exampleTranslation: ''
    });
    setActiveTab('saved');
  };

  const deleteCard = (index: number) => {
    const newCards = savedCards.filter((_, i) => i !== index);
    setSavedCards(newCards);
    saveToLocalStorage(newCards);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-800">Baz Academy</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-orange-500 font-black text-[10px]">
                <Flame size={10} />
                <span>{streak}</span>
              </div>
              <div className="flex items-center gap-0.5 text-yellow-600 font-black text-[10px]">
                <Star size={10} />
                <span>{points}</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar / Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={cn(
              "fixed top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-72 overflow-y-auto bg-white border-r border-slate-200 p-6 md:p-8 flex flex-col gap-6 md:gap-10 z-40 shadow-sm transition-all md:translate-x-0",
              !isSidebarOpen && "hidden md:flex"
            )}
          >
            <div className="hidden md:flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight text-slate-800">Baz Academy</h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-orange-500 font-black text-xs">
                    <Flame size={14} />
                    <span>{streak}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 font-black text-xs">
                    <Star size={14} />
                    <span>{points}</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-3">
              <NavButton 
                active={activeTab === 'generator'} 
                onClick={() => { setActiveTab('generator'); setIsSidebarOpen(false); }}
                icon={<Sparkles size={20} />}
                label="توليد مفردات"
              />
              <NavButton 
                active={activeTab === 'add'} 
                onClick={() => { setActiveTab('add'); setIsSidebarOpen(false); }}
                icon={<PlusCircle size={20} />}
                label="إضافة بطاقة يدوياً"
              />
              <NavButton 
                active={activeTab === 'saved'} 
                onClick={() => { setActiveTab('saved'); setIsSidebarOpen(false); }}
                icon={<History size={20} />}
                label="البطاقات المحفوظة"
                badge={savedCards.length > 0 ? savedCards.length : undefined}
              />
              <NavButton 
                active={activeTab === 'quiz'} 
                onClick={() => { setActiveTab('quiz'); setIsSidebarOpen(false); }}
                icon={<Brain size={20} />}
                label="اختبار البطاقات"
              />
              <NavButton 
                active={activeTab === 'achievements'} 
                onClick={() => { setActiveTab('achievements'); setIsSidebarOpen(false); }}
                icon={<Award size={20} />}
                label="الإنجازات"
              />
              <NavButton 
                active={activeTab === 'privacy'} 
                onClick={() => { setActiveTab('privacy'); setIsSidebarOpen(false); }}
                icon={<ShieldCheck size={20} />}
                label="سياسة الخصوصية"
              />
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-100">
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl border border-indigo-100/50">
                <p className="text-xs text-indigo-700 font-extrabold mb-2 arabic-text">نصيحة Baz Academy</p>
                <p className="text-[11px] text-slate-600 leading-relaxed arabic-text">
                  في اللغة الألمانية، تذكر دائماً حفظ الكلمة مع أداتها (der, die, das) لتسهيل تعلم القواعد لاحقاً.
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 pb-24 md:pb-12">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'generator' && (
              <motion.div
                key="generator"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 md:space-y-10"
              >
                <header className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight arabic-text">مولد المفردات الألمانية</h2>
                  <p className="text-slate-500 text-base md:text-lg arabic-text">اكتشف جمال اللغة الألمانية مع Baz Academy</p>
                </header>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm w-full sm:w-fit">
                  {(['word', 'verb', 'phrase'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setContentType(t)}
                      className={cn(
                        "flex-1 sm:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 arabic-text",
                        contentType === t 
                          ? "bg-slate-900 text-white shadow-lg" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {t === 'word' ? 'كلمة' : t === 'verb' ? 'فعل' : 'جملة'}
                    </button>
                  ))}
                  <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 md:px-10 py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs md:text-sm font-extrabold shadow-xl shadow-indigo-100 transition-all active:scale-95 arabic-text"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    توليد ذكي
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {generated ? (
                    <motion.div
                      key={generated.original}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-indigo-50/50 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl" />
                      
                      <div className="relative z-10 space-y-8 md:space-y-12">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                          <div className="space-y-2 md:space-y-3">
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                              {contentType}
                            </span>
                            <h3 className="text-4xl md:text-6xl font-black text-slate-900 german-text break-words">{generated.original}</h3>
                            <p className="text-xl md:text-3xl text-slate-400 font-bold arabic-text">{generated.translation}</p>
                          </div>
                          <button 
                            onClick={() => saveCard(generated)}
                            className="p-4 md:p-5 bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-xl hover:shadow-indigo-50 active:scale-90"
                            title="حفظ كبطاقة"
                          >
                            <Save size={24} className="md:w-8 md:h-8" />
                          </button>
                        </div>

                        <div className="pt-8 md:pt-12 border-t border-slate-100/80">
                          <div className="flex items-center gap-3 mb-4 md:mb-6 text-slate-400">
                            <BookOpen size={20} />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Beispielsatz</span>
                          </div>
                          <div className="space-y-3 md:space-y-4">
                            <p className="text-lg md:text-2xl text-slate-800 leading-relaxed font-medium german-text">"{generated.example}"</p>
                            <p className="text-base md:text-xl text-slate-500 arabic-text">{generated.exampleTranslation}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : !loading && (
                    <div className="h-64 md:h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] md:rounded-[2.5rem] text-slate-300 bg-white/50">
                      <Sparkles size={48} className="md:w-16 md:h-16 mb-4 md:mb-6 opacity-10" />
                      <p className="font-black text-lg md:text-xl arabic-text">جاهز لتعلم شيء جديد؟</p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'add' && (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 md:space-y-10"
              >
                <header className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight arabic-text">إضافة بطاقة يدوية</h2>
                  <p className="text-slate-500 text-base md:text-lg arabic-text">أضف كلماتك الخاصة أو دع الذكاء الاصطناعي يكملها لك</p>
                </header>

                <form onSubmit={handleManualSave} className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest arabic-text">الكلمة بالألمانية</label>
                      <div className="relative">
                        <input 
                          required
                          value={manualEntry.original}
                          onChange={e => setManualEntry({...manualEntry, original: e.target.value})}
                          placeholder="مثلاً: Der Apfel"
                          className="w-full p-4 md:p-5 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                        />
                        <button
                          type="button"
                          onClick={handleAIComplete}
                          disabled={loading || !manualEntry.original.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                          title="إكمال بالذكاء الاصطناعي"
                        >
                          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest arabic-text">الترجمة العربية</label>
                      <input 
                        required
                        value={manualEntry.translation}
                        onChange={e => setManualEntry({...manualEntry, translation: e.target.value})}
                        placeholder="مثلاً: التفاحة"
                        className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold arabic-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest arabic-text">مثال (اختياري)</label>
                    <input 
                      value={manualEntry.example}
                      onChange={e => setManualEntry({...manualEntry, example: e.target.value})}
                      placeholder="Ich esse einen Apfel"
                      className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest arabic-text">ترجمة المثال (اختياري)</label>
                    <input 
                      value={manualEntry.exampleTranslation}
                      onChange={e => setManualEntry({...manualEntry, exampleTranslation: e.target.value})}
                      placeholder="أنا آكل تفاحة"
                      className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold arabic-text"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base md:text-lg shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] arabic-text"
                  >
                    حفظ في المكتبة
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'saved' && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 md:space-y-10"
              >
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight arabic-text">مكتبة البطاقات</h2>
                    <p className="text-slate-500 text-base md:text-lg arabic-text">رصيدك المعرفي في Baz Academy</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                      {['all', 'مفردات', 'أفعال', 'تراكيب'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold arabic-text transition-all",
                            selectedCategory === cat ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {cat === 'all' ? 'الكل' : cat}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs md:text-sm font-black text-indigo-600 bg-indigo-50 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-indigo-100">
                      {savedCards.length} بطاقة
                    </div>
                  </div>
                </header>

                {savedCards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {savedCards
                      .filter(c => selectedCategory === 'all' || c.category === selectedCategory)
                      .map((card, i) => (
                      <Flashcard key={i} card={card} onDelete={() => deleteCard(i)} onSpeak={() => speak(card.original)} />
                    ))}
                  </div>
                ) : (
                  <div className="h-64 md:h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] md:rounded-[2.5rem] text-slate-300 bg-white/50">
                    <History size={48} className="md:w-16 md:h-16 mb-4 md:mb-6 opacity-10" />
                    <p className="font-black text-lg md:text-xl arabic-text">مكتبتك فارغة حالياً</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full"
              >
                <QuizSection cards={savedCards} onFinish={(s) => updateStats(50 + (s * 10))} />
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <header className="text-center space-y-4">
                  <div className="inline-flex p-4 bg-indigo-100 rounded-3xl text-indigo-600 mb-2">
                    <Trophy size={48} />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 arabic-text">لوحة الإنجازات</h2>
                  <p className="text-slate-500 arabic-text">تابع تقدمك واجمع الأوسمة في Baz Academy</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard icon={<Flame className="text-orange-500" />} label="أيام متتالية" value={streak} />
                  <StatCard icon={<Star className="text-yellow-500" />} label="إجمالي النقاط" value={points} />
                  <StatCard icon={<BookOpen className="text-indigo-500" />} label="بطاقات محفوظة" value={savedCards.length} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AchievementBadge 
                    unlocked={savedCards.length >= 1} 
                    icon={<PlusCircle />} 
                    title="البداية" 
                    desc="حفظ أول بطاقة" 
                  />
                  <AchievementBadge 
                    unlocked={savedCards.length >= 10} 
                    icon={<Award />} 
                    title="المجتهد" 
                    desc="حفظ 10 بطاقات" 
                  />
                  <AchievementBadge 
                    unlocked={streak >= 3} 
                    icon={<Flame />} 
                    title="المثابر" 
                    desc="3 أيام متتالية" 
                  />
                  <AchievementBadge 
                    unlocked={points >= 100} 
                    icon={<Star />} 
                    title="النجم الصاعد" 
                    desc="جمع 100 نقطة" 
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto glass-card rounded-[2.5rem] p-10 md:p-16 space-y-8"
              >
                <h2 className="text-3xl font-black text-slate-900 arabic-text">سياسة الخصوصية</h2>
                <div className="space-y-6 text-slate-600 leading-relaxed arabic-text">
                  <p>في Baz Academy، نحن نأخذ خصوصيتك على محمل الجد. إليك كيف نتعامل مع بياناتك:</p>
                  <section className="space-y-3">
                    <h3 className="text-xl font-bold text-slate-800">1. تخزين البيانات</h3>
                    <p>يتم تخزين جميع البطاقات المحفوظة، النقاط، والإنجازات محلياً على جهازك (LocalStorage). نحن لا نقوم برفع هذه البيانات إلى خوادمنا.</p>
                  </section>
                  <section className="space-y-3">
                    <h3 className="text-xl font-bold text-slate-800">2. استخدام الذكاء الاصطناعي</h3>
                    <p>عند استخدام ميزة التوليد التلقائي، يتم إرسال الكلمة فقط إلى خدمة Google Gemini لتوليد الترجمة والأمثلة. لا يتم إرسال أي بيانات شخصية.</p>
                  </section>
                  <section className="space-y-3">
                    <h3 className="text-xl font-bold text-slate-800">3. حقوق المستخدم</h3>
                    <p>يمكنك حذف جميع بياناتك في أي وقت عن طريق حذف البطاقات يدوياً أو مسح بيانات المتصفح الخاصة بالموقع.</p>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavButton 
          active={activeTab === 'generator'} 
          onClick={() => setActiveTab('generator')}
          icon={<Sparkles size={20} />}
          label="توليد"
        />
        <MobileNavButton 
          active={activeTab === 'add'} 
          onClick={() => setActiveTab('add')}
          icon={<PlusCircle size={20} />}
          label="إضافة"
        />
        <MobileNavButton 
          active={activeTab === 'saved'} 
          onClick={() => setActiveTab('saved')}
          icon={<History size={20} />}
          label="محفوظ"
        />
        <MobileNavButton 
          active={activeTab === 'quiz'} 
          onClick={() => setActiveTab('quiz')}
          icon={<Brain size={20} />}
          label="اختبار"
        />
        <MobileNavButton 
          active={activeTab === 'achievements'} 
          onClick={() => setActiveTab('achievements')}
          icon={<Award size={20} />}
          label="إنجازات"
        />
      </nav>
    </div>
  );
}

function QuizSection({ cards, onFinish }: { cards: GeneratedContent[]; onFinish: (score: number) => void }) {
  const [quizState, setQuizState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const startQuiz = () => {
    setQuizState('playing');
    setCurrentQuestion(0);
    setScore(0);
    generateQuestion(0);
  };

  const generateQuestion = (index: number) => {
    const correctAnswer = cards[index].translation;
    let otherOptions = cards
      .filter((_, i) => i !== index)
      .map(c => c.translation);
    
    // Shuffle and pick 3 wrong answers
    otherOptions = otherOptions.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // If not enough cards, add some generic ones
    while (otherOptions.length < 3) {
      const generic = ["نعم", "لا", "شكراً", "من فضلك", "مرحباً", "وداعاً"];
      const pick = generic[Math.floor(Math.random() * generic.length)];
      if (!otherOptions.includes(pick) && pick !== correctAnswer) {
        otherOptions.push(pick);
      }
    }

    const allOptions = [...otherOptions, correctAnswer].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correct = answer === cards[currentQuestion].translation;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (currentQuestion + 1 < cards.length) {
        setCurrentQuestion(prev => prev + 1);
        generateQuestion(currentQuestion + 1);
      } else {
        setQuizState('finished');
        onFinish(score);
      }
    }, 1500);
  };

  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 arabic-text">لا توجد بطاقات للاختبار</h2>
        <p className="text-slate-500 arabic-text">قم بحفظ بعض الكلمات أولاً لتبدأ الاختبار!</p>
      </div>
    );
  }

  if (quizState === 'start') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mb-8 shadow-xl shadow-indigo-100">
          <Brain size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 arabic-text">اختبر معلوماتك</h2>
        <p className="text-slate-500 mb-8 max-w-md arabic-text">
          سنقوم باختبارك في {cards.length} بطاقة محفوظة. هل أنت مستعد؟
        </p>
        <button 
          onClick={startQuiz}
          className="btn-primary px-10 py-4 rounded-2xl font-black text-lg arabic-text"
        >
          ابدأ الاختبار الآن
        </button>
      </div>
    );
  }

  if (quizState === 'finished') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center text-green-600 mb-8 shadow-xl shadow-green-100">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 arabic-text">أحسنت!</h2>
        <p className="text-slate-500 mb-6 arabic-text">لقد أنهيت الاختبار بنجاح</p>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8 min-w-[240px]">
          <p className="text-slate-400 font-bold mb-1 arabic-text">نتيجتك</p>
          <p className="text-6xl font-black text-indigo-600">{score} / {cards.length}</p>
        </div>
        <button 
          onClick={startQuiz}
          className="btn-primary px-10 py-4 rounded-2xl font-black text-lg arabic-text"
        >
          إعادة الاختبار
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Progress</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-black text-slate-400">{currentQuestion + 1} / {cards.length}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Score</span>
          <p className="text-xl font-black text-slate-800">{score}</p>
        </div>
      </div>

      <motion.div 
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card rounded-[2.5rem] p-10 md:p-16 text-center mb-10"
      >
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">ما معنى هذه الكلمة؟</span>
        <h3 className="text-4xl md:text-6xl font-black text-slate-900 german-text mb-4">{cards[currentQuestion].original}</h3>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option)}
            disabled={!!selectedAnswer}
            className={cn(
              "p-6 rounded-2xl font-bold text-lg transition-all border-2 text-right arabic-text",
              !selectedAnswer && "bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-700",
              selectedAnswer === option && isCorrect && "bg-green-50 border-green-500 text-green-700",
              selectedAnswer === option && !isCorrect && "bg-red-50 border-red-500 text-red-700",
              selectedAnswer && option === cards[currentQuestion].translation && !isCorrect && "bg-green-50 border-green-500 text-green-700"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 min-w-[64px]",
        active ? "text-indigo-600" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all",
        active ? "bg-indigo-50" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold arabic-text">{label}</span>
    </button>
  );
}

function Flashcard({ card, onDelete, onSpeak }: { card: GeneratedContent; onDelete: () => void; onSpeak: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="perspective-1000 h-[300px] w-full cursor-pointer" 
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden glass-card rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-center">
            <div className="absolute top-4 md:top-6 left-4 md:left-6 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onSpeak(); }}
                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all"
              >
                <Volume2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              </button>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Deutsch</span>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 german-text break-words">{card.original}</h3>
              {card.category && (
                <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg arabic-text">
                  {card.category}
                </span>
              )}
            </div>
            <div className="absolute bottom-6 text-slate-300 text-[10px] font-bold uppercase tracking-widest arabic-text">انقر للقلب</div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden glass-card rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-center space-y-6"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="text-center">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">العربية</span>
            <p className="text-2xl md:text-3xl text-slate-700 font-bold arabic-text">{card.translation}</p>
          </div>
          
          {card.example && (
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <BookOpen size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Beispiel</span>
              </div>
              <p className="text-sm md:text-base text-slate-600 italic german-text">"{card.example}"</p>
              <p className="text-[11px] md:text-xs text-slate-400 arabic-text mt-1">{card.exampleTranslation}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="glass-card rounded-3xl p-6 flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest arabic-text">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function AchievementBadge({ unlocked, icon, title, desc }: { unlocked: boolean; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className={cn(
      "glass-card rounded-3xl p-6 flex flex-col items-center text-center gap-4 transition-all duration-500",
      unlocked ? "opacity-100 scale-100" : "opacity-40 grayscale scale-95"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg",
        unlocked ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white" : "bg-slate-100 text-slate-400"
      )}>
        {icon}
      </div>
      <div>
        <h4 className="font-black text-slate-900 arabic-text">{title}</h4>
        <p className="text-[10px] text-slate-500 arabic-text">{desc}</p>
      </div>
      {!unlocked && (
        <div className="mt-2 px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Locked
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-[1.5rem] transition-all duration-300 group relative",
        active 
          ? "bg-slate-900 text-white shadow-2xl shadow-slate-200" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn("transition-transform duration-300 group-hover:scale-110", active ? "text-white" : "text-slate-300 group-hover:text-slate-900")}>
        {icon}
      </span>
      <span className="text-sm font-black arabic-text">{label}</span>
      {badge !== undefined && !active && (
        <span className="ml-auto w-5 h-5 md:w-6 md:h-6 bg-slate-100 text-slate-600 rounded-lg md:rounded-xl flex items-center justify-center text-[9px] md:text-[10px] font-black">
          {badge}
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="active-nav-pill"
          className="absolute left-0 w-1 md:w-1.5 h-6 md:h-8 bg-indigo-500 rounded-full ml-1"
        />
      )}
    </button>
  );
}
