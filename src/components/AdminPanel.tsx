import React, { useState, useRef, useEffect } from 'react';
import { 
  CMSState, 
  ClinicInfo, 
  Service, 
  MediaItem, 
  Testimonial, 
  BlogPost, 
  Appointment 
} from '../types';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  saveClinicInfo, 
  saveService, 
  deleteService, 
  saveMediaItem, 
  deleteMediaItem, 
  saveTestimonial, 
  deleteTestimonial, 
  saveBlogPost, 
  deleteBlogPost, 
  saveAppointment, 
  deleteAppointment 
} from '../lib/firestoreSync';
import { 
  Activity, 
  Home, 
  ShieldAlert, 
  HeartPulse, 
  Sparkles, 
  Calendar, 
  Users, 
  Image as ImageIcon, 
  Video, 
  BookOpen, 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Check, 
  Trash2, 
  Plus, 
  Edit, 
  X, 
  FileText, 
  Upload, 
  LogOut, 
  Settings, 
  Eye, 
  EyeOff, 
  Clock, 
  Shield, 
  AlertCircle,
  FileDown
} from 'lucide-react';
import { motion } from 'motion/react';

const getErrorMessage = (err: any): string => {
  if (!err) return 'Erro desconhecido.';
  const rawMsg = err.message || String(err);
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed && parsed.error) {
      if (parsed.error.includes('Missing or insufficient permissions') || parsed.error.includes('permission-denied')) {
        return 'Permissão negada. Você precisa fazer login com uma conta de administrador autorizada (como NCodes ou Dra. Júlia).';
      }
      return parsed.error;
    }
  } catch (e) {
    // Not JSON
  }
  if (rawMsg.includes('Missing or insufficient permissions') || rawMsg.includes('permission-denied')) {
    return 'Permissão negada. Você precisa fazer login com uma conta de administrador autorizada (como NCodes ou Dra. Júlia).';
  }
  return rawMsg;
};

interface AdminPanelProps {
  cmsState: CMSState;
  onUpdateState: (newState: CMSState) => void;
  onClose: () => void;
}

