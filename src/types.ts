export interface ClinicInfo {
  name: string;
  specialty: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  googleMapEmbedUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText1: string;
  heroButtonText2: string;
  heroBgImage: string;
  aboutTitle: string;
  aboutText: string;
  aboutImage: string;
  specializations: string[];
  experiences: string[];
  formations: string[];
  logoImage?: string;
  notificationEmail?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  details: string;
  icon: string; // Lucide icon name
  image: string; // Detail image
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string; // URL or Youtube link or base64 data url
  caption: string;
  category: 'Procedimentos' | 'Atendimentos' | 'Antes e Depois' | 'Clínica' | 'Outros';
  videoType?: 'youtube' | 'instagram' | 'tiktok' | 'local';
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  petName: string;
  petSpecies: 'Cão' | 'Gato' | 'Outros';
  rating: number;
  date: string;
  approved: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  image: string;
  date: string;
  tags: string[];
  views: number;
}

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  reason: string;
  date: string;
  time: string;
  address: string;
  cep: string;
  observations: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  createdAt: string;
}

export interface FinancialItem {
  id: string;
  name: string;
  category: 'Serviço' | 'Medicamento' | 'Exame' | 'Procedimento' | 'Insumo' | 'Outros';
  type: 'service' | 'medication';
  price: number;
  description?: string;
  dosage?: string;
  stock?: number;
  unit?: string;
  code?: string;
  updatedAt?: string;
}

export interface BudgetItem {
  itemId: string;
  name: string;
  type: 'service' | 'medication';
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface FinancialBudget {
  id: string;
  appointmentId?: string;
  clientName: string;
  petName: string;
  date: string;
  items: BudgetItem[];
  discount: number;
  subtotal: number;
  total: number;
  status: 'Orçamento' | 'Pago' | 'Pendente' | 'Cancelado';
  paymentMethod?: 'Pix' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Outro';
  notes?: string;
  createdAt: string;
}

export interface SiteStats {
  accesses: number;
  views: number;
}

export interface CMSState {
  info: ClinicInfo;
  services: Service[];
  media: MediaItem[];
  testimonials: Testimonial[];
  blog: BlogPost[];
  appointments: Appointment[];
  financialItems: FinancialItem[];
  financialBudgets: FinancialBudget[];
  stats: SiteStats;
}
