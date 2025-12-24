export const VEHICLE_SIZES = {
  small: 'Pequeno (Hatch)',
  medium: 'Médio (Sedan)',
  large: 'Grande (SUV)',
  xl: 'Extra Grande (Pickup)'
} as const;

export type VehicleSize = keyof typeof VEHICLE_SIZES;

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  color: string;
  year: string;
  size: VehicleSize;
  tenant_id?: string;
  client_id?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  vehicles: Vehicle[];
  ltv: number;
  visitCount: number;
  lastVisit: string;
  status: 'active' | 'inactive' | 'churn_risk';
  segment: 'vip' | 'recurring' | 'new' | 'inactive';
  notes?: string;
  tenant_id?: string;
  created_at?: string;
}

export interface DamagePoint {
  id: string;
  area: 'frente' | 'traseira' | 'teto' | 'lateral_esq' | 'lateral_dir';
  type: 'risco' | 'amassado' | 'mancha' | 'quebrado' | 'outro';
  description: string;
  photoUrl?: string;
}

export interface VehicleInventory {
  estepe: boolean;
  macaco: boolean;
  chaveRoda: boolean;
  tapetes: boolean;
  manual: boolean;
  antena: boolean;
  pertences: string;
}

export interface DailyLogEntry {
  id: string;
  date: string;
  stage: string;
  description: string;
  photos: string[];
  author: string;
}

export interface QualityChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
}

export interface ScopeItem {
  id: string;
  label: string;
  completed: boolean;
  type: 'main' | 'additional';
  photos?: string[];
  completedAt?: string;
}

export interface AdditionalItem {
  id: string;
  description: string;
  value: number;
}

export interface Discount {
  type: 'percentage' | 'value' | 'service';
  amount: number;
  description?: string;
}

export interface Task {
  id: string;
  serviceId: string;
  description: string;
  assignedTo: string; // Employee ID
  status: 'pending' | 'in_progress' | 'completed';
}

export interface WorkOrder {
  id: string;
  clientId: string;
  vehicle: string;
  plate: string;
  service: string;
  serviceId?: string;
  serviceIds?: string[];
  status: 'Aguardando Aprovação' | 'Aguardando' | 'Em Andamento' | 'Aguardando Peças' | 'Controle de Qualidade' | 'Concluído' | 'Entregue' | 'Cancelado';
  technician: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  totalValue: number;
  damages: DamagePoint[];
  vehicleInventory: VehicleInventory;
  dailyLog: DailyLogEntry[];
  qaChecklist: QualityChecklistItem[];
  scopeChecklist?: ScopeItem[];
  additionalItems?: AdditionalItem[];
  tasks: Task[];
  checklist: any[]; // Legacy
  createdAt: string;
  discount?: Discount;
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: string;
  paidAt?: string;
  npsScore?: number;
  npsComment?: string;
  clientSignature?: string;
  tenant_id?: string;
  json_data?: any;
  campaignId?: string;
  insuranceDetails?: {
    isInsurance: boolean;
    insuranceName?: string;
    deductibleAmount?: number;
    insuranceCoveredAmount?: number;
    claimNumber?: string;
  };
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  costPrice: number;
  status: 'ok' | 'warning' | 'critical';
  tenant_id?: string;
}

export interface ServiceConsumptionItem {
  inventoryId: number;
  quantity: number;
  usageUnit: string;
}

export interface ServiceConsumption {
  serviceId: string;
  items: ServiceConsumptionItem[];
}

export interface PriceMatrixEntry {
  serviceId: string;
  size: VehicleSize;
  price: number;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  standardTimeMinutes: number;
  active: boolean;
  returnIntervalDays?: number;
  showOnLandingPage?: boolean;
  imageUrl?: string;
  price_matrix?: {
    prices: Record<string, number>;
    consumption?: ServiceConsumptionItem[];
  };
  tenant_id?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  pin: string;
  salaryType: 'fixed' | 'commission' | 'mixed';
  fixedSalary: number;
  commissionRate: number;
  commissionBase: 'gross' | 'net';
  active: boolean;
  balance: number;
  tenant_id?: string;
  salary_data?: any;
  created_at?: string; // Added this property
}

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  type: 'commission' | 'advance' | 'payment' | 'salary';
  amount: number;
  description: string;
  date: string;
  relatedWorkOrderId?: string;
  tenant_id?: string;
}

