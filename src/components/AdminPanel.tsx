import React, { useState, useRef, useEffect } from 'react';
import { 
  CMSState, 
  ClinicInfo, 
  Service, 
  MediaItem, 
  BlogPost, 
  Appointment,
  FinancialItem,
  FinancialBudget,
  BudgetItem
} from '../types';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  saveClinicInfo, 
  saveService, 
  deleteService, 
  saveMediaItem, 
  deleteMediaItem, 
  saveBlogPost, 
  deleteBlogPost, 
  saveAppointment, 
  deleteAppointment,
  saveFinancialItem,
  deleteFinancialItem,
  saveFinancialBudget,
  deleteFinancialBudget
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
  FileDown,
  DollarSign,
  Receipt,
  CreditCard,
  Package,
  ShoppingCart,
  Calculator,
  Printer,
  Search,
  Tag,
  Percent
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

const compressImage = (base64Str: string, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
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
  const [firebaseAuthError, setFirebaseAuthError] = useState<string>(() => {
    return localStorage.getItem('vet_firebase_auth_error') || '';
  });
  const [showFirebaseWarning, setShowFirebaseWarning] = useState(() => {
    return localStorage.getItem('vet_hide_firebase_warning') !== 'true';
  });

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
  const isFirebaseDbAdmin = isCurrentlyAdmin;

  // Menu/Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'info' | 'services' | 'media' | 'blog' | 'appointments' | 'financial'>('dashboard');

  // Financial Tab State
  const [financialSubTab, setFinancialSubTab] = useState<'catalog' | 'budgets'>('catalog');
  const [financialSearch, setFinancialSearch] = useState('');
  const [financialCategoryFilter, setFinancialCategoryFilter] = useState<string>('Todos');

  // Financial Item Form State
  const [showFinancialItemModal, setShowFinancialItemModal] = useState(false);
  const [editingFinancialItem, setEditingFinancialItem] = useState<FinancialItem | null>(null);
  const [financialItemForm, setFinancialItemForm] = useState({
    name: '',
    category: 'Serviço' as 'Serviço' | 'Medicamento' | 'Exame' | 'Procedimento' | 'Insumo' | 'Outros',
    type: 'service' as 'service' | 'medication',
    price: '' as string | number,
    description: '',
    dosage: '',
    stock: '' as string | number,
    unit: 'Sessão',
    code: ''
  });

  // Budget / Invoice Form State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<FinancialBudget | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    appointmentId: '',
    clientName: '',
    petName: '',
    date: new Date().toISOString().split('T')[0],
    items: [] as BudgetItem[],
    discount: '' as string | number,
    notes: '',
    status: 'Orçamento' as 'Orçamento' | 'Pago' | 'Pendente' | 'Cancelado',
    paymentMethod: 'Pix' as 'Pix' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Outro'
  });
  const [budgetItemSelector, setBudgetItemSelector] = useState({
    itemId: '',
    quantity: 1,
    customUnitPrice: '' as string | number
  });

  // Receipt / Quote Printable Modal
  const [selectedBudgetForReceipt, setSelectedBudgetForReceipt] = useState<FinancialBudget | null>(null);

  // Success / Error Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form States
  const [infoForm, setInfoForm] = useState<ClinicInfo>({ 
    ...cmsState.info,
    logoImage: cmsState.info.logoImage || ''
  });

  // Sync infoForm when cmsState.info updates
  useEffect(() => {
    if (cmsState?.info) {
      setInfoForm(prev => ({
        ...cmsState.info,
        logoImage: cmsState.info.logoImage || '',
        notificationEmail: cmsState.info.notificationEmail ?? prev.notificationEmail ?? '',
        smtpHost: cmsState.info.smtpHost ?? prev.smtpHost ?? '',
        smtpPort: cmsState.info.smtpPort ?? prev.smtpPort ?? '',
        smtpUser: cmsState.info.smtpUser ?? prev.smtpUser ?? '',
        smtpPass: cmsState.info.smtpPass ?? prev.smtpPass ?? ''
      }));
    }
  }, [cmsState.info]);
  
  // Email testing states
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailResult(null);

    const targetEmail = infoForm.notificationEmail || infoForm.email;
    const customSmtp = (infoForm.smtpHost && infoForm.smtpUser && infoForm.smtpPass) ? {
      host: infoForm.smtpHost,
      port: infoForm.smtpPort,
      user: infoForm.smtpUser,
      pass: infoForm.smtpPass,
    } : undefined;

    try {
      const endpoint = `${window.location.origin}/api/test-email`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail,
          customSmtp
        })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = { error: `Servidor retornou resposta inesperada (${res.status}).` };
      }

      if (res.ok && data.success) {
        setTestEmailResult({ success: true, message: data.message });
      } else {
        setTestEmailResult({ success: false, message: data.error || 'Erro ao disparar e-mail de teste.' });
      }
    } catch (err: any) {
      setTestEmailResult({ success: false, message: `Erro de conexão: ${err?.message || err}` });
    } finally {
      setIsTestingEmail(false);
    }
  };
  
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
          localStorage.setItem('vet_firebase_auth_error', firebaseErrorMsg);
          setFirebaseAuthError(firebaseErrorMsg);
        } else {
          localStorage.removeItem('vet_firebase_auth_error');
          setFirebaseAuthError('');
        }

        setIsAuthenticated(true);
        setAdminRole('master');
        localStorage.setItem('vet_admin_auth', 'true');
        localStorage.setItem('vet_admin_role', 'master');
        localStorage.setItem('vet_admin_user', 'NCodes');
        localStorage.setItem('vet_admin_auth_method', 'password');
        setLoginError('');
        if (!firebaseSuccess) {
          triggerAlert('Painel administrativo iniciado com sucesso!', 'success');
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
          localStorage.setItem('vet_firebase_auth_error', firebaseErrorMsg);
          setFirebaseAuthError(firebaseErrorMsg);
        } else {
          localStorage.removeItem('vet_firebase_auth_error');
          setFirebaseAuthError('');
        }

        setIsAuthenticated(true);
        setAdminRole('owner');
        localStorage.setItem('vet_admin_auth', 'true');
        localStorage.setItem('vet_admin_role', 'owner');
        localStorage.setItem('vet_admin_user', 'Júlia');
        localStorage.setItem('vet_admin_auth_method', 'password');
        setLoginError('');
        if (!firebaseSuccess) {
          triggerAlert('Bem-vinda, Dra. Júlia! Painel administrativo iniciado com sucesso.', 'success');
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
    localStorage.removeItem('vet_admin_auth_method');
    localStorage.removeItem('vet_firebase_auth_error');
    setFirebaseAuthError('');
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    triggerAlert('Sessão encerrada.');
  };

