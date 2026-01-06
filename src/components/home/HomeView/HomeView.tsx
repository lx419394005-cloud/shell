import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Container } from '../../layout/Container';
import { Sparkles, MessageSquare, LayoutGrid, Zap, Shield, Globe, ArrowRight, MousePointer2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface HomeViewProps {
  onStartCreate: () => void;
}

const Tape = ({ className, rotation = 0 }: { className?: string, rotation?: number }) => (
  <div 
    className={cn("absolute h-10 w-32 bg-white/10 backdrop-blur-md border border-white/20 z-20 pointer-events-none mix-blend-overlay", className)}
    style={{ transform: `rotate(${rotation}deg)` }}
  >
    <div className="absolute inset-0 flex items-center justify-between px-2 opacity-30">
      <div className="w-1 h-6 border-l border-white/40" />
      <div className="w-1 h-6 border-l border-white/40" />
    </div>
  </div>
);

const Fragment = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ delay, duration: 0.8, ease: "easeOut" }}
    className={cn("relative p-4 bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl will-change-transform", className)}
  >
    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--color-primary)]" />
    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--color-primary)]" />
    {children}
  </motion.div>
);

const GlitchText = ({ text, className }: { text: string, className?: string }) => {
  return (
    <div className={cn("relative inline-block group", className)}>
      <span className="relative z-10">{text}</span>
      <span className="absolute inset-0 z-0 text-red-500/50 translate-x-0.5 translate-y-0.5 blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </span>
      <span className="absolute inset-0 z-0 text-blue-500/50 -translate-x-0.5 -translate-y-0.5 blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </span>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="group relative p-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all hover:-translate-y-2"
    style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 90%, 95% 100%, 0% 100%)' }}
  >
    <Tape className="-top-4 -left-8 w-24 h-8" rotation={-15} />
    <div className="w-14 h-14 bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary)] mb-6 group-hover:rotate-12 transition-transform">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black text-[var(--color-text)] mb-3 tracking-tighter uppercase">{title}</h3>
    <p className="text-[var(--color-text-secondary)] leading-relaxed font-medium">{desc}</p>
    <div className="absolute bottom-4 right-4 text-[var(--color-primary)]/20 font-mono text-4xl font-black select-none group-hover:opacity-100 opacity-0 transition-opacity">
      {String(delay * 10).padStart(2, '0')}
    </div>
  </motion.div>
);