export interface FinancialTransaction {
  id: number;
  desc: string;
  category: string;
  amount: number;
  netAmount?: number;
  fee?: number;
  type: 'income' | 'expense';
  date: string;
  dueDate?: string;
  method: 'Pix' | 'Cartão Crédito' | 'Cartão Débito' | 'Dinheiro' | 'Transferência' | 'Boleto';
  status: 'paid' | 'pending' | 'overdue';
  tenant_id?: string;
}

export interface Reminder {
  id: string;
  clientId: string;
  vehicleId: string;
  serviceType: string;
  dueDate: string;
  status: 'pending' | 'sent' | 'scheduled' | 'overdue';
  createdAt: string;
  autoGenerated: boolean;
  tenant_id?: string;
}

export interface CampaignTemplate {
  id: string;
  label: string;
  category: 'sales' | 'retention' | 'relationship';
  defaultMessage: string;
  suggestedSegment: string;
  variables: string[];
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type?: 'flash' | 'reactivation' | 'vip' | 'birthday' | 'promo' | 'combo' | 'custom';
  targetSegment: string;
  selectedClientIds: string[];
  messageTemplate: string;
  channel: 'whatsapp' | 'sms' | 'email';
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  status: 'draft' | 'scheduled' | 'sent';
  sentCount: number;
  conversionCount?: number;
  revenueGenerated?: number;
  costInTokens?: number;
  date?: string;
  scheduledFor?: string;
  customVariables?: Record<string, string>;
  tenant_id?: string;
}

export interface SocialPost {
  id: string;
  workOrderId: string;
  image: string;
  caption: string;
  hashtags: string[];
  platform: 'instagram' | 'facebook' | 'tiktok';
  status: 'draft' | 'posted';
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SystemAlert {
  id: string;
  type: 'estoque' | 'financeiro' | 'agenda' | 'cliente' | 'profissional';
  message: string;
  level: 'info' | 'atencao' | 'critico';
  resolved: boolean;
  createdAt: string;
  financialImpact?: number;
  actionLink?: string;
  actionLabel?: string;
  tenant_id?: string;
}

export interface CustomAutomation {
  id: string;
  name: string;
  trigger: 'service_completion' | 'after_days_inactive' | 'birthday';
  delayValue: number;
  delayUnit: 'hours' | 'days';
  messageTemplate: string;
  active: boolean;
}

export interface WhatsappSessionInfo {
  status: 'disconnected' | 'scanning' | 'connected';
  qrCode?: string;
  pairingCode?: string;
  device?: {
    name: string;
    number: string;
    battery: number;
    avatarUrl: string;
    platform: string;
  };
  lastUpdated?: string;
}

export interface WhatsappConfig {
  enabled: boolean;
  apiKey?: string;
  session: WhatsappSessionInfo;
  templates: {
    welcome: string;
    completion: string;
    nps: string;
    recall: string;
    birthday: string;
    appointmentReminder: string;
    reviewRequest: string;
  };
}

export interface LandingPageConfig {
  enabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  primaryColor: string;
  showServices: boolean;
  showTestimonials: boolean;
  whatsappMessage: string;
}

export interface CompanyPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    lowStock: boolean;
    osUpdates: boolean;
    marketing: boolean;
    financial: boolean;
    security: boolean;
    channels: {
      email: boolean;
      whatsapp: boolean;
      system: boolean;
    };
  };
}

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierConfig {
  id: TierLevel;
  name: string;
  minPoints: number;
  color: string;
  benefits: string[];
}

