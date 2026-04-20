/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Menu, 
  Share2, 
  Trash2, 
  X, 
  Check,
  Columns,
  ChevronsUpDown,
  ChevronsDownUp,
  ChevronUp, 
  ChevronLeft,
  AlertCircle,
  ArrowUp,
  Plus,
  Info,
  ChevronRight,
  Hospital,
  Stethoscope,
  ShieldPlus
} from 'lucide-react';
import { QUOTE_PRODUCTS as INITIAL_QUOTES, TYPE_GROUPS as INITIAL_TYPES } from './constants';
import { QuoteProduct, TypeGroup, Product } from './types';

// --- Components ---

function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      exit={{ y: 20, opacity: 0, x: '-50%' }}
      className="fixed bottom-24 left-1/2 z-[200] bg-black/80 text-white px-5 py-2.5 rounded shadow-lg text-sm flex items-center gap-2 whitespace-nowrap"
    >
      <Info className="w-4 h-4 text-white" />
      {message}
    </motion.div>
  );
}

function Navbar({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <nav className="sticky top-0 z-50 relative h-14 flex items-center justify-between px-4 border-b border-line bg-white">
        <Menu className="w-6 h-6 text-zinc-700 cursor-pointer" />
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <div className="w-5 h-5 border border-line rounded-full" />
          <span className="text-sm font-bold text-ink">LOGO</span>
        </div>

        {/* Right side placeholder to maintain center balance */}
        <div className="w-6" />
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-5 px-7 py-3.5 border-b border-line bg-white">
      <div className="flex items-center gap-2 font-bold text-sm whitespace-nowrap">
        <div className="w-5 h-5 border border-line rounded-full" />
        LOGO
      </div>
      <div className="flex gap-4.5 ml-5 flex-1 overflow-x-auto no-scrollbar">
        {['探索保險需求', '看商品', '去投保', '找服務', '健康吧', '查投資'].map((item) => (
          <span key={item} className="text-sm flex items-center gap-1 text-ink-muted whitespace-nowrap cursor-pointer hover:text-ink">
            {item} <ChevronDown className="w-3 h-3 opacity-50" />
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border border-line" />
        <div className="w-4 h-4 border border-line rounded-full" />
        <span className="text-sm cursor-pointer hover:underline">登入 <span className="text-[10px]">▾</span></span>
      </div>
    </nav>
  );
}

export default function App() {
  const [topTab, setTopTab] = useState<'quotes' | 'products'>('quotes');
  const [activeTypeIdx, setActiveTypeIdx] = useState(0);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string, kind: 'quote' | 'product', name: string } | null>(null);
  const [quotes, setQuotes] = useState<QuoteProduct[]>(INITIAL_QUOTES);
  const [types, setTypes] = useState<TypeGroup[]>(INITIAL_TYPES);
  const [showComparison, setShowComparison] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);
  const [isBBExpanded, setIsBBExpanded] = useState(false);
  const [showBTT, setShowBTT] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleScroll = () => {
      setShowBTT(window.scrollY > 300);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const activeGroup = useMemo(() => types[activeTypeIdx], [types, activeTypeIdx]);

  const compareType = useMemo(() => {
    if (compareSet.size === 0) return null;
    const firstId = Array.from(compareSet)[0];
    for (const group of types) {
      if (group.products.some(p => p.id === firstId)) return group.type;
    }
    return null;
  }, [compareSet, types]);

  const handleCompare = (id: string, typeName: string) => {
    if (compareType && compareType !== typeName) {
      setToast('比較功能限同一險種，請先清空比較清單');
      return;
    }
    setCompareSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          setToast('最多同時比較 3 件商品');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const confirmDelete = () => {
    if (!showDeleteModal) return;
    const { id, kind } = showDeleteModal;
    if (kind === 'quote') {
      setQuotes(prev => prev.filter(q => q.id !== id));
    } else {
      setTypes(prev => prev.map(g => ({
        ...g,
        products: g.products.filter(p => p.id !== id)
      })));
      setCompareSet(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    setShowDeleteModal(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-panel">
      <Navbar isMobile={isMobile} />
      
      <main className="flex-1 flex flex-col w-full max-w-[1100px] mx-auto bg-white min-h-screen shadow-sm">
        <Content 
          topTab={topTab}
          setTopTab={setTopTab}
          activeTypeIdx={activeTypeIdx}
          setActiveTypeIdx={setActiveTypeIdx}
          quotes={quotes}
          types={types}
          compareSet={compareSet}
          handleCompare={handleCompare}
          setShowDeleteModal={setShowDeleteModal}
          onShowDrawer={() => setIsBBExpanded(true)}
          isMobile={isMobile}
          compareType={compareType}
          setShowComparison={setShowComparison}
          setCompareSet={setCompareSet}
          isBBExpanded={isBBExpanded}
          setIsBBExpanded={setIsBBExpanded}
          isShareOpen={isShareOpen}
          setIsShareOpen={setIsShareOpen}
        />
      </main>

      {/* Global Modals & Widgets */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && !compareSet.size && (
          <motion.button 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 h-14 bg-ink text-white font-bold flex items-center justify-center gap-2 z-40"
          >
            <div className="w-4 h-4 rounded-full border border-white" />
            選擇諮詢方式
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobile && showBTT && (
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-6 w-10 h-10 bg-white border border-line rounded-full flex items-center justify-center shadow-lg z-50"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-1 border-line p-7 w-full max-w-[400px] brutal-shadow"
            >
              <h3 className="text-xl font-bold mb-2">
                {showDeleteModal.kind === 'quote' ? '刪除此試算結果？' : '取消保存此商品？'}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                {showDeleteModal.name}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={confirmDelete}
                  className="px-5 py-2 bg-ink text-white border border-line rounded-sm text-sm font-bold hover:bg-black/90"
                >
                  是，請{showDeleteModal.kind === 'quote' ? '刪除' : '取消'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(null)}
                  className="px-5 py-2 border border-line rounded-sm text-sm font-medium hover:bg-gray-50"
                >
                  先不要
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComparison && (
          <ComparisonModal 
            compareSet={compareSet}
            types={types}
            diffOnly={diffOnly}
            setDiffOnly={setDiffOnly}
            onClose={() => setShowComparison(false)}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* Desktop Float Action */}
      {!isMobile && (
        <div 
          className="fixed right-7 flex flex-col items-end gap-4 z-40 transition-all duration-300"
          style={{ bottom: (topTab === 'products' && compareSet.size > 0) ? '100px' : '28px' }}
        >
           <AnimatePresence>
             {showBTT && (
                <motion.button 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-10 h-10 bg-white border border-line rounded-full flex items-center justify-center brutal-shadow hover:bg-gray-50 transition-colors"
                >
                  <ArrowUp className="w-5 h-5" />
                </motion.button>
             )}
           </AnimatePresence>
           
           {(topTab === 'quotes' || compareSet.size === 0) && (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="flex border border-line bg-white brutal-shadow"
             >
               <div className="p-3 px-4 text-[12px] leading-tight border-r border-line-soft">
                 <strong className="block text-sm">心動嗎？</strong>
                 <span className="text-ink-muted">立即聯絡業務員</span>
               </div>
               <button className="p-3 px-5 text-sm font-bold flex items-center gap-1.5 hover:bg-gray-50">
                 <div className="w-4 h-4 rounded-full border border-line" />
                 選擇諮詢方式
               </button>
             </motion.div>
           )}
        </div>
      )}
    </div>
  );
}

// --- Sub-Components ---

function Content({ 
  topTab, setTopTab, activeTypeIdx, setActiveTypeIdx, quotes, types, 
  compareSet, handleCompare, setShowDeleteModal, onShowDrawer, isMobile, compareType,
  setShowComparison, setCompareSet,
  isBBExpanded, setIsBBExpanded,
  isShareOpen, setIsShareOpen
}: any) {
  const activeGroup = types[activeTypeIdx];
  const validGroups = types.filter((g: any) => g.products.length > 0);

  return (
    <div className="flex flex-col flex-1">
      {/* Breadcrumbs */}
      <div className={`${isMobile ? 'px-4 py-2 text-[12px]' : 'px-7 py-2.5 text-xs'} text-ink-muted border-b border-line-soft`}>
        首頁 &gt; 我的保存
      </div>

      {/* Page Title */}
      <div className={`${isMobile ? 'px-4 py-3.5' : 'px-7 py-4.5'} flex items-center justify-between bg-panel border-b border-line-soft`}>
        <h1 className={`${isMobile ? 'text-[22px]' : 'text-[28px]'} font-bold leading-tight`}>我的保存</h1>
        <button 
          onClick={() => setIsShareOpen(true)}
          className="share-btn flex items-center gap-1.5 px-4 py-2 bg-white border border-line rounded-full text-sm font-medium hover:bg-gray-50 flex-shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" /> 分享結果
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex px-7 bg-white border-b-2 border-line-soft ${isMobile ? 'px-4' : 'px-7'}`}>
        <button 
          onClick={() => setTopTab('quotes')}
          className={`relative py-3.5 mr-8 text-sm font-semibold transition-colors ${topTab === 'quotes' ? 'text-ink' : 'text-ink-muted'}`}
        >
          試算結果
          {topTab === 'quotes' && <motion.div layoutId="tab-underline" className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-ink" />}
        </button>
        <button 
          onClick={() => setTopTab('products')}
          className={`relative py-3.5 mr-8 text-sm font-semibold transition-colors ${topTab === 'products' ? 'text-ink' : 'text-ink-muted'}`}
        >
          商品
          {topTab === 'products' && <motion.div layoutId="tab-underline" className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-ink" />}
        </button>
      </div>

      {/* Main Area */}
      <div className={`flex-1 bg-panel ${isMobile ? 'p-4 pb-32' : 'p-7 pb-40'}`}>
        {topTab === 'quotes' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {quotes.length > 0 ? (
              <>
                <div className="bg-[#eaeaea] border border-line-soft p-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6 text-sm">
                  <div>還能保存 <span className="inline-block border border-line px-1.5 font-bold mx-1">1</span> 個試算結果</div>
                  <button className="px-4 py-1.5 bg-white border border-line rounded-full text-xs font-medium hover:bg-gray-50">
                    登入開啟無限保存
                  </button>
                </div>
                <div className="flex border-b border-line-soft mb-5 overflow-x-auto no-scrollbar gap-6">
                  <button 
                    className="py-2 whitespace-nowrap text-sm font-bold text-ink"
                  >
                    險種商品
                  </button>
                </div>
                <div className="space-y-3">
                  {quotes.map((p: QuoteProduct) => (
                    <QuoteCard 
                      key={p.id} 
                      product={p} 
                      onDelete={() => setShowDeleteModal({ id: p.id, kind: 'quote', name: p.name })}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <div className="mt-7 px-4 text-center">
                   <h3 className="text-sm font-bold mb-2.5">注意事項</h3>
                   <ul className="text-[12px] text-ink-muted leading-relaxed list-disc text-left inline-block">
                     <li>此為試算結果，僅供參考。如需投保仍須考量您的年齡、體況與保險核算狀況，實際條件以保單契約為準。</li>
                     <li>僅提供主要保障項目與首年度給付訊息，詳細保障內容請參閱保單條款，或進行完整試算。</li>
                     <li>表列保障內容係標準體續繳正常繳費下之保障內容。若為弱體、展期、繳清、部分代墊等情況，所列保障內容不適用。</li>
                   </ul>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-ink-muted italic">尚無試算結果</div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {validGroups.length > 0 ? (
              <>
                <div className="flex border-b border-line-soft mb-5 overflow-x-auto no-scrollbar gap-6">
                   {validGroups.map((g: any, idx: number) => {
                     const realIdx = types.indexOf(g);
                     const showUnderline = validGroups.length > 1 && activeTypeIdx === realIdx;
                     return (
                       <button 
                         key={g.type}
                         onClick={() => setActiveTypeIdx(realIdx)}
                         className={`py-2 whitespace-nowrap text-sm transition-colors ${showUnderline ? 'border-b-2 border-line text-ink font-bold' : (activeTypeIdx === realIdx ? 'text-ink font-bold' : 'text-ink-muted font-medium')}`}
                       >
                         {g.type}
                       </button>
                     );
                   })}
                </div>
                <div className="space-y-3">
                  {activeGroup.products.map((p: Product) => {
                    const isSelected = compareSet.has(p.id);
                    const disabled = compareType && compareType !== activeGroup.type;
                    return (
                      <ProductCard 
                        key={p.id} 
                        product={p} 
                        onDelete={() => setShowDeleteModal({ id: p.id, kind: 'product', name: p.name })}
                        isMobile={isMobile}
                        selectable
                        isSelected={isSelected}
                        onSelect={() => handleCompare(p.id, activeGroup.type)}
                        onClear={onShowDrawer}
                        disabled={disabled}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-ink-muted italic">尚無保存商品</div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Drawer */}
      {topTab === 'products' && compareSet.size > 0 && (
         <ComparisonDrawer 
           compareSet={compareSet}
           types={types}
           onClear={() => { setCompareSet(new Set()); setIsBBExpanded(false); }}
           onCompare={() => setShowComparison(true)}
           isMobile={isMobile}
           isExpanded={isBBExpanded}
           setIsExpanded={setIsBBExpanded}
           onRemove={(id: string) => setCompareSet((prev: any) => {
             const next = new Set(prev);
             next.delete(id);
             return next;
           })}
           compareType={compareType}
           onShare={() => setIsShareOpen(true)}
         />
      )}

      {/* Share Drawer */}
      <ShareDrawer 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        isMobile={isMobile}
        quotes={quotes}
        types={types}
      />
    </div>
  );
}

function QuoteCard({ product, onDelete, isMobile }: any) {
  return (
    <div className={`bg-white rounded-[20px] p-5 sm:p-7 shadow-sm border border-zinc-100/50 relative ${isMobile ? 'mx-0' : ''}`}>
      {/* Top Row: Tag & Delete */}
      <div className="flex items-center justify-between mb-2">
        <div className={`px-3 py-1 rounded-[8px] text-[12px] font-bold ${product.tag === '組合商品' ? 'bg-[#fff4e5] text-[#f59e0b]' : 'bg-[#fff4e5] text-[#f59e0b]'}`}>
          {product.tag || '單一商品'}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-1.5 text-[14px] text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>刪除</span>
        </button>
      </div>

      {/* Title & Chevron */}
      <div className="mb-2">
        <h3 className="text-[18px] sm:text-[20px] font-bold text-zinc-800 flex items-center gap-2 group cursor-pointer inline-flex">
          {product.name}
          <ChevronRight className="w-5 h-5 text-zinc-400/80 group-hover:translate-x-0.5 transition-transform" />
        </h3>
      </div>

      {/* Meta Info Row */}
      <div className="mb-4 text-[14px] sm:text-[15px] text-zinc-500 font-normal">
        {product.meta}
      </div>

      {/* Main Stats */}
      <div className="mb-4">
        <span className="text-zinc-500 text-[14px] sm:text-[15px]">年繳總保費</span>
        <span className="text-zinc-900 font-bold ml-2 text-[16px] sm:text-[18px]">
          {Number(product.premium.replace(/,/g, '')).toLocaleString()}
        </span>
        <span className="text-zinc-900 ml-1 text-[14px] sm:text-[15px]">元</span>
      </div>

      {/* Sub Items or Details Footer */}
      {product.subItems && product.subItems.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-4">
          {product.subItems.map((item: any, idx: number) => (
            <div key={idx} className="flex flex-col gap-3">
              <span className="text-[#f97316] text-[13px] sm:text-[14px] font-bold">{item.label}</span>
              <span className="text-zinc-800 text-[16px] sm:text-[18px] font-normal leading-tight">{item.name}</span>
              <div className="flex flex-col gap-1.5">
                <div className="text-[14px] sm:text-[15px] text-zinc-500">
                  小計 {Number(item.subtotal.replace(/,/g, '')).toLocaleString()} 元
                </div>
                <div className="flex gap-6 mt-1 text-[14px] sm:text-[15px] text-zinc-800">
                  <span>繳費年期 {item.term}</span>
                  <span>保額/日額 {item.amount} {item.unit || '元'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex gap-8 text-[14px] sm:text-[15px] text-zinc-800">
          <span>繳費年期 {product.term}</span>
          <span>保額/日額 {product.daily} {product.unit || '元'}</span>
        </div>
      )}
    </div>
  );
}

function ProductCard({ 
  product, onDelete, isMobile, selectable, isSelected, onSelect, disabled, onClear 
}: any) {
  const BenefitIcon = ({ name, className }: { name: string, className?: string }) => {
    switch(name) {
      case 'Hospital': return <Hospital className={className} />;
      case 'Stethoscope': return <Stethoscope className={className} />;
      case 'ShieldPlus': return <ShieldPlus className={className} />;
      default: return null;
    }
  };

  return (
    <div className={`group bg-white border border-line-soft p-5 sm:p-7 transition-all ${isSelected ? 'border-2 border-line bg-[#f9f9f9]' : 'hover:border-line cursor-pointer shadow-sm hover:shadow-md'} rounded-lg relative`}>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
        {/* Left Column (Info) */}
        <div className="flex-1">
          {/* Tags & Delete Row (Mobile style, but fits left col on desktop) */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {product.tag && (
                <span className="bg-[#fff4e5] text-[#d97706] text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-bold mr-1">
                  {product.tag}
                </span>
              )}
              {product.tags?.map((t: string, i: number) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-line-soft text-[10px]">|</span>}
                  <span className="text-[#f97316] text-[10px] sm:text-[11px] font-medium opacity-80">{t}</span>
                </Fragment>
              ))}
            </div>
            {/* Delete button only shows here on mobile, or as part of the header on desktop */}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="sm:hidden flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" /> 刪除
            </button>
          </div>

          {/* Title */}
          <div className="mb-4 group/title max-w-[90%]">
            <h3 className={`font-bold leading-tight flex items-center gap-1 transition-colors group-hover/title:text-[#16a34a] ${isMobile ? 'text-[18px]' : 'text-[22px] text-zinc-900'}`}>
              {product.name}
              <ChevronRight className="w-5 h-5 text-[#16a34a]" />
            </h3>
          </div>

          {/* Description */}
          <p className="text-[14px] text-zinc-800 font-medium mb-6 leading-relaxed tracking-tight">
            {product.description || product.meta}
          </p>

          {/* Details Row (Grid layout for better space usage) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 mb-4 sm:mb-0">
            <div>
              <span className="text-zinc-500 text-[14px] block mb-1">承保年齡</span>
              <span className="text-zinc-800 font-medium text-[15px]">{product.ageRange || '0歲~54歲'}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[14px] block mb-1">繳費期間</span>
              <span className="text-zinc-800 font-bold text-[15px]">{product.term}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[14px] block mb-1">年繳總保費</span>
              <span className="text-zinc-800 font-bold text-[15px]">{product.premium} 元</span>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-zinc-500 text-[14px] block mb-3 font-normal">給付項目</span>
              <div className="flex flex-wrap gap-5">
                {(product.benefitIcons && product.benefitIcons.length > 0) ? product.benefitIcons.map((b: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-panel rounded-lg flex items-center justify-center">
                       <BenefitIcon name={b.icon} className="w-7 h-7 text-[#f97316] opacity-80" />
                    </div>
                    <span className="text-[12px] text-zinc-500 font-medium">{b.label}</span>
                  </div>
                )) : (
                   <div className="flex flex-col items-center gap-2">
                     <div className="w-14 h-14 bg-panel rounded-lg flex items-center justify-center">
                       <Hospital className="w-7 h-7 text-[#f97316] opacity-80" />
                     </div>
                     <span className="text-[12px] text-zinc-500 font-medium whitespace-nowrap">住院給付</span>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Pricing & Action) */}
        <div className="sm:w-[220px] flex flex-col justify-between items-start sm:items-end sm:border-l sm:border-line-soft/30 sm:pl-8">
          <div className="hidden sm:block">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1 text-[12px] text-ink-muted hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> 刪除此產品
            </button>
          </div>

          <div className="w-full mt-4 sm:mt-auto">
            {selectable && (
              <div className="flex flex-col items-center sm:items-end gap-2 w-full">
                <button 
                  disabled={disabled}
                  onClick={(e) => { e.stopPropagation(); onSelect(); }}
                  className={`w-full py-2 px-4 border rounded-[3px] text-[14px] font-bold transition-all sm:min-w-[130px] flex items-center justify-center gap-1.5 group/btn ${isSelected ? 'bg-white text-ink border-line hover:bg-zinc-50' : 'bg-ink text-white border-ink hover:opacity-90 active:translate-y-[1px]'} ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                >
                  {isSelected ? (
                    isMobile ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>已加入比較</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 group-hover/btn:hidden">
                          <Check className="w-4 h-4" />
                          <span>已加入比較</span>
                        </div>
                        <div className="hidden items-center gap-1.5 group-hover/btn:flex">
                          <X className="w-4 h-4" />
                          <span>移除比較</span>
                        </div>
                      </>
                    )
                  ) : (
                    '比較給付項目'
                  )}
                </button>
                
                {disabled && (
                  <div className="flex items-center text-[11px] text-[#d93025] mt-1 text-right">
                    <span className="whitespace-nowrap">比較功能限同一險種，請先</span>{isMobile ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onClear?.(); }}
                        className="font-bold underline decoration-dotted underline-offset-2 hover:text-[#b2221b] ml-0 whitespace-nowrap"
                      >
                        清空比較清單
                      </button>
                    ) : (
                      <span className="font-bold ml-0 whitespace-nowrap">清空比較清單</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonDrawer({ 
  compareSet, types, onClear, onCompare, isMobile, isExpanded, setIsExpanded, onRemove, compareType, onShare 
}: any) {
  const selectedProducts = Array.from(compareSet).map(id => {
    for (const g of types) {
      const p = g.products.find((x: any) => x.id === id);
      if (p) return p;
    }
    return null;
  }).filter(Boolean);

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[55]"
            />
          )}
        </AnimatePresence>
        
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-line shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[60] transition-all overflow-hidden flex flex-col">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 px-4 h-[68px] cursor-pointer"
        >
          <div className="flex-1 flex flex-col">
            <span className="text-[16px] font-bold leading-tight">{compareType}</span>
            <span className="text-[12px] text-ink-muted">已加入 {compareSet.size}/3</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="text-sm text-ink-muted underline underline-offset-2 active:text-ink px-1"
              >
                清空
              </button>
              {!isExpanded && (
                <button 
                  disabled={compareSet.size < 2}
                  onClick={(e) => { e.stopPropagation(); onCompare(); }}
                  className={`px-4 py-2 bg-ink text-white text-sm font-bold rounded-[3px] transition-opacity ${compareSet.size < 2 ? 'opacity-30' : 'active:scale-95'}`}
                >
                  比較
                </button>
              )}
            </div>
            <button className={`w-8 h-8 flex items-center justify-center border border-line-soft rounded-full transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
               <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="px-4"
            >
              <div className="py-2 space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                {selectedProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-line-soft last:border-0">
                    <span className="flex-1 text-sm line-clamp-1">{p.name}</span>
                    <button 
                      onClick={() => onRemove(p.id)}
                      className="w-6.5 h-6.5 border border-line-soft rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="py-4 flex items-center gap-3">
                <button 
                  disabled={compareSet.size < 2}
                  onClick={onCompare}
                  className={`flex-1 py-3 bg-ink text-white font-bold rounded-[3px] ${compareSet.size < 2 ? 'opacity-30' : ''}`}
                >
                  比較給付項目
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 min-h-[64px] h-auto bg-white border-t border-line shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 px-7 py-3 flex items-center gap-5 animate-in slide-in-from-bottom duration-300">
      <div className="flex flex-col min-w-[100px]">
        <span className="text-sm font-bold text-ink leading-tight">{compareType}</span>
        <span className="text-[11px] text-ink-muted">{compareSet.size}/3</span>
      </div>
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {selectedProducts.map((p: any) => (
          <div key={p.id} className="flex items-center gap-2 bg-[#fafafa] border border-line px-3 py-1.5 rounded-[3px]">
            <span className="text-xs">{p.name}</span>
            <button onClick={() => onRemove(p.id)} className="hover:text-red-500 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={onClear} className="text-sm text-ink-muted underline hover:text-ink whitespace-nowrap">清空</button>
      <button 
        disabled={compareSet.size < 2}
        onClick={onCompare}
        className={`px-5 py-2.5 bg-ink text-white font-bold rounded-[3px] whitespace-nowrap ${compareSet.size < 2 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/90'}`}
      >
        比較給付項目
      </button>
    </div>
  );
}

function ComparisonModal({ 
  compareSet, types, diffOnly, setDiffOnly, onClose, isMobile 
}: any) {
  const group = useMemo(() => {
    const firstId = Array.from(compareSet)[0];
    return types.find((g: any) => g.products.some((p: any) => p.id === firstId));
  }, [compareSet, types]);

  const columns = useMemo(() => {
    return Array.from(compareSet).map(id => group.products.find((p: any) => p.id === id));
  }, [compareSet, group]);

  const tableData = useMemo(() => {
    return group.benefits.map((bg: any) => {
      const items = bg.items.map((it: any) => {
        const vals = columns.map(p => {
          const idx = group.products.indexOf(p);
          return it.v[idx] || '—';
        });
        // Now that we only show 'v' vs '—', the difference logic should be:
        // is there a mix of products with benefit and without benefit?
        const isDiff = !vals.every(v => (v !== '—') === (vals[0] !== '—'));
        return { ...it, vals, isDiff };
      });
      return { ...bg, items };
    });
  }, [group, columns]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const [headerHeight, setHeaderHeight] = useState(64); // Default fallback
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!headerRef.current) return;
    const element = headerRef.current;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && element) {
        // Use offsetHeight to include padding/borders
        setHeaderHeight(element.offsetHeight);
      }
    });
    obs.observe(element);
    return () => obs.disconnect();
  }, [isMobile]);

  const tableDataCount = tableData.length;
  const isAllCollapsed = collapsedGroups.size === tableDataCount;
  
  const parseValue = (v: string): number => {
    if (v === '—' || !v) return -1;
    const clean = v.replace(/[, ]/g, '');
    const num = parseFloat(clean.match(/[\d.]+/)?.[0] || '0');
    if (clean.includes('萬')) return num * 10000;
    return num;
  };

  const toggleAllGroups = () => {
    if (isAllCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(tableData.map((bg: any) => bg.name)));
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    // Show only when scrolling up OR near top OR at the very bottom
    if (!isAtBottom && scrollTop > lastScrollY && scrollTop > 50) {
      setShowBottomBar(false);
    } else {
      setShowBottomBar(true);
    }
    setLastScrollY(scrollTop);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleGroup = (name: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className={`bg-white border-1 border-line flex flex-col ${isMobile ? 'w-full h-full' : 'w-full max-w-[1000px] max-h-[85vh]'} brutal-shadow relative overflow-hidden`}>
      {/* Modal Header: Now outside the scroll container to be fixed at top */}
      <header className="flex items-center justify-between p-3 px-4 border-b border-line bg-white z-[110]">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-base">比較給付項目</h2>
          
          {!isMobile && (
            <label className="flex items-center gap-2 cursor-pointer select-none transition-opacity hover:opacity-80 active:scale-95 ml-2">
              <div 
                  onClick={(e) => { e.stopPropagation(); setDiffOnly(!diffOnly); }}
                  className={`w-8 h-4.5 rounded-full border border-line relative transition-colors ${diffOnly ? 'bg-ink' : 'bg-white'}`}
              >
                <motion.div 
                  animate={{ left: diffOnly ? 14 : 2 }}
                  className={`absolute top-[1px] w-3 h-3 rounded-full border border-line-soft ${diffOnly ? 'bg-white' : 'bg-ink-muted'}`} 
                />
              </div>
              <span className="text-[14px] font-bold whitespace-nowrap text-ink">只看差異</span>
            </label>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div 
        ref={scrollContainerRef}
        onScroll={isMobile ? handleScroll : undefined}
        className={`flex-1 overflow-y-auto ${isMobile ? 'overflow-x-hidden' : 'overflow-x-auto'} bg-white no-scrollbar pb-40`}
      >
        <table className="w-full border-separate border-spacing-0 table-fixed">
          {isMobile ? (
            <colgroup>
              {columns.map((_, i) => (
                <col key={i} style={{ width: `${100 / columns.length}%` }} />
              ))}
            </colgroup>
          ) : (
            <colgroup>
              <col style={{ width: '180px' }} />
              {columns.map((_, i) => (
                <col key={i} style={{ width: '180px' }} />
              ))}
            </colgroup>
          )}

          {/* Table Head: Product Names (Sticky Level 1) */}
          <thead ref={headerRef} className="sticky top-0 z-[100]">
            <tr className="bg-white shadow-sm">
              {!isMobile && (
                <th className="w-[180px] bg-[#fafafa] border-r border-b border-line-soft p-3 text-left text-ink-muted text-[11px] font-bold align-middle">
                  給付項目
                </th>
              )}
              {columns.map((p) => (
                <th 
                  key={p.id} 
                  className={`bg-white border-b border-line-soft p-2 sm:p-4 text-left font-bold leading-tight text-ink ${isMobile ? 'border-r border-line-soft last:border-r-0 text-[16px] whitespace-normal' : 'w-[180px] text-[16px]'}`}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>

          {tableData.map((bg: any) => {
            const visibleItems = diffOnly ? bg.items.filter((it: any) => it.isDiff) : bg.items;
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedGroups.has(bg.name);

            return (
              <tbody key={bg.name}>
                {/* Level 2 Sticky: Category Heading */}
                <tr 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(bg.name)}
                >
                  <td 
                    colSpan={isMobile ? columns.length : columns.length + 1} 
                    className="bg-panel border-b border-line-soft p-0 shadow-sm sticky z-50"
                    style={{ top: `${headerHeight - 1}px` }}
                  >
                    <div className="flex items-center justify-between p-3 px-4 w-full h-12 bg-panel">
                      <span className="text-[17px] font-normal text-ink">{bg.name}</span>
                      <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }}>
                        <ChevronDown className="w-5 h-5 text-ink-muted" />
                      </motion.div>
                    </div>
                  </td>
                </tr>
                {!isCollapsed && visibleItems.map((it: any) => {
                  return (
                    <Fragment key={it.k}>
                      {isMobile ? (
                        <>
                          <tr className="bg-white">
                            <td colSpan={columns.length} className="border-b border-line-soft p-0">
                              <div className="w-full flex justify-start p-4 px-4 text-left">
                                <span className="text-[16px] font-normal text-ink opacity-70">{it.k}</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="bg-white">
                            {it.vals.map((v: string, i: number) => {
                              const hasBenefit = v !== '—';
                              return (
                                <td 
                                  key={i} 
                                  className="border-b border-line-soft p-3 align-middle text-center text-[16px] leading-snug"
                                >
                                  <div className="flex justify-center w-full">
                                    {hasBenefit ? (
                                      <Check className="w-6 h-6 text-ink" />
                                    ) : (
                                      <span className="text-zinc-300">—</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td className="sticky left-0 z-10 bg-[#fafafa] border-r border-line-soft border-b border-line-soft p-3 px-4 font-normal text-[16px] leading-snug w-[180px] min-w-[180px]">
                            {it.k}
                          </td>
                          {it.vals.map((v: string, i: number) => {
                            const hasBenefit = v !== '—';
                            return (
                              <td 
                                key={i} 
                                className="bg-white border-b border-line-soft p-3 px-4 text-center w-[180px] min-w-[180px]"
                              >
                                <div className="flex justify-center w-full">
                                  {hasBenefit ? (
                                    <Check className="w-6 h-6 text-black" />
                                  ) : (
                                    <span className="text-zinc-300 text-[16px]">—</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>

      {/* Mobile Floating Bottom Controls */}
      {isMobile && (
        <>
          {/* Back to Top - Floating above navigation */}
          <AnimatePresence>
            {showBottomBar && lastScrollY > 250 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                onClick={scrollToTop}
                className="fixed bottom-[110px] right-6 z-[80] w-12 h-12 bg-white border border-zinc-100 shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <ChevronUp className="w-6 h-6 text-zinc-900" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Bottom Tool Island & Back Button */}
          <AnimatePresence>
            {showBottomBar && (
              <motion.div 
                layout
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-0 right-0 z-[70] flex items-center justify-center gap-3 px-6 pointer-events-none"
              >
                {/* Main Tool Island */}
                <motion.div 
                  layout
                  className="flex items-center px-5 h-14 bg-white/95 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.15)] rounded-full border border-zinc-100 pointer-events-auto"
                >
                  {/* Left: Expand/Collapse All */}
                  <button 
                    onClick={toggleAllGroups}
                    className="flex items-center gap-2 h-full active:opacity-60 transition-opacity"
                  >
                    <div className="text-zinc-900">
                      {isAllCollapsed ? (
                        <ChevronsUpDown className="w-5 h-5" />
                      ) : (
                        <ChevronsDownUp className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[14px] font-bold text-zinc-900 whitespace-nowrap">
                      {isAllCollapsed ? '全部展開' : '全部收合'}
                    </span>
                  </button>

                  {/* Vertical Divider */}
                  <div className="w-px h-6 bg-zinc-200 mx-4" />

                  {/* Right: Toggle Switch for Diff Only */}
                  <div 
                    onClick={() => setDiffOnly(!diffOnly)}
                    className="flex items-center gap-3 h-full cursor-pointer active:opacity-80 transition-opacity"
                  >
                    <span className="text-[14px] font-bold text-zinc-900 whitespace-nowrap">只看差異</span>
                    <div className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${diffOnly ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                      <motion.div 
                        layout
                        initial={false}
                        animate={{ x: diffOnly ? 18 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-start justify-center no-scrollbar ${isMobile ? 'bg-white overscroll-none' : 'p-4 bg-black/45 backdrop-blur-sm pt-8 sm:pt-16 overflow-auto'}`} 
      onClick={(e) => !isMobile && e.target === e.currentTarget && onClose()}
    >
      {modalContent}
    </div>
  );
}

function ShareDrawer({ 
  isOpen, onClose, isMobile, quotes, types 
}: { 
  isOpen: boolean, onClose: () => void, isMobile: boolean, quotes: any[], types: any[]
}) {
  const [activeTab, setActiveTab] = useState<'calc' | 'prod'>('calc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Function to find type for a product name or id
  const findProductType = (name: string) => {
    for (const group of types) {
      if (group.products.some((p: any) => p.name === name)) return group.type;
    }
    return '健康醫療險'; // Default for the wireframe
  };

  // Group quotes by type
  const calcGroups = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    quotes.forEach(q => {
      const type = findProductType(q.name);
      if (!groups[type]) groups[type] = [];
      groups[type].push({
        id: q.id,
        name: q.name,
        tag: q.tag || '組合商品',
        meta: q.meta,
        premium: q.premium
      });
    });
    return Object.entries(groups).map(([category, items]) => ({ category, items }));
  }, [quotes, types]);

  // Group products by type (already grouped in types prop)
  const prodGroups = useMemo(() => {
    return types.filter(g => g.products.length > 0).map(g => ({
      category: g.type,
      items: g.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        tag: '單一商品',
        meta: p.meta,
        premium: p.premium
      }))
    }));
  }, [types]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const currentGroups = activeTab === 'calc' ? calcGroups : prodGroups;

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
          />
          <motion.div 
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={{ y: 0, x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={isMobile ? { type: 'spring', damping: 30, stiffness: 300 } : { type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bg-white z-[110] shadow-2xl flex flex-col ${
              isMobile 
                ? 'inset-x-0 bottom-0 h-[92vh] rounded-t-[32px]' 
                : 'top-0 right-0 h-full w-[450px]'
            }`}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-zinc-200 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className={`p-6 pb-2 border-b border-line-soft ${isMobile ? 'pt-2' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[20px] font-bold text-ink">分享項目</h2>
                <button onClick={onClose} className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-[13px] text-zinc-500 mb-6 font-medium">請勾選至多 3 筆{activeTab === 'calc' ? '試算結果' : '收藏商品'}</p>
              
              {/* Tabs */}
              <div className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('calc')}
                  className={`pb-3 text-[15px] font-bold transition-all relative ${activeTab === 'calc' ? 'text-ink' : 'text-zinc-400'}`}
                >
                  試算結果
                  {activeTab === 'calc' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />}
                </button>
                <button 
                  onClick={() => setActiveTab('prod')}
                  className={`pb-3 text-[15px] font-bold transition-all relative ${activeTab === 'prod' ? 'text-ink' : 'text-zinc-400'}`}
                >
                  收藏商品
                  {activeTab === 'prod' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />}
                </button>
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
              {currentGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-6">
                  {/* Secondary Header: Simple border bottom style */}
                  <div className="pb-2 border-b border-zinc-100">
                    <span className="text-[15px] font-bold text-ink">{group.category}</span>
                  </div>
                  
                  <div className="space-y-6">
                    {group.items.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleToggle(item.id)}
                        className="flex items-start gap-4 cursor-pointer group"
                      >
                        {/* Checkbox */}
                        <div className={`mt-1.5 w-5 h-5 border-2 rounded-[3px] flex items-center justify-center transition-colors flex-shrink-0 ${selectedIds.includes(item.id) ? 'bg-ink border-ink' : 'border-zinc-300 group-hover:border-zinc-500'}`}>
                          {selectedIds.includes(item.id) && <Check className="w-4 h-4 text-white" />}
                        </div>
                        
                        {/* Card Content */}
                        <div className="flex-1 space-y-1.5">
                          <span className="inline-block px-2 py-0.5 border border-zinc-200 text-[10px] text-zinc-500 rounded font-bold uppercase tracking-tight">
                            {item.tag}
                          </span>
                          <h3 className="font-bold text-[16px] text-ink leading-snug">{item.name}</h3>
                          <p className="text-[12px] text-zinc-400 font-medium">{item.meta}</p>
                          <div className="pt-2 flex items-center justify-between border-t border-zinc-50 border-dashed">
                            <span className="text-[12px] text-zinc-400">年繳總保費</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[18px] font-bold text-ink">{item.premium}</span>
                              <span className="text-[12px] font-bold text-ink">元</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-100 flex flex-col gap-3">
              <button 
                disabled={selectedIds.length === 0}
                className={`w-full py-4 text-[16px] font-bold rounded-full transition-all ${selectedIds.length > 0 ? 'bg-ink text-white active:scale-[0.98]' : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}`}
              >
                確認分享{selectedIds.length > 0 && ` (${selectedIds.length})`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
