import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Dices, Maximize2, Minimize2, Minus, Mic, Volume2, ThumbsUp, ThumbsDown, Settings, Copy, Check, ChevronDown, X, Download, Activity, BrainCircuit, ScanSearch, ChevronRight, CheckCircle2, XCircle, UserCircle, Settings2, SlidersHorizontal, History, Shield, Bot, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

// ─── Dynamic API base URL (set via VITE_API_BASE_URL in .env) ───
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AuroraBackground = memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Static gradient blobs — no JS animation, pure CSS */}
    <div className="absolute top-1/4 left-[20%] w-[28rem] h-[28rem] bg-[#00D4FF]/15 rounded-full blur-[100px] opacity-20" />
    <div className="absolute bottom-1/4 right-[20%] w-[30rem] h-[30rem] bg-[#FF0080]/12 rounded-full blur-[100px] opacity-15" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-[#8B5CF6]/10 rounded-full blur-[120px] opacity-10" />
    {/* Dot-grid overlay */}
    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(0,212,255,0.08) 1px,transparent 1px)', backgroundSize: '48px 48px', opacity: 0.03 }} />
  </div>
));
AuroraBackground.displayName = 'AuroraBackground';

const LightBackground = memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(99,102,241,0.07) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
    <div className="absolute top-0 left-0 w-full h-64 opacity-40" style={{ background: 'linear-gradient(180deg,rgba(99,102,241,0.06) 0%,transparent 100%)' }} />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] bg-indigo-200/30" />
    <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full blur-[90px] bg-teal-200/25" />
  </div>
));
LightBackground.displayName = 'LightBackground';

// CSS-Accelerated Hardware-immune scanning laser
const ScannerPreviewBar = memo(({ theme }) => (
  <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl">
    <div
      className={`absolute w-full h-[2%] animate-scan-laser-3d`}
      style={{
        backgroundColor: theme === 'dark' ? '#00D4FF' : '#3B82F6',
        boxShadow: theme === 'dark' ? '0 0 15px #00D4FF, 0 0 30px #00D4FF' : '0 0 15px rgba(59,130,246,0.8), 0 0 30px rgba(59,130,246,0.6)'
      }}
    />
  </div>
));
ScannerPreviewBar.displayName = 'ScannerPreviewBar';