function extractEmbedUrl(input: string): string {
  if (!input) return '';
  
  // 1. Unescape HTML entities first in case it's double-encoded (like &amp; to &)
  let cleaned = input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // 2. Remove external curly quotes or quotes at the absolute start/end of the input
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^[“”"'«»‘’\s]+|[“”"'«»‘’\s]+$/g, '').trim();

  // 3. Extract src from iframe if it's an iframe string
  if (cleaned.toLowerCase().includes('<iframe')) {
    // Regex matching src with single, double, curly, or no quotes
    const srcMatch = cleaned.match(/src=["'“”]?([^"'“”\s>]+)["'“”]?/i);
    if (srcMatch && srcMatch[1]) {
      cleaned = srcMatch[1];
    }
  }

  // 4. Clean any residual smart quotes and trim
  cleaned = cleaned.replace(/^[“”"'«»‘’\s]+|[“”"'«»‘’\s]+$/g, '').trim();
  
  // Ensure any residual &amp; is fully replaced to &
  cleaned = cleaned.replace(/&amp;/g, '&');
  
  return cleaned;
}

  // 1. Info Save Handler
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmbedUrl = extractEmbedUrl(infoForm.googleMapEmbedUrl);
    const updatedInfo = { 
      ...infoForm, 
      phone: infoForm.whatsapp,
      googleMapEmbedUrl: cleanedEmbedUrl
    };
    
    // Also update local infoForm state with the cleaned URL
    setInfoForm(prev => ({
      ...prev,
      googleMapEmbedUrl: cleanedEmbedUrl
    }));

    const originalInfo = { ...cmsState.info };
    onUpdateState({
      ...cmsState,
      info: updatedInfo
    });
    try {
      await saveClinicInfo(updatedInfo);
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
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 500, 500, 0.8);
            setInfoForm(prev => ({
              ...prev,
              logoImage: compressed
            }));
            triggerAlert('Logotipo carregado e otimizado com sucesso!');
          } catch (err) {
            setInfoForm(prev => ({
              ...prev,
              logoImage: event.target.result as string
            }));
            triggerAlert('Logotipo carregado com sucesso!');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Hero background image upload handler
  const handleHeroBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        triggerAlert('Apenas arquivos de imagem são permitidos!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 1200, 1200, 0.7);
            setInfoForm(prev => ({
              ...prev,
              heroBgImage: compressed
            }));
            triggerAlert('Imagem do banner carregada e otimizada com sucesso!');
          } catch (err) {
            setInfoForm(prev => ({
              ...prev,
              heroBgImage: event.target.result as string
            }));
            triggerAlert('Imagem do banner carregada com sucesso!');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // About profile image upload handler
  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        triggerAlert('Apenas arquivos de imagem são permitidos!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 800, 800, 0.75);
            setInfoForm(prev => ({
              ...prev,
              aboutImage: compressed
            }));
            triggerAlert('Foto de perfil carregada e otimizada com sucesso!');
          } catch (err) {
            setInfoForm(prev => ({
              ...prev,
              aboutImage: event.target.result as string
            }));
            triggerAlert('Foto de perfil carregada com sucesso!');
          }
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

  const handleServiceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        triggerAlert('Apenas arquivos de imagem são permitidos!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 800, 800, 0.75);
            setServiceForm(prev => ({
              ...prev,
              image: compressed
            }));
            triggerAlert('Imagem do serviço carregada e otimizada com sucesso!');
          } catch (err) {
            setServiceForm(prev => ({
              ...prev,
              image: event.target.result as string
            }));
            triggerAlert('Imagem do serviço carregada com sucesso!');
          }
        }
      };
      reader.readAsDataURL(file);
    }
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
        try {
          const compressed = await compressImage(event.target.result as string, 1000, 1000, 0.7);
          const newMediaItem: MediaItem = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'photo',
            url: compressed,
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
            triggerAlert('Imagem enviada e otimizada com sucesso!');
          } catch (err) {
            onUpdateState({
              ...cmsState,
              media: originalMedia
            });
            triggerAlert(`Erro ao salvar imagem: ${getErrorMessage(err)}`, 'error');
          }
        } catch (compErr) {
          const newMediaItem: MediaItem = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'photo',
            url: event.target.result as string,
            caption: file.name.replace(/\.[^/.]+$/, ""),
            category: uploadCategory
          };
          const originalMedia = [...cmsState.media];
          onUpdateState({
            ...cmsState,
            media: [newMediaItem, ...cmsState.media]
          });

          try {
            await saveMediaItem(newMediaItem);
            triggerAlert('Imagem enviada com sucesso!');
          } catch (err) {
            onUpdateState({
              ...cmsState,
              media: originalMedia
            });
            triggerAlert(`Erro ao salvar imagem: ${getErrorMessage(err)}`, 'error');
          }
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

  const handleBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        triggerAlert('Apenas arquivos de imagem são permitidos!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const compressed = await compressImage(event.target.result as string, 1000, 1000, 0.7);
            setPostForm(prev => ({
              ...prev,
              image: compressed
            }));
            triggerAlert('Imagem da postagem carregada e otimizada com sucesso!');
          } catch (err) {
            setPostForm(prev => ({
              ...prev,
              image: event.target.result as string
            }));
            triggerAlert('Imagem da postagem carregada com sucesso!');
          }
        }
      };
      reader.readAsDataURL(file);
    }
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
        
        // Send email to tutor if email exists and status is Confirmado or Cancelado
        const apptObj = updatedAppt as Appointment;
        if (apptObj.email && (newStatus === 'Confirmado' || newStatus === 'Cancelado')) {
          const customSmtp = (cmsState.info.smtpHost && cmsState.info.smtpUser && cmsState.info.smtpPass) ? {
            host: cmsState.info.smtpHost,
            port: cmsState.info.smtpPort,
            user: cmsState.info.smtpUser,
            pass: cmsState.info.smtpPass,
          } : undefined;

          fetch(`${window.location.origin}/api/send-status-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointment: apptObj,
              customSmtp
            })
          }).catch(e => console.error("Error sending status email to tutor:", e));

          triggerAlert(`Status atualizado para "${newStatus}" e e-mail enviado ao tutor (${apptObj.email})!`);
        } else {
          triggerAlert(`Status do agendamento atualizado para: ${newStatus}`);
        }
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

  // 7. Financial Management Handlers
  const handleSaveFinancialItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financialItemForm.name.trim()) {
      triggerAlert('Digite o nome do serviço ou medicamento.', 'error');
      return;
    }
    const numericPrice = typeof financialItemForm.price === 'number' ? financialItemForm.price : parseFloat(financialItemForm.price || '0');
    if (isNaN(numericPrice) || numericPrice < 0) {
      triggerAlert('Digite um preço válido.', 'error');
      return;
    }

    const itemToSave: FinancialItem = {
      id: editingFinancialItem ? editingFinancialItem.id : `fi_${Date.now()}`,
      name: financialItemForm.name.trim(),
      category: financialItemForm.category,
      type: financialItemForm.type,
      price: numericPrice,
      description: financialItemForm.description.trim(),
      dosage: financialItemForm.dosage.trim(),
      stock: financialItemForm.type === 'medication' ? (typeof financialItemForm.stock === 'number' ? financialItemForm.stock : parseInt(financialItemForm.stock || '0', 10)) : undefined,
      unit: financialItemForm.unit.trim() || (financialItemForm.type === 'service' ? 'Sessão' : 'Unidade'),
      code: financialItemForm.code.trim() || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
      updatedAt: new Date().toISOString()
    };

    const originalItems = [...(cmsState.financialItems || [])];
    const updatedItems = editingFinancialItem
      ? originalItems.map(item => item.id === itemToSave.id ? itemToSave : item)
      : [itemToSave, ...originalItems];

    onUpdateState({
      ...cmsState,
      financialItems: updatedItems
    });

    setShowFinancialItemModal(false);
    setEditingFinancialItem(null);
    setFinancialItemForm({
      name: '',
      category: 'Serviço',
      type: 'service',
      price: '',
      description: '',
      dosage: '',
      stock: '',
      unit: 'Sessão',
      code: ''
    });

    try {
      await saveFinancialItem(itemToSave);
      triggerAlert(editingFinancialItem ? 'Item atualizado com sucesso!' : 'Novo item adicionado ao catálogo!');
    } catch (err) {
      onUpdateState({ ...cmsState, financialItems: originalItems });
      triggerAlert(`Erro ao salvar item: ${getErrorMessage(err)}`, 'error');
    }
  };

  const handleDeleteFinancialItem = async (id: string, name: string) => {
    if (confirm(`Excluir o item "${name}" do catálogo financeiro?`)) {
      const originalItems = [...(cmsState.financialItems || [])];
      onUpdateState({
        ...cmsState,
        financialItems: originalItems.filter(item => item.id !== id)
      });
      try {
        await deleteFinancialItem(id);
        triggerAlert(`Item "${name}" excluído.`);
      } catch (err) {
        onUpdateState({ ...cmsState, financialItems: originalItems });
        triggerAlert(`Erro ao excluir item: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  const handleOpenEditFinancialItem = (item: FinancialItem) => {
    setEditingFinancialItem(item);
    setFinancialItemForm({
      name: item.name,
      category: item.category || 'Serviço',
      type: item.type,
      price: item.price,
      description: item.description || '',
      dosage: item.dosage || '',
      stock: item.stock !== undefined ? item.stock : '',
      unit: item.unit || (item.type === 'service' ? 'Sessão' : 'Unidade'),
      code: item.code || ''
    });
    setShowFinancialItemModal(true);
  };

  const handleAddBudgetItem = () => {
    if (!budgetItemSelector.itemId) {
      triggerAlert('Selecione um item do catálogo para adicionar.', 'error');
      return;
    }
    const catalogItem = cmsState.financialItems?.find(i => i.id === budgetItemSelector.itemId);
    if (!catalogItem) return;

    const unitPrice = budgetItemSelector.customUnitPrice !== '' ? Number(budgetItemSelector.customUnitPrice) : catalogItem.price;
    const quantity = Number(budgetItemSelector.quantity) || 1;
    const total = unitPrice * quantity;

    const newItem: BudgetItem = {
      itemId: catalogItem.id,
      name: catalogItem.name,
      type: catalogItem.type,
      unitPrice,
      quantity,
      total
    };

    setBudgetForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setBudgetItemSelector({ itemId: '', quantity: 1, customUnitPrice: '' });
  };

  const handleRemoveBudgetItem = (index: number) => {
    setBudgetForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.clientName.trim() || !budgetForm.petName.trim()) {
      triggerAlert('Preencha os campos de Tutor e Pet.', 'error');
      return;
    }
    if (budgetForm.items.length === 0) {
      triggerAlert('Adicione ao menos um serviço ou medicamento ao orçamento.', 'error');
      return;
    }

    const subtotal = budgetForm.items.reduce((acc, item) => acc + item.total, 0);
    const discount = typeof budgetForm.discount === 'number' ? budgetForm.discount : parseFloat(budgetForm.discount || '0');
    const total = Math.max(0, subtotal - discount);

    const budgetToSave: FinancialBudget = {
      id: editingBudget ? editingBudget.id : `fb_${Date.now()}`,
      appointmentId: budgetForm.appointmentId || undefined,
      clientName: budgetForm.clientName.trim(),
      petName: budgetForm.petName.trim(),
      date: budgetForm.date || new Date().toISOString().split('T')[0],
      items: budgetForm.items,
      discount,
      subtotal,
      total,
      status: budgetForm.status,
      paymentMethod: budgetForm.paymentMethod,
      notes: budgetForm.notes.trim(),
      createdAt: editingBudget ? editingBudget.createdAt : new Date().toISOString()
    };

    const originalBudgets = [...(cmsState.financialBudgets || [])];
    const updatedBudgets = editingBudget
      ? originalBudgets.map(b => b.id === budgetToSave.id ? budgetToSave : b)
      : [budgetToSave, ...originalBudgets];

    onUpdateState({
      ...cmsState,
      financialBudgets: updatedBudgets
    });

    setShowBudgetModal(false);
    setEditingBudget(null);
    setBudgetForm({
      appointmentId: '',
      clientName: '',
      petName: '',
      date: new Date().toISOString().split('T')[0],
      items: [],
      discount: '',
      notes: '',
      status: 'Orçamento',
      paymentMethod: 'Pix'
    });

    try {
      await saveFinancialBudget(budgetToSave);
      triggerAlert(editingBudget ? 'Orçamento atualizado com sucesso!' : 'Novo orçamento registrado com sucesso!');
    } catch (err) {
      onUpdateState({ ...cmsState, financialBudgets: originalBudgets });
      triggerAlert(`Erro ao salvar orçamento: ${getErrorMessage(err)}`, 'error');
    }
  };

  const handleOpenEditBudget = (budget: FinancialBudget) => {
    setEditingBudget(budget);
    setBudgetForm({
      appointmentId: budget.appointmentId || '',
      clientName: budget.clientName,
      petName: budget.petName,
      date: budget.date,
      items: [...budget.items],
      discount: budget.discount || '',
      notes: budget.notes || '',
      status: budget.status,
      paymentMethod: budget.paymentMethod || 'Pix'
    });
    setShowBudgetModal(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Deseja realmente excluir este orçamento/fatura?')) {
      const originalBudgets = [...(cmsState.financialBudgets || [])];
      onUpdateState({
        ...cmsState,
        financialBudgets: originalBudgets.filter(b => b.id !== id)
      });
      try {
        await deleteFinancialBudget(id);
        triggerAlert('Orçamento excluído com sucesso.');
      } catch (err) {
        onUpdateState({ ...cmsState, financialBudgets: originalBudgets });
        triggerAlert(`Erro ao excluir orçamento: ${getErrorMessage(err)}`, 'error');
      }
    }
  };

  const handleCreateBudgetFromAppointment = (appt: Appointment) => {
    setEditingBudget(null);
    setBudgetForm({
      appointmentId: appt.id,
      clientName: appt.name,
      petName: `${appt.species}${appt.breed ? ` (${appt.breed})` : ''}`,
      date: appt.date || new Date().toISOString().split('T')[0],
      items: [],
      discount: '',
      notes: `Atendimento referente a: ${appt.reason}`,
      status: 'Orçamento',
      paymentMethod: 'Pix'
    });
    setActiveTab('financial');
    setFinancialSubTab('budgets');
    setShowBudgetModal(true);
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

          <button
            onClick={() => setActiveTab('financial')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'financial' ? 'bg-vet-light/20 text-vet-dark font-semibold' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            <div className="flex items-center gap-3">
              <DollarSign size={18} className="text-emerald-600" />
              <span>Área Financeira</span>
            </div>
            {(cmsState.financialBudgets || []).filter(b => b.status === 'Pendente' || b.status === 'Orçamento').length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {(cmsState.financialBudgets || []).filter(b => b.status === 'Pendente' || b.status === 'Orçamento').length}
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
              {activeTab === 'blog' && 'Redigir e Editar Posts'}
              {activeTab === 'appointments' && 'Visualizador de Consultas'}
              {activeTab === 'financial' && 'Gestão Financeira & Tabela de Preços'}
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

        {/* FIREBASE AUTH WARNING */}
        {!firebaseUser && showFirebaseWarning && (
          <div className="mx-8 mt-6">
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 shadow-sm space-y-2.5 relative">
              <button
                type="button"
                onClick={() => {
                  setShowFirebaseWarning(false);
                  localStorage.setItem('vet_hide_firebase_warning', 'true');
                }}
                className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Ocultar Aviso
              </button>
              <div className="flex items-center gap-2.5 font-semibold text-sm">
                <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                <span>Alerta de Autenticação Firebase</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed pr-20">
                Você iniciou o painel localmente, mas a conexão em segundo plano com o Firebase Auth falhou. 
                Isso pode impedir a gravação e sincronização correta de dados com o Firestore.
              </p>
              {firebaseAuthError && (
                <div className="mt-2 text-xs bg-amber-100/50 p-2.5 rounded-lg font-mono text-amber-900 border border-amber-200/50 leading-relaxed pr-20">
                  <strong>Aviso:</strong> {firebaseAuthError}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-8 mt-6 flex-1">
          
          {/* ======================================================== */}
          {/* TAB: DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
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
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-600 uppercase">Logotipo do Site</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition">
                          <Upload size={14} />
                          <span>Selecionar Arquivo de Imagem</span>
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
                      <span className="text-[10px] text-neutral-400 mt-1 block">O logotipo personalizado será atualizado no topo e rodapé do site através do upload de um arquivo de imagem.</span>
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

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-neutral-600 uppercase">Imagem de Fundo do Banner</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition">
                        <Upload size={14} />
                        <span>Selecionar Arquivo de Fundo</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleHeroBgUpload}
                          className="hidden" 
                        />
                      </label>
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block">Envie um arquivo de imagem para alterar o fundo do banner principal.</span>
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
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-neutral-600 uppercase">Foto de Perfil</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition">
                          <Upload size={14} />
                          <span>Selecionar Foto de Perfil</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleAboutImageUpload}
                            className="hidden" 
                          />
                        </label>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">Envie um arquivo de imagem para alterar sua foto de perfil na seção "Quem Sou".</span>
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
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">WhatsApp e Telefone de Contato (Apenas Números com DDD)</label>
                    <input 
                      type="text" 
                      value={infoForm.whatsapp}
                      onChange={e => setInfoForm({ ...infoForm, whatsapp: e.target.value, phone: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">Ex: 5511999998888. Este número será utilizado tanto para conversas no WhatsApp quanto para as ligações telefônicas do site.</span>
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

              {/* Email Notifications Configuration */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-lg font-bold text-neutral-800 font-display flex items-center gap-2">
                    <span>📧 Notificações por E-mail (Agendamentos)</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Ativo
                  </span>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Quando um tutor preenche o formulário de solicitação de agendamento no site, uma notificação detalhada é enviada para o seu e-mail de recebimento.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">E-mail(s) para Receber os Agendamentos</label>
                    <input 
                      type="text" 
                      placeholder={infoForm.email || "ex: contato@juliaguaraldo.com.br, dra.julia@gmail.com"}
                      value={infoForm.notificationEmail || ''}
                      onChange={e => setInfoForm({ ...infoForm, notificationEmail: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vet-light bg-neutral-50/50"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Você pode colocar <strong>mais de 1 e-mail</strong> separando por vírgula (ex: <code className="bg-neutral-100 px-1 py-0.5 rounded">email1@site.com, email2@site.com</code>). Se deixar em branco, o aviso vai para o e-mail principal ({infoForm.email || 'contato'}).
                    </span>
                  </div>

                  <div className="sm:col-span-2 border-t border-neutral-100 pt-3 mt-1">
                    <h4 className="text-xs font-bold text-neutral-700 uppercase mb-2">Servidor de Disparo SMTP (Opcional - Personalizado)</h4>
                    <p className="text-[11px] text-neutral-500 mb-3">
                      Caso deseje utilizar sua própria conta de e-mail (ex: Gmail com Senha de App, Mailtrap ou Resend) para realizar os envios:
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Servidor SMTP (Host)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: smtp.gmail.com"
                      value={infoForm.smtpHost || ''}
                      onChange={e => setInfoForm({ ...infoForm, smtpHost: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Porta SMTP</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 587 ou 465"
                      value={infoForm.smtpPort || ''}
                      onChange={e => setInfoForm({ ...infoForm, smtpPort: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Usuário / E-mail SMTP</label>
                    <input 
                      type="text" 
                      placeholder="Ex: seu-email@gmail.com"
                      value={infoForm.smtpUser || ''}
                      onChange={e => setInfoForm({ ...infoForm, smtpUser: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Senha SMTP / Senha de App</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      value={infoForm.smtpPass || ''}
                      onChange={e => setInfoForm({ ...infoForm, smtpPass: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                    />
                    <span className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1 block">
                      💡 <strong>Dica Gmail:</strong> Use uma <em>Senha de App</em> de 16 caracteres (gerada na Conta do Google em <u>Segurança &gt; Senhas de App</u>), e não a senha pessoal.
                    </span>
                  </div>

                  <div className="sm:col-span-2 border-t border-neutral-100 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isTestingEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Testando Conexão SMTP...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={14} />
                          <span>Enviar E-mail de Teste Agora</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-neutral-500">
                      Dispara para: <strong className="text-neutral-800">{infoForm.notificationEmail || infoForm.email || 'Não definido'}</strong>
                    </span>
                  </div>

                  {testEmailResult && (
                    <div className={`sm:col-span-2 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                      testEmailResult.success 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {testEmailResult.success ? <Check size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                      </div>
                      <div className="leading-relaxed">
                        <strong>{testEmailResult.success ? 'Conexão de E-mail OK!' : 'Atenção / Falha no Envio:'}</strong>
                        <p className="mt-0.5">{testEmailResult.message}</p>
                      </div>
                    </div>
                  )}
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

                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-semibold text-neutral-600 uppercase">Imagem Principal do Serviço</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition shrink-0">
                            <Upload size={14} />
                            <span>Enviar Foto do Serviço</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleServiceImageUpload}
                              className="hidden" 
                            />
                          </label>
                          {serviceForm.image && (
                            <div className="border border-neutral-200 rounded-lg overflow-hidden h-12 w-20 bg-neutral-100">
                              <img src={serviceForm.image} alt="Serviço" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-1 block">Carregue um arquivo de imagem para ilustrar o serviço oferecido.</span>
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
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-neutral-600 uppercase">Imagem de Capa</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition w-full text-center justify-center">
                              <Upload size={14} />
                              <span>Enviar Capa</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleBlogImageUpload}
                                className="hidden" 
                              />
                            </label>
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-1 block">Envie uma imagem para a capa do artigo.</span>
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

          {/* ======================================================== */}
          {/* TAB: FINANCIAL MANAGEMENT (Catálogo de Preços e Faturamento) */}
          {/* ======================================================== */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* FINANCIAL SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Paid / Faturado */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Total Faturado</span>
                    <span className="text-2xl font-bold font-display text-emerald-600 mt-1 block">
                      R$ {(cmsState.financialBudgets || [])
                        .filter(b => b.status === 'Pago')
                        .reduce((sum, b) => sum + b.total, 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      {(cmsState.financialBudgets || []).filter(b => b.status === 'Pago').length} orçamentos pagos
                    </span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                    <DollarSign size={24} />
                  </div>
                </div>

                {/* Total Pending / Em Aberto */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Em Aberto</span>
                    <span className="text-2xl font-bold font-display text-amber-600 mt-1 block">
                      R$ {(cmsState.financialBudgets || [])
                        .filter(b => b.status === 'Pendente' || b.status === 'Orçamento')
                        .reduce((sum, b) => sum + b.total, 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      {(cmsState.financialBudgets || []).filter(b => b.status === 'Pendente' || b.status === 'Orçamento').length} pendentes
                    </span>
                  </div>
                  <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                    <Clock size={24} />
                  </div>
                </div>

                {/* Total Catalog Items */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Catálogo de Itens</span>
                    <span className="text-2xl font-bold font-display text-neutral-800 mt-1 block">
                      {(cmsState.financialItems || []).length} Cadastrados
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      {(cmsState.financialItems || []).filter(i => i.type === 'service').length} Serviços • {(cmsState.financialItems || []).filter(i => i.type === 'medication').length} Medicamentos
                    </span>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                    <Tag size={24} />
                  </div>
                </div>

                {/* Stock alert */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Estoque de Medicamentos</span>
                    <span className="text-2xl font-bold font-display text-neutral-800 mt-1 block">
                      {(cmsState.financialItems || [])
                        .filter(i => i.type === 'medication' && i.stock !== undefined)
                        .reduce((acc, i) => acc + (i.stock || 0), 0)} Unidades
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                      {(cmsState.financialItems || []).filter(i => i.type === 'medication' && (i.stock || 0) <= 5).length > 0 
                        ? `${(cmsState.financialItems || []).filter(i => i.type === 'medication' && (i.stock || 0) <= 5).length} itens com estoque baixo`
                        : 'Estoque regular'}
                    </span>
                  </div>
                  <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                    <Package size={24} />
                  </div>
                </div>
              </div>

              {/* NAVIGATION BETWEEN SUB-TABS & ACTIONS */}
              <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex bg-neutral-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setFinancialSubTab('catalog')}
                    className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                      financialSubTab === 'catalog' ? 'bg-white text-vet-dark shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Tag size={15} /> Catálogo & Tabela de Preços
                  </button>
                  <button
                    onClick={() => setFinancialSubTab('budgets')}
                    className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                      financialSubTab === 'budgets' ? 'bg-white text-vet-dark shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Receipt size={15} /> Orçamentos & Lançamentos
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {financialSubTab === 'catalog' ? (
                    <button
                      onClick={() => {
                        setEditingFinancialItem(null);
                        setFinancialItemForm({
                          name: '',
                          category: 'Serviço',
                          type: 'service',
                          price: '',
                          description: '',
                          dosage: '',
                          stock: '',
                          unit: 'Sessão',
                          code: ''
                        });
                        setShowFinancialItemModal(true);
                      }}
                      className="w-full sm:w-auto bg-vet-dark hover:bg-vet-leaf text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus size={16} /> Novo Serviço / Medicamento
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingBudget(null);
                        setBudgetForm({
                          appointmentId: '',
                          clientName: '',
                          petName: '',
                          date: new Date().toISOString().split('T')[0],
                          items: [],
                          discount: '',
                          notes: '',
                          status: 'Orçamento',
                          paymentMethod: 'Pix'
                        });
                        setShowBudgetModal(true);
                      }}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus size={16} /> Gerar Novo Orçamento
                    </button>
                  )}
                </div>
              </div>

              {/* SUB-TAB 1: CATALOG TABLE */}
              {financialSubTab === 'catalog' && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-neutral-800 font-display text-base">Tabela de Preços e Medicamentos</h3>
                      <p className="text-xs text-neutral-500">Cadastre e ajuste os valores de consultas, procedimentos anestésicos, vacinas e medicamentos.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Buscar por nome ou código..."
                          value={financialSearch}
                          onChange={e => setFinancialSearch(e.target.value)}
                          className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <select
                        value={financialCategoryFilter}
                        onChange={e => setFinancialCategoryFilter(e.target.value)}
                        className="border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 bg-white focus:outline-none focus:ring-1 focus:ring-vet-light cursor-pointer"
                      >
                        <option value="Todos">Todas Categoria</option>
                        <option value="Serviço">Serviços</option>
                        <option value="Medicamento">Medicamentos</option>
                        <option value="Procedimento">Procedimentos</option>
                        <option value="Insumo">Insumos</option>
                        <option value="Exame">Exames</option>
                      </select>
                    </div>
                  </div>

                  {/* ITEMS TABLE */}
                  <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                          <th className="py-3 px-4">Código</th>
                          <th className="py-3 px-4">Item / Nome</th>
                          <th className="py-3 px-4">Tipo & Categoria</th>
                          <th className="py-3 px-4">Dosagem / Detalhes</th>
                          <th className="py-3 px-4">Estoque</th>
                          <th className="py-3 px-4 text-right">Valor Unitário</th>
                          <th className="py-3 px-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs">
                        {(cmsState.financialItems || [])
                          .filter(item => {
                            const matchSearch = item.name.toLowerCase().includes(financialSearch.toLowerCase()) || 
                                                (item.code && item.code.toLowerCase().includes(financialSearch.toLowerCase()));
                            const matchCat = financialCategoryFilter === 'Todos' || item.category === financialCategoryFilter;
                            return matchSearch && matchCat;
                          })
                          .length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-neutral-400">
                                Nenhum item cadastrado ou encontrado com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            (cmsState.financialItems || [])
                              .filter(item => {
                                const matchSearch = item.name.toLowerCase().includes(financialSearch.toLowerCase()) || 
                                                    (item.code && item.code.toLowerCase().includes(financialSearch.toLowerCase()));
                                const matchCat = financialCategoryFilter === 'Todos' || item.category === financialCategoryFilter;
                                return matchSearch && matchCat;
                              })
                              .map(item => (
                                <tr key={item.id} className="hover:bg-neutral-50/80 transition">
                                  <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 font-semibold">{item.code || 'N/A'}</td>
                                  <td className="py-3 px-4 font-bold text-neutral-800">
                                    {item.name}
                                    {item.description && <p className="text-[11px] text-neutral-400 font-normal line-clamp-1">{item.description}</p>}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      item.type === 'service' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                    }`}>
                                      {item.category || (item.type === 'service' ? 'Serviço' : 'Medicamento')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-neutral-600">
                                    {item.dosage ? item.dosage : item.unit || '—'}
                                  </td>
                                  <td className="py-3 px-4">
                                    {item.type === 'medication' && item.stock !== undefined ? (
                                      <span className={`font-semibold ${item.stock <= 5 ? 'text-red-600 font-bold' : 'text-neutral-700'}`}>
                                        {item.stock} {item.unit || 'unid'}
                                      </span>
                                    ) : (
                                      <span className="text-neutral-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono text-sm">
                                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditFinancialItem(item)}
                                        className="p-1.5 text-neutral-500 hover:text-vet-dark hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                                        title="Editar"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFinancialItem(item.id, item.name)}
                                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Excluir"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: BUDGETS & INVOICES LIST */}
              {financialSubTab === 'budgets' && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-neutral-800 font-display text-base">Orçamentos e Faturas do Consultório</h3>
                    <p className="text-xs text-neutral-500">Acompanhe orçamentos gerados, status de pagamentos e imprima recibos de atendimento.</p>
                  </div>

                  <div className="space-y-4">
                    {(cmsState.financialBudgets || []).length === 0 ? (
                      <p className="text-center py-8 text-neutral-400 text-sm">Nenhum orçamento cadastrado até o momento.</p>
                    ) : (
                      (cmsState.financialBudgets || []).map(budget => (
                        <div 
                          key={budget.id} 
                          className={`border rounded-xl p-5 shadow-xs space-y-4 transition ${
                            budget.status === 'Pago' ? 'border-emerald-200 bg-emerald-50/10' :
                            budget.status === 'Pendente' ? 'border-amber-200 bg-amber-50/10' :
                            budget.status === 'Cancelado' ? 'border-red-100 bg-red-50/10' : 'border-neutral-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase font-bold text-neutral-400">
                                  Nº {budget.id} • Data: {budget.date}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  budget.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                                  budget.status === 'Pendente' ? 'bg-amber-100 text-amber-800' :
                                  budget.status === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {budget.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-neutral-800 font-display text-base mt-1">
                                Tutor: {budget.clientName} <span className="text-neutral-400 font-normal">| Paciente: {budget.petName}</span>
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setSelectedBudgetForReceipt(budget)}
                                className="bg-neutral-800 hover:bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Printer size={14} /> Ver / Imprimir Recibo
                              </button>
                              <button
                                onClick={() => handleOpenEditBudget(budget)}
                                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit size={14} /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Items breakdown list */}
                          <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 text-xs space-y-1.5">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Itens Incluídos:</span>
                            <div className="divide-y divide-neutral-200/60">
                              {budget.items.map((item, idx) => (
                                <div key={idx} className="py-1 flex justify-between items-center text-neutral-700">
                                  <span>
                                    <strong className="font-semibold">{item.quantity}x</strong> {item.name}
                                    <span className="text-[10px] text-neutral-400 ml-2">({item.type === 'service' ? 'Serviço' : 'Medicamento'})</span>
                                  </span>
                                  <span className="font-mono font-medium">
                                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Totals summary */}
                            <div className="pt-2 mt-2 border-t border-neutral-200 flex flex-wrap justify-between items-center text-xs">
                              <div className="text-neutral-500 space-x-3">
                                <span>Forma de Pagamento: <strong className="text-neutral-700">{budget.paymentMethod || 'Pix'}</strong></span>
                                {budget.discount > 0 && (
                                  <span>Desconto: <strong className="text-red-600">-R$ {budget.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-neutral-500 mr-2">Valor Total:</span>
                                <strong className="text-base font-bold font-mono text-emerald-700">
                                  R$ {budget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {budget.notes && (
                            <p className="text-xs text-neutral-500 italic bg-white p-2.5 rounded-lg border border-neutral-100">
                              <strong className="not-italic text-neutral-600 font-semibold">Observações:</strong> {budget.notes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* MODAL 1: ADD/EDIT FINANCIAL ITEM (CATALOG) */}
              {showFinancialItemModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                      <h3 className="font-bold text-neutral-800 font-display text-lg">
                        {editingFinancialItem ? 'Editar Item do Catálogo' : 'Cadastrar Item no Catálogo'}
                      </h3>
                      <button
                        onClick={() => { setShowFinancialItemModal(false); setEditingFinancialItem(null); }}
                        className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveFinancialItem} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Nome do Item *</label>
                        <input
                          type="text"
                          required
                          value={financialItemForm.name}
                          onChange={e => setFinancialItemForm({ ...financialItemForm, name: e.target.value })}
                          placeholder="Ex: Consulta Anestésica Pré-Operatória / Dipirona 500mg"
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Tipo de Item</label>
                          <select
                            value={financialItemForm.type}
                            onChange={e => setFinancialItemForm({ 
                              ...financialItemForm, 
                              type: e.target.value as 'service' | 'medication',
                              category: e.target.value === 'service' ? 'Serviço' : 'Medicamento'
                            })}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light cursor-pointer"
                          >
                            <option value="service">Serviço / Procedimento</option>
                            <option value="medication">Medicamento / Insumo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Categoria</label>
                          <select
                            value={financialItemForm.category}
                            onChange={e => setFinancialItemForm({ ...financialItemForm, category: e.target.value as any })}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light cursor-pointer"
                          >
                            <option value="Serviço">Serviço</option>
                            <option value="Medicamento">Medicamento</option>
                            <option value="Procedimento">Procedimento</option>
                            <option value="Insumo">Insumo</option>
                            <option value="Exame">Exame</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Valor Unitário (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={financialItemForm.price}
                            onChange={e => setFinancialItemForm({ ...financialItemForm, price: e.target.value })}
                            placeholder="250.00"
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Unidade / Medida</label>
                          <input
                            type="text"
                            value={financialItemForm.unit}
                            onChange={e => setFinancialItemForm({ ...financialItemForm, unit: e.target.value })}
                            placeholder="Ex: Sessão, Frasco, Ampola, Dose"
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Código Ref.</label>
                          <input
                            type="text"
                            value={financialItemForm.code}
                            onChange={e => setFinancialItemForm({ ...financialItemForm, code: e.target.value })}
                            placeholder="SERV-001"
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>

                        {financialItemForm.type === 'medication' ? (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Estoque Atual</label>
                            <input
                              type="number"
                              value={financialItemForm.stock}
                              onChange={e => setFinancialItemForm({ ...financialItemForm, stock: e.target.value })}
                              placeholder="10"
                              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Dosagem Padrão</label>
                            <input
                              type="text"
                              value={financialItemForm.dosage}
                              onChange={e => setFinancialItemForm({ ...financialItemForm, dosage: e.target.value })}
                              placeholder="Ex: Conforme peso"
                              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Descrição Detalhada</label>
                        <textarea
                          rows={2}
                          value={financialItemForm.description}
                          onChange={e => setFinancialItemForm({ ...financialItemForm, description: e.target.value })}
                          placeholder="Descreva o que está incluso no procedimento ou as especificações do medicamento..."
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => { setShowFinancialItemModal(false); setEditingFinancialItem(null); }}
                          className="px-4 py-2 bg-neutral-200 text-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-vet-dark hover:bg-vet-leaf text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          Salvar Item
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* MODAL 2: GENERATE / EDIT BUDGET & INVOICE */}
              {showBudgetModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 space-y-5"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                      <h3 className="font-bold text-neutral-800 font-display text-lg">
                        {editingBudget ? 'Editar Orçamento / Fatura' : 'Gerar Orçamento / Fatura de Atendimento'}
                      </h3>
                      <button
                        onClick={() => { setShowBudgetModal(false); setEditingBudget(null); }}
                        className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveBudget} className="space-y-4">
                      {/* Header Client / Pet Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Nome do Tutor (Cliente) *</label>
                          <input
                            type="text"
                            required
                            value={budgetForm.clientName}
                            onChange={e => setBudgetForm({ ...budgetForm, clientName: e.target.value })}
                            placeholder="Ex: Clarice Antunes"
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Nome do Paciente (Pet) *</label>
                          <input
                            type="text"
                            required
                            value={budgetForm.petName}
                            onChange={e => setBudgetForm({ ...budgetForm, petName: e.target.value })}
                            placeholder="Ex: Thor (Cão - Golden)"
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Data do Atendimento</label>
                          <input
                            type="date"
                            required
                            value={budgetForm.date}
                            onChange={e => setBudgetForm({ ...budgetForm, date: e.target.value })}
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                          />
                        </div>
                      </div>

                      {/* ITEM SELECTOR BAR */}
                      <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                        <label className="block text-xs font-bold text-neutral-700 uppercase">Adicionar Serviços ou Medicamentos do Catálogo</label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                          <div className="sm:col-span-6">
                            <select
                              value={budgetItemSelector.itemId}
                              onChange={e => {
                                const id = e.target.value;
                                const catItem = cmsState.financialItems?.find(i => i.id === id);
                                setBudgetItemSelector({
                                  itemId: id,
                                  quantity: 1,
                                  customUnitPrice: catItem ? catItem.price : ''
                                });
                              }}
                              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-vet-light cursor-pointer"
                            >
                              <option value="">-- Selecione do Catálogo --</option>
                              {(cmsState.financialItems || []).map(item => (
                                <option key={item.id} value={item.id}>
                                  [{item.category}] {item.name} — R$ {item.price.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qtd"
                              value={budgetItemSelector.quantity}
                              onChange={e => setBudgetItemSelector({ ...budgetItemSelector, quantity: parseInt(e.target.value || '1', 10) })}
                              className="w-full border border-neutral-300 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-vet-light"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="R$ Unit"
                              value={budgetItemSelector.customUnitPrice}
                              onChange={e => setBudgetItemSelector({ ...budgetItemSelector, customUnitPrice: e.target.value })}
                              className="w-full border border-neutral-300 rounded-lg px-2.5 py-2 text-xs bg-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-vet-light"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddBudgetItem}
                              className="w-full bg-vet-dark hover:bg-vet-leaf text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus size={14} /> Incluir
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ADDED ITEMS LIST */}
                      <div className="border border-neutral-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-100 font-bold text-neutral-600 border-b border-neutral-200">
                            <tr>
                              <th className="py-2 px-3">Item</th>
                              <th className="py-2 px-3 text-center">Qtd</th>
                              <th className="py-2 px-3 text-right">Unitário</th>
                              <th className="py-2 px-3 text-right">Total</th>
                              <th className="py-2 px-2 text-center">Remover</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {budgetForm.items.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-6 text-neutral-400">
                                  Nenhum item adicionado ainda. Selecione acima para compor a fatura.
                                </td>
                              </tr>
                            ) : (
                              budgetForm.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50">
                                  <td className="py-2 px-3 font-semibold text-neutral-800">{item.name}</td>
                                  <td className="py-2 px-3 text-center font-bold text-neutral-700">{item.quantity}</td>
                                  <td className="py-2 px-3 text-right font-mono">
                                    R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBudgetItem(idx)}
                                      className="text-neutral-400 hover:text-red-600 p-1 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* CALCULATIONS BAR */}
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Desconto Especial (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={budgetForm.discount}
                              onChange={e => setBudgetForm({ ...budgetForm, discount: e.target.value })}
                              placeholder="0.00"
                              className="w-full border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-mono text-red-600 font-bold focus:outline-none focus:ring-1 focus:ring-vet-light"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Forma de Pagamento</label>
                            <select
                              value={budgetForm.paymentMethod}
                              onChange={e => setBudgetForm({ ...budgetForm, paymentMethod: e.target.value as any })}
                              className="w-full border border-neutral-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-vet-light cursor-pointer"
                            >
                              <option value="Pix">Pix</option>
                              <option value="Dinheiro">Dinheiro Espécie</option>
                              <option value="Cartão de Crédito">Cartão de Crédito</option>
                              <option value="Cartão de Débito">Cartão de Débito</option>
                              <option value="Transferência">Transferência Bancária</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">Status da Fatura</label>
                            <select
                              value={budgetForm.status}
                              onChange={e => setBudgetForm({ ...budgetForm, status: e.target.value as any })}
                              className="w-full border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-vet-light cursor-pointer"
                            >
                              <option value="Orçamento">Orçamento</option>
                              <option value="Pendente">Pendente</option>
                              <option value="Pago">Pago</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </div>
                        </div>

                        {/* Totals Summary Line */}
                        <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                          <span className="text-xs text-neutral-500 font-medium">
                            Subtotal: R$ {budgetForm.items.reduce((acc, i) => acc + i.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="text-right">
                            <span className="text-xs font-bold text-neutral-700 uppercase mr-2">Valor Final:</span>
                            <strong className="text-xl font-bold font-mono text-emerald-700">
                              R$ {Math.max(0, budgetForm.items.reduce((acc, i) => acc + i.total, 0) - (Number(budgetForm.discount) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Observações do Recibo / Recomendações</label>
                        <textarea
                          rows={2}
                          value={budgetForm.notes}
                          onChange={e => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                          placeholder="Instruções para o tutor, condições de retorno ou chave Pix..."
                          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-vet-light"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => { setShowBudgetModal(false); setEditingBudget(null); }}
                          className="px-4 py-2 bg-neutral-200 text-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          Salvar Orçamento
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* MODAL 3: PRINTABLE RECEIPT / QUOTE VIEW */}
              {selectedBudgetForReceipt && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-neutral-200 space-y-6 relative print:p-0 print:border-none print:shadow-none"
                  >
                    {/* Action buttons bar */}
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-4 print:hidden">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Visualização de Recibo / Comprovante
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.print()}
                          className="bg-vet-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-vet-leaf transition cursor-pointer"
                        >
                          <Printer size={15} /> Imprimir / Salvar PDF
                        </button>
                        <button
                          onClick={() => setSelectedBudgetForReceipt(null)}
                          className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* RECEIPT CONTENT AREA (CLEAN PRINT LAYOUT) */}
                    <div className="space-y-6 text-neutral-800">
                      {/* Header / Clinic Logo */}
                      <div className="text-center border-b border-neutral-200 pb-5 space-y-1">
                        <h2 className="text-2xl font-bold font-display text-vet-dark">{cmsState.info.name}</h2>
                        <p className="text-xs text-neutral-600 font-medium">{cmsState.info.specialty}</p>
                        <p className="text-[11px] text-neutral-400">
                          CRMV Ativo • {cmsState.info.phone} • WhatsApp: {cmsState.info.whatsapp}
                        </p>
                        <p className="text-[11px] text-neutral-400">{cmsState.info.address}</p>
                      </div>

                      {/* Receipt Details Box */}
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-neutral-400 block font-semibold text-[10px] uppercase">Tutor / Cliente:</span>
                          <strong className="text-neutral-800 text-sm">{selectedBudgetForReceipt.clientName}</strong>
                        </div>
                        <div>
                          <span className="text-neutral-400 block font-semibold text-[10px] uppercase">Paciente / Pet:</span>
                          <strong className="text-neutral-800 text-sm">{selectedBudgetForReceipt.petName}</strong>
                        </div>
                        <div>
                          <span className="text-neutral-400 block font-semibold text-[10px] uppercase">Data da Emissão:</span>
                          <span>{selectedBudgetForReceipt.date}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block font-semibold text-[10px] uppercase">Status / Recibo Nº:</span>
                          <span className="font-mono font-bold text-vet-dark">#{selectedBudgetForReceipt.id} ({selectedBudgetForReceipt.status})</span>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div>
                        <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Discriminação dos Serviços e Medicamentos</h4>
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-neutral-300 text-neutral-500 font-bold uppercase text-[10px]">
                              <th className="py-2">Item</th>
                              <th className="py-2 text-center">Qtd</th>
                              <th className="py-2 text-right">Unitário</th>
                              <th className="py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {selectedBudgetForReceipt.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-2.5 font-medium text-neutral-800">{item.name}</td>
                                <td className="py-2.5 text-center">{item.quantity}</td>
                                <td className="py-2.5 text-right font-mono text-neutral-600">
                                  R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-neutral-800">
                                  R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals Breakdown */}
                      <div className="border-t border-neutral-300 pt-4 text-xs space-y-1">
                        <div className="flex justify-between text-neutral-600">
                          <span>Subtotal:</span>
                          <span className="font-mono">R$ {selectedBudgetForReceipt.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {selectedBudgetForReceipt.discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Desconto Concedido:</span>
                            <span className="font-mono">-R$ {selectedBudgetForReceipt.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                          <span>VALOR TOTAL:</span>
                          <span className="font-mono text-emerald-700">R$ {selectedBudgetForReceipt.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Payment & Notes Footer */}
                      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs space-y-2 text-emerald-900">
                        <p className="font-bold">Forma de Pagamento: {selectedBudgetForReceipt.paymentMethod || 'Pix'}</p>
                        {selectedBudgetForReceipt.notes && (
                          <p className="italic text-emerald-800 text-[11px]">
                            Observações: {selectedBudgetForReceipt.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-center pt-6 text-[10px] text-neutral-400 border-t border-neutral-100 space-y-0.5">
                        <p>Dra. Júlia Guaraldo — Anestesiologia & Medicina Veterinária Domiciliar</p>
                        <p>Obrigado pela confiança no cuidado com seu pet!</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