export default function AdminPanel({ cmsState, onUpdateState, onClose }: AdminPanelProps) {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('vet_admin_auth') === 'true';
  });
  const [adminRole, setAdminRole] = useState<'master' | 'owner' | null>(() => {
    return localStorage.getItem('vet_admin_role') as 'master' | 'owner' | null;
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Track Firebase Google Auth state
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  // Determine actual role in the current session
  const currentRole = (firebaseUser && firebaseUser.email === 'ncodes@drajuliaguaraldo.com') ? 'master' : (firebaseUser && firebaseUser.email === 'julia@drajuliaguaraldo.com' ? 'owner' : adminRole);

  // Combined Auth check (Google Admin or local credential)
  const isCurrentlyAdmin = (firebaseUser && (firebaseUser.email === 'ncodes@drajuliaguaraldo.com' || firebaseUser.email === 'julia@drajuliaguaraldo.com')) || isAuthenticated;

  // Real Database admin status checking Firebase authenticated email
  const isFirebaseDbAdmin = !!(firebaseUser && firebaseUser.email && (
    firebaseUser.email.toLowerCase() === 'ncodes@drajuliaguaraldo.com' ||
    firebaseUser.email.toLowerCase() === 'julia@drajuliaguaraldo.com'
  ));

  // Menu/Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'info' | 'services' | 'media' | 'testimonials' | 'blog' | 'appointments'>('dashboard');

  // Success / Error Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form States
  const [infoForm, setInfoForm] = useState<ClinicInfo>({ 
    ...cmsState.info,
    logoImage: cmsState.info.logoImage || ''
  });
  
  // Service edit states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [serviceForm, setServiceForm] = useState<Service>({
    id: '', title: '', description: '', details: '', icon: 'HeartPulse', image: ''
  });

  // Media edit states
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [uploadCategory, setUploadCategory] = useState<'Procedimentos' | 'Atendimentos' | 'Antes e Depois' | 'Clínica' | 'Outros'>('Atendimentos');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blog edit states
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postForm, setPostForm] = useState<BlogPost>({
    id: '', title: '', summary: '', content: '', category: '', image: '', date: '', tags: [], views: 0
  });
  const [tagInput, setTagInput] = useState('');

  // Trigger temporary success notification
  const triggerAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Auth Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    
    // Check for NCodes (Master Programmer)
    if (cleanUser.toLowerCase() === 'ncodes' && password === 'Taijou13') {
      try {
        const email = 'ncodes@drajuliaguaraldo.com';
        const pass = 'Taijou13';
        let firebaseSuccess = false;
        let firebaseErrorMsg = '';

        try {
          await signInWithEmailAndPassword(auth, email, pass);
          firebaseSuccess = true;
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            try {
              await createUserWithEmailAndPassword(auth, email, pass);
              firebaseSuccess = true;
            } catch (createErr: any) {
              console.error('Failed to create background auth user:', createErr);
              firebaseErrorMsg = createErr.message || String(createErr);
              if (createErr.code === 'auth/operation-not-allowed') {
                firebaseErrorMsg = "O provedor de login 'E-mail/Senha' está DESATIVADO no seu Firebase Console (Authentication > Sign-in method). Por favor, ative-o para habilitar esta conta.";
              }
            }
          } else {
            console.error('Failed to login background auth user:', err);
            firebaseErrorMsg = err.message || String(err);
            if (err.code === 'auth/operation-not-allowed') {
              firebaseErrorMsg = "O provedor de login 'E-mail/Senha' está DESATIVADO no seu Firebase Console (Authentication > Sign-in method). Por favor, ative-o para habilitar esta conta.";
            }
          }
        }

        if (!firebaseSuccess) {
          console.warn('Firebase background auth failed:', firebaseErrorMsg);
        }

        setIsAuthenticated(true);
        setAdminRole('master');
        localStorage.setItem('vet_admin_auth', 'true');
        localStorage.setItem('vet_admin_role', 'master');
        localStorage.setItem('vet_admin_user', 'NCodes');
        setLoginError('');
        if (!firebaseSuccess) {
          triggerAlert('Logado localmente com sucesso! (Verifique o aviso de permissões do Firebase abaixo)', 'error');
        } else {
          triggerAlert('Login efetuado com sucesso como Master (Programador)!');
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setLoginError('Erro de autenticação no banco de dados.');
      }
    } 
    // Check for Júlia (Dona / Proprietária)
    else if ((cleanUser.toLowerCase() === 'júlia' || cleanUser.toLowerCase() === 'julia') && password === 'Julia123') {
      try {
        const email = 'julia@drajuliaguaraldo.com';
        const pass = 'Julia123';
        let firebaseSuccess = false;
        let firebaseErrorMsg = '';

        try {
          await signInWithEmailAndPassword(auth, email, pass);
          firebaseSuccess = true;
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            try {
              await createUserWithEmailAndPassword(auth, email, pass);
              firebaseSuccess = true;
            } catch (createErr: any) {
              console.error('Failed to create background auth user:', createErr);
              firebaseErrorMsg = createErr.message || String(createErr);
              if (createErr.code === 'auth/operation-not-allowed') {
                firebaseErrorMsg = "O provedor de login 'E-mail/Senha' está DESATIVADO no seu Firebase Console (Authentication > Sign-in method). Por favor, ative-o para habilitar esta conta.";
              }
            }
          } else {
            console.error('Failed to login background auth user:', err);
            firebaseErrorMsg = err.message || String(err);
            if (err.code === 'auth/operation-not-allowed') {
              firebaseErrorMsg = "O provedor de login 'E-mail/Senha' está DESATIVADO no seu Firebase Console (Authentication > Sign-in method). Por favor, ative-o para habilitar esta conta.";
            }
          }
        }

        if (!firebaseSuccess) {
          console.warn('Firebase background auth failed:', firebaseErrorMsg);
        }

        setIsAuthenticated(true);
        setAdminRole('owner');
        localStorage.setItem('vet_admin_auth', 'true');
        localStorage.setItem('vet_admin_role', 'owner');
        localStorage.setItem('vet_admin_user', 'Júlia');
        setLoginError('');
        if (!firebaseSuccess) {
          triggerAlert('Logada localmente com sucesso! (Verifique o aviso de permissões do Firebase abaixo)', 'error');
        } else {
          triggerAlert('Bem-vinda, Dra. Júlia! Login efetuado com sucesso.');
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setLoginError('Erro de autenticação no banco de dados.');
      }
    } else {
      setLoginError('Usuário ou senha incorretos.');
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setAdminRole(null);
    localStorage.removeItem('vet_admin_auth');
    localStorage.removeItem('vet_admin_role');
    localStorage.removeItem('vet_admin_user');
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    triggerAlert('Sessão encerrada.');
  };

  // 1. Info Save Handler
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const originalInfo = { ...cmsState.info };
    onUpdateState({
      ...cmsState,
      info: infoForm
    });
    try {
      await saveClinicInfo(infoForm);
      triggerAlert('Configurações gerais atualizadas com sucesso!');
    } catch (err) {
      onUpdateState({
        ...cmsState,
        info: originalInfo
      });
      triggerAlert(`Erro ao atualizar configurações: ${getErrorMessage(err)}`, 'error');
    }
  };

  // Helper to append specializations, experiences, formations
  const handleAddItem = (type: 'specializations' | 'experiences' | 'formations', value: string) => {
    if (!value.trim()) return;
    setInfoForm(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
  };

  const handleRemoveItem = (type: 'specializations' | 'experiences' | 'formations', index: number) => {
    setInfoForm(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        triggerAlert('Apenas arquivos de imagem são permitidos!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInfoForm(prev => ({
            ...prev,
            logoImage: event.target?.result as string
          }));
          triggerAlert('Logotipo carregado com sucesso!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Services Handlers
  const handleOpenEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({ ...service });
    setIsCreatingService(false);
  };

  const handleOpenCreateService = () => {
    setIsCreatingService(true);
    setEditingService(null);
    setServiceForm({
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      description: '',
      details: '',
      icon: 'HeartPulse',
      image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800'
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedServices = [...cmsState.services];
    
    if (isCreatingService) {
      updatedServices.push(serviceForm);
    } else {
      updatedServices = updatedServices.map(s => s.id === serviceForm.id ? serviceForm : s);
    }

    const originalServices = [...cmsState.services];
    onUpdateState({
      ...cmsState,
      services: updatedServices
    });
    setEditingService(null);
    setIsCreatingService(false);

    try {
      await saveService(serviceForm);
      triggerAlert(isCreatingService ? `Serviço "${serviceForm.title}" criado com sucesso!` : `Serviço "${serviceForm.title}" atualizado com sucesso!`);
    } catch (err) {
      onUpdateState({
        ...cmsState,
        services: originalServices
      });
      triggerAlert(`Erro ao salvar serviço: ${getErrorMessage(err)}`, 'error');
    }
  };

  const handleDeleteService = async (id: string, title: string) => {
    if (confirm(`Deseja realmente excluir o serviço "${title}"?`)) {
      const originalServices = [...cmsState.services];
      onUpdateState({
        ...cmsState,
        services: cmsState.services.filter(s => s.id !== id)
      });
      try {
        await deleteService(id);
        triggerAlert(`Serviço "${title}" excluído.`);
      } catch (err) {
        onUpdateState({
          ...cmsState,
          services: originalServices
        });
        triggerAlert(`Erro ao deletar serviço: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  // 3. Media Handlers (Drag & Drop image to Base64)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerAlert('Apenas arquivos de imagem são permitidos!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const newMediaItem: MediaItem = {
          id: Math.random().toString(36).substring(2, 9),
          type: 'photo',
          url: event.target.result as string,
          caption: file.name.replace(/\.[^/.]+$/, ""), // file name without extension
          category: uploadCategory
        };
        const originalMedia = [...cmsState.media];
        onUpdateState({
          ...cmsState,
          media: [newMediaItem, ...cmsState.media]
        });

        try {
          await saveMediaItem(newMediaItem);
          triggerAlert('Imagem enviada e compactada com sucesso!');
        } catch (err) {
          onUpdateState({
            ...cmsState,
            media: originalMedia
          });
          triggerAlert(`Erro ao salvar imagem: ${getErrorMessage(err)}`, 'error');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;

    let finalUrl = videoUrlInput.trim();
    let videoType: 'youtube' | 'instagram' | 'tiktok' | 'local' = 'local';

    if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
      videoType = 'youtube';
      // convert to embed if simple link
      if (finalUrl.includes('watch?v=')) {
        const id = finalUrl.split('v=')[1]?.split('&')[0];
        if (id) finalUrl = `https://www.youtube.com/embed/${id}`;
      } else if (finalUrl.includes('youtu.be/')) {
        const id = finalUrl.split('youtu.be/')[1]?.split('?')[0];
        if (id) finalUrl = `https://www.youtube.com/embed/${id}`;
      }
    } else if (finalUrl.includes('instagram.com')) {
      videoType = 'instagram';
    } else if (finalUrl.includes('tiktok.com')) {
      videoType = 'tiktok';
    }

    const newVideoItem: MediaItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'video',
      url: finalUrl,
      caption: videoCaption.trim() || 'Vídeo Clínico',
      category: uploadCategory,
      videoType
    };

    const originalMedia = [...cmsState.media];
    onUpdateState({
      ...cmsState,
      media: [newVideoItem, ...cmsState.media]
    });

    setVideoUrlInput('');
    setVideoCaption('');

    try {
      await saveMediaItem(newVideoItem);
      triggerAlert('Mídia de vídeo vinculada com sucesso!');
    } catch (err) {
      onUpdateState({
        ...cmsState,
        media: originalMedia
      });
      triggerAlert(`Erro ao salvar vídeo: ${getErrorMessage(err)}`, 'error');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta mídia?')) {
      const originalMedia = [...cmsState.media];
      onUpdateState({
        ...cmsState,
        media: cmsState.media.filter(m => m.id !== id)
      });
      try {
        await deleteMediaItem(id);
        triggerAlert('Mídia removida com sucesso.');
      } catch (err) {
        onUpdateState({
          ...cmsState,
          media: originalMedia
        });
        triggerAlert(`Erro ao excluir mídia: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  // 4. Testimonials Approvals
  const handleToggleTestimonialApproval = async (id: string) => {
    let updatedItem: Testimonial | null = null;
    const updated = cmsState.testimonials.map(t => {
      if (t.id === id) {
        updatedItem = { ...t, approved: !t.approved };
        return updatedItem;
      }
      return t;
    });
    const originalTestimonials = [...cmsState.testimonials];
    onUpdateState({
      ...cmsState,
      testimonials: updated
    });

    if (updatedItem) {
      try {
        await saveTestimonial(updatedItem);
        triggerAlert(updatedItem.approved ? 'Depoimento aprovado e publicado!' : 'Depoimento ocultado do público.');
      } catch (err) {
        onUpdateState({
          ...cmsState,
          testimonials: originalTestimonials
        });
        triggerAlert(`Erro ao atualizar depoimento: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (confirm('Excluir este depoimento permanentemente?')) {
      const originalTestimonials = [...cmsState.testimonials];
      onUpdateState({
        ...cmsState,
        testimonials: cmsState.testimonials.filter(t => t.id !== id)
      });
      try {
        await deleteTestimonial(id);
        triggerAlert('Depoimento excluído.');
      } catch (err) {
        onUpdateState({
          ...cmsState,
          testimonials: originalTestimonials
        });
        triggerAlert(`Erro ao excluir depoimento: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  // 5. Blog Posts
  const handleOpenEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({ ...post });
    setIsCreatingPost(false);
    setTagInput(post.tags.join(', '));
  };

  const handleOpenCreatePost = () => {
    setIsCreatingPost(true);
    setEditingPost(null);
    setPostForm({
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      summary: '',
      content: '',
      category: 'Geral',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      views: 0
    });
    setTagInput('');
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArr = tagInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const finalForm = { ...postForm, tags: tagsArr };
    
    let updatedBlog = [...cmsState.blog];
    if (isCreatingPost) {
      updatedBlog.push(finalForm);
    } else {
      updatedBlog = updatedBlog.map(p => p.id === finalForm.id ? finalForm : p);
    }

    const originalBlog = [...cmsState.blog];
    onUpdateState({
      ...cmsState,
      blog: updatedBlog
    });
    setEditingPost(null);
    setIsCreatingPost(false);

    try {
      await saveBlogPost(finalForm);
      triggerAlert(isCreatingPost ? `Postagem "${finalForm.title}" publicada com sucesso!` : `Postagem "${finalForm.title}" atualizada com sucesso!`);
    } catch (err) {
      onUpdateState({
        ...cmsState,
        blog: originalBlog
      });
      triggerAlert(`Erro ao salvar artigo: ${getErrorMessage(err)}`, 'error');
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (confirm(`Deseja realmente excluir o artigo "${title}"?`)) {
      const originalBlog = [...cmsState.blog];
      onUpdateState({
        ...cmsState,
        blog: cmsState.blog.filter(p => p.id !== id)
      });
      try {
        await deleteBlogPost(id);
        triggerAlert(`Artigo "${title}" excluído.`);
      } catch (err) {
        onUpdateState({
          ...cmsState,
          blog: originalBlog
        });
        triggerAlert(`Erro ao excluir artigo: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  // 6. Appointment Manager
  const handleChangeAppointmentStatus = async (id: string, newStatus: 'Pendente' | 'Confirmado' | 'Cancelado') => {
    let updatedAppt: Appointment | null = null;
    const updated = cmsState.appointments.map(a => {
      if (a.id === id) {
        updatedAppt = { ...a, status: newStatus };
        return updatedAppt;
      }
      return a;
    });
    const originalAppointments = [...cmsState.appointments];
    onUpdateState({
      ...cmsState,
      appointments: updated
    });

    if (updatedAppt) {
      try {
        await saveAppointment(updatedAppt);
        triggerAlert(`Status do agendamento atualizado para: ${newStatus}`);
      } catch (err) {
        onUpdateState({
          ...cmsState,
          appointments: originalAppointments
        });
        triggerAlert(`Erro ao atualizar agendamento: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (confirm('Remover registro de agendamento permanentemente?')) {
      const originalAppointments = [...cmsState.appointments];
      onUpdateState({
        ...cmsState,
        appointments: cmsState.appointments.filter(a => a.id !== id)
      });
      try {
        await deleteAppointment(id);
        triggerAlert('Agendamento removido.');
      } catch (err) {
        onUpdateState({
          ...cmsState,
          appointments: originalAppointments
        });
        triggerAlert(`Erro ao remover agendamento: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  // Drag-and-drop file input click helper
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // --- LOGIN SCREEN ---
  if (!isCurrentlyAdmin) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-vet-light/20 p-4 rounded-full mb-3 text-vet-dark">
              <Shield size={36} />
            </div>
            <h1 className="text-2xl font-semibold text-neutral-800 font-display">Painel Administrativo</h1>
            <p className="text-sm text-neutral-500 mt-1">Dra. Júlia Guaraldo — CMS Privado</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Nome de Usuário
              </label>
              <input 
                type="text" 
                required
                autoComplete="off"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Digite o usuário"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-vet-light bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                Senha de Acesso
              </label>
              <input 
                type="password" 
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-vet-light bg-neutral-50"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-xs bg-red-50 text-red-600 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-vet-dark text-white font-medium rounded-lg py-3 hover:bg-vet-leaf transition shadow-md hover:shadow-lg mt-2 cursor-pointer"
            >
              Entrar no Painel
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-end items-center text-xs text-neutral-400">
            <button 
              onClick={onClose}
              className="text-vet-dark font-medium hover:underline cursor-pointer"
            >
              Voltar ao Site
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-neutral-800 font-display">Painel CMS</h2>
            {currentRole === 'master' ? (
              <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <Shield size={12} className="inline" /> NCodes (Master)
              </p>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Sparkles size={12} className="inline" /> Dra. Júlia (Dona)
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-neutral-400 hover:text-neutral-600 p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <Activity size={18} />
            Estatísticas Gerais
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'info' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <Settings size={18} />
            Informações do Site
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'services' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <HeartPulse size={18} />
            Serviços Clínicos
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'media' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <ImageIcon size={18} />
            Painel de Mídias
          </button>

          <button
            onClick={() => setActiveTab('testimonials')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'testimonials' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <Users size={18} />
            Depoimentos
          </button>

          <button
            onClick={() => setActiveTab('blog')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'blog' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <BookOpen size={18} />
            Artigos do Blog
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'appointments' ? 'bg-vet-light/20 text-vet-dark' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} />
              <span>Agendamentos</span>
            </div>
            {cmsState.appointments.filter(a => a.status === 'Pendente').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cmsState.appointments.filter(a => a.status === 'Pendente').length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-2">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Eye size={14} />
            Ver Site Público
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <LogOut size={14} />
            Encerrar Painel
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-50 pb-12">
        
        {/* HEADER */}
        <header className="bg-white border-b border-neutral-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-display text-neutral-800">
              {activeTab === 'dashboard' && 'Dashboard de Performance'}
              {activeTab === 'info' && 'Editar Informações do Site'}
              {activeTab === 'services' && 'Gerenciar Serviços Oferecidos'}
              {activeTab === 'media' && 'Galeria e Biblioteca de Mídia'}
              {activeTab === 'testimonials' && 'Moderação de Depoimentos'}
              {activeTab === 'blog' && 'Redigir e Editar Posts'}
              {activeTab === 'appointments' && 'Visualizador de Consultas'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-neutral-100 px-2.5 py-1.5 rounded-lg text-neutral-500 font-mono hidden sm:inline-block">
              Acesso: {currentRole === 'master' ? 'Master (Programador)' : 'Proprietária (Dona)'}
            </span>
            <button
              onClick={onClose}
              className="bg-vet-dark hover:bg-vet-leaf text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Eye size={14} />
              Visualizar Site
            </button>
          </div>
        </header>

        {/* ALERTS POPUP */}
        {alert && (
          <div className="mx-8 mt-6">
            <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
              <Check size={18} />
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          </div>
        )}

        <div className="px-8 mt-6 flex-1">
          
          {/* ======================================================== */}
          {/* TAB: DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* FIREBASE AUTH DISCONNECTED WARNING */}
              {!isFirebaseDbAdmin && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs space-y-3">
                  <div className="flex items-center gap-2.5 font-bold text-amber-800 text-sm">
                    <ShieldAlert size={20} className="text-amber-600 animate-pulse shrink-0" />
                    <span>Aviso Importante: Modo de Somente-Leitura Ativo</span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">
                    O painel administrativo local está ativo, mas o provedor de login por <strong>E-mail/Senha</strong> do Firebase está desativado no seu console. 
                    Isso impede a gravação e exclusão direta no banco de dados.
                  </p>
                  <div className="text-xs bg-white/50 p-3.5 rounded-xl border border-amber-200/50 space-y-2">
                    <span className="block font-bold text-amber-950">Como ativar a gravação/exclusão de dados:</span>
                    <p className="text-amber-900 leading-relaxed text-base-sm">
                      Acesse seu <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-950 hover:text-amber-800">Console do Firebase</a>, vá em 
                      <strong className="text-amber-950"> Authentication &gt; Sign-in method</strong>, clique em <strong className="text-amber-950">Adicionar Provedor</strong>, selecione <strong className="text-amber-950">E-mail/Senha</strong> e ative-o. Uma vez ativado, a sincronização de gravação funcionará perfeitamente!
                    </p>
                  </div>
                </div>
              )}
              {/* Analytics grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <span className="text-neutral-400 text-xs font-medium uppercase">Acessos Únicos</span>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{cmsState.stats.accesses}</p>
                  <span className="text-xs text-emerald-600 font-semibold mt-2 block">↑ 12% este mês</span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <span className="text-neutral-400 text-xs font-medium uppercase">Visualizações de Páginas</span>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{cmsState.stats.views}</p>
                  <span className="text-xs text-emerald-600 font-semibold mt-2 block">↑ 18% este mês</span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <span className="text-neutral-400 text-xs font-medium uppercase">Solicitações de Agendamento</span>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{cmsState.appointments.length}</p>
                  <span className="text-xs text-amber-600 font-semibold mt-2 block">
                    {cmsState.appointments.filter(a => a.status === 'Pendente').length} pendentes
                  </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <span className="text-neutral-400 text-xs font-medium uppercase">Depoimentos Públicos</span>
                  <p className="text-2xl font-bold text-neutral-800 mt-1">{cmsState.testimonials.length}</p>
                  <span className="text-xs text-neutral-500 mt-2 block">
                    {cmsState.testimonials.filter(t => !t.approved).length} não aprovados
                  </span>
                </div>
              </div>

              {/* Status grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Pending requests */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-neutral-800 font-display">Pedidos de Agendamento Recentes</h3>
                    <button 
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs text-vet-dark hover:underline font-semibold"
                    >
                      Ver todos
                    </button>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {cmsState.appointments.length === 0 ? (
                      <p className="text-sm text-neutral-400 py-4">Nenhum agendamento recebido.</p>
                    ) : (
                      cmsState.appointments.slice(0, 5).map(app => (
                        <div key={app.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm text-neutral-800">{app.name} ({app.species})</p>
                            <p className="text-xs text-neutral-500">Desejado: {app.date} às {app.time}</p>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            app.status === 'Confirmado' ? 'bg-emerald-50 text-emerald-700' :
                            app.status === 'Cancelado' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* DB Info Counter */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-neutral-800 font-display">Tamanho do Banco de Dados</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Artigos do Blog</span>
                      <strong className="text-neutral-800">{cmsState.blog.length} posts</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Mídias no Acervo</span>
                      <strong className="text-neutral-800">{cmsState.media.length} itens</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Serviços Oferecidos</span>
                      <strong className="text-neutral-800">{cmsState.services.length} serviços</strong>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-xl text-xs text-neutral-500 border border-neutral-150">
                    <p className="font-semibold mb-1 text-neutral-700">Modo de Armazenamento:</p>
                    LocalStorage Ativo. Seus dados estão salvos com segurança na memória do navegador e carregados instantaneamente.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: GENERAL SITE INFO */}
          {/* ======================================================== */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-6">

              {/* Logotipo e Identidade Visual */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-neutral-800 font-display border-b border-neutral-100 pb-3">
                  Logotipo e Identidade Visual
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">URL do Logotipo Personalizado</label>
                      <input 
                        type="text" 
                        placeholder="https://exemplo.com/sua-logo.png ou dados de imagem base64..."
                        value={infoForm.logoImage}
                        onChange={e => setInfoForm({ ...infoForm, logoImage: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">Insira um link direto de imagem, ou faça o upload de um arquivo local abaixo.</span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-600 uppercase">Fazer Upload de Arquivo Local</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition">
                          <Upload size={14} />
                          <span>Selecionar Imagem</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden" 
                          />
                        </label>
                        {infoForm.logoImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setInfoForm({ ...infoForm, logoImage: '' });
                              triggerAlert('Logotipo personalizado removido. Voltando ao padrão!');
                            }}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl px-3 py-2.5 text-xs font-semibold transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                            Remover Logotipo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center border border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Visualização Prévia da Logo</span>
                    <div className="bg-white border border-neutral-150 p-4 rounded-xl shadow-xs min-h-[90px] w-full flex items-center justify-center">
                      {infoForm.logoImage ? (
                        <img 
                          src={infoForm.logoImage} 
                          alt="Logotipo Personalizado" 
                          className="max-h-16 max-w-full object-contain" 
                        />
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="bg-vet-light text-white p-2 rounded-[50%_50%_50%_0] flex items-center justify-center shrink-0">
                            <HeartPulse size={16} />
                          </div>
                          <span className="text-xs text-neutral-500 font-semibold font-serif">Dra. Júlia Guaraldo</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-2">
                      {infoForm.logoImage ? 'Usando logotipo personalizado' : 'Usando logotipo orgânico padrão'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Main Banner and Hero */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-neutral-800 font-display border-b border-neutral-100 pb-3">
                  Configurações do Banner Principal (Hero)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Título do Banner</label>
                    <textarea 
                      rows={2}
                      value={infoForm.heroTitle}
                      onChange={e => setInfoForm({ ...infoForm, heroTitle: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Subtítulo do Banner</label>
                    <textarea 
                      rows={2}
                      value={infoForm.heroSubtitle}
                      onChange={e => setInfoForm({ ...infoForm, heroSubtitle: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Botão Agendamento</label>
                    <input 
                      type="text" 
                      value={infoForm.heroButtonText1}
                      onChange={e => setInfoForm({ ...infoForm, heroButtonText1: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Botão WhatsApp</label>
                    <input 
                      type="text" 
                      value={infoForm.heroButtonText2}
                      onChange={e => setInfoForm({ ...infoForm, heroButtonText2: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Imagem de Fundo do Banner (URL)</label>
                    <input 
                      type="text" 
                      value={infoForm.heroBgImage}
                      onChange={e => setInfoForm({ ...infoForm, heroBgImage: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">Insira um link de imagem do Unsplash ou use o painel de mídias para fazer upload e colar aqui.</span>
                  </div>
                </div>
              </div>

              {/* Bio and About section */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-neutral-800 font-display border-b border-neutral-100 pb-3">
                  Seção "Quem Sou" (Biografia)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Título do Perfil</label>
                      <input 
                        type="text" 
                        value={infoForm.aboutTitle}
                        onChange={e => setInfoForm({ ...infoForm, aboutTitle: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Texto da Biografia</label>
                      <textarea 
                        rows={8}
                        value={infoForm.aboutText}
                        onChange={e => setInfoForm({ ...infoForm, aboutText: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Foto de Perfil (URL)</label>
                      <input 
                        type="text" 
                        value={infoForm.aboutImage}
                        onChange={e => setInfoForm({ ...infoForm, aboutImage: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light bg-neutral-50"
                      />
                    </div>
                    <div className="border border-neutral-200 rounded-xl overflow-hidden h-48 flex items-center justify-center bg-neutral-100">
                      {infoForm.aboutImage ? (
                        <img src={infoForm.aboutImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-neutral-400">Sem foto cadastrada</span>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100" />

                {/* Sublists for specializations / formacoes / experiencias */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Formações */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-neutral-500 uppercase tracking-wider">Formação Acadêmica</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar formação..."
                        id="newFormation"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            handleAddItem('formations', val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                      />
                    </div>
                    <ul className="space-y-1 bg-neutral-50 p-3 rounded-xl border border-neutral-150 min-h-36">
                      {infoForm.formations.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs text-neutral-700 py-1 border-b border-neutral-100 last:border-0">
                          <span className="flex-1 pr-2">{item}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem('formations', idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Especialidades */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-neutral-500 uppercase tracking-wider">Especializações</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar especialização..."
                        id="newSpecialization"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            handleAddItem('specializations', val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                      />
                    </div>
                    <ul className="space-y-1 bg-neutral-50 p-3 rounded-xl border border-neutral-150 min-h-36">
                      {infoForm.specializations.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs text-neutral-700 py-1 border-b border-neutral-100 last:border-0">
                          <span className="flex-1 pr-2">{item}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem('specializations', idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Experiências */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-neutral-500 uppercase tracking-wider">Experiência Profissional</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar experiência..."
                        id="newExperience"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            handleAddItem('experiences', val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                      />
                    </div>
                    <ul className="space-y-1 bg-neutral-50 p-3 rounded-xl border border-neutral-150 min-h-36">
                      {infoForm.experiences.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs text-neutral-700 py-1 border-b border-neutral-100 last:border-0">
                          <span className="flex-1 pr-2">{item}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem('experiences', idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Contacts and Maps */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-neutral-800 font-display border-b border-neutral-100 pb-3">
                  Contatos e Localização (Rodapé / Formulário)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={infoForm.name}
                      onChange={e => setInfoForm({ ...infoForm, name: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Especialidade / Subtítulo</label>
                    <input 
                      type="text" 
                      value={infoForm.specialty}
                      onChange={e => setInfoForm({ ...infoForm, specialty: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">E-mail Comercial</label>
                    <input 
                      type="email" 
                      value={infoForm.email}
                      onChange={e => setInfoForm({ ...infoForm, email: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Telefone Exibição</label>
                    <input 
                      type="text" 
                      value={infoForm.phone}
                      onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">WhatsApp (Apenas Números com DDD)</label>
                    <input 
                      type="text" 
                      value={infoForm.whatsapp}
                      onChange={e => setInfoForm({ ...infoForm, whatsapp: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">Ex: 5511999998888</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Instagram (@)</label>
                    <input 
                      type="text" 
                      value={infoForm.instagram}
                      onChange={e => setInfoForm({ ...infoForm, instagram: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Região de Atendimento (Endereço)</label>
                    <input 
                      type="text" 
                      value={infoForm.address}
                      onChange={e => setInfoForm({ ...infoForm, address: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">URL de Incorporação do Mapa (Google Maps Embed URL)</label>
                    <textarea 
                      rows={2}
                      value={infoForm.googleMapEmbedUrl}
                      onChange={e => setInfoForm({ ...infoForm, googleMapEmbedUrl: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>
                </div>
              </div>

              {/* Form Submission */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInfoForm({ ...cmsState.info })}
                  className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Descartar Alterações
                </button>
                <button
                  type="submit"
                  className="bg-vet-dark text-white hover:bg-vet-leaf px-8 py-3 rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
                >
                  Salvar Todas as Informações
                </button>
              </div>

            </form>
          )}

          {/* ======================================================== */}
          {/* TAB: SERVICES CLINICAL */}
          {/* ======================================================== */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              
              {!editingService && !isCreatingService ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200">
                    <span className="text-sm text-neutral-500 font-medium">Você tem {cmsState.services.length} serviços listados no site.</span>
                    <button
                      onClick={handleOpenCreateService}
                      className="bg-vet-dark hover:bg-vet-leaf text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={16} /> Novo Serviço
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cmsState.services.map(s => (
                      <div key={s.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                        <div className="h-44 relative bg-neutral-100">
                          <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-vet-dark shadow-sm">
                            <Sparkles size={18} />
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-neutral-800 text-base font-display">{s.title}</h4>
                            <p className="text-xs text-neutral-500 mt-2 line-clamp-3">{s.description}</p>
                          </div>

                          <div className="flex gap-2 mt-5 pt-4 border-t border-neutral-100">
                            <button
                              onClick={() => handleOpenEditService(s)}
                              className="flex-1 flex items-center justify-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
                            >
                              <Edit size={14} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id, s.title)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
                >
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-6">
                    <h3 className="text-lg font-bold text-neutral-800 font-display">
                      {isCreatingService ? 'Criar Novo Serviço' : `Editar Serviço: ${serviceForm.title}`}
                    </h3>
                    <button
                      onClick={() => { setEditingService(null); setIsCreatingService(false); }}
                      className="text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveService} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Título do Serviço</label>
                        <input 
                          type="text" 
                          required
                          value={serviceForm.title}
                          onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Ícone Ilustrativo (Nome do Ícone Lucide)</label>
                        <select
                          value={serviceForm.icon}
                          onChange={e => setServiceForm({ ...serviceForm, icon: e.target.value })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                        >
                          <option value="Home">Home (Casa/Domicílio)</option>
                          <option value="Activity">Activity (Anestesia/Batimento)</option>
                          <option value="ShieldAlert">ShieldAlert (Avaliação/Prevenção)</option>
                          <option value="HeartPulse">HeartPulse (Recuperação/Cuidado)</option>
                          <option value="Sparkles">Sparkles (Consultoria/Especial)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Descrição Curta (Exibida no Card inicial)</label>
                        <input 
                          type="text" 
                          required
                          value={serviceForm.description}
                          onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Imagem Principal do Serviço (URL)</label>
                        <input 
                          type="text" 
                          value={serviceForm.image}
                          onChange={e => setServiceForm({ ...serviceForm, image: e.target.value })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Detalhes Completos do Serviço (Exibidos ao clicar no site)</label>
                        <textarea 
                          rows={6}
                          required
                          value={serviceForm.details}
                          onChange={e => setServiceForm({ ...serviceForm, details: e.target.value })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                          placeholder="Fale detalhadamente sobre como o serviço funciona, metodologias, exames que estão inclusos, etc."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => { setEditingService(null); setIsCreatingService(false); }}
                        className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300 px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-vet-dark text-white hover:bg-vet-leaf px-6 py-2.5 rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                      >
                        Salvar Serviço
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: MEDIA & GALLERY */}
          {/* ======================================================== */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              
              {/* Media tools grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Drag-and-drop Image Upload */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-neutral-800 font-display mb-2">Enviar Novas Imagens</h3>
                    <p className="text-xs text-neutral-500 mb-4">Escolha a categoria antes do envio. A foto é convertida para base64 local automaticamente.</p>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Categoria de Destino</label>
                      <select
                        value={uploadCategory}
                        onChange={e => setUploadCategory(e.target.value as any)}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                      >
                        <option value="Atendimentos">Atendimentos</option>
                        <option value="Procedimentos">Procedimentos</option>
                        <option value="Antes e Depois">Antes e Depois</option>
                        <option value="Clínica">Clínica</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragActive ? 'border-vet-dark bg-vet-light/10' : 'border-neutral-300 hover:border-vet-leaf bg-neutral-50'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden" 
                      accept="image/*"
                    />
                    <Upload size={32} className="mx-auto text-neutral-400 mb-2" />
                    <p className="text-xs font-semibold text-neutral-700">Arraste e solte ou clique aqui</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Formatos suportados: PNG, JPG, JPEG, WEBP</p>
                  </div>
                </div>

                {/* Video url linker */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm lg:col-span-2">
                  <h3 className="font-bold text-neutral-800 font-display mb-2">Vincular Link de Vídeo</h3>
                  <p className="text-xs text-neutral-500 mb-4">Cadastre vídeos do YouTube, Instagram, TikTok ou canais de mídia para a galeria.</p>

                  <form onSubmit={handleAddVideo} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">URL do Vídeo</label>
                      <input 
                        type="url" 
                        required
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrlInput}
                        onChange={e => setVideoUrlInput(e.target.value)}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Legenda / Descrição Curta</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Monitoramento de anestesia inalatória em felino"
                          value={videoCaption}
                          onChange={e => setVideoCaption(e.target.value)}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Categoria</label>
                        <select
                          value={uploadCategory}
                          onChange={e => setUploadCategory(e.target.value as any)}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light bg-white"
                        >
                          <option value="Atendimentos">Atendimentos</option>
                          <option value="Procedimentos">Procedimentos</option>
                          <option value="Antes e Depois">Antes e Depois</option>
                          <option value="Clínica">Clínica</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-vet-dark hover:bg-vet-leaf text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      Cadastrar Vídeo
                    </button>
                  </form>
                </div>

              </div>

              {/* Media viewer with filters */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                  <h3 className="font-bold text-neutral-800 font-display">Acervo de Mídia Existente ({cmsState.media.length})</h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {['all', 'Atendimentos', 'Procedimentos', 'Antes e Depois', 'Clínica', 'Outros'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setMediaFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${mediaFilter === cat ? 'bg-vet-dark text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                      >
                        {cat === 'all' ? 'Ver Todos' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {cmsState.media
                    .filter(m => mediaFilter === 'all' || m.category === mediaFilter)
                    .map(m => (
                      <div key={m.id} className="group relative border border-neutral-200 rounded-xl overflow-hidden shadow-xs h-36 bg-neutral-100">
                        {m.type === 'photo' ? (
                          <img src={m.url} alt={m.caption} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-neutral-800 text-white text-center">
                            <Video size={24} className="text-vet-light mb-1" />
                            <span className="text-[10px] font-semibold uppercase">{m.videoType || 'video'}</span>
                          </div>
                        )}

                        {/* Floating Delete Button - Always visible for quick access (especially on mobile/touch screens) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedia(m.id);
                          }}
                          className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-all duration-200 cursor-pointer hover:scale-105"
                          title="Excluir mídia"
                        >
                          <Trash2 size={12} />
                        </button>

                        {/* Hover Overlay for details */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                          <span className="bg-vet-leaf/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md self-start">
                            {m.category}
                          </span>
                          
                          <div>
                            <p className="text-[10px] text-white line-clamp-2 leading-tight font-medium mb-1 pr-6">{m.caption}</p>
                            <p className="text-[8px] text-neutral-300 uppercase font-mono">{m.type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: TESTIMONIALS MODERATION */}
          {/* ======================================================== */}
          {activeTab === 'testimonials' && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="font-bold text-neutral-800 font-display border-b border-neutral-100 pb-3">
                Moderador de Depoimentos de Clientes
              </h3>

              <div className="divide-y divide-neutral-100">
                {cmsState.testimonials.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-6">Nenhum depoimento cadastrado.</p>
                ) : (
                  cmsState.testimonials.map(t => (
                    <div key={t.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1.5 flex-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <strong className="text-neutral-800 text-sm">{t.name}</strong>
                          <span className="text-xs text-neutral-400">— Tutor(a) de {t.petName} ({t.petSpecies})</span>
                          <span className="bg-neutral-100 text-neutral-600 text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {t.date}
                          </span>
                        </div>
                        <p className="text-neutral-600 text-xs italic leading-relaxed">"{t.content}"</p>
                        <div className="flex gap-1 text-amber-500">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 self-stretch sm:self-center">
                        <button
                          onClick={() => handleToggleTestimonialApproval(t.id)}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            t.approved 
                              ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' 
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {t.approved ? (
                            <>
                              <EyeOff size={14} /> Ocultar
                            </>
                          ) : (
                            <>
                              <Eye size={14} /> Aprovar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: BLOG WRITING */}
          {/* ======================================================== */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              
              {!editingPost && !isCreatingPost ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200">
                    <span className="text-sm text-neutral-500 font-medium">Você possui {cmsState.blog.length} postagens publicadas no blog.</span>
                    <button
                      onClick={handleOpenCreatePost}
                      className="bg-vet-dark hover:bg-vet-leaf text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={16} /> Novo Artigo
                    </button>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100 shadow-xs">
                    {cmsState.blog.map(post => (
                      <div key={post.id} className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex gap-4 items-center flex-1">
                          <img src={post.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          <div className="space-y-1">
                            <span className="bg-vet-light/25 text-vet-dark text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {post.category}
                            </span>
                            <h4 className="font-bold text-neutral-800 text-sm font-display line-clamp-1">{post.title}</h4>
                            <p className="text-xs text-neutral-400 font-mono">Publicado em: {post.date} • {post.views} Visualizações</p>
                          </div>
                        </div>

                        <div className="flex gap-2 self-stretch md:self-auto justify-end">
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            className="flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                          >
                            <Edit size={14} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id, post.title)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
                >
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-6">
                    <h3 className="text-lg font-bold text-neutral-800 font-display">
                      {isCreatingPost ? 'Criar Novo Artigo' : `Editar Artigo: ${postForm.title}`}
                    </h3>
                    <button
                      onClick={() => { setEditingPost(null); setIsCreatingPost(false); }}
                      className="text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSavePost} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Título do Post</label>
                          <input 
                            type="text" 
                            required
                            value={postForm.title}
                            onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Resumo Curto (Para listagem)</label>
                          <input 
                            type="text" 
                            required
                            value={postForm.summary}
                            onChange={e => setPostForm({ ...postForm, summary: e.target.value })}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Categoria</label>
                            <input 
                              type="text" 
                              required
                              value={postForm.category}
                              onChange={e => setPostForm({ ...postForm, category: e.target.value })}
                              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                              placeholder="Ex: Saúde Felina"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Data Publicação</label>
                            <input 
                              type="date" 
                              required
                              value={postForm.date}
                              onChange={e => setPostForm({ ...postForm, date: e.target.value })}
                              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Palavras-chave (Separe por vírgulas)</label>
                          <input 
                            type="text" 
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            placeholder="Ex: Anestesia, Gatos, Vacinação"
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Imagem de Capa (URL)</label>
                          <input 
                            type="text" 
                            required
                            value={postForm.image}
                            onChange={e => setPostForm({ ...postForm, image: e.target.value })}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light bg-neutral-50"
                          />
                        </div>
                        <div className="border border-neutral-200 rounded-xl overflow-hidden h-44 bg-neutral-100 flex items-center justify-center">
                          {postForm.image ? (
                            <img src={postForm.image} alt="Capa" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-neutral-400">Sem imagem</span>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Corpo do Artigo (Suporta quebras de linha normais)</label>
                        <textarea 
                          rows={14}
                          required
                          value={postForm.content}
                          onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                          placeholder="Fale tudo que quiser aqui! Suas dicas de veterinária, anestesiologia, etc."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => { setEditingPost(null); setIsCreatingPost(false); }}
                        className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300 px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-vet-dark text-white hover:bg-vet-leaf px-6 py-2.5 rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                      >
                        Publicar Artigo
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: APPOINTMENTS CONSULTATION VIEW */}
          {/* ======================================================== */}
          {activeTab === 'appointments' && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="font-bold text-neutral-800 font-display">Log de Consultas e Agendamentos</h3>
                  <p className="text-xs text-neutral-500">Histórico de solicitações realizadas pelos tutores no formulário.</p>
                </div>
                
                {/* Download PDF/CSV button for accessibility & data preservation */}
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cmsState.appointments, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", "agendamentos_dra_julia.json");
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    triggerAlert("Arquivo JSON de registros baixado!");
                  }}
                  className="flex items-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <FileDown size={14} /> Exportar Backup (JSON)
                </button>
              </div>

              <div className="space-y-6">
                {cmsState.appointments.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-6 text-center">Nenhum pedido de agendamento registrado no momento.</p>
                ) : (
                  cmsState.appointments.map(app => (
                    <div 
                      key={app.id} 
                      className={`border rounded-xl p-5 shadow-xs space-y-4 transition-all ${
                        app.status === 'Confirmado' ? 'border-emerald-100 bg-emerald-50/10' :
                        app.status === 'Cancelado' ? 'border-red-100 bg-red-50/10' : 'border-amber-100 bg-amber-50/10'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                            Solicitação #{app.id} • Feita em: {new Date(app.createdAt).toLocaleString('pt-BR')}
                          </span>
                          <h4 className="font-bold text-neutral-800 font-display text-base mt-0.5">
                            Tutor: {app.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleChangeAppointmentStatus(app.id, 'Confirmado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                              app.status === 'Confirmado' ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Check size={14} /> Confirmar
                          </button>

                          <button
                            onClick={() => handleChangeAppointmentStatus(app.id, 'Cancelado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                              app.status === 'Cancelado' ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-red-50'
                            }`}
                          >
                            <X size={14} /> Cancelar
                          </button>

                          <button
                            onClick={() => handleDeleteAppointment(app.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-neutral-150 text-xs">
                        <div>
                          <strong className="text-neutral-500 block">Animal:</strong>
                          <span>{app.species} • {app.breed || 'Sem raça'}</span>
                        </div>
                        <div>
                          <strong className="text-neutral-500 block">Idade / Peso:</strong>
                          <span>{app.age || 'N/A'} • {app.weight || 'N/A'}</span>
                        </div>
                        <div>
                          <strong className="text-neutral-500 block">Contatos:</strong>
                          <span>{app.phone} <br /> {app.email}</span>
                        </div>
                        <div>
                          <strong className="text-neutral-500 block">Data e Hora Preferidos:</strong>
                          <span className="font-semibold text-vet-dark">{app.date} às {app.time}</span>
                        </div>
                      </div>

                      {/* Address & reason */}
                      <div className="text-xs space-y-2 bg-white p-4 rounded-lg border border-neutral-150">
                        <div>
                          <strong className="text-neutral-500">Endereço de Atendimento:</strong>
                          <p className="text-neutral-700 mt-0.5">{app.address} — CEP: {app.cep}</p>
                        </div>
                        <div>
                          <strong className="text-neutral-500">Motivo da Consulta / Sintomas:</strong>
                          <p className="text-neutral-700 mt-0.5 font-medium italic">"{app.reason}"</p>
                        </div>
                        {app.observations && (
                          <div>
                            <strong className="text-neutral-500 font-bold">Observações Adicionais:</strong>
                            <p className="text-neutral-700 mt-0.5">{app.observations}</p>
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
