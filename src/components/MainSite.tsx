import React, { useState, useEffect } from 'react';
import { CMSState, Service, BlogPost, MediaItem, Testimonial, Appointment } from '../types';
import { saveAppointment, saveTestimonial, saveBlogPost } from '../lib/firestoreSync';
import { 
  Home, 
  Activity, 
  ShieldAlert, 
  HeartPulse, 
  Sparkles, 
  Phone, 
  MapPin, 
  Instagram, 
  Mail, 
  Clock, 
  ArrowUp, 
  ChevronRight, 
  Star, 
  Plus, 
  X, 
  Menu, 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  ChevronLeft, 
  Play, 
  CheckCircle2,
  Lock,
  ArrowRight,
  Video,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MainSiteProps {
  cmsState: CMSState;
  onUpdateState: (newState: CMSState) => void;
  onOpenAdmin: () => void;
}

export default function MainSite({ cmsState, onUpdateState, onOpenAdmin }: MainSiteProps) {
  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active sub-page state for separated page layout
  const [currentPage, setCurrentPage] = useState<'home' | 'quem-sou' | 'servicos' | 'galeria' | 'depoimentos' | 'blog' | 'contato' | 'agendamento'>('home');

  const navigateToPage = (page: 'home' | 'quem-sou' | 'servicos' | 'galeria' | 'depoimentos' | 'blog' | 'contato' | 'agendamento') => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Back to top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Modal Detail States
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeMediaFilter, setActiveMediaFilter] = useState<string>('all');
  const [activeAboutTab, setActiveAboutTab] = useState<'formations' | 'specializations' | 'experiences'>('formations');

  // Interactive Lightbox State
  const [lightboxMedia, setLightboxMedia] = useState<MediaItem | null>(null);

  // Testimonial submission form state
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    petName: '',
    petSpecies: 'Cão' as 'Cão' | 'Gato' | 'Outros',
    rating: 5,
    content: ''
  });
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);

  // Appointment scheduling form state
  const [appointmentForm, setAppointmentForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    species: 'Cão',
    breed: '',
    age: '',
    weight: '',
    reason: '',
    date: '',
    time: '',
    address: '',
    cep: '',
    observations: ''
  });
  const [appointmentSubmitted, setAppointmentSubmitted] = useState(false);

  // Scroll detection for "Back to top"
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Increment view count when article is opened
  const handleOpenArticle = async (post: BlogPost) => {
    const updatedPost = { ...post, views: post.views + 1 };
    const updatedBlog = cmsState.blog.map(b => {
      if (b.id === post.id) {
        return updatedPost;
      }
      return b;
    });
    
    onUpdateState({
      ...cmsState,
      blog: updatedBlog
    });
    setSelectedPost(updatedPost);

    try {
      await saveBlogPost(updatedPost);
    } catch (e) {
      console.error("Failed to increment views in Firestore:", e);
    }
  };

  // Submit appointment request
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAppointment: Appointment = {
      id: 'A' + Math.floor(1000 + Math.random() * 9000),
      ...appointmentForm,
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };

    onUpdateState({
      ...cmsState,
      appointments: [newAppointment, ...cmsState.appointments]
    });

    setAppointmentSubmitted(true);

    try {
      await saveAppointment(newAppointment);
    } catch (e) {
      console.error("Failed to save appointment in Firestore:", e);
    }

    setTimeout(() => {
      setAppointmentSubmitted(false);
      setAppointmentForm({
        name: '', phone: '', whatsapp: '', email: '',
        species: 'Cão', breed: '', age: '', weight: '',
        reason: '', date: '', time: '', address: '', cep: '', observations: ''
      });
    }, 5000);
  };

  // Submit testimonial
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTestimonial: Testimonial = {
      id: 'T' + Math.floor(1000 + Math.random() * 9000),
      ...testimonialForm,
      date: new Date().toISOString().split('T')[0],
      approved: false // requires admin approval (CMS moderates this!)
    };

    onUpdateState({
      ...cmsState,
      testimonials: [...cmsState.testimonials, newTestimonial]
    });

    setTestimonialSubmitted(true);

    try {
      await saveTestimonial(newTestimonial);
    } catch (e) {
      console.error("Failed to save testimonial in Firestore:", e);
    }

    setTimeout(() => {
      setTestimonialSubmitted(false);
      setShowTestimonialModal(false);
      setTestimonialForm({ name: '', petName: '', petSpecies: 'Cão', rating: 5, content: '' });
    }, 4000);
  };

  // Render Service Icon
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <Home size={22} className="text-vet-dark" />;
      case 'Activity': return <Activity size={22} className="text-vet-dark" />;
      case 'ShieldAlert': return <ShieldAlert size={22} className="text-vet-dark" />;
      case 'HeartPulse': return <HeartPulse size={22} className="text-vet-dark" />;
      case 'Sparkles': return <Sparkles size={22} className="text-vet-dark" />;
      default: return <HeartPulse size={22} className="text-vet-dark" />;
    }
  };

  // Get only approved testimonials
  const approvedTestimonials = cmsState.testimonials.filter(t => t.approved);

  // Reusable header for separate pages
  const renderPageHeader = (title: string, subtitle: string) => (
    <div className="bg-white border-b border-neutral-150 py-12 px-6 md:px-12 relative overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-64 h-64 bg-vet-light/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
            <span className="cursor-pointer hover:text-vet-leaf transition" onClick={() => navigateToPage('home')}>Início</span>
            <span>/</span>
            <span className="text-vet-dark">{title}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-neutral-800 tracking-tight">{title}</h1>
        </div>
        <p className="text-xs md:text-sm text-neutral-500 font-light max-w-sm leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F8F9F8] text-neutral-700 min-h-screen relative flex flex-col">
      
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-vet-light/20 py-4 px-6 md:px-12 flex justify-between items-center transition-all">
        {/* Brand logo details - Organic Leaf style logo-icon */}
        <div 
          onClick={() => navigateToPage('home')}
          className="flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition"
        >
          {cmsState.info.logoImage ? (
            <img 
              src={cmsState.info.logoImage} 
              alt={cmsState.info.name} 
              className="h-10 w-auto object-contain max-w-[150px] shrink-0 rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-vet-light text-white p-2.5 rounded-[50%_50%_50%_0] shadow-xs flex items-center justify-center shrink-0">
              <HeartPulse size={20} />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-serif font-semibold text-lg md:text-xl tracking-tight text-neutral-800 leading-tight">
              {cmsState.info.name}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-vet-dark font-semibold leading-none mt-0.5">
              Veterinária Domiciliar & Anestesiologia
            </span>
          </div>
        </div>

        {/* Desktop Nav menu - Montserrat styled upper navigation with Page State Support */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 font-semibold text-xs uppercase tracking-widest">
          <button 
            onClick={() => navigateToPage('home')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'home' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Início
          </button>
          <button 
            onClick={() => navigateToPage('quem-sou')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'quem-sou' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Quem Sou
          </button>
          <button 
            onClick={() => navigateToPage('servicos')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'servicos' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Serviços
          </button>
          <button 
            onClick={() => navigateToPage('galeria')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'galeria' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Galeria
          </button>
          <button 
            onClick={() => navigateToPage('depoimentos')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'depoimentos' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Depoimentos
          </button>
          <button 
            onClick={() => navigateToPage('blog')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'blog' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Blog
          </button>
          <button 
            onClick={() => navigateToPage('contato')} 
            className={`transition cursor-pointer py-1 border-b-2 ${currentPage === 'contato' ? 'text-vet-leaf border-vet-leaf' : 'text-neutral-500 hover:text-vet-dark border-transparent'}`}
          >
            Contatos
          </button>
          
          <button 
            onClick={() => navigateToPage('agendamento')} 
            className="bg-vet-leaf hover:bg-vet-dark text-white font-bold px-4 py-2 rounded-full shadow-[0_6px_15px_rgba(142,187,99,0.25)] text-xs transition duration-300 cursor-pointer shrink-0"
          >
            Agendar Consulta
          </button>
        </nav>

        {/* Right side shortcuts & mobile menu button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAdmin}
            title="Painel de Controle"
            className="p-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-vet-dark rounded-full transition cursor-pointer"
          >
            <Lock size={16} />
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-600 hover:text-vet-dark rounded-lg cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-neutral-200 px-6 py-4 flex flex-col gap-4 font-semibold text-xs uppercase tracking-widest text-left"
          >
            <button onClick={() => navigateToPage('home')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'home' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Início</button>
            <button onClick={() => navigateToPage('quem-sou')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'quem-sou' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Quem Sou</button>
            <button onClick={() => navigateToPage('servicos')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'servicos' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Serviços</button>
            <button onClick={() => navigateToPage('galeria')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'galeria' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Galeria</button>
            <button onClick={() => navigateToPage('depoimentos')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'depoimentos' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Depoimentos</button>
            <button onClick={() => navigateToPage('blog')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'blog' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Blog</button>
            <button onClick={() => navigateToPage('contato')} className={`py-2 text-left border-b border-neutral-100 ${currentPage === 'contato' ? 'text-vet-leaf font-bold' : 'text-neutral-600 hover:text-vet-dark'}`}>Contatos</button>
            
            <button 
              onClick={() => navigateToPage('agendamento')}
              className="bg-vet-leaf hover:bg-vet-dark text-white text-center font-bold py-3 rounded-full text-xs shadow-sm cursor-pointer"
            >
              Agendar Consulta
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- 1. HERO BANNER & SERVICES OVERLAY (HOME PAGE) ----------------- */}
      {currentPage === 'home' && (
        <>
          <section className="relative min-h-[85vh] grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[#f0f4eb] to-[#e8f0e0] overflow-hidden">
            
            {/* Floating leaf decoration */}
            <svg className="absolute w-36 h-36 text-vet-light/10 top-10 left-10 rotate-45 pointer-events-none" viewBox="0 0 100 100">
              <path d="M50 0 C70 30 70 70 50 100 C30 70 30 30 50 0" fill="currentColor" />
            </svg>

            {/* Left Column: Content container */}
            <div className="relative z-10 flex flex-col justify-center px-6 md:px-12 lg:pl-16 xl:pl-24 py-16 md:py-24 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 bg-vet-leaf/10 border border-vet-leaf/20 text-vet-dark px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <Sparkles size={14} /> Atendimento Domiciliar
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light font-serif leading-none tracking-tight text-neutral-800">
                  {/* Highlight certain words in italic to match the artistic serif vibe */}
                  Cuidado especializado<br />no conforto do <i className="font-serif">lar</i>.
                </h1>

                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-md font-light">
                  {cmsState.info.heroSubtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => navigateToPage('agendamento')} 
                    className="bg-vet-leaf hover:bg-vet-dark text-white text-center font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-[0_10px_20px_rgba(142,187,99,0.3)] hover:shadow-lg transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar size={14} />
                    {cmsState.info.heroButtonText1}
                  </button>

                  <button 
                    onClick={() => navigateToPage('contato')} 
                    className="border-2 border-vet-light bg-transparent hover:bg-vet-light/10 text-vet-dark text-center font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone size={14} />
                    Falar Conosco
                  </button>
                </div>

                <div className="pt-6 font-semibold text-[10px] text-neutral-400 uppercase tracking-widest flex items-center gap-6">
                  <span>CRM-SP 21045</span>
                  <span>★ ★ ★ ★ ★ (5.0)</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Creative Fluid Photo-Blob visual container */}
            <div className="relative flex items-center justify-center bg-gradient-to-br from-[#e8f0e0] to-[#f0f4eb] p-8 lg:p-12 min-h-[400px] lg:min-h-0">
              {/* Subtle floral/leaf watermark under the blob */}
              <svg className="absolute w-56 h-56 text-vet-light/15 bottom-10 right-10 rotate-12 pointer-events-none" viewBox="0 0 100 100">
                <path d="M50 0 C70 30 70 70 50 100 C30 70 30 30 50 0" fill="currentColor" />
              </svg>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="photo-blob w-[280px] h-[320px] sm:w-[380px] sm:h-[430px] lg:w-[420px] lg:h-[480px] overflow-hidden bg-white flex items-center justify-center relative"
              >
                <img 
                  src={cmsState.info.heroBgImage} 
                  alt="Atendimento Veterinário" 
                  className="w-full h-full object-cover select-none"
                />
              </motion.div>
            </div>
          </section>

          {/* ----------------- SERVICES OVERLAY BAR ----------------- */}
          <div className="hidden lg:grid grid-cols-4 bg-white py-8 px-12 gap-8 border border-vet-light/15 shadow-[0_15px_30px_rgba(0,0,0,0.02)] max-w-7xl mx-auto rounded-3xl -mt-12 relative z-20">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-vet-leaf font-bold uppercase tracking-widest">01</span>
              <h3 className="font-serif text-sm font-semibold text-neutral-800">Atendimento Domiciliar</h3>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Consultas completas no conforto e segurança do lar, evitando transporte.</p>
            </div>
            <div className="flex flex-col gap-1.5 border-l border-neutral-100 pl-8">
              <span className="text-[10px] text-vet-leaf font-bold uppercase tracking-widest">02</span>
              <h3 className="font-serif text-sm font-semibold text-neutral-800">Anestesiologia Veterinária</h3>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Avaliações minuciosas e anestesia segura em cirurgias parceiras.</p>
            </div>
            <div className="flex flex-col gap-1.5 border-l border-neutral-100 pl-8">
              <span className="text-[10px] text-vet-leaf font-bold uppercase tracking-widest">03</span>
              <h3 className="font-serif text-sm font-semibold text-neutral-800">Avaliações Pré-Operatórias</h3>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Redução criteriosa de riscos com exames clínicos e laudos técnicos.</p>
            </div>
            <div className="flex items-center justify-end pl-8">
              <button 
                onClick={() => navigateToPage('servicos')} 
                className="text-vet-dark hover:text-vet-leaf text-xs font-bold border-b-2 border-vet-light/40 pb-1 flex items-center gap-1.5 transition cursor-pointer"
              >
                Ver Todos os Serviços <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* ----------------- PORTAL DIRECTORY CARD GRIDS ----------------- */}
          <section className="py-16 px-6 md:px-12 w-full max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-vet-dark block">Navegue pelo Site</span>
              <h2 className="text-2xl md:text-3xl font-light font-serif text-neutral-800">Explore Nossos Serviços e Conteúdos</h2>
              <p className="text-sm text-neutral-500 font-light">Selecione uma das seções abaixo para saber mais sobre o atendimento humanizado da Dra. Júlia Guaraldo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Quem Sou */}
              <div 
                onClick={() => navigateToPage('quem-sou')}
                className="group bg-white p-6 rounded-2xl border border-neutral-150 hover:border-vet-light/45 hover:shadow-[0_15px_30px_rgba(142,187,99,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="bg-vet-light/10 text-vet-dark p-3 rounded-xl w-fit group-hover:bg-vet-leaf group-hover:text-white transition duration-300">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-800 group-hover:text-vet-leaf transition">Sobre a Dra. Júlia</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">Conheça a trajetória, qualificações, formações e a paixão pelo cuidado individualizado.</p>
                </div>
                <span className="text-[10px] font-bold text-vet-dark uppercase tracking-wider flex items-center gap-1.5 self-end">
                  Saber Mais <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </span>
              </div>

              {/* Card 2: Serviços */}
              <div 
                onClick={() => navigateToPage('servicos')}
                className="group bg-white p-6 rounded-2xl border border-neutral-150 hover:border-vet-light/45 hover:shadow-[0_15px_30px_rgba(142,187,99,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="bg-vet-light/10 text-vet-dark p-3 rounded-xl w-fit group-hover:bg-vet-leaf group-hover:text-white transition duration-300">
                    <HeartPulse size={18} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-800 group-hover:text-vet-leaf transition">Serviços Veterinários</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">Consultas, anestesia segura, exames pré-operatórios no conforto do seu lar.</p>
                </div>
                <span className="text-[10px] font-bold text-vet-dark uppercase tracking-wider flex items-center gap-1.5 self-end">
                  Ver Serviços <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </span>
              </div>

              {/* Card 3: Galeria */}
              <div 
                onClick={() => navigateToPage('galeria')}
                className="group bg-white p-6 rounded-2xl border border-neutral-150 hover:border-vet-light/45 hover:shadow-[0_15px_30px_rgba(142,187,99,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="bg-vet-light/10 text-vet-dark p-3 rounded-xl w-fit group-hover:bg-vet-leaf group-hover:text-white transition duration-300">
                    <Camera size={18} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-800 group-hover:text-vet-leaf transition">Galeria de Fotos</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">Acompanhe registros reais de consultas domiciliares, procedimentos e pacientes felizes.</p>
                </div>
                <span className="text-[10px] font-bold text-vet-dark uppercase tracking-wider flex items-center gap-1.5 self-end">
                  Ver Galeria <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </span>
              </div>

              {/* Card 4: Depoimentos */}
              <div 
                onClick={() => navigateToPage('depoimentos')}
                className="group bg-white p-6 rounded-2xl border border-neutral-150 hover:border-vet-light/45 hover:shadow-[0_15px_30px_rgba(142,187,99,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="bg-vet-light/10 text-vet-dark p-3 rounded-xl w-fit group-hover:bg-vet-leaf group-hover:text-white transition duration-300">
                    <MessageSquare size={18} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-800 group-hover:text-vet-leaf transition">Depoimentos</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">Leia o carinho e relatos dos tutores que confiaram a vida de seus pets aos nossos cuidados.</p>
                </div>
                <span className="text-[10px] font-bold text-vet-dark uppercase tracking-wider flex items-center gap-1.5 self-end">
                  Ler Depoimentos <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </span>
              </div>

              {/* Card 5: Blog */}
              <div 
                onClick={() => navigateToPage('blog')}
                className="group bg-white p-6 rounded-2xl border border-neutral-150 hover:border-vet-light/45 hover:shadow-[0_15px_30px_rgba(142,187,99,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="bg-vet-light/10 text-vet-dark p-3 rounded-xl w-fit group-hover:bg-vet-leaf group-hover:text-white transition duration-300">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-800 group-hover:text-vet-leaf transition">Dicas e Blog</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">Artigos educativos sobre saúde animal, anestesiologia e bem-estar do pet.</p>
                </div>
                <span className="text-[10px] font-bold text-vet-dark uppercase tracking-wider flex items-center gap-1.5 self-end">
                  Acessar Blog <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </span>
              </div>

              {/* Card 6: Agendamento */}
              <div 
                onClick={() => navigateToPage('agendamento')}
                className="group bg-neutral-900 p-6 rounded-2xl border border-neutral-800 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-56 text-white"
              >
                <div className="space-y-3">
                  <div className="bg-vet-leaf text-white p-3 rounded-xl w-fit">
                    <Calendar size={18} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-white group-hover:text-vet-light transition">Solicitar Consulta</h3>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">Agende um horário para seu cão ou gato, ou envie informações para orçamento anestésico.</p>
                </div>
                <span className="text-[10px] font-bold text-vet-light uppercase tracking-wider flex items-center gap-1.5 self-end">
                  Agendar Agora <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ----------------- 2. QUEM SOU (ABOUT ME) ----------------- */}
      {currentPage === 'quem-sou' && (
        <>
          {renderPageHeader("Quem Sou", "Saiba mais sobre a dedicação, formação acadêmica e amor incondicional da Dra. Júlia Guaraldo pela saúde e bem-estar de cães e gatos.")}
          <section id="quem-sou" className="py-20 md:py-28 px-6 md:px-12 w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Photo frame */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-vet-light/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-vet-dark/15 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="photo-blob w-[280px] h-[340px] sm:w-[320px] sm:h-[390px] md:w-[340px] md:h-[410px] overflow-hidden relative">
                  <img 
                    src={cmsState.info.aboutImage} 
                    alt={cmsState.info.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Texts and Tabbed Qualifications */}
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-bold uppercase tracking-widest text-vet-dark block">Dedicada à Medicina Veterinária</span>
                <h2 className="text-3xl md:text-4xl font-light font-serif text-neutral-800 leading-tight">
                  {cmsState.info.aboutTitle}
                </h2>

                {/* Paragraph renders split lines for clean reading */}
                <div className="text-neutral-600 text-sm leading-relaxed space-y-4 font-light whitespace-pre-line">
                  {cmsState.info.aboutText}
                </div>

                {/* Inner qualifications tabber */}
                <div className="pt-4 border-t border-neutral-100">
                  <div className="flex gap-2 border-b border-neutral-100 pb-2 mb-4 overflow-x-auto">
                    <button
                      onClick={() => setActiveAboutTab('formations')}
                      className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${activeAboutTab === 'formations' ? 'border-vet-dark text-vet-dark' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                    >
                      Formação Acadêmica
                    </button>
                    <button
                      onClick={() => setActiveAboutTab('specializations')}
                      className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${activeAboutTab === 'specializations' ? 'border-vet-dark text-vet-dark' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                    >
                      Especializações
                    </button>
                    <button
                      onClick={() => setActiveAboutTab('experiences')}
                      className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 cursor-pointer ${activeAboutTab === 'experiences' ? 'border-vet-dark text-vet-dark' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                    >
                      Experiência
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.ul 
                      key={activeAboutTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {activeAboutTab === 'formations' && cmsState.info.formations.map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-600">
                          <ChevronRight size={16} className="text-vet-leaf shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}

                      {activeAboutTab === 'specializations' && cmsState.info.specializations.map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-600">
                          <ChevronRight size={16} className="text-vet-leaf shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}

                      {activeAboutTab === 'experiences' && cmsState.info.experiences.map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-600">
                          <ChevronRight size={16} className="text-vet-leaf shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </motion.ul>
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </section>
        </>
      )}

      {/* ----------------- 3. SERVIÇOS (SERVICES BENTO-GRID) ----------------- */}
      {currentPage === 'servicos' && (
        <>
          {renderPageHeader("Nossos Serviços", "Atendimento clínico domiciliar e suporte anestésico com máximo rigor científico e carinho para com seu pet.")}
          <section id="servicos" className="bg-vet-bg py-20 md:py-28 px-6 md:px-12">
            <div className="w-full max-w-7xl mx-auto space-y-12">
              
              <div className="text-center max-w-xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-vet-dark">Especialidades e Cuidados</span>
                <h2 className="text-3xl md:text-4xl font-light font-serif text-neutral-800">
                  Serviços Veterinários
                </h2>
                <p className="text-sm text-neutral-500 font-light">
                  Atendimento com alto rigor cirúrgico, segurança e carinho absoluto no planejamento de cada consulta ou anestesia.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cmsState.services.map(s => (
                  <motion.div 
                    whileHover={{ y: -6 }}
                    key={s.id} 
                    className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-48 overflow-hidden bg-neutral-100">
                        <img src={s.image} alt={s.title} className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                      </div>
                      
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-vet-light text-white p-2.5 rounded-[50%_50%_50%_0] shadow-xs flex items-center justify-center shrink-0">
                            {renderIcon(s.icon)}
                          </div>
                          <h3 className="font-semibold text-neutral-800 text-base font-serif">{s.title}</h3>
                        </div>

                        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2">
                      <button
                        onClick={() => setSelectedService(s)}
                        className="w-full bg-neutral-50 hover:bg-vet-light hover:text-neutral-900 border border-neutral-200 hover:border-vet-light text-neutral-700 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Saber Mais <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </section>
        </>
      )}

      {/* ----------------- 4. GALERIA (PORTFOLIO GALLERY) ----------------- */}
      {currentPage === 'galeria' && (
        <>
          {renderPageHeader("Galeria de Mídias", "Confira registros reais de consultas domiciliares, momentos com nossos queridos pacientes e procedimentos anestésicos seguros.")}
          <section id="galeria" className="py-20 md:py-28 px-6 md:px-12 w-full max-w-7xl mx-auto space-y-12">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-vet-dark block">Momentos do nosso trabalho</span>
                <h2 className="text-3xl md:text-4xl font-light font-serif text-neutral-800">
                  Galeria de Mídias
                </h2>
                <p className="text-sm text-neutral-500 max-w-md font-light">
                  Registros reais de atendimentos domiciliares acolhedores e controle rigoroso de anestesia em procedimentos parceiros.
                </p>
              </div>

              {/* Categorized Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {['all', 'Atendimentos', 'Procedimentos', 'Antes e Depois', 'Clínica', 'Outros'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveMediaFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer ${activeMediaFilter === cat ? 'bg-vet-dark text-white shadow-sm' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'}`}
                  >
                    {cat === 'all' ? 'Ver Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {cmsState.media
                .filter(m => activeMediaFilter === 'all' || m.category === activeMediaFilter)
                .map(m => (
                  <div 
                    key={m.id}
                    onClick={() => setLightboxMedia(m)}
                    className="group relative h-48 border border-neutral-100 rounded-2xl overflow-hidden cursor-pointer shadow-xs"
                  >
                    {m.type === 'photo' ? (
                      <img src={m.url} alt={m.caption} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center p-4 text-center text-white relative">
                        <Video size={28} className="text-vet-light mb-1.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{m.videoType || 'Vídeo'}</span>
                        <Play size={20} className="absolute inset-0 m-auto text-white opacity-40" />
                      </div>
                    )}

                    {/* Caption overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <span className="bg-vet-light text-neutral-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md self-start uppercase">
                        {m.category}
                      </span>
                      <p className="text-[10px] text-white line-clamp-2 leading-tight font-medium mt-2">{m.caption}</p>
                    </div>
                  </div>
                ))}
            </div>

          </section>
        </>
      )}

      {/* ----------------- 5. DEPOIMENTOS (TESTIMONIALS) ----------------- */}
      {currentPage === 'depoimentos' && (
        <>
          {renderPageHeader("O Que Dizem os Tutores", "Leia relatos sinceros, carinhosos e reais de quem confiou a vida e o bem-estar de seus cães e gatos ao nosso atendimento especializado.")}
          <section id="depoimentos" className="bg-vet-bg py-20 md:py-28 px-6 md:px-12">
            <div className="w-full max-w-7xl mx-auto space-y-12">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-vet-dark block">Aprovado pelos tutores</span>
                  <h2 className="text-3xl md:text-4xl font-light font-serif text-neutral-800">
                    O que dizem sobre nós
                  </h2>
                  <p className="text-sm text-neutral-500 font-light">
                    Comentários reais de quem vivenciou o carinho e o profissionalismo no atendimento veterinário.
                  </p>
                </div>

                <button
                  onClick={() => setShowTestimonialModal(true)}
                  className="bg-vet-leaf hover:bg-vet-dark text-white px-5 py-3 rounded-full text-xs font-semibold shadow-[0_6px_15px_rgba(142,187,99,0.25)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} /> Deixar Meu Depoimento
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedTestimonials.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-6 text-center col-span-full">Ainda não há depoimentos publicados no momento.</p>
                ) : (
                  approvedTestimonials.map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex gap-1 text-amber-400 text-sm">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} size={16} fill="currentColor" />
                          ))}
                        </div>
                        <p className="text-xs text-neutral-600 italic leading-relaxed">
                          "{t.content}"
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-neutral-800">{t.name}</strong>
                          <p className="text-[10px] text-neutral-400">Tutor(a) de {t.petName} ({t.petSpecies})</p>
                        </div>
                        <span className="bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-400 text-[10px] font-mono px-2 py-0.5">
                          {t.date}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </section>
        </>
      )}

      {/* ----------------- 6. BLOG SECTION ----------------- */}
      {currentPage === 'blog' && (
        <>
          {renderPageHeader("Dicas e Blog", "Artigos informativos de medicina veterinária, anestesiologia e manejo animal focado em promover bem-estar diário.")}
          <section id="blog" className="py-20 md:py-28 px-6 md:px-12 w-full max-w-7xl mx-auto space-y-12">
            
            <div className="text-center max-w-xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-vet-dark block">Dicas e Informação Veterinária</span>
              <h2 className="text-3xl md:text-4xl font-light font-serif text-neutral-800">
                Dicas da Dra. Júlia (Blog)
              </h2>
              <p className="text-sm text-neutral-500 font-light">
                Artigos informativos de medicina veterinária, anestesiologia e manejo animal focado em promover bem-estar diário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cmsState.blog.map(post => (
                <div 
                  key={post.id} 
                  className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition grid grid-cols-1 sm:grid-cols-5 gap-4"
                >
                  <div className="sm:col-span-2 h-44 sm:h-full bg-neutral-100 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="sm:col-span-3 p-5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="bg-vet-light/20 text-vet-dark text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {post.category}
                      </span>
                      
                      <h3 className="font-bold text-neutral-800 font-display text-base leading-tight">
                        {post.title}
                      </h3>

                      <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3 font-light">
                        {post.summary}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
                      <span>{post.date}</span>
                      <button
                        onClick={() => handleOpenArticle(post)}
                        className="text-vet-dark font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Ler Completo <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </section>
        </>
      )}

      {/* ----------------- 7. SCHEDULING FORM (AGENDAMENTO) ----------------- */}
      {currentPage === 'agendamento' && (
        <>
          {renderPageHeader("Agendamento Clínico", "Solicite um agendamento de consulta domiciliar ou envie detalhes para um orçamento anestésico personalizado.")}
          <section id="agendamento" className="bg-vet-bg py-20 md:py-28 px-6 md:px-12">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
          
          <div className="bg-vet-dark p-8 text-white text-center space-y-3 relative">
            <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-full">
              <Calendar size={18} />
            </div>
            <h3 className="text-xl md:text-2xl font-light font-serif uppercase tracking-wider">Solicitar Consulta / Orçamento Anestésico</h3>
            <p className="text-xs text-neutral-200 leading-relaxed font-light max-w-md mx-auto">
              Preencha os campos abaixo. Iremos registrar a solicitação, e a Dra. Júlia entrará em contato via WhatsApp para confirmar disponibilidade.
            </p>
          </div>

          <form onSubmit={handleScheduleAppointment} className="p-8 space-y-6">
            
            {appointmentSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="font-bold text-lg text-neutral-800">Pedido Enviado com Sucesso!</h4>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-md mx-auto">
                  Agradecemos a confiança! Os dados foram gravados em nossa base clínica. A Dra. Júlia entrará em contato via WhatsApp no número informado muito em breve.
                </p>
              </motion.div>
            ) : (
              <>
                {/* 1. Tutor Info */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">1. Dados do Tutor</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        required
                        value={appointmentForm.name}
                        onChange={e => setAppointmentForm({ ...appointmentForm, name: e.target.value })}
                        placeholder="Ex: Clara Antunes"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">E-mail</label>
                      <input 
                        type="email" 
                        required
                        value={appointmentForm.email}
                        onChange={e => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                        placeholder="Ex: clara@email.com"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Telefone Fixo / Comercial</label>
                      <input 
                        type="text" 
                        required
                        value={appointmentForm.phone}
                        onChange={e => setAppointmentForm({ ...appointmentForm, phone: e.target.value })}
                        placeholder="Ex: (11) 98765-4321"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">WhatsApp para Contato Direto</label>
                      <input 
                        type="text" 
                        required
                        value={appointmentForm.whatsapp}
                        onChange={e => setAppointmentForm({ ...appointmentForm, whatsapp: e.target.value })}
                        placeholder="Ex: 5511987654321"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pet Info */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">2. Informações do Pet</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Espécie</label>
                      <select
                        value={appointmentForm.species}
                        onChange={e => setAppointmentForm({ ...appointmentForm, species: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                      >
                        <option value="Cão">Cão</option>
                        <option value="Gato">Gato</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Raça</label>
                      <input 
                        type="text" 
                        value={appointmentForm.breed}
                        onChange={e => setAppointmentForm({ ...appointmentForm, breed: e.target.value })}
                        placeholder="Ex: SRD, Persa, Golden"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Idade do Pet</label>
                      <input 
                        type="text" 
                        value={appointmentForm.age}
                        onChange={e => setAppointmentForm({ ...appointmentForm, age: e.target.value })}
                        placeholder="Ex: 3 anos"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Peso Estimado</label>
                      <input 
                        type="text" 
                        value={appointmentForm.weight}
                        onChange={e => setAppointmentForm({ ...appointmentForm, weight: e.target.value })}
                        placeholder="Ex: 5.5 kg"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Address and Time */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">3. Endereço e Preferência de Horário</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Endereço Completo</label>
                      <input 
                        type="text" 
                        required
                        value={appointmentForm.address}
                        onChange={e => setAppointmentForm({ ...appointmentForm, address: e.target.value })}
                        placeholder="Rua, Número, Complemento, Bairro e Cidade"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">CEP</label>
                      <input 
                        type="text" 
                        required
                        value={appointmentForm.cep}
                        onChange={e => setAppointmentForm({ ...appointmentForm, cep: e.target.value })}
                        placeholder="00000-000"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Data Desejada</label>
                      <input 
                        type="date" 
                        required
                        value={appointmentForm.date}
                        onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Horário de Preferência</label>
                      <input 
                        type="time" 
                        required
                        value={appointmentForm.time}
                        onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">4. Queixa Clínica / Motivo da Cirurgia</h4>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Descrição</label>
                    <textarea 
                      rows={3}
                      required
                      value={appointmentForm.reason}
                      onChange={e => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                      placeholder="Descreva brevemente o motivo do agendamento (Ex: Consulta anual preventiva, avaliação de dor articular, cirurgia de mastectomia agendada...)"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Observações Adicionais (Doenças prévias, temperamento...)</label>
                    <textarea 
                      rows={2}
                      value={appointmentForm.observations}
                      onChange={e => setAppointmentForm({ ...appointmentForm, observations: e.target.value })}
                      placeholder="Se houver alguma informação que queira destacar para adiantar o atendimento."
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-vet-leaf text-white hover:bg-vet-dark py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_10px_20px_rgba(142,187,99,0.3)] hover:shadow-lg transition cursor-pointer"
                >
                  Solicitar Consulta Domiciliar
                </button>
              </>
            )}

          </form>
        </div>
      </section>
        </>
      )}

      {/* ----------------- 8. CONTATO & REGIONAL MAP ----------------- */}
      {currentPage === 'contato' && (
        <>
          {renderPageHeader("Fale Conosco", "Dra. Júlia atende no conforto do seu lar em São Paulo, ABC Paulista e proximidades. Entre em contato para tirar dúvidas, solicitar orçamentos anestésicos ou agendar sua consulta.")}
          <section id="contato" className="py-20 md:py-28 px-6 md:px-12 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-vet-dark block">Atendimento Humanizado</span>
            <h2 className="text-3xl md:text-4xl font-light font-serif text-neutral-800">
              Contatos e Localidade
            </h2>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              Dra. Júlia atende no conforto do seu lar em São Paulo, ABC Paulista e proximidades. Para dúvidas sobre exames, orçamentos anestésicos ou parcerias cirúrgicas, use os canais oficiais:
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-vet-light/20 p-2.5 rounded-xl text-vet-dark">
                <Phone size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Telefone Comercial</span>
                <strong className="text-neutral-800 text-sm font-medium">{cmsState.info.phone}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="bg-vet-light/20 p-2.5 rounded-xl text-vet-dark">
                <Instagram size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Instagram Oficial</span>
                <a 
                  href={`https://instagram.com/${cmsState.info.instagram}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-vet-dark hover:underline text-sm font-medium"
                >
                  @{cmsState.info.instagram}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="bg-vet-light/20 p-2.5 rounded-xl text-vet-dark">
                <Mail size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">E-mail Comercial</span>
                <strong className="text-neutral-800 text-sm font-medium">{cmsState.info.email}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="bg-vet-light/20 p-2.5 rounded-xl text-vet-dark">
                <MapPin size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Região de Cobertura</span>
                <strong className="text-neutral-800 text-sm font-medium">{cmsState.info.address}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="bg-vet-light/20 p-2.5 rounded-xl text-vet-dark">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Horário de Atendimento</span>
                <strong className="text-neutral-800 text-sm font-medium">Segunda a Sexta: 08h às 19h • Sábado: 08h às 13h</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map iframe */}
        <div className="lg:col-span-7 h-96 lg:h-auto rounded-3xl overflow-hidden border border-neutral-200 shadow-md">
          <iframe 
            src={cmsState.info.googleMapEmbedUrl} 
            className="w-full h-full border-0"
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Área de Atendimento de Júlia Guaraldo"
          />
        </div>

      </section>
        </>
      )}

      {/* ----------------- FOOTER ----------------- */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 px-6 md:px-12 border-t border-neutral-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-display font-bold text-lg text-white">{cmsState.info.name}</h4>
            <p className="text-xs">{cmsState.info.specialty}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <button onClick={() => navigateToPage('quem-sou')} className="hover:text-white transition cursor-pointer">Quem Sou</button>
            <button onClick={() => navigateToPage('servicos')} className="hover:text-white transition cursor-pointer">Serviços</button>
            <button onClick={() => navigateToPage('galeria')} className="hover:text-white transition cursor-pointer">Galeria</button>
            <button onClick={() => navigateToPage('blog')} className="hover:text-white transition cursor-pointer">Blog</button>
            <button onClick={() => navigateToPage('contato')} className="hover:text-white transition cursor-pointer">Contato</button>
          </div>

          <div className="text-center md:text-right text-[10px] space-y-1">
            <p>© 2026 {cmsState.info.name}. Todos os direitos reservados.</p>
            <p className="text-neutral-600">Site institucional e sistema CMS desenvolvido com alto desempenho.</p>
          </div>
        </div>
      </footer>

      {/* ----------------- FLOATING TOOLBARS (WHATSAPP, BACK TO TOP) ----------------- */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {/* Back to top widget */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-neutral-800/90 hover:bg-neutral-900 text-white p-3 rounded-full shadow-lg transition duration-300 cursor-pointer"
              title="Voltar ao Topo"
            >
              <ArrowUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* WhatsApp primary floater */}
        <a 
          href={`https://wa.me/${cmsState.info.whatsapp}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-xl hover:scale-105 transition duration-300 flex items-center justify-center"
          title="Falar no WhatsApp"
        >
          <Phone size={24} className="animate-pulse" />
        </a>
      </div>


      {/* ======================================================== */}
      {/* OVERLAY MODAL: SERVICE SPECIFICATIONS */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
              <div className="h-56 relative bg-neutral-100">
                <img src={selectedService.image} alt={selectedService.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedService(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="bg-vet-light/20 p-2.5 rounded-xl text-vet-dark shrink-0">
                    {renderIcon(selectedService.icon)}
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl text-neutral-800 font-display">
                    {selectedService.title}
                  </h3>
                </div>

                <p className="text-xs text-neutral-400 font-bold tracking-wider uppercase">Detalhamento Técnico do Procedimento</p>
                <div className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line font-light">
                  {selectedService.details}
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
                <a
                  href="#agendamento"
                  onClick={() => setSelectedService(null)}
                  className="bg-vet-dark hover:bg-vet-leaf text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition"
                >
                  Agendar este Serviço
                </a>
                <button
                  onClick={() => setSelectedService(null)}
                  className="border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* OVERLAY MODAL: ARTICLE READER */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
              <div className="h-64 relative bg-neutral-100 shrink-0">
                <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-mono">
                  <span className="bg-vet-light/25 text-vet-dark text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {selectedPost.category}
                  </span>
                  <span>Publicado em: {selectedPost.date}</span>
                  <span>•</span>
                  <span>{selectedPost.views} visualizações</span>
                </div>

                <h3 className="font-bold text-2xl text-neutral-800 font-display leading-tight">
                  {selectedPost.title}
                </h3>

                <p className="text-neutral-500 text-sm font-semibold italic border-l-2 border-vet-leaf pl-3 py-1">
                  {selectedPost.summary}
                </p>

                <div className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line font-light py-2">
                  {selectedPost.content}
                </div>

                <div className="pt-4 flex flex-wrap gap-1.5 border-t border-neutral-100">
                  {selectedPost.tags.map((tag, i) => (
                    <span key={i} className="bg-neutral-100 text-neutral-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Fechar Leitura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* LIGHTBOX FOR PORTFOLIO (GALLERY IMAGES AND VIDEO EMBEDS) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {lightboxMedia && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full flex flex-col items-center gap-4 text-white"
            >
              <button
                onClick={() => setLightboxMedia(null)}
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="w-full bg-neutral-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                {lightboxMedia.type === 'photo' ? (
                  <img src={lightboxMedia.url} alt={lightboxMedia.caption} className="max-h-[70vh] max-w-full object-contain" />
                ) : (
                  <iframe 
                    src={lightboxMedia.url} 
                    className="w-full h-full aspect-video border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={lightboxMedia.caption}
                  />
                )}
              </div>

              <div className="text-center max-w-lg space-y-1">
                <span className="bg-vet-leaf text-neutral-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {lightboxMedia.category}
                </span>
                <p className="text-xs text-neutral-300 italic">{lightboxMedia.caption}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* TESTIMONIAL CREATOR SUB-MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showTestimonialModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden w-full max-w-md"
            >
              <div className="bg-vet-dark p-6 text-white flex justify-between items-center">
                <h3 className="font-bold font-display text-lg">Escrever Depoimento</h3>
                <button
                  onClick={() => setShowTestimonialModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTestimonial} className="p-6 space-y-4">
                {testimonialSubmitted ? (
                  <div className="py-8 text-center space-y-3">
                    <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-neutral-800 text-sm">Depoimento Registrado!</h4>
                    <p className="text-xs text-neutral-500">
                      Obrigado por nos avaliar! Sua opinião foi enviada para aprovação do moderador e logo estará visível no site.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Seu Nome</label>
                        <input 
                          type="text" 
                          required
                          value={testimonialForm.name}
                          onChange={e => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                          placeholder="Ex: Mariana Silva"
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-neutral-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nome do Pet</label>
                        <input 
                          type="text" 
                          required
                          value={testimonialForm.petName}
                          onChange={e => setTestimonialForm({ ...testimonialForm, petName: e.target.value })}
                          placeholder="Ex: Oliver"
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-neutral-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Espécie do Pet</label>
                        <select
                          value={testimonialForm.petSpecies}
                          onChange={e => setTestimonialForm({ ...testimonialForm, petSpecies: e.target.value as any })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                        >
                          <option value="Cão">Cão</option>
                          <option value="Gato">Gato</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nota (1 a 5 estrelas)</label>
                        <select
                          value={testimonialForm.rating}
                          onChange={e => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                        >
                          <option value="5">5 Estrelas (Excelente)</option>
                          <option value="4">4 Estrelas (Muito Bom)</option>
                          <option value="3">3 Estrelas (Bom)</option>
                          <option value="2">2 Estrelas (Regular)</option>
                          <option value="1">1 Estrela (Insatisfatório)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Seu Comentário</label>
                      <textarea 
                        rows={4}
                        required
                        value={testimonialForm.content}
                        onChange={e => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                        placeholder="Fale como foi a consulta, o carinho do atendimento e o bem-estar do seu pet..."
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-neutral-50"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-vet-dark text-white hover:bg-vet-leaf py-3 rounded-lg text-xs font-bold uppercase transition cursor-pointer"
                    >
                      Enviar Depoimento
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