export interface GamificationConfig {
  enabled: boolean;
  levelSystem: boolean;
  pointsMultiplier: number;
  tiers: TierConfig[];
}

export interface CompanySettings {
  name: string;
  slug: string;
  responsibleName: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  logoUrl: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  primaryColor?: string;
  initialBalance: number;
  hourlyRate?: number;
  whatsapp: WhatsappConfig;
  landingPage: LandingPageConfig;
  preferences: CompanyPreferences;
  gamification: GamificationConfig;
  automations?: {
    birthday: boolean;
    nps: boolean;
    churnRecovery: boolean;
    appointmentReminders: boolean;
    reviewRequest: boolean;
  };
  customAutomations?: CustomAutomation[];
  legal?: {
    termsText?: string;
    privacyText?: string;
  };
}

export interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  pdfUrl: string;
}

export interface TokenHistory {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

export interface SubscriptionDetails {
  planId: 'starter' | 'pro' | 'enterprise' | 'trial';
  status: 'active' | 'inactive' | 'past_due' | 'trial';
  nextBillingDate: string;
  paymentMethod: string;
  tokenBalance: number;
  tokenHistory: TokenHistory[];
  invoices: Invoice[];
}

export interface ShopOwner {
  id: string;
  name: string;
  email: string;
  shopName: string;
}

export interface AuthResponse {
  success: boolean;
  error?: {
    message: string;
  };
}

export interface ClientPoints {
  clientId: string;
  totalPoints: number;
  currentLevel: number;
  tier: TierLevel;
  lastServiceDate: string;
  servicesCompleted: number;
  pointsHistory: {
    id: string;
    workOrderId: string;
    points: number;
    description: string;
    date: string;
  }[];
}

export interface FidelityCard {
  clientId: string;
  cardNumber: string;
  cardHolder: string;
  cardColor: string;
  qrCode: string;
  expiresAt: string;
  issueDate: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  requiredPoints: number;
  requiredLevel: TierLevel;
  rewardType: 'discount' | 'free_service' | 'gift';
  percentage?: number;
  value?: number;
  gift?: string;
  active: boolean;
  createdAt: string;
  config?: any;
  tenant_id?: string;
}

export interface Redemption {
  id: string;
  clientId: string;
  rewardId: string;
  rewardName: string;
  code: string;
  pointsCost: number;
  status: 'active' | 'used' | 'expired';
  redeemedAt: string;
  usedAt?: string;
  usedInWorkOrderId?: string;
  tenant_id?: string;
}

export interface ServiceRecipe {
  id: string;
  serviceId: string;
  items: {
    inventoryId: number;
    quantity: number;
    unit: string;
  }[];
}

export interface SaaSTenant {
  id: string;
  name: string;
  responsibleName: string;
  email: string;
  phone: string;
  planId: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  joinedAt: string;
  nextBilling: string;
  tokenBalance: number;
  mrr: number;
  lastLogin: string;
  logoUrl?: string;
}

export interface SaaSPlan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: number;
  features: string[];
  includedTokens: number;
  maxEmployees: number;
  maxDiskSpace: number;
  active: boolean;
  highlight?: boolean;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  active: boolean;
}

export interface SaaSTokenTransaction {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'purchase' | 'usage' | 'bonus' | 'plan_credit';
  amount: number;
  value?: number;
  description: string;
  date: string;
}

export interface SaaSTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: 'infrastructure' | 'marketing' | 'personnel' | 'api_costs' | 'other' | 'subscription' | 'token_sale';
  date: string;
}

export interface MessageLog {
  id: string;
  workOrderId?: string;
  clientId?: string;
  clientName?: string;
  clientPhone: string;
  type: 'text' | 'image' | 'template';
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  costInTokens: number;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  channel: 'whatsapp_bot' | 'whatsapp_manual' | 'sms' | 'email';
  trigger: 'manual' | 'automation' | 'campaign';
  tenant_id?: string;
}