export const HomeView = ({ onStartCreate }: HomeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden selection:bg-[var(--color-primary)] selection:text-white">
      {/* 基础底色层 */}
      <div className="fixed inset-0 bg-[var(--color-bg)] -z-20" />
      
      {/* 未来拼贴背景层 */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* 基础网格 */}
        <div className="absolute inset-0 opacity-[0.1]" 
          style={{ 
            backgroundImage: `linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} 
        />
        
        {/* 动态拼贴块 */}
        <div 
          className="absolute top-[10%] left-[-5%] w-[40%] h-[60%] bg-[var(--color-primary)]/5 blur-[120px] rotate-12 animate-pulse-slow"
        />
        <div 
          className="absolute bottom-[10%] right-[-5%] w-[40%] h-[60%] bg-indigo-500/5 blur-[120px] -rotate-12 animate-pulse-slow-delayed"
        />

        {/* 装饰性拼贴碎片 */}
        <Fragment className="absolute top-[15%] right-[10%] w-48 h-64 -rotate-6 opacity-40 group">
          <img 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop" 
            alt="collage-1"
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 will-change-transform"
          />
          <div className="absolute inset-0 bg-[var(--color-primary)]/10 mix-blend-overlay" />
          <Tape className="-top-2 -right-10" rotation={25} />
        </Fragment>

        <Fragment className="absolute top-[40%] left-[-2%] w-64 h-48 rotate-12 opacity-25 group">
          <img 
            src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=800&auto=format&fit=crop" 
            alt="collage-2"
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 will-change-transform"
          />
          <div className="absolute inset-0 bg-indigo-500/20 mix-blend-multiply" />
          <Tape className="-bottom-4 -left-6" rotation={-15} />
        </Fragment>

        <Fragment className="absolute bottom-[10%] right-[5%] w-56 h-72 rotate-3 opacity-30 group">
          <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop" 
            alt="collage-3"
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 will-change-transform"
          />
          <div className="absolute inset-0 bg-[var(--color-primary)]/10 mix-blend-color-dodge" />
          <Tape className="-top-6 left-1/2 -translate-x-1/2" rotation={5} />
        </Fragment>

        <Fragment className="absolute bottom-[20%] left-[5%] w-72 h-40 rotate-12 opacity-30">
          <div className="flex flex-col gap-2 p-2 font-mono text-[8px] text-[var(--color-primary)] overflow-hidden">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="whitespace-nowrap opacity-50">
                0x{Math.random().toString(16).slice(2, 10).toUpperCase()} {" >> "} PROCESS_INIT_SEQUENCE_{i}
              </div>
            ))}
          </div>
          <Tape className="-bottom-2 -left-10" rotation={-15} />
        </Fragment>

        {/* 扫描线效果 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-10">
        <div className="mx-auto px-10 sm:px-16 lg:px-24 max-w-[1600px] w-full">
          <div className="flex flex-col items-center text-center space-y-10 relative">
            {/* 核心背景大图拼贴 */}
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[120%] -z-10 pointer-events-none"
            >
              <img 
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop" 
                alt="hero-bg"
                className="w-full h-full object-cover filter contrast-150 brightness-50 mix-blend-screen"
              />
            </motion.div>

            {/* 新增：人与电脑的抽象拼贴碎片 */}
            <Fragment className="absolute -top-20 -left-10 w-48 h-64 rotate-12 opacity-40 group hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" 
                alt="human-tech-1"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-[var(--color-primary)]/20 mix-blend-overlay" />
              <Tape className="-top-4 -right-8" rotation={15} />
            </Fragment>

            <Fragment className="absolute top-0 -right-20 w-64 h-48 -rotate-12 opacity-30 group hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop" 
                alt="computer-abstract"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-blue-500/20 mix-blend-multiply" />
              <Tape className="-bottom-6 -left-10" rotation={-25} />
            </Fragment>

            <Fragment className="absolute -bottom-40 left-1/4 w-56 h-72 rotate-6 opacity-30 group hidden xl:block">
              <img 
                src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=800&auto=format&fit=crop" 
                alt="human-abstract"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-[var(--color-primary)]/10 mix-blend-color-dodge" />
              <Tape className="-top-4 left-1/2 -translate-x-1/2" rotation={5} />
            </Fragment>

            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4"
            >
              <div className="h-[1px] w-12 bg-[var(--color-primary)]" />
              <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">
                Future Art Laboratory v2.0
              </span>
              <div className="h-[1px] w-12 bg-[var(--color-primary)]" />
            </motion.div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10"
              >
                <h1 className="text-8xl sm:text-9xl md:text-[14rem] font-black tracking-tighter leading-[0.8] text-[var(--color-text)]">
                  <GlitchText text="PICS" className="md:mr-4" />
                  <br className="md:hidden" />
                  <span className="text-[var(--color-primary)] opacity-90 drop-shadow-[0_0_50px_rgba(255,69,0,0.5)]">AI</span>
                </h1>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-10 -right-10 p-4 bg-white text-black font-black text-xl -rotate-12 mix-blend-difference hidden sm:block"
              >
                EXPERIMENTAL
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl"
            >
              <p className="text-xl md:text-3xl text-[var(--color-text-secondary)] font-medium leading-relaxed">
                在碎裂的数字时空里，<br />
                重新定义<span className="text-[var(--color-text)] font-black italic underline decoration-[var(--color-primary)] decoration-4 underline-offset-8"> 灵感的边界 </span>。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="pt-4"
            >
              <button 
                onClick={onStartCreate}
                className="group relative px-16 py-8 bg-[var(--color-text)] text-[var(--color-bg)] font-black text-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 88% 100%, 0% 100%)' }}
              >
                <div className="absolute inset-0 bg-[var(--color-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-4">
                  立即进入创作核心 <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
        {/* 背景拼贴图片 */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute top-[10%] left-[5%] w-40 h-40 opacity-10 -rotate-6 animate-pulse-soft"
          >
            <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400" className="w-full h-full object-cover grayscale rounded-sm" />
          </div>
          <div
            className="absolute bottom-[20%] right-[2%] w-48 h-48 opacity-10 rotate-6 animate-pulse-soft"
            style={{ animationDelay: '1s' }}
          >
            <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400" className="w-full h-full object-cover grayscale rounded-sm" />
          </div>
        </div>

        <Container>
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-bold text-[var(--color-text)]">强大功能，简单掌控</h2>
            <p className="text-[var(--color-text-secondary)]">我们为你准备了一切所需工具</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Sparkles}
              title="多模型 AI 绘图"
              desc="支持 Flux, Stable Diffusion 等顶尖模型，无论是写实还是艺术风格，都能完美呈现。"
              delay={0.1}
            />
            <FeatureCard 
              icon={MessageSquare}
              title="智能对话助手"
              desc="内置多种大语言模型，辅助你优化提示词，激发创作灵感，解答技术难题。"
              delay={0.2}
            />
            <FeatureCard 
              icon={LayoutGrid}
              title="沉浸式作品库"
              desc="Pinterest 风格的瀑布流展示，轻松管理你的每一份创意，支持高清无损导出。"
              delay={0.3}
            />
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <Container>
          <div 
            className="relative p-12 md:p-24 bg-[var(--color-text)] text-[var(--color-bg)] overflow-hidden"
            style={{ clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)' }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,var(--color-primary)_0%,transparent_70%)]" />
            
            <Tape className="-top-2 left-1/4 w-40 h-12 bg-white/20" rotation={5} />
            <Tape className="-bottom-2 right-1/4 w-40 h-12 bg-white/20" rotation={-5} />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10 space-y-10 text-center"
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                开启你的 <span className="text-[var(--color-primary)]">创意实验</span>
              </h2>
              <p className="text-xl text-[var(--color-bg)]/60 max-w-2xl mx-auto font-medium">
                在这里，每一个像素都是一次未知的拼接，每一个提示词都是一段未来的代码。
              </p>
              <button
                onClick={onStartCreate}
                className="group relative px-16 py-6 bg-[var(--color-primary)] text-white font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,69,0,0.5)]"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 90% 100%, 0% 100%)' }}
              >
                立即开始
              </button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 blur-3xl rounded-full" />
        <Container className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 font-black text-2xl text-[var(--color-text)] tracking-tighter">
              <div className="w-10 h-10 bg-[var(--color-primary)] flex items-center justify-center text-white" style={{ clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)' }}>P</div>
              PICS AI
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-mono opacity-50 uppercase tracking-widest">
              Digital Artifact // Version 2.0.26
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4 text-[var(--color-text-secondary)] text-sm font-medium">
            <div className="flex items-center gap-8 uppercase tracking-widest text-[10px]">
              <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors">Lab Journal</span>
              <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors">Data Protocol</span>
              <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors">Neural Mesh</span>
            </div>
            <p className="opacity-40 italic">© {new Date().getFullYear()} PICS AI. Built with fragmentation and love.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