// Unified synchronous animated progress ring (text + SVG stroke) - Memoized for ultimate performance
const AnimatedProgressRing = memo(({ target, duration = 1400, delay = 300, color, r = 44, cx = 50, cy = 50 }) => {
  const circ = 2 * Math.PI * r;
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(circ); // Start empty

  useEffect(() => {
    let raf;
    const endDash = circ - (target / 100) * circ;

    const timeout = setTimeout(() => {
      // Native CSS Transition handles the ring line smoothly
      setOffset(endDash);

      // JS RAF loop handles the text numbers (cheap to run)
      const start = performance.now();
      const animate = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic curve for smooth finish, matches CSS easeOut
        const eased = 1 - Math.pow(1 - progress, 3);

        setCount((eased * target).toFixed(2));

        if (progress < 1) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay, r, circ]);

  return (
    <>
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          filter: `drop-shadow(0 0 8px ${color}88)`,
          transformOrigin: '50% 50%',
          transform: 'rotate(-90deg)',
          transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.215, 0.61, 0.355, 1)`
        }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="900" fontFamily="inherit">{count}%</text>
    </>
  );
});
AnimatedProgressRing.displayName = 'AnimatedProgressRing';

// ═══════════════════════════════════════════════════════════════
// CONFETTI CELEBRATION — Party animation on tour completion
// ═══════════════════════════════════════════════════════════════
const CONFETTI_COLORS = ['#00D4FF', '#8B5CF6', '#FF0080', '#FBBF24', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#F97316', '#06B6D4'];
const CONFETTI_PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: Math.random() * 0.8,
  duration: 2.5 + Math.random() * 2.5,
  size: 6 + Math.random() * 8,
  rotation: Math.random() * 720 - 360,
  drift: (Math.random() - 0.5) * 120,
  shape: i % 3, // 0=square, 1=circle, 2=rectangle
}));
const ConfettiCelebration = React.memo(({ active }) => {
  const particles = CONFETTI_PARTICLES;

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Confetti particles only — no text */}
      {/* Confetti particles */}
      {particles.map(p => (
        <div key={p.id} className="confetti-particle" style={{
          '--x': `${p.x}vw`, '--drift': `${p.drift}px`, '--rotation': `${p.rotation}deg`,
          left: `${p.x}%`, width: p.shape === 2 ? p.size * 0.5 : p.size, height: p.shape === 2 ? p.size * 1.5 : p.size,
          backgroundColor: p.color, borderRadius: p.shape === 1 ? '50%' : p.shape === 2 ? '2px' : '3px',
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }} />
      ))}
    </div>
  );
});
ConfettiCelebration.displayName = 'ConfettiCelebration';

// ═══════════════════════════════════════════════════════════════
// GUIDED TOUR — Interactive step-by-step onboarding system
// ═══════════════════════════════════════════════════════════════
const TOUR_STEPS = [
  { id: 'welcome', target: null, title: '👋 Welcome to CDSS', desc: 'This interactive guide will walk you through every feature of the AI-powered Chest X-Ray Diagnostic System. Let\'s get started!', position: 'center' },
  { id: 'image-gateway', target: '[data-tour="image-gateway"]', title: '🏥 Image Gateway', desc: 'This is your control panel. Upload X-rays, enter patient info, and configure which AI models to use — all from here.', position: 'right' },
  { id: 'random-validation', target: '[data-tour="random-validation"]', title: '🎲 Random Validation', desc: 'Click this button to instantly load a random chest X-ray from our database and run a full AI diagnosis. Perfect for testing!', position: 'right', actionRequired: true, actionLabel: '👆 Click "Deploy Random Validation" to continue' },
  { id: 'patient-data', target: '[data-tour="patient-data"]', title: '📋 Patient Metadata (Optional)', desc: 'Enter the patient\'s ID, age, and gender. This data is included in PDF reports and shared with the AI chatbot for context-aware responses. Completely optional.', position: 'right' },
  { id: 'model-config', target: '[data-tour="model-config"]', title: '⚙️ Ensemble Model Config', desc: 'Toggle individual AI models on/off. The system uses DenseNet-121, ConvNeXtV2-Base, and MaxViT-Base in a meta-learner ensemble for maximum accuracy.', position: 'right' },
  { id: 'upload-dropzone', target: '[data-tour="upload-dropzone"]', title: '📤 Upload Custom X-ray', desc: 'Drag & drop or click here to upload your own chest X-ray image in any valid format (up to 10MB). The system validates that it\'s a genuine radiograph.', position: 'right' },
  { id: 'execute-ai', target: '[data-tour="execute-ai"]', title: '🚀 Execute Diagnostic AI', desc: 'Once an image is loaded, click this button to start the full AI diagnostic pipeline. Three deep learning models will analyze the X-ray simultaneously.', position: 'right', actionRequired: true, actionLabel: '👆 Click "Execute Diagnostic AI" to start analysis' },
  { id: 'wait-for-results', target: '[data-tour="pipeline-status"]', title: '⏳ AI Processing Pipeline', desc: 'The AI is analysing the X-ray through multiple models. Watch the real-time progress — parsing, distributing, inference, and synthesis stages.', position: 'right', waitForStatus: 'success' },
  { id: 'diagnosis-result', target: '[data-tour="diagnosis-result"]', title: '🎯 AI Diagnosis Result', desc: 'The final diagnosis with a confidence score. The system classifies 3 conditions — Normal, Pneumonia, and Pleural Effusion — using an ensemble of 3 deep learning models.', position: 'left' },
  { id: 'xray-preview', target: '[data-tour="xray-preview"]', title: '🔬 X-Ray Scan Preview', desc: 'Interactive view of the uploaded radiograph with a scanning laser overlay. Hover to zoom in 2.5×. Click the expand icon for fullscreen.', position: 'left', allowInteraction: true },
  { id: 'gradcam', target: '[data-tour="gradcam-card"]', title: '🔥 GradCAM++ Attention Map', desc: 'This heatmap shows exactly WHERE the AI focused when making its diagnosis. Red/yellow = high attention, blue = low attention. Hover to zoom in 2.5×.', position: 'left', allowInteraction: true },
  { id: 'probability-bars', target: '[data-tour="probability-bars"]', title: '📊 Probability Distribution', desc: 'Confidence breakdown across all 3 classes: Normal, Pneumonia, and Pleural Effusion. The highest probability determines the diagnosis.', position: 'left' },
  { id: 'reports-panel', target: '[data-tour="reports-panel"]', title: '📝 AI-Generated Reports', desc: 'Generate detailed clinical narratives: a "Radiologist Report" for professionals and a "Patient Report" in plain language. Both can be downloaded as PDFs.', position: 'left' },
  { id: 'ai-assistant', target: '[data-tour="ai-assistant"]', title: '🤖 AI Assistant', desc: 'Chat with a context-aware AI about the diagnosis. It knows the results, heatmap, and patient data. Supports voice input and text-to-speech!', position: 'left' },
  { id: 'faq-section', target: '[data-tour="faq-section"]', title: '❓ FAQ & Disclaimer', desc: 'Scroll down to find answers to frequently asked questions about the system, supported image formats, and a medical disclaimer reminding that professional consultation is essential.', position: 'top' },
  { id: 'theme-toggle', target: '[data-tour="theme-toggle"]', title: '🎨 Theme Toggle', desc: 'Switch between Dark and Light modes. The entire UI adapts seamlessly.', position: 'bottom' },
  { id: 'complete', target: null, title: '🎉 Tour Complete!', desc: 'You\'re all set! Explore the system at your own pace. You can restart this tour anytime from the "Take a Tour?" button in the top bar.', position: 'center' },
];

const GuidedTour = memo(({ active, step, onNext, onPrev, onSkip, theme, status }) => {
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const currentStep = TOUR_STEPS[step] || TOUR_STEPS[0];

  // Keyboard navigation: Escape, Left, Right
  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
      if (e.key === 'ArrowRight' && !currentStep.actionRequired && !currentStep.waitForStatus && step < TOUR_STEPS.length - 1) { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft' && step > 0 && !currentStep.waitForStatus) { e.preventDefault(); onPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, step, currentStep, onNext, onPrev, onSkip]);

  // Recalculate spotlight & tooltip position — optimized for zero lag
  useEffect(() => {
    if (!active) return;
    queueMicrotask(() => setIsAnimating(true));
    const animTimer = setTimeout(() => setIsAnimating(false), 200);
    const calculate = () => {
      if (!currentStep.target) {
        setSpotlightRect(null);
        setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        return;
      }
      const el = document.querySelector(currentStep.target);
      if (!el) {
        setSpotlightRect(null);
        setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        return;
      }
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const pad = 12;
        setSpotlightRect({ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });

        const pos = currentStep.position;
        const isMobile = window.innerWidth < 640;
        const tooltipW = isMobile ? Math.min(380, window.innerWidth - 32) : 380;
        const maxTop = window.innerHeight - 400;
        let t = {}, arrowSide = '';

        if (isMobile) {
          // On mobile, always center horizontally and position below or above the target
          const centerLeft = Math.max(16, (window.innerWidth - tooltipW) / 2);
          if (rect.bottom + 20 < maxTop) {
            t = { top: rect.bottom + 20, left: centerLeft };
            arrowSide = 'top';
          } else {
            t = { top: Math.max(16, rect.top - 320), left: centerLeft };
            arrowSide = 'bottom';
          }
        } else if (pos === 'right') {
          t = { top: Math.max(16, Math.min(rect.top, maxTop)), left: Math.min(rect.right + 20, window.innerWidth - tooltipW - 16) };
          arrowSide = 'left';
        } else if (pos === 'left') {
          t = { top: Math.max(16, Math.min(rect.top, maxTop)), left: Math.max(16, rect.left - tooltipW - 20) };
          arrowSide = 'right';
          if (t.left < 16) { t = { top: Math.min(rect.bottom + 20, maxTop), left: Math.max(16, rect.left) }; arrowSide = 'top'; }
        } else if (pos === 'bottom') {
          t = { top: Math.min(rect.bottom + 20, maxTop), left: Math.max(16, Math.min(rect.left - 100, window.innerWidth - tooltipW - 16)) };
          arrowSide = 'top';
        } else if (pos === 'top') {
          t = { top: Math.max(16, rect.top - 380), left: Math.max(16, Math.min(rect.left, window.innerWidth - tooltipW - 16)) };
          arrowSide = 'bottom';
        }
        t._arrowSide = arrowSide;
        setTooltipPos(t);
      });
    };
    calculate();
    window.addEventListener('resize', calculate);
    return () => { window.removeEventListener('resize', calculate); clearTimeout(animTimer); };
  }, [active, step, currentStep]);

  // Auto-advance when waiting for status change
  useEffect(() => {
    if (!active || !currentStep.waitForStatus) return;
    if (status === currentStep.waitForStatus) {
      setTimeout(() => onNext(), 800);
    }
  }, [active, status, currentStep, onNext]);

  if (!active) return null;

  const isCenter = currentStep.position === 'center';
  const isActionStep = currentStep.actionRequired;
  const isWaitStep = !!currentStep.waitForStatus;
  const totalSteps = TOUR_STEPS.length;
  const arrowSide = tooltipPos._arrowSide || '';
  const progressPct = ((step + 1) / totalSteps) * 100;
  const isLastStep = step === totalSteps - 1;
  const isFirstStep = step === 0;

  const isInteractive = isActionStep || currentStep.allowInteraction;

  return (
    <>
      {/* Overlay — pointer-events:none on action/interactive steps so user can interact with target */}
      <div className="tour-overlay" onClick={isInteractive ? undefined : onSkip} style={isInteractive ? { pointerEvents: 'none' } : {}} />

      {/* Spotlight with smooth CSS transitions */}
      {spotlightRect && (
        <div className={`tour-spotlight ${isActionStep ? 'tour-action-required' : ''}`}
          style={{ top: spotlightRect.top, left: spotlightRect.left, width: spotlightRect.width, height: spotlightRect.height }} />
      )}

      {/* Tooltip */}
      <div key={step} className={`tour-tooltip ${isAnimating ? 'tour-tooltip-entering' : ''}`}
        data-mobile-tour
        style={isCenter
          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          : { top: tooltipPos.top, left: tooltipPos.left }
        }
      >
        <div className={`relative w-[min(380px,calc(100vw-32px))] ${theme === 'dark' ? 'bg-[#0d1520]/95 backdrop-blur-xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)]' : 'bg-white/95 backdrop-blur-xl border border-gray-200 shadow-[0_25px_60px_rgba(0,0,0,0.15)]'} rounded-2xl overflow-hidden`}>

          {/* Animated gradient top strip */}
          <div className="tour-gradient-strip" />

          {/* Header */}
          <div className={`px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 ${theme === 'dark' ? 'bg-gradient-to-r from-[#00D4FF]/5 via-transparent to-[#8B5CF6]/5' : 'bg-gradient-to-r from-blue-50/80 via-transparent to-violet-50/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-black ${theme === 'dark' ? 'bg-[#00D4FF]/15 text-[#00D4FF] ring-1 ring-[#00D4FF]/20' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'}`}>
                  {step + 1}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                  of {totalSteps}
                </span>
              </div>
              <button onClick={onSkip} className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${theme === 'dark' ? 'text-white/30 hover:text-white hover:bg-white/10' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`}>
                ✕
              </button>
            </div>
            <h3 className={`text-[16px] sm:text-[19px] font-extrabold tracking-tight leading-snug ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentStep.title}
            </h3>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <p className={`text-[13px] sm:text-[14px] leading-[1.6] sm:leading-[1.8] ${theme === 'dark' ? 'text-white/65' : 'text-gray-600'}`}>
              {currentStep.desc}
            </p>
            {isActionStep && (
              <div className={`mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-bold tour-action-badge ${theme === 'dark' ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                <span className="text-base animate-bounce-arrow">👆</span>
                <span>{currentStep.actionLabel}</span>
              </div>
            )}
            {isWaitStep && status !== currentStep.waitForStatus && (
              <div className={`mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Waiting for AI to finish processing...</span>
              </div>
            )}
          </div>

          {/* Footer — Progress bar + Buttons */}
          <div className={`px-4 sm:px-6 pb-4 sm:pb-5 pt-2 sm:pt-3 ${theme === 'dark' ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
            {/* Progress bar */}
            <div className={`w-full h-1 rounded-full overflow-hidden mb-4 ${theme === 'dark' ? 'bg-white/8' : 'bg-gray-100'}`}>
              <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #00D4FF, #8B5CF6, #FF0080)' }} />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-white/25' : 'text-gray-300'}`}>
                {step > 0 ? '← / →  navigate' : 'Esc to close'}
              </span>
              <div className="flex gap-2">
                {step > 0 && !isWaitStep && (
                  <button onClick={onPrev} className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 ${theme === 'dark' ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}>
                    ← Back
                  </button>
                )}
                {!isActionStep && !isWaitStep && step < totalSteps - 1 && (
                  <button onClick={onNext} className="tour-next-btn px-5 py-2 text-[11px] font-bold rounded-xl text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)' }}>
                    {isFirstStep ? 'Start Tour →' : 'Next →'}
                  </button>
                )}
                {isLastStep && (
                  <button onClick={onSkip} className="px-6 py-2 text-[11px] font-bold rounded-xl text-white cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4FF, #8B5CF6, #FF0080)' }}>
                    🎉 Finish Tour
                  </button>
                )}
                {isActionStep && (
                  <button onClick={onSkip} className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all duration-200 cursor-pointer hover:scale-105 ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:text-gray-700'}`}>
                    Skip Tour
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Arrow pointer */}
        {!isCenter && arrowSide && (
          <div className="tour-tooltip-arrow"
            style={{
              ...(theme === 'dark' ? { background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)' } : { background: 'white', border: '1px solid #e5e7eb' }),
              ...(arrowSide === 'left' ? { left: -8, top: 40, borderRight: 'none', borderTop: 'none' } :
                arrowSide === 'right' ? { right: -8, top: 40, borderLeft: 'none', borderBottom: 'none' } :
                  arrowSide === 'top' ? { top: -8, left: 40, borderBottom: 'none', borderRight: 'none' } :
                    { bottom: -8, left: 40, borderTop: 'none', borderLeft: 'none' })
            }}
          />
        )}
      </div>
    </>
  );
});
GuidedTour.displayName = 'GuidedTour';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [, setIsRandom] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [filename, setFilename] = useState('');

  const [status, setStatus] = useState('idle'); // idle | parsing | distributing | inference | synthesizing | success | error
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal & Download States
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [, setFsMousePos] = useState({ x: 0, y: 0, pct: { x: 50, y: 50 }, show: false });

  // Backend readiness
  const [modelsReady, setModelsReady] = useState(false);
  const [modelLoadMsg, setModelLoadMsg] = useState('Connecting to AI backend...');

  // Amazon-style Magnifier States
  const [zoomPos1, setZoomPos1] = useState({ x: 0, y: 0, show: false });
  const [zoomPos2, setZoomPos2] = useState({ x: 0, y: 0, show: false });

  // Azure RAG Agent States
  const [reportsLoading, setReportsLoading] = useState({ radiologist: false, patient: false });
  const [reportsData, setReportsData] = useState({ radiologist: null, patient: null });
  const [activeReportTab, setActiveReportTab] = useState('patient'); // 'radiologist' | 'patient'

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // Collapsible Chatbot State
  const [isChatInitialized, setIsChatInitialized] = useState(false); // Start Chat Feature

  // Advanced Chatbot States
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(null); // which msg idx has settings open
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => localStorage.getItem('cdss_tts_voice') || '');
  const [availableVoices, setAvailableVoices] = useState([]);

  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatInputRef = useRef(null);

  // Premium Phase 4 Features
  const [patientData, setPatientData] = useState({ id: '', age: '', sex: '' });
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [modelConfig, setModelConfig] = useState({ densenet: true, convnext: true, maxvit: true });
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('cdss_scan_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // FAQ State
  const [openFaq, setOpenFaq] = useState(null);

  // Guided Tour State
  const [showTour, setShowTour] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const handleTourNext = useCallback(() => setTourStep(s => Math.min(s + 1, TOUR_STEPS.length - 1)), []);
  const handleTourPrev = useCallback(() => setTourStep(s => Math.max(s - 1, 0)), []);
  const handleTourSkip = useCallback(() => {
    const isFinishing = tourStep === TOUR_STEPS.length - 1;
    setShowTour(false);
    setTourStep(0);
    if (isFinishing) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
    }
  }, [tourStep]);

  // Auto-advance tour on action/status steps
  useEffect(() => {
    if (!showTour) return;
    const currentTourStep = TOUR_STEPS[tourStep];
    // Advance when a file is loaded during the random-validation action step
    if (currentTourStep?.actionRequired && currentTourStep.id === 'random-validation' && file) {
      const timer = setTimeout(() => setTourStep(s => s + 1), 600);
      return () => clearTimeout(timer);
    }
    // Advance when user clicks Execute Diagnostic AI — status leaves idle
    // This handles both "just started processing" AND "already finished processing" cases
    if (currentTourStep?.actionRequired && currentTourStep.id === 'execute-ai' && status !== 'idle') {
      const timer = setTimeout(() => setTourStep(s => s + 1), 600);
      return () => clearTimeout(timer);
    }
    // If we're on wait-for-results and results already came in, skip ahead
    if (currentTourStep?.waitForStatus && (status === currentTourStep.waitForStatus || results)) {
      const timer = setTimeout(() => setTourStep(s => s + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [showTour, tourStep, file, status, results]);

  // ═══ INJECT CRITICAL KEYFRAMES INTO DOCUMENT HEAD ═══
  // Tailwind v4 strips/overrides @keyframes defined in CSS files.
  // Injecting them here guarantees they exist in the browser DOM.
  useEffect(() => {
    const id = '__cdss_keyframes__';
    if (document.getElementById(id)) return; // already injected
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.4; }
      }
      @keyframes scan-laser-sweep {
        0%   { top: -5%; }
        50%  { top: 85%; }
        100% { top: -5%; }
      }
      @keyframes scanning-slide {
        0%   { transform: translate3d(-150%, 0, 0); }
        100% { transform: translate3d(450%, 0, 0); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%      { transform: translateY(-12px); }
      }
      @keyframes shimmer-fast {
        0%   { transform: translateX(-200%) skewX(-12deg); }
        100% { transform: translateX(250%) skewX(-12deg); }
      }
    `;
    document.head.appendChild(style);
  }, []);


  // Load available TTS voices
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Curate diverse english voices
        const curated = [];
        const en = voices.filter(v => v.lang.startsWith('en'));

        // English voices
        const enFemale = en.find(v => /female|zira|samantha|jenny|hazel/i.test(v.name));
        const enMale = en.find(v => /male|david|daniel|mark|james/i.test(v.name));
        const gUS = en.find(v => /google us english/i.test(v.name));
        const gUK = en.find(v => /google uk english/i.test(v.name) && v !== gUS);
        const enExtra = en.find(v => v !== enFemale && v !== enMale && v !== gUS && v !== gUK);

        if (enFemale) curated.push({ voice: enFemale, label: `🇺🇸 ${enFemale.name.split(' ').slice(0, 2).join(' ')} (Female)` });
        if (enMale) curated.push({ voice: enMale, label: `🇺🇸 ${enMale.name.split(' ').slice(0, 2).join(' ')} (Male)` });
        if (gUS) curated.push({ voice: gUS, label: `🇺🇸 Google US English` });
        if (gUK) curated.push({ voice: gUK, label: `🇬🇧 Google UK English` });
        if (enExtra && curated.length < 5) curated.push({ voice: enExtra, label: `🌐 ${enExtra.name.split(' ').slice(0, 2).join(' ')}` });

        // Fallback: if not enough, fill from all available
        if (curated.length < 2) {
          voices.slice(0, 5).forEach(v => {
            if (!curated.find(c => c.voice.name === v.name)) curated.push({ voice: v, label: `${v.lang} — ${v.name.split(' ').slice(0, 2).join(' ')}` });
          });
        }
        setAvailableVoices(curated.slice(0, 5));
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const scrollToBottom = () => {
    // Scroll within the chat messages container only — never scroll the page
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatting, isChatOpen, isChatFullScreen, isChatMinimized]);

  // System Audio Ping
  const playPing = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* AudioContext may be blocked by browser policy */ }
  };

  const resultsRef = useRef(null);

  // Auto-scroll down to AI Narratives after diagnosis
  // Show scroll hint
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showNormalHeatmapExplain, setShowNormalHeatmapExplain] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // Initial user scroll tracker to hide hint
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200 && showScrollHint) {
        setShowScrollHint(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollHint]);

  // Back-to-top visibility tracker
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (status === 'success' && results && resultsRef.current) {
      setShowScrollHint(true);
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
      // Auto-hide scroll hint after 6s
      const timer = setTimeout(() => setShowScrollHint(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [status, results]);

  const handleCopy = async (text, idx) => {
    const plainText = text.replace(/\*\*/g, '');
    try {
      await navigator.clipboard.writeText(plainText);
    } catch {
      // Fallback for non-HTTPS origins (e.g. localhost)
      const ta = document.createElement('textarea');
      ta.value = plainText;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Feature explanation toggle
  const [expandedFeature, setExpandedFeature] = useState(null);
  const explanationRef = useRef(null);

  // Feature expansion — gentle scroll so user can see the expanded info
  useEffect(() => {
    if (expandedFeature && explanationRef.current) {
      setTimeout(() => {
        const rect = explanationRef.current.getBoundingClientRect();
        const isBelow = rect.bottom > window.innerHeight;
        if (isBelow) {
          window.scrollBy({ top: 220, behavior: 'smooth' });
        }
      }, 250);
    }
  }, [expandedFeature]);

  // Toggling theme hook
  useEffect(() => {
    document.body.className = theme === 'dark'
      ? "dark bg-[#080C14] text-[#E8EDF8] antialiased font-sans min-h-screen transition-colors duration-300"
      : "bg-[#EDF0F7] text-[#1E2340] antialiased font-sans min-h-screen transition-colors duration-300";
  }, [theme]);

  // Reset all prediction state on page load
  useEffect(() => {
    setFile(null); setPreviewUrl(''); setFilename('');
    setResults(null); setStatus('idle'); setErrorMsg('');
    setReportsData({ radiologist: null, patient: null });
    setReportsLoading({ radiologist: false, patient: false });
    setChatMessages([]);
    setIsChatOpen(false);
  }, []);

  // Poll /health until models are ready
  useEffect(() => {
    let timer;
    const poll = async () => {
      try {
        const res = await axios.get(`${API_BASE}/health`);
        if (res.data.ready) {
          setModelsReady(true);
          setModelLoadMsg(`All 3 AI models loaded in ${res.data.startup_seconds}s`);
        } else {
          setModelLoadMsg('Loading AI models into memory... (this takes ~60s)');
          timer = setTimeout(poll, 3000);
        }
      } catch {
        setModelLoadMsg('Waiting for backend to start...');
        timer = setTimeout(poll, 3000);
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setStatus('error');
        setErrorMsg('Validation Failed: The selected image exceeds the 10MB processing limit.');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setFilename(selectedFile.name);
      setIsRandom(false);
      setResults(null);
      setStatus('idle');
      setErrorMsg('');
    }
  }, []);

  const handleRandomSelect = useCallback(async () => {
    try {
      setIsRandomLoading(true);
      const response = await axios.get(`${API_BASE}/random_image?t=${Date.now()}`, {
        responseType: 'blob'
      });

      const returnedFilename = response.headers['x-filename'] || response.headers['X-Filename'] || `random-image-${Date.now()}.png`;
      const blob = response.data;
      const fileObj = new File([blob], returnedFilename, { type: blob.type || "image/jpeg" });

      setFile(fileObj);
      setPreviewUrl(URL.createObjectURL(fileObj));
      setFilename(returnedFilename);
      setIsRandom(true);
      setResults(null);
      setStatus('idle');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      alert("Failed to fetch random image from backend.");
    } finally {
      setIsRandomLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    if (!Object.values(modelConfig).some(Boolean)) {
      setErrorMsg("Error: At least one AI model must be enabled in the Ensemble Architecture to perform a diagnosis.");
      setStatus('error');
      return;
    }

    setResults(null);
    setErrorMsg('');

    const formData = new FormData();
    formData.append("file", file);
    if (patientData.id) formData.append("patient_id", patientData.id);
    if (patientData.age) formData.append("patient_age", patientData.age);
    if (patientData.sex) formData.append("patient_sex", patientData.sex);
    formData.append("models_config", JSON.stringify(modelConfig));

    try {
      // Step 1
      setStatus('parsing');
      await new Promise(r => setTimeout(r, 800));

      // Step 2
      setStatus('distributing');
      await new Promise(r => setTimeout(r, 800));

      // Step 3 (Long poll)
      setStatus('inference');

      const response = await axios.post(`${API_BASE}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 400000
      });

      // Step 4
      setStatus('synthesizing');
      await new Promise(r => setTimeout(r, 600));

      // Step 5
      setStatus('success');
      setResults(response.data);

      const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        filename: file.name,
        prediction: response.data.prediction,
        confidence: response.data.confidence_score
      };
      setScanHistory(prev => {
        const newHistory = [historyItem, ...prev].slice(0, 5);
        localStorage.setItem('cdss_scan_history', JSON.stringify(newHistory));
        return newHistory;
      });

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || err.message || "Unknown error occurred.");
    }
  }, [file, modelConfig, patientData]);

  const handleGenerateReport = async (type) => {
    if (!results) return;

    setReportsLoading(prev => ({ ...prev, [type]: true }));
    try {
      const topClass = results.prediction;
      const confidence = results.confidence_score;
      const heatmapDesc = "Visual gradients strongly focused on the central pulmonary regions."; // Placeholder

      const reportRes = await axios.post(`${API_BASE}/api/generate_reports`, {
        pathology: topClass,
        confidence: confidence,
        heatmap_description: heatmapDesc,
        report_type: type,
        patient_context: patientData
      });

      const aiText = reportRes.data.response;

      // Match inner content or fallback to full text
      const match = aiText.match(new RegExp(`<${type === 'radiologist' ? 'RadiologistReport' : 'PatientNarrative'}>([\\s\\S]*?)</${type === 'radiologist' ? 'RadiologistReport' : 'PatientNarrative'}>`, 'i'));
      let extractedText = match ? match[1] : aiText;

      // ── Clean & normalize AI-generated markdown ──
      extractedText = extractedText
        .replace(/<[^>]+>/g, '')              // strip any HTML/XML tags
        .replace(/\[doc\d+\]/gi, '')          // strip Azure RAG citation markers [doc1] etc.
        .trim()
        .replace(/\r\n/g, '\n')              // normalize line endings
        .replace(/^[ \t]+/gm, '');            // strip leading whitespace per line

      // Fix broken bold: collapse single newlines into spaces so **text\nmore** becomes **text more**
      // (markdown ** cannot span line breaks — they must be on the same line)
      // Preserve paragraph breaks (double newlines)
      extractedText = extractedText.replace(/([^\n])\n(?!\n)/g, '$1 ');

      // Re-insert paragraph break after headings that got merged with content
      // e.g., "**Findings** The chest..." → "**Findings**\n\nThe chest..."
      extractedText = extractedText.replace(/^(\*\*[^*]+\*\*)\s+(?=[A-Z])/gm, '$1\n\n');

      // Remove empty/collapsed bold markers: "****" or "** **"
      extractedText = extractedText.replace(/\*\*\s*\*\*/g, '');

      // Ensure balanced ** per paragraph (unbalanced ** causes ALL subsequent ** to show as literal)
      extractedText = extractedText.split('\n\n').map(para => {
        const count = (para.match(/\*\*/g) || []).length;
        if (count % 2 !== 0) {
          // Remove the last unpaired ** to restore balanced parsing
          const lastIdx = para.lastIndexOf('**');
          return para.slice(0, lastIdx) + para.slice(lastIdx + 2);
        }
        return para;
      }).join('\n\n');

      setReportsData(prev => ({
        ...prev,
        [type]: extractedText || "Failed to parse text from model context."
      }));
    } catch (err) {
      console.error("Report generation failed", err);
      setReportsData(prev => ({
        ...prev,
        [type]: "Error connecting to Azure RAG agent."
      }));
    } finally {
      setReportsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Chat Notification Observer
  useEffect(() => {
    if (!isChatting && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === 'assistant' && (isChatMinimized || !isChatOpen)) {
        setUnreadCount(prev => prev + 1);
        playPing();
      }
    }
  }, [isChatting, chatMessages, isChatMinimized, isChatOpen]);

  // Speech to Text (Mic Input) — Enhanced with continuous mode
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    // eslint-disable-next-line no-unused-vars
    let finalTranscript = '';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          setChatInput(prev => (prev + ' ' + transcript).trim());
        }
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text to Speech (AI Voice)
  const handleSpeak = (text, idx) => {
    if (!window.speechSynthesis) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const plainText = text.replace(/\*\*/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    // Apply user-selected voice
    if (selectedVoiceName) {
      const match = availableVoices.find(v => v.voice.name === selectedVoiceName);
      if (match) utterance.voice = match.voice;
    }
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Report TTS
  const [speakingReport, setSpeakingReport] = useState(null);
  const handleSpeakReport = (text, id) => {
    if (!window.speechSynthesis) return;
    if (speakingReport === id) {
      window.speechSynthesis.cancel();
      setSpeakingReport(null);
      return;
    }
    window.speechSynthesis.cancel();
    const plain = text.replace(/\*\*/g, '').replace(/\n+/g, '. ');
    const utt = new SpeechSynthesisUtterance(plain);
    if (selectedVoiceName) {
      const match = availableVoices.find(v => v.voice.name === selectedVoiceName);
      if (match) utt.voice = match.voice;
    }
    utt.rate = 0.95;
    utt.onend = () => setSpeakingReport(null);
    utt.onerror = () => setSpeakingReport(null);
    setSpeakingReport(id);
    window.speechSynthesis.speak(utt);
  };

  const selectVoice = (voiceName) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('cdss_tts_voice', voiceName);
    setVoiceSettingsOpen(null);
  };

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const handleDownloadPDF = async (reportType) => {
    const text = reportsData[reportType];
    if (!text) return;

    const getBase64 = (inputFile) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(inputFile);
    });

    let originalImgBase64 = null;
    if (file) {
      try {
        originalImgBase64 = await getBase64(file);
      } catch { /* skip image embed if read fails */ }
    }

    const doc = new jsPDF();
    const title = reportType === 'radiologist' ? 'Radiologist Clinical Report' : 'Patient Narrative Report';

    // Premium Deep Blue Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');

    // Main Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("CDSS Diagnostic AI", 15, 20);

    // Sub-title
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(14);
    doc.text(title, 15, 30);

    // Patient & Scan Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 45, 180, 25, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 45, 180, 25, 'S');

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Left Col: Patient Demographics
    doc.text(`Patient ID: ${patientData.id || 'N/A'}`, 20, 53);
    doc.text(`Age: ${patientData.age || 'N/A'}`, 20, 60);
    doc.text(`Sex: ${patientData.sex || 'N/A'}`, 20, 67);

    // Right Col: Diagnostic Summary
    doc.text(`Date Assessed: ${new Date().toLocaleString()}`, 110, 53);
    doc.text(`Primary Diagnosis: ${results?.prediction || 'N/A'}`, 110, 60);
    doc.text(`AI Confidence: ${results ? (results.confidence_score * 100).toFixed(2) + '%' : 'N/A'}`, 110, 67);

    let currentY = 82;

    // Insert Images if available
    if (originalImgBase64 && results?.heatmap_base64) {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.text("Original X-Ray Scan", 15, currentY);
      doc.text("GradCAM++ Attention Map", 110, currentY);

      currentY += 4;

      doc.addImage(originalImgBase64, 'JPEG', 15, currentY, 80, 80);
      const heatmapData = `data:image/png;base64,${results.heatmap_base64}`;
      doc.addImage(heatmapData, 'PNG', 110, currentY, 80, 80);

      currentY += 90;
    }

    // Body Content Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text("Clinical Analysis Details:", 15, currentY);

    currentY += 8;

    // Generated GPT Body Text
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const maxLineWidth = 180;

    // Pre-process: collapse runs of 3+ newlines into exactly 2 (one paragraph break)
    const cleanedText = text.replace(/\n{3,}/g, '\n\n');

    // Split text into lines, preserving markdown bold markers
    const rawLines = doc.splitTextToSize(cleanedText, maxLineWidth);

    // Render each line, parsing **bold** segments inline
    for (let i = 0; i < rawLines.length; i++) {
      if (currentY > 280) {
        doc.addPage();
        currentY = 20;
      }
      const line = rawLines[i];
      const trimmed = line.trim();

      // Empty lines = paragraph break — use compact 3pt gap instead of full line height
      if (trimmed.length === 0) {
        currentY += 3;
        continue;
      }

      // Bold heading lines get a small extra top margin for visual separation
      const isBoldHeading = /^\*\*[^*]+\*\*$/.test(trimmed);
      if (isBoldHeading && i > 0) {
        currentY += 2;
      }

      // Split line into segments: normal text and **bold** text
      const parts = line.split(/(\*\*.*?\*\*)/);
      let xPos = 15;
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(boldText, xPos, currentY);
          xPos += doc.getTextWidth(boldText);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
        } else {
          doc.text(part, xPos, currentY);
          xPos += doc.getTextWidth(part);
        }
      }
      currentY += 6;
    }

    // Direct jsPDF save — produces a proper .pdf download
    const fileName = `CDSS_Report_${patientData.id || 'Unknown'}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    // Reset textarea height back to initial single-row size
    if (chatInputRef.current) {
      chatInputRef.current.style.height = '56px';
    }
    setIsChatting(true);

    try {
      const contextParts = [];
      if (patientData.id || patientData.age || patientData.sex) {
        contextParts.push(`Patient Context: ID=${patientData.id || 'N/A'}, Age=${patientData.age || 'N/A'}, Gender=${patientData.sex || 'N/A'}`);
      }
      if (results) {
        contextParts.push(`Current Diagnosis: ${results.prediction} (${(results.confidence_score * 100).toFixed(2)}% confidence). Heatmap shows: ${results.heatmap_description || 'N/A'}`);
      }
      if (reportsData.radiologist) {
        contextParts.push(`Radiologist Report: ${reportsData.radiologist.substring(0, 500)}`);
      }
      if (reportsData.patient) {
        contextParts.push(`Patient Report: ${reportsData.patient.substring(0, 500)}`);
      }
      const contextString = contextParts.length > 0 ? contextParts.join('\n\n') : null;

      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: userMsg.content,
        chat_history: chatMessages.map(m => ({ role: m.role, content: m.content })),
        context: contextString
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "**Error:** Azure Connection failed." }]);
    } finally {
      setIsChatting(false);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  };

  const ActiveStepLog = ({ status }) => {
    let text = "";
    let Icon = Activity;

    if (status === 'parsing') { text = "1. 🛠️ Validating and Parsing Uploaded Radiograph"; Icon = Activity; }
    else if (status === 'distributing') { text = "2. 🧠 Distributing to Graphic Processing Pipelines"; Icon = ChevronRight; }
    else if (status === 'inference') { text = "3. ⚙️ Computing Multi-Model Inference... (Intensive passes)"; Icon = Activity; }
    else if (status === 'synthesizing') { text = "4. 🧬 Synthesizing Extracted Features..."; Icon = ChevronRight; }

    return (
      <motion.div
        key={status}
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        transition={{ duration: 0.3, type: "spring" }}
        className={`flex items-center space-x-3 py-1.5 px-3 rounded-xl shadow-md relative overflow-hidden group border w-full max-w-xl
          ${theme === 'dark' ? 'bg-gradient-to-r from-[#00D4FF]/20 to-[#FF0080]/10 border-[#00D4FF]/50 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-blue-100'} cursor-default`}
      >
        {/* CSS-only Shimmer background — no JS animation */}
        <div className="shimmer-fast-bg" />

        <div className={`p-1.5 rounded-lg shadow-inner relative z-10 animate-pulse ${theme === 'dark' ? 'bg-[#00D4FF] text-white shadow-[0_0_10px_#00D4FF]' : 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]'}`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <div className="flex-1 relative z-10">
          <p className={`text-xs font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
            {text}
          </p>
        </div>
        <div className={`w-5 h-5 flex-shrink-0 rounded-full border-[3px] border-transparent ${theme === 'dark' ? 'border-t-[#00D4FF] border-r-[#00D4FF]' : 'border-t-blue-600 border-r-blue-600'} animate-spin`} style={{ transformOrigin: 'center' }} />
      </motion.div>
    );
  };

  const handleDownloadHeatmap = () => {
    if (!results || !results.heatmap_base64 || isDownloading) return;
    setIsDownloading(true);

    // Simulate slight delay for animation visibility
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${results.heatmap_base64}`;
      link.download = `GradCAM_AI_Attention_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }, 600);
  };

  const handleFullscreenImage = (base64OrUrl, isBase64 = false) => {
    if (!base64OrUrl) return;
    const url = isBase64 ? `data:image/png;base64,${base64OrUrl}` : base64OrUrl;
    setFullscreenImage(url);
  };

  const chartData = useMemo(() => {
    return results ? Object.entries(results.class_probabilities).map(([name, val]) => ({
      name, value: val * 100
    })) : [];
  }, [results]);

  return (
    <div className={`min-h-screen transition-colors duration-150 ${theme === 'dark' ? 'bg-[#080C14]' : 'bg-[#EDF0F7]'}`}>

      {/* Dynamic Background */}
      {theme === 'dark' ? <AuroraBackground /> : <LightBackground />}

      {/* Confetti celebration on tour completion */}
      <ConfettiCelebration active={showConfetti} />

      {/* Models Loading Banner */}
      <AnimatePresence>
        {!modelsReady && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-0 left-0 right-0 z-[300] overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 py-3 px-6"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.95) 0%, rgba(139,92,246,0.95) 50%, rgba(255,0,128,0.88) 100%)' }}>
              {/* 3-dot blink loader */}
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white dot-1" />
                <span className="w-2 h-2 rounded-full bg-white dot-2" />
                <span className="w-2 h-2 rounded-full bg-white dot-3" />
              </div>
              <span className="text-white text-xs font-bold tracking-widest uppercase">{modelLoadMsg}</span>
            </div>
            {/* Shimmer sweep under the banner */}
            <div className="shimmer-fast-bg" />
          </motion.div>
        )}
      </AnimatePresence >

      <div className={`app-container max-w-6xl 2xl:max-w-7xl mx-auto space-y-2 sm:space-y-3 relative z-10 w-full transition-opacity duration-500 ${!modelsReady ? 'opacity-40 pointer-events-none select-none' : ''}`}>

        {/* ═══ PREMIUM HEADER ═══ */}
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
          className={`relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5
            ${theme === 'dark'
              ? 'bg-gradient-to-br from-[#0d1520] via-[#111827] to-[#0d1520] border border-white/10 shadow-[0_0_40px_rgba(0,212,255,0.08)]'
              : 'bg-gradient-to-br from-[#F4F6FC] to-[#EEF0FA] border border-indigo-100 shadow-lg shadow-indigo-50/60'}`}
        >
          {/* Subtle bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 10%, #00D4FF 30%, #8B5CF6 50%, #FF0080 70%, transparent 90%)', opacity: 0.3 }} />
          {theme === 'dark' && (
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #00D4FF 0%, transparent 50%), radial-gradient(circle at 80% 50%, #8B5CF6 0%, transparent 50%)' }} />
          )}

          <div className="z-10">
            <h1 onClick={() => window.location.reload()} className="cursor-pointer hover:opacity-80 transition-opacity text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-clip-text text-transparent drop-shadow-sm font-josefin-sans"
              style={{ backgroundImage: 'linear-gradient(135deg, #00D4FF 0%, #a78bfa 40%, #FF0080 80%, #f59e0b 100%)', textShadow: theme === 'dark' ? '0 0 20px rgba(0,212,255,0.4)' : 'none' }}>
              Clinical Decision Support System
            </h1>
            <p className={`text-[9px] sm:text-[10px] md:text-[11px] font-semibold mt-1 tracking-wide transition-colors duration-300 ${theme === 'dark' ? 'text-cyan-400/70' : 'text-indigo-500/80'} font-josefin-sans`}>
              Chest X-Ray Meta-Ensemble Neural Network using Hybrid CNN–Transformer Architecture
            </p>
            <p className={`text-[10px] sm:text-[11px] font-medium mt-1.5 tracking-widest uppercase transition-colors duration-300 ${theme === 'dark' ? 'text-white/55 hover:text-white/80' : 'text-[#5B6080] hover:text-indigo-600'} font-josefin-sans`}>
              Deep Learning · Computer Vision · Diagnostic Radiography
            </p>
            <div className="hidden sm:flex flex-wrap gap-1.5 mt-2">
              {['DenseNet-121', 'ConvNeXtV2', 'MaxViT', 'L2 Meta', 'GradCAM++'].map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, type: 'spring', bounce: 0.4 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className={`text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-default transition-all duration-300
                    ${theme === 'dark' ? 'border-white/10 text-white/50 bg-white/5 hover:border-[#00D4FF]/40 hover:text-white/80 hover:bg-[#00D4FF]/10 hover:shadow-[0_0_10px_rgba(0,212,255,0.15)]' : 'border-indigo-200 text-indigo-400 bg-indigo-50/60 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 hover:shadow-sm'}`}
                >{t}</motion.span>
              ))}
            </div>
          </div>

          {/* ═══ Mobile Hamburger Menu Button (visible below sm) ═══ */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(p => !p)}
            className={`absolute top-3 right-3 sm:hidden z-30 flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 cursor-pointer
              ${theme === 'dark'
                ? 'bg-white/5 border-white/15 text-white/80 hover:border-[#00D4FF]/50'
                : 'bg-white border-indigo-200 text-indigo-600 hover:border-indigo-400 shadow-sm'}`}
            aria-label="Menu"
          >
            <span className="text-lg">{mobileMenuOpen ? '✕' : '☰'}</span>
          </motion.button>

          {/* ═══ Mobile Dropdown Panel (fixed overlay, visible below sm) ═══ */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                {/* Backdrop to close on tap-outside */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 z-[9998] sm:hidden"
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`fixed top-16 right-4 z-[9999] w-48 rounded-2xl border p-2 flex flex-col gap-1.5 shadow-2xl sm:hidden
                    ${theme === 'dark'
                      ? 'bg-[#0d1520]/95 backdrop-blur-xl border-white/10'
                      : 'bg-white/95 backdrop-blur-xl border-indigo-100'}`}
                >
                  <button
                    onClick={() => { setShowTour(true); setTourStep(0); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all
                      ${theme === 'dark' ? 'text-[#00D4FF] hover:bg-[#00D4FF]/10' : 'text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    <span>📖</span> Take a Tour?
                  </button>
                  <button
                    onClick={() => { document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all
                      ${theme === 'dark' ? 'text-[#8B5CF6] hover:bg-[#8B5CF6]/10' : 'text-violet-600 hover:bg-violet-50'}`}
                  >
                    <span>❓</span> FAQ
                  </button>
                  <button
                    onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all
                      ${theme === 'dark' ? 'text-white/80 hover:bg-white/5' : 'text-[#1E2340] hover:bg-indigo-50'}`}
                  >
                    <span>{theme === 'dark' ? '☀️' : '🌙'}</span> {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ═══ Desktop Buttons (hidden below sm, visible sm+) ═══ */}
          {/* Take a Tour Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowTour(true); setTourStep(0); }}
            className={`hidden sm:flex relative z-10 items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[10px] border transition-all duration-300 cursor-pointer overflow-hidden uppercase tracking-widest
              ${theme === 'dark'
                ? 'bg-gradient-to-r from-[#00D4FF]/10 to-[#8B5CF6]/10 border-[#00D4FF]/30 text-[#00D4FF] hover:border-[#00D4FF]/60 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)]'
                : 'bg-gradient-to-r from-blue-50 to-violet-50 border-indigo-200 text-indigo-600 hover:border-indigo-400 hover:shadow-lg'}`}
          >
            <span>📖</span>
            <span>Take a Tour?</span>
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep-slow pointer-events-none" />
          </motion.button>

          {/* FAQ Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
            className={`hidden sm:flex relative z-10 items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-[10px] border transition-all duration-300 cursor-pointer overflow-hidden uppercase tracking-widest
              ${theme === 'dark'
                ? 'bg-gradient-to-r from-[#8B5CF6]/10 to-[#FF0080]/10 border-[#8B5CF6]/30 text-[#8B5CF6] hover:border-[#8B5CF6]/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                : 'bg-gradient-to-r from-violet-50 to-pink-50 border-violet-200 text-violet-600 hover:border-violet-400 hover:shadow-lg'}`}
          >
            <span>❓</span>
            <span>FAQ</span>
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            data-tour="theme-toggle"
            className={`hidden sm:flex relative z-10 items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-[10px] border transition-all duration-300 cursor-pointer overflow-hidden uppercase tracking-widest
              ${theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white/90 hover:border-[#00D4FF]/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)]'
                : 'bg-white border-indigo-200 text-[#1E2340] hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-lg'}`}
          >
            <motion.div animate={{ rotate: theme === 'dark' ? 0 : 180 }} transition={{ duration: 0.5 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.div>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep-slow pointer-events-none" />
          </motion.button>
        </motion.div>

        {/* Main Grid – stacks on mobile/tablet, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 w-full">

          {/* Left Sidebar - Uploader */}
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 22 }}
            className="col-span-1 lg:col-span-4 space-y-3 md:space-y-4 lg:sticky lg:top-6 lg:self-start"
          >
            {/* ═══ IMAGE GATEWAY PANEL ═══ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -2 }}
              data-tour="image-gateway"
              className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border p-3 sm:p-3 transition-all duration-300 hover-lift ${theme === 'dark'
                ? 'bg-gradient-to-b from-[#0f1823] to-[#0b0f19] border-white/8 shadow-[0_0_30px_rgba(0,212,255,0.05)] hover:border-[#00D4FF]/20 hover:shadow-[0_0_40px_rgba(0,212,255,0.1)]'
                : 'bg-gradient-to-b from-[#F4F6FC] to-[#EDEFFE] border-indigo-100 shadow-lg shadow-indigo-50/40 hover:border-indigo-300 hover:shadow-xl'
                }`}
            >
              {/* Sidebar sliding glow bar — self-contained animation */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes _sbSlide { 0%,100%{top:0%} 50%{top:60%} }
                ._sb_glow { 
                  position:absolute; left:0; top:0; width:100%; height:40%;
                  background:linear-gradient(180deg,#00D4FF,#8B5CF6,#FF0080);
                  box-shadow:0 0 12px rgba(0,212,255,0.5),0 0 24px rgba(139,92,246,0.25);
                  border-radius:999px;
                  animation:_sbSlide 1.5s ease-in-out infinite;
                }
              `}} />
              <div className="absolute left-0 top-4 bottom-4 w-[5px] rounded-r-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/20 via-[#8B5CF6]/20 to-[#FF0080]/20 rounded-r-full" />
                <div className="_sb_glow" />
              </div>

              <div className="pl-3 sm:pl-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-2xl flex-shrink-0 transition-transform ${theme === 'dark' ? 'bg-gradient-to-br from-[#00D4FF]/5 to-transparent border border-[#00D4FF]/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'bg-gradient-to-br from-blue-50 to-transparent border border-blue-200'}`}>
                    <Activity size={18} className={theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'} />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-sm sm:text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-josefin-sans`}>Image Gateway</h2>
                    <p className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'} font-josefin-sans`}>Radiograph Input</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {modelsReady && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1" style={{ boxShadow: '0 0 10px rgba(16,185,129,0.9), 0 0 20px rgba(16,185,129,0.4)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    )}
                    <button onClick={() => setShowPatientForm(!showPatientForm)} data-tour="patient-data" className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? (showPatientForm ? 'bg-[#00D4FF]/20 text-[#00D4FF]' : 'text-white/40 hover:text-white hover:bg-white/10') : (showPatientForm ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100')}`} title="Patient Demographics">
                      <UserCircle size={16} />
                    </button>
                    <button onClick={() => setShowModelConfig(!showModelConfig)} data-tour="model-config" className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? (showModelConfig ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'text-white/40 hover:text-white hover:bg-white/10') : (showModelConfig ? 'bg-violet-100 text-violet-600' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100')}`} title="Ensemble Config">
                      <Settings2 size={16} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showPatientForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#111827]/50 border-white/10 shadow-[inner_0_0_15px_rgba(0,0,0,0.5)]' : 'bg-white/80 backdrop-blur border-blue-100 shadow-inner'}`}>
                        <div className="flex items-center gap-2 mb-1 pl-1">
                          <UserCircle size={14} className={theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-500'} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>Patient Context</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Patient ID (Opt)" value={patientData.id} onChange={e => setPatientData({ ...patientData, id: e.target.value })} className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-[#0b0f19] border-white/5 text-white placeholder-white/20 focus:border-[#00D4FF]/40' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-400 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)]'}`} />
                          <input type="number" placeholder="Age" value={patientData.age} onChange={e => setPatientData({ ...patientData, age: e.target.value })} className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-[#0b0f19] border-white/5 text-white placeholder-white/20 focus:border-[#00D4FF]/40' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-400 focus:shadow-[0_0_10px_rgba(59,130,246,0.1)]'}`} />
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          {['Male', 'Female', 'Other'].map(s => (
                            <button key={s} onClick={() => setPatientData({ ...patientData, sex: s })} className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1.5 rounded-lg border transition-all ${patientData.sex === s ? (theme === 'dark' ? 'bg-[#00D4FF]/10 border-[#00D4FF]/50 text-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.1)]' : 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm') : (theme === 'dark' ? 'bg-[#0b0f19] border-white/5 text-white/40 hover:text-white/80 hover:bg-white/5' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50')}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showModelConfig && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#111827]/50 border-white/10 shadow-[inner_0_0_15px_rgba(0,0,0,0.5)]' : 'bg-white/80 backdrop-blur border-violet-100 shadow-inner'}`}>
                        <div className="flex items-center gap-2 mb-1 pl-1">
                          <SlidersHorizontal size={14} className={theme === 'dark' ? 'text-[#8B5CF6]' : 'text-violet-500'} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>Ensemble Architecture</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {Object.entries(modelConfig).map(([model, isEnabled], idx) => {
                            const colors = ['#00D4FF', '#8B5CF6', '#FF0080'];
                            const c = colors[idx % 3];
                            return (
                              <div key={model} className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 ${theme === 'dark' ? `bg-[#0f1423] ${isEnabled ? 'border-white/10' : 'border-white/5 opacity-60'}` : `bg-gray-50 ${isEnabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}`}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: isEnabled ? `0 0 8px ${c}` : 'none', transition: 'box-shadow 0.3s' }} />
                                  <span className={`text-[12px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>{model}</span>
                                </div>
                                <button onClick={() => setModelConfig({ ...modelConfig, [model]: !isEnabled })} className="relative w-[48px] h-[28px] rounded-full transition-all duration-300 cursor-pointer" style={{ background: isEnabled ? c : (theme === 'dark' ? '#1a1830' : '#e5e7eb'), boxShadow: isEnabled ? `0 0 12px ${c}40` : 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                                  <div className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all duration-300 shadow-md ${isEnabled ? 'right-[3px] scale-110' : 'left-[3px] scale-100'}`} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRandomSelect}
                  disabled={isRandomLoading || (status !== 'idle' && status !== 'error' && status !== 'success')}
                  data-tour="random-validation"
                  className={`relative group flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-full border-0 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg
                     ${theme === 'dark'
                      ? 'text-white shadow-[0_10px_30px_rgba(0,212,255,0.15)] hover:shadow-[0_15px_40px_rgba(0,212,255,0.3)]'
                      : 'text-white shadow-md hover:shadow-xl'}`}
                  style={theme === 'dark' ? { background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(255,0,128,0.15) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' } : { background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
                >
                  {/* Vibrant background layer that fades in on hover */}
                  {theme === 'dark' && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#00D4FF]/40 via-[#8B5CF6]/40 to-[#FF0080]/40" />
                  )}

                  <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-white/20'}`}>
                      <Dices size={16} className={isRandomLoading ? 'animate-bounce' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold tracking-wide font-josefin-sans">Deploy Random Validation</span>
                  </div>
                  <div className="relative z-10">
                    {isRandomLoading ? (
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke={theme === 'dark' ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.2)'} strokeWidth="3" fill="none" />
                        <circle cx="12" cy="12" r="10" stroke={theme === 'dark' ? '#00D4FF' : '#ffffff'} strokeWidth="3" strokeDasharray="16 46" strokeLinecap="round" fill="none">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      </svg>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-bold opacity-50 group-hover:opacity-100 transition-opacity uppercase tracking-widest bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                        {theme === 'dark' ? 'Try it' : 'Try it'}
                      </span>
                    )}
                  </div>
                  {/* Shimmer */}
                  {!isRandomLoading && (
                    <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep pointer-events-none" />
                  )}
                </motion.button>

                {/* Premium Upload Dropzone */}
                <div className="relative group cursor-pointer mt-2">
                  {theme === 'dark' && (
                    <div className="absolute -inset-1 bg-gradient-to-br from-[#00D4FF] via-[#8B5CF6] to-[#FF0080] rounded-3xl blur-[40px] opacity-40 pointer-events-none animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                  )}
                  <div className={`relative rounded-3xl sm:rounded-[20px] border-2 border-dashed p-2.5 md:p-3 text-center transition-all duration-500 active:scale-[0.98] group/upload
                    ${theme === 'dark'
                      ? 'bg-[#0b0f19]/40 border-white/10 group-hover:border-[#8B5CF6]/50 group-hover:bg-[#0b0f19]/80 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                      : 'bg-gradient-to-br from-gray-50 to-blue-50/20 border-gray-200 group-hover:border-violet-400 group-hover:from-violet-50 group-hover:to-fuchsia-50'}`}
                  >
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileUpload} />
                    <div
                      className={`w-8 h-8 mx-auto mb-1 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:-translate-y-1.5
                        ${theme === 'dark' ? 'bg-[#151b2b] border border-white/5 group-hover:border-[#8B5CF6]/40 group-hover:shadow-[0_8px_20px_rgba(139,92,246,0.2)]' : 'bg-white shadow-sm border border-gray-100 group-hover:border-violet-200 group-hover:shadow-md'}`}
                    >
                      <Upload size={18} className={`transition-colors duration-500 ${theme === 'dark' ? 'text-[#8B5CF6] group-hover:text-white' : 'text-violet-500'}`} />
                    </div>
                    <p data-tour="upload-dropzone" className={`font-bold text-[11px] mb-0.5 transition-colors duration-500 ${theme === 'dark' ? 'text-white/80 group-hover:text-white' : 'text-gray-800'}`}>Upload Custom Scan</p>
                    <p className={`text-[9px] font-semibold uppercase tracking-widest ${theme === 'dark' ? 'text-white/35' : 'text-gray-400'}`}>ANY FORMAT · UP TO 10MB</p>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* ═══ ANALYSIS LAUNCHER ═══ */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.97 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5
                    ${theme === 'dark' ? 'bg-[#0f1823]/90 border-white/8' : 'bg-[#F4F6FC] border-indigo-100 shadow-lg shadow-indigo-50/40'}`}
                >
                  {/* Filename tag */}
                  <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-xs font-bold overflow-hidden
                    ${theme === 'dark' ? 'bg-white/5 border border-white/8' : 'bg-gray-50 border border-gray-200'}`}>
                    <span className="text-base flex-shrink-0">📄</span>
                    <span className={`${theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'} flex-shrink-0 font-bold uppercase tracking-wide text-[10px]`}>Selected:</span>
                    <span className={`truncate min-w-0 ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>{filename}</span>
                  </div>

                  {/* Execute Button — pill-style matching Deploy Random Validation */}
                  <div className="relative group/execute mt-2">
                    <motion.button
                      whileHover={status === 'idle' || status === 'error' || status === 'success' ? { scale: 1.02, y: -2 } : {}}
                      whileTap={status === 'idle' || status === 'error' || status === 'success' ? { scale: 0.98 } : {}}
                      onClick={handleAnalyze}
                      data-action="analyze"
                      data-tour="execute-ai"
                      disabled={status !== 'idle' && status !== 'error' && status !== 'success'}
                      className={`relative group flex items-center justify-between w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-full border-0 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg text-white
                        ${status !== 'idle' && status !== 'error' && status !== 'success'
                          ? 'opacity-80 cursor-not-allowed'
                          : 'shadow-[0_10px_30px_rgba(139,92,246,0.2)] hover:shadow-[0_15px_40px_rgba(139,92,246,0.35)]'}`}
                      style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #FF0080 100%)' }}
                    >
                      <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-full bg-white/20">
                          {status !== 'idle' && status !== 'error' && status !== 'success' ? (
                            <svg fill="none" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 animate-spin">
                              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                              <path fill="#ffffff" d="M4 12C4 7.58172 7.58172 4 12 4V1C5.92487 1 1 5.92487 1 12H4Z" />
                            </svg>
                          ) : (
                            <ScanSearch size={16} strokeWidth={2.5} />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold tracking-wide font-josefin-sans">
                          {status !== 'idle' && status !== 'error' && status !== 'success' ? 'Processing Ensembles...' : 'Execute Diagnostic AI'}
                        </span>
                      </div>
                      <div className="relative z-10">
                        {status !== 'idle' && status !== 'error' && status !== 'success' ? (
                          <span className="text-[10px] sm:text-[11px] font-bold opacity-70 uppercase tracking-widest bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap animate-pulse">Running</span>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] font-bold opacity-50 group-hover:opacity-100 transition-opacity uppercase tracking-widest bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">Run</span>
                        )}
                      </div>
                      {/* Shimmer */}
                      {(status === 'idle' || status === 'error' || status === 'success') && (
                        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep pointer-events-none" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 22, delay: 0.1 }}
            className="lg:col-span-8 w-full"
          >
            {/* Idle State — premium placeholder when no file is selected */}
            <AnimatePresence mode="wait">
              {status === 'idle' && !file && !results && (
                <motion.div
                  key="idle-placeholder"
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.005 }}
                  className={`relative rounded-2xl sm:rounded-3xl border p-8 sm:p-12 text-center group transition-shadow duration-500 glass-premium
                    ${theme === 'dark' ? 'border-white/8 hover:border-[#00D4FF]/25 hover:shadow-[0_0_40px_rgba(0,212,255,0.08)]' : 'border-indigo-100 shadow-lg hover:border-indigo-300 hover:shadow-indigo-100/80 hover:shadow-2xl'}`}
                >
                  {/* Premium Interactive Anatomy / Network Scanner Core */}
                  <div className="relative w-40 h-40 mx-auto mb-8 cursor-col-resize group/core perspective-1000 will-change-transform" style={{ transform: 'translateZ(0)' }}>
                    {/* Pulsing Aura */}
                    <div className="absolute inset-0 rounded-full opacity-40 group-hover/core:opacity-80 transition-opacity duration-700 blur-[30px]" style={{ background: 'radial-gradient(circle, #00D4FF, #8B5CF6, transparent 70%)' }} />

                    {/* Hardware Accelerated Rotating Rings */}
                    <div className="absolute inset-2 border-[3px] border-dashed rounded-full opacity-50" style={{ borderColor: theme === 'dark' ? '#00D4FF' : '#3B82F6', animation: 'spin 10s linear infinite', willChange: 'transform' }} />
                    <div className="absolute inset-5 border-[2px] border-dotted rounded-full opacity-70" style={{ borderColor: theme === 'dark' ? '#FF0080' : '#8B5CF6', animation: 'spin 15s linear infinite reverse', willChange: 'transform' }} />

                    {/* Inner Glass Orb */}
                    <div className={`absolute inset-8 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-500 border shadow-2xl group-hover/core:scale-105
                      ${theme === 'dark' ? 'bg-[#0f1823]/80 border-[#00D4FF]/40 shadow-[0_0_40px_rgba(0,212,255,0.2)] group-hover/core:shadow-[0_0_80px_rgba(0,212,255,0.5)] group-hover/core:border-[#00D4FF]/80' : 'bg-white/80 border-blue-400 shadow-xl group-hover/core:shadow-2xl group-hover/core:border-blue-600'}`}>
                      <BrainCircuit size={48} strokeWidth={1.5} className={`transition-transform duration-500 group-hover/core:scale-110 ${theme === 'dark' ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                  </div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className={`text-xl sm:text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-[#1E2340]'} font-josefin-sans`}
                  >Ready for Analysis</motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className={`text-sm max-w-xs mx-auto mb-6 ${theme === 'dark' ? 'text-white/40' : 'text-[#5B6080]'}`}
                  >
                    Upload a chest X-ray or deploy a random validation image from the panel on the left.
                  </motion.p>

                  {/* Feature pills — premium clickable expanding cards */}
                  <div className="relative flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {[
                        { icon: '🧠', label: '3-Model Ensemble', color: '#00D4FF', desc: 'Three separate deep learning architectures — DenseNet-121, ConvNeXtV2, and MaxViT — each independently analyze your X-ray. Their predictions are fused by an L2 Meta-Learner to produce a single, highly robust diagnosis that outperforms any individual model.' },
                        { icon: '🔬', label: 'GradCAM++ Heatmap', color: '#8B5CF6', desc: 'Gradient-weighted Class Activation Mapping (GradCAM++) generates a visual heatmap overlay showing exactly which pixels the AI focused on to make its diagnosis. Red/yellow regions = high attention. This makes the AI\'s decision transparent and interpretable for clinicians.' },
                        { icon: '⚡', label: 'Sub-60s Inference', color: '#F59E0B', desc: 'The entire inference pipeline — image preprocessing, 3-model forward passes, meta-ensemble fusion, and GradCAM++ heatmap generation — completes in under 60 seconds. Optimized for pure CPU inference.' },
                        { icon: '📝', label: 'Dual-Tier Reports', color: '#10B981', desc: 'Generate tailored post-inference reports on-demand. Receive both a highly technical formal radiologist breakdown and an empathetic, simplified narrative suited for patient communication.' },
                      ].map((f, i) => {
                        const isActive = expandedFeature === f.label;
                        return (
                          <motion.button
                            key={f.label}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + i * 0.12, duration: 0.35, ease: 'easeOut' }}
                            onClick={() => setExpandedFeature(isActive ? null : f.label)}
                            className="relative group cursor-pointer"
                            style={{ willChange: 'transform' }}
                          >
                            {/* Glow ring behind button */}
                            <div
                              className="absolute -inset-1 rounded-2xl blur-md pointer-events-none transition-opacity duration-300"
                              style={{ background: f.color, opacity: isActive ? 0.4 : 0 }}
                            />
                            <div
                              className={`relative flex items-center gap-2 text-[10px] font-bold px-4 py-2.5 rounded-xl border transition-all duration-200 ease-out overflow-hidden uppercase tracking-widest
                                ${isActive
                                  ? (theme === 'dark'
                                    ? 'bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.03]'
                                    : 'bg-white border-blue-400/30 text-gray-800 shadow-xl scale-[1.03]')
                                  : (theme === 'dark'
                                    ? 'bg-white/[0.04] border-white/8 text-white/40 hover:bg-white/[0.08] hover:border-white/15 hover:text-white/70 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-white/80 border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300 hover:text-gray-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]')}`}
                            >
                              {/* Colored left accent */}
                              <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-r-full transition-all duration-200"
                                style={{ backgroundColor: isActive ? f.color : 'transparent', boxShadow: isActive ? `0 0 8px ${f.color}` : 'none' }} />
                              <span className="text-base">{f.icon}</span>
                              <span className="tracking-wide">{f.label}</span>
                              <span
                                className="text-[10px] opacity-40 transition-transform duration-200"
                                style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                              >▾</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Expanding explanation box dropdown */}
                    <AnimatePresence mode="wait">
                      {expandedFeature && (() => {
                        const feature = [
                          { label: '3-Model Ensemble', color: '#00D4FF', desc: 'Three separate deep learning architectures — DenseNet-121, ConvNeXtV2, and MaxViT — each independently analyze your X-ray. Their predictions are fused by an L2 Meta-Learner to produce a single, highly robust diagnosis that outperforms any individual model.' },
                          { label: 'GradCAM++ Heatmap', color: '#8B5CF6', desc: 'Gradient-weighted Class Activation Mapping (GradCAM++) generates a visual heatmap overlay showing exactly which pixels the AI focused on to make its diagnosis. Red/yellow regions = high attention. This makes the AI\'s decision transparent and interpretable for clinicians.' },
                          { label: 'Sub-60s Inference', color: '#F59E0B', desc: 'The entire inference pipeline — image preprocessing, 3-model forward passes, meta-ensemble fusion, and GradCAM++ heatmap generation — completes in under 60 seconds. Optimized for pure CPU inference.' },
                          { label: 'Dual-Tier Reports', color: '#10B981', desc: 'Generate tailored post-inference reports on-demand. Receive both a highly technical formal radiologist breakdown and an empathetic, simplified narrative suited for patient communication.' },
                        ].find(x => x.label === expandedFeature);
                        return (
                          <motion.div
                            ref={explanationRef}
                            key={expandedFeature}
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="w-full mt-4 overflow-hidden z-10"
                            style={{ willChange: 'height, opacity' }}
                          >
                            <div className={`relative rounded-2xl border p-5 mt-1 text-left
                              ${theme === 'dark'
                                ? 'glass-premium border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.3)]'
                                : 'glass-premium-light border-gray-200 shadow-lg'}`}
                            >
                              {/* Colored top accent bar */}
                              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                                style={{ background: `linear-gradient(90deg, transparent, ${feature?.color}, transparent)`, boxShadow: `0 0 12px ${feature?.color}40` }} />
                              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                                {feature?.desc}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Pipeline Visualizer */}
            <AnimatePresence mode="wait">
              {status !== 'idle' && status !== 'error' && !results && (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  data-tour="pipeline-status"
                  className={`relative overflow-hidden rounded-3xl border p-6 w-full
                    ${theme === 'dark' ? 'bg-[#0d1520] border-white/8 shadow-[0_0_30px_rgba(0,212,255,0.06)]' : 'bg-[#F4F6FC] border-indigo-100 shadow-lg'}`}
                >
                  {/* Scanning progress bar at top — pure CSS, never freezes */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
                    <div className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" style={{ animation: 'scanning-slide 1.8s ease-in-out infinite', willChange: 'transform' }} />
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl" style={{ animation: 'spin 2s linear infinite', willChange: 'transform' }}>
                      <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-[#00D4FF]/10' : 'bg-blue-50'}`}>
                        <Activity size={18} className={theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'} />
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-josefin-sans`}>Inference Pipeline</h3>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Multi-Model Processing Active</p>
                    </div>
                  </div>

                  {/* Step indicators with connecting lines */}
                  <div className="flex items-center gap-0 mb-5">
                    {['Parsing', 'Thread Allocation', 'Inference', 'Synthesis'].map((step, i, arr) => {
                      const stepMap = { parsing: 0, distributing: 1, inference: 2, synthesizing: 3 };
                      const cur = stepMap[status] ?? 0;
                      const isDone = cur > i;
                      const isActive = cur === i;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: '60px' }}>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 border-2 relative z-10
                                ${isActive ? 'animate-pulse-glow' : ''}
                                ${isDone ? (theme === 'dark' ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-green-500 text-white border-green-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]')
                                  : isActive ? (theme === 'dark' ? 'bg-[#00D4FF] text-[#0B0F19] border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.5)]' : 'bg-[#00D4FF] text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]')
                                    : (theme === 'dark' ? 'bg-white/5 text-white/25 border-white/10' : 'bg-gray-100 text-gray-400 border-gray-300')}`}
                            >
                              {isDone ? (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6 }}>✓</motion.span>
                              ) : (
                                i + 1
                              )}
                            </div>
                            <span className={`text-[8px] font-bold uppercase tracking-wider text-center leading-tight
                              ${isActive ? (theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600') : isDone ? (theme === 'dark' ? 'text-emerald-400' : 'text-green-600') : (theme === 'dark' ? 'text-white/25' : 'text-gray-400')}`}>{step}</span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`flex-1 h-[3px] rounded-full mx-1 transition-all duration-700 relative -z-0 ${isDone ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : isActive ? 'bg-gradient-to-r from-[#00D4FF]/80 to-transparent' : (theme === 'dark' ? 'bg-white/8' : 'bg-gray-200')}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {status !== 'idle' && status !== 'error' && status !== 'success' && (
                      <div className="w-full"><ActiveStepLog status={status} /></div>
                    )}
                  </AnimatePresence>

                  <p className={`text-[10px] font-semibold mt-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                    <span>⏱️</span> Usually under 60s — models are processing your radiograph...
                  </p>
                </motion.div>
              )}

              {/* ═══ ERROR CARD ═══ */}
              {status === 'error' && (
                <motion.div
                  key="error-card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                  className={`relative overflow-hidden rounded-3xl border p-8 w-full flex flex-col items-center text-center space-y-4
                    ${theme === 'dark' ? 'bg-[#1a0a0a] border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]' : 'bg-red-50 border-red-200 shadow-red-100 shadow-xl'}`}
                >
                  <div
                    className={`p-5 rounded-full animate-gentle-wiggle ${theme === 'dark' ? 'bg-red-500/15 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-red-100'}`}
                  >
                    <XCircle size={52} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>Analysis Could Not Proceed</h3>
                    <p className={`text-sm leading-relaxed max-w-md ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                      {errorMsg.toLowerCase().includes('grayscale') || errorMsg.toLowerCase().includes('color') || errorMsg.toLowerCase().includes('channels')
                        ? '⚠️ The uploaded image does not appear to be a valid chest X-ray. Colour photographs (cat photos, selfies, etc.) are not accepted. Upload a greyscale radiograph in PNG or JPEG format.'
                        : errorMsg.toLowerCase().includes('10mb') || errorMsg.toLowerCase().includes('size')
                          ? '⚠️ File size exceeds the 10 MB limit. Please compress or resize your image.'
                          : errorMsg.toLowerCase().includes('invalid image') || errorMsg.toLowerCase().includes('parsing')
                            ? '⚠️ The file could not be read as an image. Ensure it is a valid PNG or JPEG file.'
                            : errorMsg ? `⚠️ ${errorMsg}` : '⚠️ An unexpected error occurred. Upload a valid chest X-ray image from the sidebar.'}
                    </p>
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${theme === 'dark' ? 'text-white/25' : 'text-gray-400'}`}>← Use the sidebar to upload a new image</p>
                </motion.div>
              )}

              {/* Final Results View */}
              {results && status === 'success' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, type: 'spring', stiffness: 180, damping: 20 }}
                  className="w-full space-y-6"
                  data-tour="diagnosis-result"
                >
                  {/* Inference Time Log */}
                  {results.inference_time_seconds && (
                    <div className="flex justify-end w-full">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 
                        ${theme === 'dark' ? 'bg-[#0d1117] text-gray-400 border border-white/10' : 'bg-white text-gray-500 border border-gray-200 shadow-sm'}`}
                      >
                        <span className="text-sm">⏱️</span>
                        <span>Predicted in {results.inference_time_seconds < 60 ? `${Math.round(results.inference_time_seconds)}s` : `${Math.floor(results.inference_time_seconds / 60)}m ${Math.round(results.inference_time_seconds % 60)}s`}</span>
                      </div>
                    </div>
                  )}

                  {/* Premium Diagnosis Banner */}
                  {(() => {
                    const isNormal = results.prediction.toLowerCase() === 'normal';
                    const isPleural = results.prediction.toLowerCase() === 'pleural effusion';
                    const accColor = isNormal ? '#10B981' : isPleural ? '#F59E0B' : '#EF4444';
                    const accGlow = isNormal ? 'rgba(16,185,129,0.25)' : isPleural ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)';
                    const gradFrom = isNormal ? '#10B981' : isPleural ? '#F59E0B' : '#EF4444';
                    const gradTo = isNormal ? '#059669' : isPleural ? '#D97706' : '#DC2626';
                    const icon = isNormal ? '🫁' : isPleural ? '💧' : '🦠';
                    const pct = parseFloat((results.confidence_score * 100).toFixed(2));
                    // SVG ring params
                    const r = 44, circ = 2 * Math.PI * r;
                    // stroke-dashoffset computed for potential SVG ring usage
                    void (circ - (pct / 100) * circ);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                        className={`relative overflow-hidden rounded-3xl border ${theme === 'dark' ? 'border-white/10 bg-[#0d1117]' : 'border-gray-200 bg-white'} shadow-2xl`}
                        style={{ boxShadow: `0 0 60px ${accGlow}` }}
                      >
                        {/* Animated Gradient Background */}
                        <div
                          className="absolute inset-0 pointer-events-none animate-gentle-pulse"
                          style={{ background: `radial-gradient(ellipse at 20% 50%, ${gradFrom}33 0%, transparent 65%)` }}
                        />
                        <div
                          className="absolute inset-0 pointer-events-none animate-gentle-pulse-delay"
                          style={{ background: `radial-gradient(ellipse at 80% 50%, ${gradTo}22 0%, transparent 65%)` }}
                        />

                        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">

                          {/* Left — Diagnosis Info */}
                          <div className="flex-1 min-w-0">
                            {/* Icon + Label */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`animate-gentle-wiggle inline-flex items-center justify-center ${typeof icon === 'string' ? 'text-4xl' : ''}`} style={{ width: 40, height: 40 }}>{icon}</div>
                              <span className={`text-xs font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full border`}
                                style={{ color: accColor, borderColor: `${accColor}44`, background: `${accColor}11` }}>
                                AI Clinical Diagnosis
                              </span>
                            </div>

                            {/* Prediction */}
                            <motion.h2
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1, type: 'spring' }}
                              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 font-josefin-sans"
                              style={{ color: accColor }}
                            >
                              {results.prediction}
                            </motion.h2>

                            {/* Ground Truth Pill */}
                            {results.ground_truth && results.ground_truth !== 'Unknown' && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border mb-4
                                  ${results.is_correct
                                    ? (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700')
                                    : (theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-300 text-red-700')}`}
                                style={{ boxShadow: results.is_correct ? '0 0 14px rgba(16,185,129,0.2)' : '0 0 14px rgba(239,68,68,0.2)' }}
                              >
                                {results.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                <span className={`text-xs uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>True Label:</span>
                                <span>{results.ground_truth}</span>
                                <span className="text-xs">{results.is_correct ? '✓ Correct' : '✗ Incorrect'}</span>
                              </motion.div>
                            )}

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {[
                                { label: '3 Models', icon: '🧠' },
                                { label: 'L2 Meta-Ensemble', icon: '⚗️' },
                                { label: 'GradCAM++ Active', icon: '🔬' },
                              ].map((s) => (
                                <motion.span key={s.label}
                                  whileHover={{ scale: 1.08, y: -2 }}
                                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-default transition-all duration-300
                                    ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-[#00D4FF]/30 hover:text-white/80 hover:shadow-[0_0_12px_rgba(0,212,255,0.12)]' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md'}`}>
                                  {s.icon} {s.label}
                                </motion.span>
                              ))}
                            </div>
                          </div>

                          {/* Right — Animated Confidence Ring (SVG-native, no overlap) */}
                          <div className="flex flex-col items-center gap-2 flex-shrink-0">
                            <svg width="140" height="140" viewBox="0 0 100 100">
                              {/* Outer glow ring */}
                              <circle cx="50" cy="50" r="48" fill="none"
                                stroke={`${accColor}15`}
                                strokeWidth="1" />
                              {/* Track ring */}
                              <circle cx="50" cy="50" r={r} fill="none"
                                stroke={theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}
                                strokeWidth="9" />
                              {/* Unified Synchronous Progress Ring + Text */}
                              <AnimatedProgressRing key={`ring-${pct}-${results.prediction}`} target={pct} color={accColor} />
                              <text x="50" y="60" textAnchor="middle" dominantBaseline="middle"
                                fill={theme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                                fontSize="7" fontWeight="700" fontFamily="inherit"
                                letterSpacing="1.5"
                              >CONFIDENCE</text>
                            </svg>
                            <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                              Meta-Ensemble Score
                            </p>
                          </div>

                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* 2 Col Viz (Images Side By Side) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mb-6 items-start">
                    {/* ═══ ORIGINAL SCAN CARD ═══ */}
                    <motion.div
                      initial={{ opacity: 0, x: -15, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
                      whileHover={{ y: -3 }}
                      data-tour="xray-preview"
                      className={`relative flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover-lift
                        ${theme === 'dark' ? 'bg-[#0d1520] border-white/8 hover:border-[#00D4FF]/25 hover:shadow-[0_0_30px_rgba(0,212,255,0.08)]' : 'bg-white border-gray-100 shadow-xl hover:border-indigo-200 hover:shadow-2xl'}`}
                    >
                      {/* Card Header */}
                      <div className={`flex justify-between items-center px-4 sm:px-5 py-3 border-b
                        ${theme === 'dark' ? 'border-white/6 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                        <div className="flex items-center gap-2">
                          <ScanSearch size={18} strokeWidth={2.5} className="text-[#00D4FF]" />
                          <span className={`text-[13px] sm:text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-josefin-sans`}>Real-time AI Scan Preview</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          disabled={!previewUrl}
                          onClick={() => handleFullscreenImage(previewUrl)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all uppercase tracking-wider
                            ${!previewUrl ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                            ${theme === 'dark' ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 text-[#00D4FF] hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:bg-[#00D4FF]/20' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm'}`}
                        >
                          <Maximize2 size={12} strokeWidth={2.5} /> Expand
                        </motion.button>
                      </div>
                      <div
                        className={`flex-1 flex items-center justify-center relative cursor-crosshair p-0 sm:p-2 min-h-[280px] sm:min-h-[320px] overflow-hidden
                          ${theme === 'dark' ? 'bg-[#05080f]' : 'bg-gray-100'}`}
                        onMouseMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); setZoomPos1({ x: ((e.clientX - b.left) / b.width) * 100, y: ((e.clientY - b.top) / b.height) * 100, show: true }); }}
                        onMouseLeave={() => setZoomPos1({ ...zoomPos1, show: false })}
                      >
                        {/* Background Grid for techy look */}
                        {theme === 'dark' && (
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBoMjBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDE5LjVoMjB2LTFIMHoxOS41IDB2MjBoLTFWMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 z-0 pointer-events-none" />
                        )}

                        <img src={previewUrl} alt="Uploaded" className="scan-image object-contain w-full h-full sm:rounded-xl transition-transform duration-200 relative z-10"
                          style={zoomPos1.show ? { transformOrigin: `${zoomPos1.x}% ${zoomPos1.y}%`, transform: 'scale(2.5)' } : {}} />

                        {status !== 'idle' && status !== 'error' && status !== 'success' && (
                          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-none sm:rounded-xl">

                            {/* The sweeping cyan laser line — inline animation for reliability */}
                            <div className="absolute left-0 right-0 h-[120px] flex flex-col justify-center" style={{ animation: 'scan-laser-sweep 2s ease-in-out infinite', willChange: 'top' }}>
                              {/* Top Fade */}
                              <div className="w-full h-[60px] bg-gradient-to-t from-[#00D4FF]/20 to-transparent" />
                              {/* Core Laser */}
                              <div className="w-full h-[3px] bg-white shadow-[0_0_20px_#00D4FF,0_0_40px_#00D4FF]" />
                              {/* Bottom Fade */}
                              <div className="w-full h-[60px] bg-gradient-to-b from-[#00D4FF]/20 to-transparent" />
                            </div>

                            {/* Animated Targeting Corners (Cyan) */}
                            <div className="absolute inset-0 flex p-2">
                              <div className="relative w-full h-full opacity-80">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00D4FF]" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00D4FF]" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00D4FF]" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00D4FF]" />
                              </div>
                            </div>

                            {/* Center Target Box */}
                            <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-[#00D4FF]/30 rounded-lg flex items-center justify-center pointer-events-none animate-target-pulse">
                              <div className="w-2 h-2 rounded-full bg-[#00D4FF]/50" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* ═══ GRADCAM CARD ═══ */}
                    <motion.div
                      initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      whileHover={{ y: -3 }}
                      data-tour="gradcam-card"
                      className={`relative flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover-lift
                        ${theme === 'dark' ? 'bg-[#0d1520] border-white/8 hover:border-[#FF0080]/25 hover:shadow-[0_0_30px_rgba(255,0,128,0.08)]' : 'bg-white border-gray-100 shadow-xl hover:border-pink-200 hover:shadow-2xl'}`}
                    >
                      {/* Card Header */}
                      <div className={`flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b
                        ${theme === 'dark' ? 'border-white/6 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                        {/* Title + badge */}
                        <div className="flex items-center gap-2 min-w-0 flex-shrink">
                          <div className="w-2 h-2 flex-shrink-0 rounded-full bg-[#FF0080] animate-pulse-dot" style={{ boxShadow: '0 0 8px rgba(255,0,128,0.8)' }} />
                          <span className={`text-[13px] sm:text-sm font-bold tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-josefin-sans`}>AI Attention Map</span>
                          <span className={`hidden sm:inline-flex flex-shrink-0 items-center justify-center text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border group relative overflow-hidden
                            ${theme === 'dark' ? 'border-[#FF0080]/30 text-[#FF0080] bg-[#FF0080]/10' : 'border-pink-300 text-pink-600 bg-pink-50'}`}>
                            <span className="relative z-10">GradCAM++</span>
                            {theme === 'dark' && <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#FF0080]/30 to-transparent animate-shimmer-sweep" />}
                          </span>
                        </div>
                        {/* Buttons */}
                        <div className="flex flex-shrink-0 gap-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            disabled={!results || !results.heatmap_base64 || isDownloading}
                            onClick={handleDownloadHeatmap}
                            title="Download heatmap"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all uppercase tracking-wider
                               ${(!results || !results.heatmap_base64) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                               ${theme === 'dark' ? 'bg-[#FF0080]/10 border-[#FF0080]/30 text-[#FF0080] hover:shadow-[0_0_15px_rgba(255,0,128,0.2)] hover:bg-[#FF0080]/20' : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100 hover:border-pink-300 hover:shadow-sm'}`}
                          >
                            <Download size={12} strokeWidth={2.5} className={isDownloading ? 'animate-bounce' : ''} />
                            <span className="hidden sm:inline">{isDownloading ? 'Saving...' : 'Save'}</span>
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            disabled={!results || !results.heatmap_base64}
                            onClick={() => handleFullscreenImage(results?.heatmap_base64, true)}
                            title="View fullscreen"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all uppercase tracking-wider
                               ${(!results || !results.heatmap_base64) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                               ${theme === 'dark' ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 text-[#00D4FF] hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:bg-[#00D4FF]/20' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm'}`}
                          >
                            <Maximize2 size={12} strokeWidth={2.5} />
                            <span className="hidden sm:inline">Expand</span>
                          </motion.button>
                        </div>
                      </div>
                      <div
                        className={`flex-1 flex items-center justify-center relative cursor-crosshair p-2 min-h-[280px] overflow-hidden
                          ${theme === 'dark' ? 'bg-black/50' : 'bg-gray-50'}`}
                        onMouseMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); setZoomPos2({ x: ((e.clientX - b.left) / b.width) * 100, y: ((e.clientY - b.top) / b.height) * 100, show: true }); }}
                        onMouseLeave={() => setZoomPos2({ ...zoomPos2, show: false })}
                      >
                        {results.heatmap_base64 ? (
                          <img src={`data:image/png;base64,${results.heatmap_base64}`} alt="GradCAM"
                            className="scan-image object-contain rounded-xl transition-transform duration-200"
                            style={zoomPos2.show ? { transformOrigin: `${zoomPos2.x}% ${zoomPos2.y}%`, transform: 'scale(2.5)' } : {}} />
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-10 h-10" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke={theme === 'dark' ? 'rgba(0,212,255,0.1)' : 'rgba(37,99,235,0.1)'} strokeWidth="3" fill="none" />
                              <circle cx="12" cy="12" r="10" stroke={theme === 'dark' ? '#00D4FF' : '#2563EB'} strokeWidth="3" strokeDasharray="16 46" strokeLinecap="round" fill="none">
                                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                              </circle>
                            </svg>
                            <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Generating attention map...</p>
                          </div>
                        )}
                        {/* Spectrum legend */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
                          <span className="text-[9px] text-white/50 font-bold">Low</span>
                          <div className="w-20 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #3B82F6, #10B981, #FBBF24, #EF4444)' }} />
                          <span className="text-[9px] text-white/50 font-bold">High</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* ═══ HEATMAP DISCLAIMER (all cases) ═══ */}
                    {results.heatmap_base64 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border backdrop-blur-sm ${theme === 'dark'
                          ? 'bg-amber-500/5 border-amber-500/15'
                          : 'bg-amber-50 border-amber-200/50'}`}
                      >
                        <span className="text-xs animate-pulse">{'\u{1F4A1}'}</span>
                        <p className={`text-[11px] leading-snug ${theme === 'dark' ? 'text-amber-200/70' : 'text-amber-700'}`}>
                          This heatmap shows <strong>where the AI paid attention</strong> to make its decision &mdash; <strong>not</strong> where the disease is.
                        </p>
                      </motion.div>
                    )}

                    {/* ═══ WHY HEATMAP FOR NORMAL? ═══ */}
                    {results.prediction?.toLowerCase() === 'normal' && results.heatmap_base64 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4, type: 'spring', stiffness: 120 }}
                        className="mt-2"
                      >
                        <button
                          onClick={() => setShowNormalHeatmapExplain(!showNormalHeatmapExplain)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 group relative overflow-hidden
                            ${theme === 'dark'
                              ? 'bg-[#0d1520]/80 border-emerald-500/20 hover:border-emerald-400/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]'
                              : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:shadow-lg'}`}
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: theme === 'dark' ? 'linear-gradient(90deg, transparent, rgba(16,185,129,0.05), transparent)' : 'linear-gradient(90deg, transparent, rgba(16,185,129,0.08), transparent)', backgroundSize: '200% 100%', animation: 'shimmer-fast 2s linear infinite' }} />
                          <span className="text-base relative z-10">{'\u{1F914}'}</span>
                          <span className={`text-[12px] font-semibold flex-1 text-left relative z-10 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            Why heatmap for a Normal case?
                          </span>
                          <motion.span
                            animate={{ rotate: showNormalHeatmapExplain ? 180 : 0 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                            className={`text-xs relative z-10 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}
                          >
                            {'\u25BC'}
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {showNormalHeatmapExplain && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, scale: 0.98 }}
                              animate={{ height: 'auto', opacity: 1, scale: 1 }}
                              exit={{ height: 0, opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className={`mt-1.5 p-4 rounded-xl border space-y-2.5 ${theme === 'dark'
                                ? 'bg-[#0d1520] border-white/6'
                                : 'bg-white border-gray-100'}`}>
                                {[
                                  { icon: '\u{1F50D}', title: 'Verifies AI Focus', desc: 'Confirms that the AI examined the correct lung areas to reach its Normal conclusion, not random edges or artifacts.' },
                                  { icon: '\u26A0\uFE0F', title: 'Catches Hidden Uncertainty', desc: 'If certain areas glow warm (0.4\u20130.6), the AI may be slightly unsure, prompting a radiologist to double-check.' },
                                  { icon: '\u{1F4CB}', title: 'Complete Audit Trail', desc: 'Every scan gets a visual record of the AI\u2019s reasoning, supporting transparent and evidence-based diagnostics.' },
                                ].map((item, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.12, duration: 0.3 }}
                                    className={`flex gap-3 p-2.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                  >
                                    <span className="text-base mt-0.5">{item.icon}</span>
                                    <div>
                                      <p className={`text-[13px] font-bold ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>{item.title}</p>
                                      <p className={`text-[12px] leading-relaxed mt-0.5 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{item.desc}</p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                  </div>

                  {/* ═══ PROBABILITY CHART ═══ */}
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 100 }}
                    whileHover={{ scale: 1.02 }}
                    data-tour="probability-bars"
                    className={`relative overflow-hidden rounded-3xl border p-6 w-full cursor-default group transition-all duration-500 hover:shadow-2xl hover:border-[#00D4FF]/50
                      ${theme === 'dark' ? 'bg-[#0d1520] border-white/8 hover:shadow-[0_0_50px_rgba(0,212,255,0.08)]' : 'bg-white border-gray-100 shadow-xl'}`}
                  >
                    {/* Animated top border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, #8B5CF6, #FF0080, transparent)', backgroundSize: '200% 100%', animation: 'shimmer-fast 3s linear infinite' }} />

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className={`font-bold text-base tracking-tight ${theme === 'dark' ? 'text-white/95' : 'text-gray-900'} font-josefin-sans`}>
                          Class Probability Distribution
                        </h4>
                        <p className={`text-[10px] font-medium uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                          Meta-Ensemble Logistic Regression Output
                        </p>
                      </div>
                      <span className={`text-[10px] px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider border
                        ${theme === 'dark' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        Logistic Meta-Ensemble
                      </span>
                    </div>

                    <div className="space-y-5">
                      {chartData
                        .sort((a, b) => b.value - a.value)
                        .map((entry, index) => {
                          const isNormal = entry.name.toLowerCase() === 'normal';
                          const isPleural = entry.name.toLowerCase() === 'pleural effusion';
                          const barColor = isNormal ? '#10B981' : isPleural ? '#F59E0B' : '#EF4444';
                          const gradient = isNormal
                            ? 'from-emerald-400 to-teal-500'
                            : isPleural
                              ? 'from-amber-400 to-orange-500'
                              : 'from-rose-500 to-pink-500';
                          const isLeading = index === 0;
                          return (
                            <div key={entry.name}
                              className={`group/bar space-y-2 p-3 -mx-3 rounded-xl cursor-default transition-colors duration-200
                                ${theme === 'dark' ? 'hover:bg-white/[0.04]' : 'hover:bg-blue-50/50'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}66` }}
                                    className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                                  />
                                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>{entry.name}</span>
                                  {isLeading && (
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border
                                      ${theme === 'dark' ? 'bg-white/8 text-white/60 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                      ⭐ Top
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
                                  {entry.value.toFixed(2)}%
                                </span>
                              </div>
                              <div className={`relative h-7 rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(entry.value, 2)}%` }}
                                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.1 }}
                                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-end`}
                                  style={{ boxShadow: isLeading ? `0 0 16px ${barColor}40` : 'none' }}
                                >
                                  {/* Static inner shine — no JS animation */}
                                  <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                                  {entry.value > 8 && (
                                    <span className="text-[11px] font-bold text-white drop-shadow-md pr-3 z-10 whitespace-nowrap tabular-nums">
                                      {entry.value.toFixed(2)}%
                                    </span>
                                  )}
                                </motion.div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>

                  {/* ═══ AI CLINICAL NARRATIVES & CDSS ASSISTANT ═══ */}
                  <motion.div
                    ref={resultsRef}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 22 }}
                    className="mt-6 flex flex-col lg:flex-row gap-6 w-full"
                  >
                    {/* Scroll Down Indicator */}
                    <AnimatePresence>
                      {showScrollHint && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-1 pointer-events-none"
                        >
                          <span className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md border ${theme === 'dark' ? 'bg-[#0d1520]/80 border-[#00D4FF]/30 text-[#00D4FF]' : 'bg-white/90 border-blue-200 text-blue-600 shadow-lg'}`}>
                            ↓ Scroll down for AI Narratives
                          </span>
                          <div className="animate-bounce-arrow">
                            <ChevronDown size={20} className={theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* NLG Reports Panel */}
                    <div data-tour="reports-panel" className={`flex-1 rounded-3xl border p-6 flex flex-col relative overflow-hidden
                      ${theme === 'dark' ? 'bg-[#0d1520] border-white/8' : 'bg-white border-gray-100 shadow-xl'}`}>
                      {reportsLoading[activeReportTab] && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                          <svg className="w-12 h-12 mb-4" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="rgba(0,212,255,0.1)" strokeWidth="4" fill="none" />
                            <circle cx="12" cy="12" r="10" stroke="#00D4FF" strokeWidth="4" strokeDasharray="16 46" strokeLinecap="round" fill="none">
                              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="12" cy="12" r="10" stroke="#FF0080" strokeWidth="4" strokeDasharray="8 54" strokeLinecap="round" fill="none">
                              <animateTransform attributeName="transform" type="rotate" from="360 12 12" to="0 12 12" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          </svg>
                          <p className="text-[#00D4FF] font-bold text-sm tracking-widest animate-[pulse_1.5s_ease-in-out_infinite]">Generating Custom Azure Inference...</p>
                        </div>
                      )}

                      <div className="flex flex-col items-start gap-3 mb-6">
                        <h4 className={`font-bold text-base tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-josefin-sans`}>
                          AI Clinical Narratives
                        </h4>
                        <div className={`flex p-1.5 rounded-[14px] border w-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b0f19] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                          <button
                            onClick={() => setActiveReportTab('radiologist')}
                            className={`relative flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-500 cursor-pointer uppercase tracking-widest ${activeReportTab === 'radiologist' ? (theme === 'dark' ? 'text-white' : 'text-blue-600 bg-white shadow-sm border border-blue-100') : (theme === 'dark' ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-800')}`}>
                            {activeReportTab === 'radiologist' && theme === 'dark' && (
                              <motion.div layoutId="activeTabBadge" className="absolute inset-0 bg-[#1a2332] rounded-xl border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.5)]" style={{ zIndex: 0 }} />
                            )}
                            <span className="relative z-10">Radiologist</span>
                          </button>
                          <button
                            onClick={() => setActiveReportTab('patient')}
                            className={`relative flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-500 cursor-pointer uppercase tracking-widest ${activeReportTab === 'patient' ? (theme === 'dark' ? 'text-white' : 'text-pink-600 bg-white shadow-sm border border-pink-100') : (theme === 'dark' ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-800')}`}>
                            {activeReportTab === 'patient' && theme === 'dark' && (
                              <motion.div layoutId="activeTabBadge" className="absolute inset-0 bg-[#1a2332] rounded-xl border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.5)]" style={{ zIndex: 0 }} />
                            )}
                            <span className="relative z-10">Patient</span>
                          </button>
                        </div>
                      </div>

                      <div className={`flex-1 flex flex-col items-center justify-center pr-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {reportsData[activeReportTab] ? (
                          <div className="w-full h-full pr-2 flex flex-col relative">
                            <div className="flex justify-end mb-3 gap-2">
                              <button
                                onClick={() => handleSpeakReport(reportsData[activeReportTab], activeReportTab)}
                                className={`px-4 py-2.5 rounded-xl font-bold text-[10px] shadow-sm transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border uppercase tracking-widest
                                  ${speakingReport === activeReportTab
                                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                                    : theme === 'dark' ? 'border-white/10 hover:border-[#00D4FF]/50 bg-[#0d1520] hover:bg-white/5 text-[#00D4FF]' : 'border-blue-200 bg-white text-blue-600 shadow-md hover:border-blue-400 hover:shadow-lg'}`}
                                title={speakingReport === activeReportTab ? 'Stop' : 'Read aloud'}
                              >
                                <Volume2 size={15} className={speakingReport === activeReportTab ? 'animate-pulse' : ''} />
                                <span>{speakingReport === activeReportTab ? 'Stop' : 'Listen'}</span>
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(activeReportTab)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-[10px] shadow-sm transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border uppercase tracking-widest relative overflow-hidden ${theme === 'dark' ? 'border-white/10 hover:border-[#00D4FF]/50 bg-[#0d1520] hover:bg-white/5 text-[#00D4FF] hover:shadow-[0_0_25px_rgba(0,212,255,0.25)]' : 'border-blue-200 bg-white text-blue-600 shadow-md hover:border-blue-400 hover:shadow-lg'}`}
                              >
                                <div className="relative z-10 flex items-center gap-2">
                                  <Download size={15} strokeWidth={3} />
                                  <span>{activeReportTab === 'radiologist' ? 'Download PDF' : 'Download PDF'}</span>
                                </div>
                                <div className={`absolute inset-y-0 w-1/3 pointer-events-none animate-shimmer-sweep-slow ${theme === 'dark' ? 'bg-gradient-to-r from-transparent via-[#00D4FF]/10 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400/10 to-transparent'}`} />
                              </button>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar flex-1 pb-2">
                              {activeReportTab === 'radiologist' ? (
                                <div className={`text-[14px] leading-[1.85] p-6 rounded-xl border shadow-inner prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:font-bold
                                  ${theme === 'dark' ? 'bg-black/30 border-white/5 text-gray-200 prose-invert prose-strong:text-white' : 'bg-gray-50 border-gray-200 text-gray-700 prose-strong:text-gray-900'}`}
                                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, letterSpacing: '0.01em' }}>
                                  <ReactMarkdown>{reportsData.radiologist}</ReactMarkdown>
                                </div>
                              ) : (
                                <div className={`text-[15px] leading-[1.9] p-6 rounded-xl border shadow-inner prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:font-bold
                                  ${theme === 'dark' ? 'bg-gradient-to-br from-[#00D4FF]/5 to-[#FF0080]/5 border-white/5 text-gray-200 prose-invert prose-strong:text-white' : 'bg-gradient-to-br from-blue-50/50 to-pink-50/50 border-gray-200 text-gray-700 prose-strong:text-gray-900'}`}
                                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, letterSpacing: '0.015em' }}>
                                  <ReactMarkdown>{reportsData.patient}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 mt-4">
                            <Activity size={32} className={`mb-4 opacity-50 ${theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-500'}`} />
                            <p className="text-sm opacity-70 mb-6 max-w-xs">
                              Generate a tailored linguistic interpretation of the current diagnostic findings.
                            </p>
                            <button
                              onClick={() => handleGenerateReport(activeReportTab)}
                              className={`px-8 py-4 rounded-2xl font-bold text-xs shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all duration-500 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 cursor-pointer uppercase tracking-[0.15em] relative group/btn overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-r from-[#1a2332] to-[#0d1520] border border-white/20 hover:border-[#00D4FF]/50 text-white' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-400 hover:shadow-xl'}`}
                            >
                              {theme === 'dark' && (
                                <div className={`absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${activeReportTab === 'radiologist' ? 'from-[#00D4FF]/30 to-[#8B5CF6]/30' : 'from-[#8B5CF6]/30 to-[#FF0080]/30'}`} />
                              )}
                              {theme === 'dark' && (
                                <div className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500 ${activeReportTab === 'radiologist' ? 'group-hover/btn:shadow-[inset_0_0_30px_rgba(0,212,255,0.4)]' : 'group-hover/btn:shadow-[inset_0_0_30px_rgba(255,0,128,0.4)]'}`} />
                              )}
                              <span className={`relative z-10 transition-colors duration-300 text-white`}>
                                Generate {activeReportTab === 'radiologist' ? 'Radiologist' : 'Patient'} Report
                              </span>
                              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-sweep pointer-events-none" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Empty State placeholder OR Processing Scanner Preview */}
            {!results && file && status !== 'idle' && status !== 'error' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`w-full mt-6 glass-panel p-6 border ${theme === 'dark' ? 'border-[#00D4FF]/30' : 'border-blue-300'}`}
              >
                <h4 className={`text-center font-bold mb-4 flex items-center justify-center text-base md:text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <ScanSearch className={`mr-2 ${theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'}`} size={20} />
                  Real-time AI Scan Preview
                </h4>
                <div className={`w-full max-w-sm mx-auto h-48 md:h-64 rounded-xl overflow-hidden flex items-center justify-center border relative transition-transform hover:scale-[1.02] ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300 shadow-inner'}`}>
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain opacity-50" />
                  <ScannerPreviewBar theme={theme} />
                </div>
              </motion.div>
            )}

          </motion.div>
        </div >

        {/* ═══════════ FAQ Section ═══════════ */}
        <div id="faq-section" data-tour="faq-section" className="w-full mt-10 mb-4">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-shimmer`}>❓ Frequently Asked Questions</h2>
            <p className={`text-sm md:text-base ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Common questions about the AI diagnostic system</p>
          </div>
          <div className="flex flex-col gap-2.5 max-w-3xl mx-auto stagger-fade-in">
            {[
              { q: 'How accurate is the AI diagnosis?', a: 'Our ensemble of 3 deep-learning models (DenseNet-121, ConvNeXtV2-Base, MaxViT-Base) achieves high diagnostic accuracy through meta-learner synthesis. However, all results should be validated by a certified radiologist or physician.' },
              { q: 'What conditions can the system detect?', a: 'The system classifies chest X-rays into 3 categories: Normal (healthy), Pneumonia (lung infection), and Pleural Effusion (fluid buildup around the lungs). The diagnosis is powered by 3 deep learning models fused through a meta-learner ensemble for maximum accuracy.' },
              { q: 'Is my patient data stored or shared?', a: 'No. All processing happens in real-time on our servers. Uploaded images are not stored after analysis is complete. Patient metadata (ID, age, gender) is used only for report generation and is never persisted or shared with third parties.' },
              { q: 'How does the GradCAM++ heatmap work?', a: 'GradCAM++ (Gradient-weighted Class Activation Mapping) visualizes which regions of the X-ray the AI focused on during classification. Red/yellow areas indicate high attention regions that influenced the diagnosis, providing explainability for clinical decision-making.' },
              { q: 'Can I use this system for clinical diagnosis?', a: 'This system is designed as a Clinical Decision Support System (CDSS) — an assistive tool to aid medical professionals. It is NOT a replacement for professional medical diagnosis. Always consult a certified radiologist or physician for final diagnostic decisions.' },
              { q: 'What image formats are supported?', a: 'The system accepts any valid image format including PNG, JPEG, JPG, and WEBP (up to 10MB). All uploaded images are automatically preprocessed and converted to 512×512 PNG format before AI analysis. Images are validated to ensure they are genuine chest radiographs.' },
            ].map((faq, i) => (
              <div key={i}
                className={`faq-item rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer
                  ${theme === 'dark'
                    ? `bg-[#0d1520]/60 border-white/8 hover:border-[#00D4FF]/30 ${openFaq === i ? 'border-[#00D4FF]/40 shadow-[0_0_20px_rgba(0,212,255,0.08)]' : ''}`
                    : `bg-white border-gray-200 hover:border-blue-300 shadow-sm ${openFaq === i ? 'border-blue-400 shadow-md' : ''}`}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className={`flex items-center justify-between px-6 py-5 ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-blue-50/30'}`}>
                  <span className={`text-[15px] font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-black ${theme === 'dark' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 'bg-blue-100 text-blue-600'}`}>{i + 1}</span>
                    {faq.q}
                  </span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown size={18} className={`${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`} />
                  </motion.div>
                </div>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className={`px-6 pb-5 pt-2 text-[14.5px] leading-[1.9] ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ Medical Disclaimer ═══════════ */}
        <div className={`w-full mt-6 mb-2 py-8 px-6 text-center border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
          <div className={`flex items-center justify-center gap-2.5 mb-4 ${theme === 'dark' ? 'text-amber-400/80' : 'text-amber-600'}`}>
            <Shield size={20} />
            <span className="text-[13px] font-bold uppercase tracking-[0.2em]">Medical Disclaimer</span>
          </div>
          <p className={`text-[14px] leading-[2] max-w-2xl mx-auto ${theme === 'dark' ? 'text-white/45' : 'text-gray-500'}`}>
            This AI-powered Clinical Decision Support System is designed to <strong className={theme === 'dark' ? 'text-white/65' : 'text-gray-700'}>assist</strong> medical professionals — not replace them.
            All diagnostic outputs, heatmaps, and reports are for <strong className={theme === 'dark' ? 'text-white/65' : 'text-gray-700'}>informational purposes only</strong> and must be
            reviewed by a certified radiologist or physician before any clinical decision is made.
            <strong className={theme === 'dark' ? 'text-white/65' : 'text-gray-700'}> Professional medical consultation is always necessary.</strong>
          </p>
          <p className={`mt-4 text-[13px] italic ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
            &quot;Empowering clinicians with AI insight — because better tools lead to better outcomes.&quot;
          </p>
        </div>

      </div >

      {/* Fullscreen Overlay Modal with Circular Magnifier */}
      < AnimatePresence >
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
            onClick={() => { setFullscreenImage(null); setFsMousePos(p => ({ ...p, show: false })); }}
          >
            {/* Close Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors duration-200 shadow-2xl z-50 group cursor-pointer"
              title="Close Full Screen"
            >
              <XCircle size={32} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Hint */}
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs italic z-50 pointer-events-none">
              🔍 Hover over the image to activate magnifier lens
            </p>

            {/* Main Image */}
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              src={fullscreenImage}
              alt="Fullscreen Viewer"
              className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-crosshair select-none"
              onClick={(e) => e.stopPropagation()}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // Clamp to 0-100%
                const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
                const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

                // Show magnifier ONLY if inside image bounds
                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                  // Direct DOM manipulation guarantees perfect cursor-sync without React re-render queueing
                  const mag = document.getElementById('fs-magnifier');
                  if (mag) {
                    mag.style.opacity = "1";
                    mag.style.backgroundPosition = `${pctX}% ${pctY}%`;
                  }
                } else {
                  const mag = document.getElementById('fs-magnifier');
                  if (mag) mag.style.opacity = "0";
                }
              }}
              onMouseLeave={() => {
                const mag = document.getElementById('fs-magnifier');
                if (mag) mag.style.opacity = "0";
              }}
            />

            {/* Circular Magnifier Lens — fixed at bottom-right, shows zoomed crop */}
            <div
              id="fs-magnifier"
              style={{
                width: 230,
                height: 230,
                backgroundImage: `url(${fullscreenImage})`,
                backgroundSize: '400%', // 4x optical zoom
                backgroundPosition: `50% 50%`,
                backgroundRepeat: 'no-repeat',
                opacity: 0,
                transition: 'opacity 0.2s ease-out'
              }}
              className="fixed bottom-10 right-10 z-[10000] rounded-full border-4 border-white/30 shadow-[0_0_40px_rgba(0,212,255,0.5),0_0_0_2px_rgba(255,255,255,0.1)] pointer-events-none overflow-hidden"
            >
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[1px] h-6 bg-white/50" />
                <div className="w-6 h-[1px] bg-white/50 absolute" />
              </div>
              {/* Ring label */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[9px] font-bold text-white/60 tracking-widest uppercase">4× Zoom</span>
              </div>
            </div>
          </motion.div>
        )
        }
      </AnimatePresence >


      {/* GLOBAL FLOATING AI ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <>
              {/* Backdrop for mobile to click-out */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsChatOpen(false)}
                className="fixed inset-0 z-[190] bg-black/20 backdrop-blur-sm lg:hidden"
              />
              {/* The Side Drawer */}
              <motion.div
                initial={{ x: '100%', opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.8 }}
                className={`fixed top-0 right-0 h-[100dvh] z-[200] shadow-[-10px_0_40px_rgba(0,0,0,0.4)] flex flex-col border-l ${isChatFullScreen ? 'w-full' : 'w-[100%] sm:w-[400px] lg:w-[40%] xl:w-[40%]'} ${theme === 'dark' ? 'bg-[#0d1520]/95 backdrop-blur-xl border-[#00D4FF]/20 text-white' : 'bg-white/95 backdrop-blur-xl border-blue-200 text-gray-900'}`}
              >
                <div className={`p-4 lg:p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/10 bg-gradient-to-r from-[#00D4FF]/10 to-transparent' : 'border-blue-100 bg-gradient-to-r from-blue-50 to-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00D4FF] to-[#8B5CF6] flex items-center justify-center p-[2px] shadow-lg">
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#0d1520]' : 'bg-white'}`}>
                        <Bot size={18} className="text-[#00D4FF]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg tracking-tight">System AI Assistant</h4>
                      <p className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse dot-1"></span> Intelligent Context
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setIsChatFullScreen(!isChatFullScreen)} className={`p-2 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'}`} title="Full Screen">
                      {isChatFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button onClick={() => { setIsChatMinimized(true); setIsChatOpen(false); }} className={`p-2 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800'}`} title="Minimize">
                      <Minus size={18} />
                    </button>
                    <button onClick={() => setIsChatOpen(false)} className={`p-2 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`} title="Close Chat">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {!isChatInitialized ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    {/* Background animated glow for empty state */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-[#00D4FF]/20 via-[#8B5CF6]/20 to-[#FF0080]/20 rounded-full blur-[60px] animate-[pulse_6s_ease-in-out_infinite]" />
                    <div className={`relative w-28 h-28 mb-8 rounded-full flex items-center justify-center border-0 shadow-[0_0_50px_rgba(0,212,255,0.3)] animate-float ${theme === 'dark' ? 'bg-[#0d1520]' : 'bg-white'}`}>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00D4FF] via-[#8B5CF6] to-[#FF0080] p-[2px] animate-[spin_4s_linear_infinite]" style={{ maskImage: 'linear-gradient(#fff 0 0)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)' }}></div>
                      <Bot size={48} className={`relative z-10 animate-pulse ${theme === 'dark' ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Got a medical question?</h3>
                    <p className={`text-[15px] max-w-sm mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      The AI Assistant can help explain diagnostic confidence scores, summarize heatmaps, or answer general medical inquiries.
                    </p>
                    <button
                      onClick={() => {
                        setIsChatInitialized(true);

                        const autoInit = async () => {
                          const initPrompt = (results && results.prediction)
                            ? `We just ran an analysis resulting in a ${results.prediction} diagnosis with ${(results.confidence_score * 100).toFixed(2)}% confidence. Briefly greet me as the AI Assistant, acknowledge this specific diagnosis if applicable, and offer to explain the heatmap or answer questions. Be very concise, maximum 1 sentence.`
                            : "Briefly greet me as the System AI Assistant. Offer to answer any general medical or technical questions about the CDSS. Be very concise, maximum 1 sentence. Do NOT mention that a scan is uploaded or not.";

                          setIsChatting(true);

                          // Fallback timeout to prevent infinite hanging
                          const timeoutId = setTimeout(() => {
                            if (chatMessages.length === 0) {
                              setChatMessages([{ role: 'assistant', content: "Hello! I'm your AI Assistant. How can I help you today?" }]);
                              setIsChatting(false);
                            }
                          }, 8000);

                          try {
                            const patientCtx = (patientData.id || patientData.age || patientData.sex) ? ` Patient: ID=${patientData.id || 'N/A'}, Age=${patientData.age || 'N/A'}, Gender=${patientData.sex || 'N/A'}.` : '';
                            const contextString = results ? `Current Diagnosis: ${results.prediction} (${(results.confidence_score * 100).toFixed(1)}% confidence). Heatmap shows: ${results.heatmap_description || 'N/A'}.${patientCtx}` : (patientCtx || null);
                            const res = await axios.post(`${API_BASE}/api/chat`, { message: initPrompt, chat_history: [], context: contextString }, { timeout: 7000 });
                            clearTimeout(timeoutId);
                            if (chatMessages.length === 0) { // Only set if timeout didn't trigger
                              setChatMessages([{ role: 'assistant', content: res.data.response }]);
                            }
                          } catch {
                            clearTimeout(timeoutId);
                            if (chatMessages.length === 0) {
                              setChatMessages([{ role: 'assistant', content: "Hello! I'm your AI Assistant. How can I help you today?" }]);
                            }
                          } finally {
                            setIsChatting(false);
                          }
                        };
                        autoInit();
                      }}
                      className={`relative overflow-hidden w-full max-w-[240px] px-8 py-3.5 rounded-2xl font-bold tracking-widest uppercase text-white shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 group hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]`}
                      style={theme === 'dark' ? { background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #FF0080 100%)', backgroundSize: '200% auto' } : { background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)', backgroundSize: '200% auto' }}
                    >
                      <div className="absolute inset-0 bg-[length:200%_auto] z-0 animate-[shimmer-fast_3s_linear_infinite]"
                        style={theme === 'dark' ? { backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)' } : { backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)' }} />
                      <span className="relative z-10 flex items-center justify-center gap-2">START CHAT <ChevronRight size={18} strokeWidth={3} /></span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar pb-6 flex flex-col items-start w-full">
                      {chatMessages.length === 0 && isChatting && (
                        <div className="flex h-full w-full items-center justify-center opacity-50 text-sm animate-pulse flex-col gap-3">
                          <Activity size={24} className="animate-bounce text-[#00D4FF]" />
                          Initializing connection...
                        </div>
                      )}
                      {chatMessages.map((msg, idx) => (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4 }} key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-md ${theme === 'dark' ? 'bg-[#0b0f19] border border-[#00D4FF]/30 text-[#00D4FF]' : 'bg-blue-50 border border-blue-200 text-blue-600'}`}>
                              <Activity size={14} />
                            </div>
                          )}
                          <div className="max-w-[85%] flex flex-col">
                            <div className={`relative overflow-hidden rounded-[20px] p-4 text-[15px] leading-relaxed font-google-sans tracking-[0.015em] font-medium ${msg.role === 'user'
                              ? 'text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] rounded-tr-sm border border-white/5'
                              : theme === 'dark' ? 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/10 shadow-inner' : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-200'}`}>
                              {msg.role === 'user' && (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/90 to-[#FF0080]/90 z-0 backdrop-blur-md" />
                                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0" />
                                </>
                              )}
                              <div className={`relative z-10 prose max-w-none prose-bold-override prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${theme === 'dark' ? 'prose-invert marker:text-[#00D4FF]' : 'marker:text-blue-500'}`}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>

                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-1.5 mt-1.5 ml-1 relative">
                                <button onClick={() => handleSpeak(msg.content, idx)} className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${speakingIdx === idx ? 'text-emerald-400 bg-emerald-400/15' : theme === 'dark' ? 'text-gray-500 hover:text-[#00D4FF] hover:bg-white/8' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Read aloud">
                                  <Volume2 size={15} className={speakingIdx === idx ? 'animate-pulse' : ''} />
                                </button>
                                <button className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${theme === 'dark' ? 'text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'}`} title="Helpful">
                                  <ThumbsUp size={14} />
                                </button>
                                <button className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${theme === 'dark' ? 'text-gray-500 hover:text-red-400 hover:bg-red-400/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`} title="Not helpful">
                                  <ThumbsDown size={14} />
                                </button>
                                <button onClick={() => handleCopy(msg.content, idx)} className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${copiedIdx === idx ? 'text-emerald-400 bg-emerald-400/15' : theme === 'dark' ? 'text-gray-500 hover:text-[#00D4FF] hover:bg-white/8' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`} title={copiedIdx === idx ? 'Copied!' : 'Copy'}>
                                  {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                                <div className="relative">
                                  <button onClick={() => setVoiceSettingsOpen(voiceSettingsOpen === idx ? null : idx)} className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${voiceSettingsOpen === idx ? (theme === 'dark' ? 'text-[#00D4FF] bg-[#00D4FF]/10' : 'text-blue-600 bg-blue-50') : theme === 'dark' ? 'text-gray-500 hover:text-[#00D4FF] hover:bg-white/8' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Voice Settings">
                                    <Settings size={14} />
                                  </button>
                                  <AnimatePresence>
                                    {voiceSettingsOpen === idx && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute top-full left-0 mt-2 rounded-xl shadow-2xl border z-50 min-w-[200px] overflow-hidden ${theme === 'dark' ? 'bg-[#0d1520] border-white/10' : 'bg-white border-gray-200'}`}
                                      >
                                        <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-b ${theme === 'dark' ? 'text-[#00D4FF] border-white/10 bg-white/5' : 'text-blue-600 border-gray-100 bg-gray-50'}`}>
                                          Voice Selection
                                        </div>
                                        {availableVoices.length === 0 ? (
                                          <div className={`px-3 py-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No voices available</div>
                                        ) : availableVoices.map((v, vi) => (
                                          <button
                                            key={vi}
                                            onClick={() => selectVoice(v.voice.name)}
                                            className={`w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${selectedVoiceName === v.voice.name ? (theme === 'dark' ? 'bg-[#00D4FF]/15 text-[#00D4FF]' : 'bg-blue-50 text-blue-600') : theme === 'dark' ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                                          >
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedVoiceName === v.voice.name ? 'bg-[#00D4FF] shadow-[0_0_6px_#00D4FF]' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
                                            {v.label}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {isChatting && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-start items-end">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 shadow-md ${theme === 'dark' ? 'bg-[#0b0f19] border border-[#00D4FF]/30 text-[#00D4FF]' : 'bg-blue-50 border border-blue-200 text-blue-600'}`}>
                            <Activity size={14} />
                          </div>
                          <div className={`rounded-2xl p-4 rounded-tl-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <div className="w-1.5 h-1.5 bg-[#FF0080] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} className="h-4 w-full" />
                    </div>

                    <div className={`sticky bottom-0 left-0 right-0 p-4 lg:p-6 pb-6 z-10 ${theme === 'dark' ? 'bg-[#080c14]' : 'bg-gray-50'}`}>
                      <div className={`absolute inset-0 -top-12 bg-gradient-to-t ${theme === 'dark' ? 'from-[#080c14] via-[#080c14]' : 'from-gray-50 via-gray-50'} to-transparent pointer-events-none`} />

                      <form onSubmit={handleChatSubmit} className={`relative flex items-center w-full max-w-4xl mx-auto rounded-[32px] p-2 backdrop-blur-3xl transition-all duration-300 ring-0 outline-none border-0 ${theme === 'dark' ? 'bg-[#0d1520] border-transparent shadow-[0_4px_30px_rgba(0,0,0,0.5)] focus-within:bg-[#0f1825]' : 'bg-white border-transparent shadow-xl focus-within:bg-[#f8faff]'}`}>


                        <textarea
                          ref={chatInputRef}
                          value={chatInput}
                          onChange={(e) => {
                            setChatInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (chatInput.trim() && !isChatting) handleChatSubmit(e);
                            }
                            // Shift+Enter will naturally insert a newline in a textarea
                          }}
                          placeholder="Type a message..."
                          className={`peer flex-1 min-w-0 text-[15px] tracking-[0.02em] px-6 py-4 bg-transparent outline-none ring-0 focus:ring-0 focus:outline-none border-none !border-none transition-all duration-300 relative z-10 resize-none overflow-y-hidden leading-relaxed ${theme === 'dark' ? 'text-white placeholder-gray-500 font-medium' : 'text-gray-900 placeholder-gray-400 font-medium'}`}
                          style={{ minHeight: '56px', maxHeight: '120px', border: 'none', boxShadow: 'none', outline: 'none' }}
                          disabled={isChatting}
                          rows={1}
                        />

                        <div className="flex items-center gap-2 relative z-10">
                          <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-3.5 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]' : theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00D4FF] border-0' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-blue-600 border-0'}`}
                            title="Voice Input"
                          >
                            <Mic size={22} className={isListening ? 'animate-bounce' : ''} />
                          </button>

                          <button
                            type="submit"
                            disabled={isChatting || !chatInput.trim()}
                            className={`p-4 rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center shadow-lg relative overflow-hidden group/submit ${theme === 'dark' ? 'text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]'}`}
                            style={theme === 'dark' ? { background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #FF0080 100%)', backgroundSize: '200% auto' } : {}}
                          >
                            {theme === 'dark' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-overlay animate-shimmer-sweep-slow" />
                            )}
                            <ChevronRight size={24} strokeWidth={3} className="relative z-10" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* History Drawer */}
        <AnimatePresence>
          {isHistoryOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHistoryOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 left-0 bottom-0 w-full sm:w-[400px] z-50 flex flex-col shadow-2xl border-r ${theme === 'dark' ? 'bg-[#0b101a] border-white/10' : 'bg-white border-gray-200'}`}
              >
                <div className={`flex items-center justify-between p-5 sm:p-6 border-b ${theme === 'dark' ? 'border-white/10 bg-[#0d1520]' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-[#8B5CF6]/20' : 'bg-violet-100'}`}>
                      <History size={20} className={theme === 'dark' ? 'text-[#8B5CF6]' : 'text-violet-600'} />
                    </div>
                    <div>
                      <h2 className={`font-bold text-lg font-josefin-sans tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Scan History</h2>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Local Session Analytics</p>
                    </div>
                  </div>
                  <button onClick={() => setIsHistoryOpen(false)} className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'}`}>
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 custom-scrollbar">
                  {scanHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 text-center px-4">
                      <History size={48} className={`mb-4 ${theme === 'dark' ? 'text-white/20' : 'text-gray-300'}`} />
                      <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>No history found.</p>
                      <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Successful scans will be saved here locally for your reference.</p>
                    </div>
                  ) : (
                    scanHistory.map((scan, idx) => (
                      <div key={scan.id} className={`flex flex-col p-4 rounded-2xl border transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-[#111827]/60 border-white/10 hover:border-[#8B5CF6]/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'bg-white border-gray-200 shadow-sm hover:border-violet-300 hover:shadow-md'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500'}`}>{scan.date}</span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${scan.prediction === 'Pneumonia' ? (theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600') : (scan.prediction === 'Normal' ? (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600') : (theme === 'dark' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'))}`}>
                            {scan.prediction}
                          </span>
                        </div>
                        <h4 className={`font-semibold text-sm truncate w-full mb-1 ${theme === 'dark' ? 'text-white/90' : 'text-gray-800'}`}>{scan.filename}</h4>
                        <div className="flex items-center justify-between w-full mt-2">
                          <span className={`text-[12px] font-medium ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>Confidence</span>
                          <span className={`text-[13px] font-bold tracking-wide ${theme === 'dark' ? 'text-[#00D4FF]' : 'text-blue-600'}`}>{(scan.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${scan.confidence * 100}%` }} transition={{ duration: 1, delay: idx * 0.1 }} className="h-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6]" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Bubble Button (Hidden when drawer is open) */}
        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setIsChatOpen(true); setIsChatMinimized(false); setUnreadCount(0); }}
              data-tour="ai-assistant"
              className={`relative group flex items-center justify-center w-[72px] h-[72px] rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out cursor-pointer border-0 outline-none ring-0 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-110`}
              style={{ animation: 'float 3.5s ease-in-out infinite' }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00D4FF] via-[#8B5CF6] to-[#FF0080] opacity-90 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden" />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-[length:200%_auto] bg-gradient-to-r from-transparent via-white/20 to-transparent overflow-hidden" style={{ animation: 'shimmer-fast 3s linear infinite' }} />

              <div className="flex items-center justify-center w-[58px] h-[58px] rounded-full relative hover:scale-[1.1] transition-transform duration-500 z-10">
                <Bot size={32} className="text-white drop-shadow-lg" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 border-2 border-white items-center justify-center text-[11px] font-bold text-white shadow-lg">{unreadCount}</span>
                  </span>
                ) : chatMessages.length > 0 && !isChatOpen && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="back-to-top-btn"
            aria-label="Back to top"
          >
            <ArrowUp size={22} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Guided Tour */}
      <GuidedTour active={showTour} step={tourStep} onNext={handleTourNext} onPrev={handleTourPrev} onSkip={handleTourSkip} theme={theme} status={status} />

    </div >
  );
}
