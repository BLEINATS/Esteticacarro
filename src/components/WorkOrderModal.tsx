import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, Camera, User, 
  MessageCircle, FileText, Box, Save, PenTool, 
  ShieldCheck, ClipboardCheck, CalendarClock, Hammer,
  CreditCard, UploadCloud, Lock, Share2, Plus, Trash2,
  DollarSign, Wrench, Check, Smile, Star, ListTodo,
  Image as ImageIcon, Search, Car, UserPlus, ChevronDown,
  Printer, Send, Tag, Ticket, Trophy, Gift, Sparkles, Bot, Loader2, ImagePlus, Eye, Megaphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkOrder, DamagePoint, VehicleInventory, DailyLogEntry, AdditionalItem, QualityChecklistItem, ScopeItem, Vehicle, VehicleSize, VEHICLE_SIZES, FinancialTransaction } from '../types';
import { cn, formatCurrency, formatId } from '../lib/utils';
import VehicleDamageMap from './VehicleDamageMap';
import ClientModal from './ClientModal';
import WorkOrderPrintTemplate from './WorkOrderPrintTemplate';
import SignaturePad from './SignaturePad';
import { useDialog } from '../context/DialogContext';
import { useNavigate } from 'react-router-dom';

interface WorkOrderModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

export default function WorkOrderModal({ workOrder, onClose }: WorkOrderModalProps) {
  const navigate = useNavigate();
  const { 
    addWorkOrder, updateWorkOrder, completeWorkOrder, submitNPS, 
    clients, recipes, services, getPrice, getWhatsappLink, 
    workOrders, addVehicle, useVoucher, getVoucherDetails,
    getClientPoints, companySettings, getRewardsByLevel, claimReward,
    addFinancialTransaction, deleteFinancialTransaction, financialTransactions,
    updateClientLTV, subscription, consumeTokens, employees, campaigns
  } = useApp();
  const { showConfirm, showAlert, showOptions } = useDialog();

  const [activeTab, setActiveTab] = useState<'reception' | 'execution' | 'quality' | 'finance'>('reception');
  const [isSaving, setIsSaving] = useState(false);

  // ... (rest of state definitions remain the same) ...
  const [selectedClientId, setSelectedClientId] = useState<string>(workOrder.clientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string>(workOrder.plate || '');
  
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({ model: '', plate: '', color: '', size: 'medium' });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [damages, setDamages] = useState<DamagePoint[]>(workOrder.damages || []);
  const [inventory, setInventory] = useState<VehicleInventory>(workOrder.vehicleInventory || {
    estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: ''
  });
  const [dailyLog, setDailyLog] = useState<DailyLogEntry[]>(workOrder.dailyLog || []);
  const [newLogText, setNewLogText] = useState('');
  const [newLogPhoto, setNewLogPhoto] = useState<string | null>(null);

  const [insurance, setInsurance] = useState(workOrder.insuranceDetails || { isInsurance: false });
  const [qaList, setQaList] = useState<QualityChecklistItem[]>(workOrder.qaChecklist || []);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>(workOrder.additionalItems || []);
  const [scopeList, setScopeList] = useState<ScopeItem[]>(workOrder.scopeChecklist || []);
  
  const [currentStatus, setCurrentStatus] = useState<WorkOrder['status']>(workOrder.status);
  const [assignedTechnician, setAssignedTechnician] = useState<string>(workOrder.technician || 'A Definir');

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [npsScore, setNpsScore] = useState<number | null>(workOrder.npsScore || null);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [currentDamageArea, setCurrentDamageArea] = useState<DamagePoint['area'] | null>(null);
  const [damageDesc, setDamageDesc] = useState('');
  const [damagePhoto, setDamagePhoto] = useState<string | null>(null);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [clientSignature, setClientSignature] = useState<string | null>(workOrder.clientSignature || null);

  const [discountType, setDiscountType] = useState<'value' | 'percentage' | 'service'>(workOrder.discount?.type || 'percentage');
  const [discountAmount, setDiscountAmount] = useState<number>(workOrder.discount?.amount || 0);
  const [discountDescription, setDiscountDescription] = useState<string>(workOrder.discount?.description || '');
  
  const [paymentMethod, setPaymentMethod] = useState(workOrder.paymentMethod || 'Pix');
  const [paymentDate, setPaymentDate] = useState(workOrder.paidAt ? new Date(workOrder.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(workOrder.paymentStatus === 'paid');

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  
  // NEW: Campaign Attribution
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(workOrder.campaignId || '');

  const [servicePrice, setServicePrice] = useState<number>(() => {
    const extras = workOrder.additionalItems?.reduce((acc, item) => acc + item.value, 0) || 0;
    let baseValue = workOrder.totalValue;

    if (workOrder.discount && workOrder.discount.amount > 0) {
        if (workOrder.discount.type === 'percentage') {
            const rate = workOrder.discount.amount / 100;
            if (rate < 1) {
                baseValue = baseValue / (1 - rate);
            }
        } else {
            baseValue = baseValue + workOrder.discount.amount;
        }
    }

    return baseValue > 0 ? Math.max(0, baseValue - extras) : 0;
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientVehicles = selectedClient ? selectedClient.vehicles : [];
  const selectedVehicleObj = clientVehicles.find(v => v.plate === selectedVehiclePlate);

  const rawClientPoints = selectedClientId ? getClientPoints(selectedClientId) : undefined;
  const currentPoints = rawClientPoints?.totalPoints || 0;
  const currentTierId = rawClientPoints?.tier || 'bronze';
  const defaultTierConfig = { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: [] };
  const clientTierConfig = (companySettings.gamification.tiers || []).find(t => t.id === currentTierId) || defaultTierConfig;

  const isWhatsAppConnected = companySettings.whatsapp.session.status === 'connected';

  const filteredClients = clientSearch.length > 0 
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
    : [];

  // ... (useEffect hooks remain the same) ...
  useEffect(() => {
    if (workOrder.clientId && workOrder.clientId !== 'c1' && workOrder.clientId !== '') {
        const c = clients.find(cl => cl.id === workOrder.clientId);
        if (c) {
            setClientSearch(c.name);
            setSelectedClientId(c.id);
        }
    }
  }, [workOrder.clientId, clients]);

  useEffect(() => {
    if (workOrder.serviceIds && workOrder.serviceIds.length > 0) {
        setSelectedServiceIds(workOrder.serviceIds);
    } else if (workOrder.serviceId) {
        setSelectedServiceIds([workOrder.serviceId]);
    }
  }, [workOrder]);

  useEffect(() => {
    if (selectedVehicleObj && selectedServiceIds.length > 0) {
        const total = selectedServiceIds.reduce((acc, id) => acc + getPrice(id, selectedVehicleObj.size), 0);
        if (workOrder.totalValue === 0 || selectedServiceIds.join(',') !== (workOrder.serviceIds || [workOrder.serviceId]).join(',')) {
             setServicePrice(total);
        }
    }
  }, [selectedServiceIds, selectedVehicleObj]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (scopeList.length === 0) {
        const items: ScopeItem[] = [];
        if (workOrder.service) items.push({ id: 'main-svc', label: workOrder.service, completed: false, type: 'main' });
        if (workOrder.additionalItems && workOrder.additionalItems.length > 0) {
            workOrder.additionalItems.forEach(item => {
                items.push({ id: `add-${item.id}`, label: item.description, completed: false, type: 'additional' });
            });
        }
        if (items.length > 0) setScopeList(items);
    }
  }, [workOrder.service, workOrder.additionalItems]);

  useEffect(() => {
    if (qaList.length === 0) {
      const defaultQA: QualityChecklistItem[] = [
        { id: 'q1', label: 'Serviço principal executado conforme OS', checked: false, required: true },
        { id: 'q2', label: 'Limpeza final realizada (sem resíduos)', checked: false, required: true },
        { id: 'q3', label: 'Pertences do cliente conferidos', checked: false, required: true },
      ];
      
      if (workOrder.service.toLowerCase().includes('funilaria') || workOrder.service.toLowerCase().includes('pintura')) {
        defaultQA.push({ id: 'q4', label: 'Tonalidade da pintura conferida na luz natural', checked: false, required: true });
        defaultQA.push({ id: 'q5', label: 'Montagem de peças alinhada (gaps)', checked: false, required: true });
      }

      if (workOrder.service.toLowerCase().includes('polimento') || workOrder.service.toLowerCase().includes('vitrificação')) {
        defaultQA.push({ id: 'q6', label: 'Inspeção de hologramas com luz de detalhamento', checked: false, required: true });
        defaultQA.push({ id: 'q7', label: 'Plásticos e borrachas protegidos/limpos', checked: false, required: true });
      }

      if (workOrder.service.toLowerCase().includes('higienização')) {
        defaultQA.push({ id: 'q8', label: 'Bancos e carpetes 100% secos', checked: false, required: true });
      }

      setQaList(defaultQA);
    }
  }, [workOrder.service]);

  // ... (handlers remain the same) ...
  const handleClientSelect = (client: any) => {
    setSelectedClientId(client.id);
    setClientSearch(client.name);
    setShowClientList(false);
    if (client.vehicles.length > 0) {
        const v = client.vehicles[0];
        setSelectedVehiclePlate(v.plate);
    } else {
        setSelectedVehiclePlate('');
        setIsAddingVehicle(true);
    }
  };

  const handleVehicleChange = (plate: string) => {
    setSelectedVehiclePlate(plate);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
        prev.includes(serviceId) 
            ? prev.filter(id => id !== serviceId) 
            : [...prev, serviceId]
    );
  };

  const handleQuickAddVehicle = () => {
    if (selectedClientId && newVehicle.model && newVehicle.plate) {
        const v: Vehicle = {
            id: `v-${Date.now()}`,
            model: newVehicle.model || '',
            plate: newVehicle.plate || '',
            color: newVehicle.color || '',
            year: newVehicle.year || '',
            size: newVehicle.size as VehicleSize || 'medium'
        };
        addVehicle(selectedClientId, v);
        setSelectedVehiclePlate(v.plate);
        setIsAddingVehicle(false);
        setNewVehicle({ model: '', plate: '', color: '', size: 'medium' });
    }
  };

  const getUpdatedOrderData = (): Partial<WorkOrder> => {
    const extrasTotal = additionalItems.reduce((acc, item) => acc + item.value, 0);
    const subtotal = servicePrice + extrasTotal;
    
    let discountValue = 0;
    if (discountType === 'percentage') {
        discountValue = subtotal * (discountAmount / 100);
    } else {
        discountValue = discountAmount;
    }

    const finalTotal = insurance.isInsurance 
      ? (insurance.deductibleAmount || 0) + (insurance.insuranceCoveredAmount || 0) + extrasTotal 
      : Math.max(0, subtotal - discountValue);

    const selectedServicesList = services.filter(s => selectedServiceIds.includes(s.id));
    const serviceName = selectedServicesList.length > 0 
        ? selectedServicesList.map(s => s.name).join(' + ') 
        : workOrder.service;

    return {
      clientId: selectedClientId,
      vehicle: selectedVehicleObj ? selectedVehicleObj.model : workOrder.vehicle,
      plate: selectedVehiclePlate,
      damages,
      vehicleInventory: inventory,
      dailyLog,
      insuranceDetails: insurance,
      qaChecklist: qaList,
      scopeChecklist: scopeList,
      additionalItems,
      totalValue: finalTotal,
      service: serviceName,
      serviceId: selectedServiceIds[0],
      serviceIds: selectedServiceIds,
      status: currentStatus,
      technician: assignedTechnician,
      clientSignature: clientSignature,
      discount: {
        type: discountType,
        amount: discountAmount,
        description: discountDescription
      },
      paymentStatus: isPaid ? 'paid' : 'pending',
      paymentMethod: isPaid ? paymentMethod : undefined,
      paidAt: isPaid ? paymentDate : undefined,
      campaignId: selectedCampaignId // Save attribution
    };
  };

  const handleSave = async () => {
    if (!selectedClientId || !selectedVehiclePlate) {
        await showAlert({
            title: 'Dados Incompletos',
            message: 'Por favor, selecione um cliente e um veículo antes de salvar.',
            type: 'warning'
        });
        setActiveTab('reception');
        return;
    }

    setIsSaving(true);

    if (appliedVoucher) {
      useVoucher(appliedVoucher, workOrder.id);
    }

    const updatedData = getUpdatedOrderData();
    const exists = workOrders.some(o => o.id === workOrder.id);
    
    let success = false;

    if (exists) {
        success = await updateWorkOrder(workOrder.id, updatedData);
    } else {
        success = await addWorkOrder({
            ...workOrder,
            ...updatedData,
            createdAt: workOrder.createdAt || new Date().toISOString(),
            tasks: workOrder.tasks || [],
            checklist: workOrder.checklist || []
        } as WorkOrder);
    }
    
    setIsSaving(false);

    if (success) {
        onClose();
        await showAlert({
            title: 'Sucesso',
            message: 'Ordem de Serviço salva com sucesso.',
            type: 'success'
        });
    } else {
        await showAlert({
            title: 'Erro ao Salvar',
            message: 'Não foi possível salvar a OS. Verifique sua conexão e tente novamente.',
            type: 'error'
        });
    }
  };

  const handleApprove = async () => {
      if (!selectedClientId || !selectedVehiclePlate) {
        await showAlert({
            title: 'Atenção',
            message: 'Selecione o cliente antes de aprovar.',
            type: 'warning'
        });
        return;
      }

      setIsSaving(true);

      const updatedData = getUpdatedOrderData();
      const approvedData = {
          ...updatedData,
          status: 'Aguardando' as const
      };

      const exists = workOrders.some(o => o.id === workOrder.id);
      let success = false;

      if (exists) {
          success = await updateWorkOrder(workOrder.id, approvedData);
      } else {
          success = await addWorkOrder({
              ...workOrder,
              ...approvedData,
              createdAt: new Date().toISOString(),
              tasks: [],
              checklist: []
          } as WorkOrder);
      }
      
      setIsSaving(false);

      if (success) {
          setCurrentStatus('Aguardando');
          onClose();
          await showAlert({
            title: 'Aprovado',
            message: 'Ordem de Serviço aprovada e enviada para a fila.',
            type: 'success'
          });
      } else {
          await showAlert({
            title: 'Erro',
            message: 'Falha ao aprovar OS.',
            type: 'error'
          });
      }
  };

  // ... (Other handlers like handleRegisterPayment, handleUndoPayment, handleApplyVoucher, handleAddDamage, handleSaveDamage, handlePhotoCapture, handleLogPhotoSelect, handleAddLog, handleQuickAfterPhoto, handleStatusChange, handleNPS, handlePrint, handleSendWhatsApp) ...
  // ... (Keeping them as is, just showing handleSendTrackingLink update) ...

  const handleRegisterPayment = async () => {
    const currentData = getUpdatedOrderData();
    const amountToPay = currentData.totalValue || 0;

    const confirm = await showConfirm({
        title: 'Confirmar Pagamento',
        message: `Deseja registrar o pagamento de ${formatCurrency(amountToPay)} via ${paymentMethod}?`,
        confirmText: 'Sim, Confirmar',
        type: 'success'
    });

    if (confirm) {
        setIsPaid(true);
        const transaction: FinancialTransaction = {
            id: Date.now(),
            desc: `Pagamento OS #${workOrder.id} - ${selectedClient?.name || 'Cliente'}`,
            category: 'Serviços',
            amount: amountToPay,
            netAmount: amountToPay,
            fee: 0,
            type: 'income',
            date: paymentDate,
            dueDate: paymentDate,
            method: paymentMethod,
            status: 'paid'
        };
        
        addFinancialTransaction(transaction);
        
        updateWorkOrder(workOrder.id, { 
            paymentStatus: 'paid',
            paymentMethod: paymentMethod,
            paidAt: paymentDate,
            totalValue: amountToPay
        });

        if (selectedClientId) {
            updateClientLTV(selectedClientId, amountToPay);
        }

        await showAlert({
            title: 'Pagamento Registrado',
            message: 'O valor foi lançado no financeiro e o LTV do cliente atualizado.',
            type: 'success'
        });
    }
  };

  const handleUndoPayment = async () => {
    const currentData = getUpdatedOrderData();
    const amountToRefund = currentData.totalValue || 0;

    const confirm = await showConfirm({
        title: 'Desfazer Pagamento',
        message: 'Isso removerá o lançamento do financeiro e subtrairá o valor do LTV do cliente. Continuar?',
        type: 'warning',
        confirmText: 'Sim, Desfazer'
    });

    if (confirm) {
        const transaction = financialTransactions.find(t => t.desc.includes(`OS #${workOrder.id}`));
        if (transaction) {
            deleteFinancialTransaction(transaction.id);
        }
        
        setIsPaid(false);
        
        updateWorkOrder(workOrder.id, { 
            paymentStatus: 'pending',
            paymentMethod: undefined,
            paidAt: undefined
        });

        if (selectedClientId) {
            updateClientLTV(selectedClientId, -amountToRefund);
        }

        await showAlert({
            title: 'Pagamento Desfeito',
            message: 'O lançamento foi removido e o LTV do cliente ajustado.',
            type: 'success'
        });
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    const details = getVoucherDetails(voucherCode);
    
    if (!details) {
      await showAlert({ title: 'Inválido', message: 'Voucher não encontrado.', type: 'warning' });
      return;
    }

    if (details.redemption.status !== 'active') {
      await showAlert({ title: 'Inválido', message: 'Este voucher já foi utilizado ou expirou.', type: 'warning' });
      return;
    }

    if (details.redemption.clientId !== selectedClientId) {
       const confirmUse = await showConfirm({
         title: 'Voucher de Outro Cliente',
         message: 'Este voucher pertence a outro cliente. Deseja aplicar mesmo assim?',
         type: 'warning',
         confirmText: 'Sim, Aplicar'
       });
       if (!confirmUse) return;
    }

    if (details.reward) {
      if (details.reward.rewardType === 'discount') {
        setDiscountType('percentage');
        setDiscountAmount(details.reward.percentage || 0);
        setDiscountDescription(`Voucher: ${voucherCode} (${details.reward.name})`);
      } else if (details.reward.rewardType === 'service' || details.reward.rewardType === 'free_service') {
        setDiscountType('service');
        setDiscountAmount(servicePrice); 
        setDiscountDescription(`Voucher Serviço: ${voucherCode} (${details.reward.gift || details.reward.name})`);
      }
      setAppliedVoucher(voucherCode);
      
      // AUTO-LINK CAMPAIGN IF VOUCHER IS RELATED (Mock logic: if voucher code contains campaign prefix)
      // In a real scenario, Redemption would have a campaignId field.
      // For now, we can try to guess or just leave it.
      // Better: Let's assume the user manually selects the campaign if not automated.
      
      await showAlert({ title: 'Sucesso', message: `Voucher ${voucherCode} aplicado! O desconto foi configurado.`, type: 'success' });
    }
  };

  const handleAddDamage = (area: DamagePoint['area']) => {
    setCurrentDamageArea(area);
    setDamageDesc('');
    setDamagePhoto(null);
    setIsDamageModalOpen(true);
  };

  const handleSaveDamage = () => {
    if (currentDamageArea && damageDesc) {
      setDamages([...damages, { 
        id: Date.now().toString(), 
        area: currentDamageArea, 
        type: 'risco', 
        description: damageDesc, 
        photoUrl: damagePhoto || 'pending' 
      }]);
      setIsDamageModalOpen(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setDamagePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLog = () => {
    if (!newLogText && !newLogPhoto) return;
    
    const photos = newLogPhoto ? [newLogPhoto] : [];
    
    setDailyLog([{ 
        id: Date.now().toString(), 
        date: new Date().toISOString(), 
        stage: 'Execução', 
        description: newLogText || 'Foto registrada', 
        photos: photos, 
        author: 'Técnico' 
    }, ...dailyLog]);
    
    setNewLogText('');
    setNewLogPhoto(null);
  };

  const handleQuickAfterPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setDailyLog([{ 
            id: Date.now().toString(), 
            date: new Date().toISOString(), 
            stage: 'Finalização', 
            description: 'Resultado Final', 
            photos: [url], 
            author: 'Técnico' 
        }, ...dailyLog]);
      };
      reader.readAsDataURL(file);
    }
  };

  const canComplete = qaList.every(q => !q.required || q.checked);

  const handleStatusChange = async (newStatus: WorkOrder['status']) => {
    if (newStatus === 'Entregue' && !canComplete) {
      await showAlert({
        title: 'Controle de Qualidade',
        message: 'Opa! Precisamos completar o Checklist de Qualidade antes de entregar o carro.',
        type: 'warning'
      });
      return;
    }

    const exists = workOrders.some(o => o.id === workOrder.id);
    if (!exists) {
        const shouldSave = await showConfirm({
            title: 'Salvar OS?',
            message: 'Para mudar o status, precisamos salvar a OS primeiro. Deseja salvar agora?',
            type: 'info'
        });
        if (shouldSave) {
            handleSave();
        }
        return;
    }

    updateWorkOrder(workOrder.id, { status: newStatus });
    setCurrentStatus(newStatus);
    
    if (newStatus === 'Concluído') {
      const currentData = getUpdatedOrderData();
      const fullOrderSnapshot = { ...workOrder, ...currentData, status: 'Concluído' } as WorkOrder;
      
      updateWorkOrder(workOrder.id, currentData);
      completeWorkOrder(workOrder.id, fullOrderSnapshot);
      
      if (selectedClient) {
        const msg = `Olá ${selectedClient.name}! O serviço no seu ${selectedVehicleObj?.model || 'veículo'} foi concluído com sucesso. Valor Total: ${formatCurrency(fullOrderSnapshot.totalValue)}. Aguardamos sua retirada!`;
        
        let method = 'manual';
        if (isWhatsAppConnected) {
            method = await showOptions({
                title: 'Avisar Cliente',
                message: 'Serviço concluído! Como deseja avisar o cliente?',
                options: [
                    { label: '🤖 Robô (1 Token)', value: 'bot', variant: 'primary' },
                    { label: '📱 Manual (WhatsApp)', value: 'manual', variant: 'secondary' }
                ]
            }) || 'cancel';
        }

        if (method === 'bot') {
            if (consumeTokens(1, `Aviso Conclusão OS #${workOrder.id}`)) {
                showAlert({ title: 'Aviso Enviado', message: 'Mensagem de conclusão enviada via Robô.', type: 'success' });
            } else {
                showAlert({ title: 'Erro no Envio', message: 'Saldo de tokens insuficiente para envio automático.', type: 'warning' });
            }
        } else if (method === 'manual') {
            window.open(getWhatsappLink(selectedClient.phone, msg), '_blank');
        }
      }
      await showAlert({
        title: 'Serviço Concluído!',
        message: 'Pontos creditados, comissão lançada e estoque atualizado.',
        type: 'success'
      });
    } 
  };

  const handleNPS = (score: number) => {
    setNpsScore(score);
    submitNPS(workOrder.id, score);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showAlert({
        title: 'Erro',
        message: 'Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.',
        type: 'error'
      });
      return;
    }

    const currentData = getUpdatedOrderData();
    const printOrder = { ...workOrder, ...currentData } as WorkOrder;

    const htmlContent = WorkOrderPrintTemplate({ workOrder: printOrder, client: selectedClient });
    
    // ... (Print logic inside template function or similar) ...
    // Reusing existing print logic
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>OS ${formatId(workOrder.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #000; background: #fff; margin: 0; }
          @page { size: A4; margin: 10mm; }
          @media print { body { margin: 0; } }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0 0 10px 0; font-size: 32px; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
          .os-title { font-size: 28px; font-weight: bold; color: #2563eb; }
          .section { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
          .section h3 { margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-weight: bold; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .grid-2.full { grid-template-columns: 1fr; }
          .info-row { margin-bottom: 8px; }
          .info-label { font-weight: bold; display: inline-block; width: 120px; }
          .damage-list { list-style-position: inside; padding: 0; }
          .damage-list li { margin-bottom: 5px; }
          .financial { background-color: #f5f5f5; border: 2px solid #ccc; }
          .total-value { font-size: 20px; font-weight: bold; color: #2563eb; }
          .signature-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
          .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; }
          .footer { text-align: center; font-size: 11px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ORDEM DE SERVIÇO</h1>
            <div class="header-top">
              <div>
                <div><strong>Oficina:</strong> ${companySettings.name}</div>
                <div><strong>Endereço:</strong> ${companySettings.address}</div>
                <div><strong>Telefone:</strong> ${companySettings.phone}</div>
              </div>
              <div style="text-align: right;">
                <div class="os-title">OS ${formatId(workOrder.id)}</div>
                <div style="font-size: 12px; color: #666; text-transform: uppercase;">${currentStatus}</div>
                <div style="font-size: 12px; color: #666;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="section">
              <h3>CLIENTE</h3>
              ${selectedClient ? `
                <div class="info-row"><span class="info-label">Nome:</span> ${selectedClient.name}</div>
                <div class="info-row"><span class="info-label">Telefone:</span> ${selectedClient.phone}</div>
                <div class="info-row"><span class="info-label">Email:</span> ${selectedClient.email}</div>
              ` : 'Dados do cliente não disponíveis'}
            </div>
            <div class="section">
              <h3>VEÍCULO</h3>
              <div class="info-row"><span class="info-label">Modelo:</span> ${printOrder.vehicle}</div>
              <div class="info-row"><span class="info-label">Placa:</span> ${printOrder.plate}</div>
              <div class="info-row"><span class="info-label">Status:</span> ${printOrder.status}</div>
              <div class="info-row"><span class="info-label">Técnico:</span> ${printOrder.technician}</div>
            </div>
          </div>

          <div class="section grid-2 full">
            <h3>SERVIÇOS</h3>
            <div style="font-size: 16px; margin-bottom: 10px;">${printOrder.service}</div>
          </div>

          <div class="section financial grid-2 full">
            <h3>RESUMO FINANCEIRO</h3>
            <div style="font-size: 14px;">
              <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 18px; border-top: 1px solid #ccc; padding-top: 10px;">
                <span>Valor Total:</span>
                <span class="total-value">${formatCurrency(printOrder.totalValue)}</span>
              </div>
            </div>
          </div>

          <div class="signature-row">
            <div class="signature-box">Assinatura do Cliente</div>
            <div class="signature-box">Assinatura do Técnico</div>
            <div class="signature-box">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedClient) {
      await showAlert({
        title: 'Atenção',
        message: 'Selecione um cliente antes de enviar a OS via WhatsApp.',
        type: 'warning'
      });
      return;
    }

    const currentData = getUpdatedOrderData();
    
    const itemsText = currentData.additionalItems && currentData.additionalItems.length > 0 
      ? currentData.additionalItems.map(item => `\n• ${item.description}: R$ ${item.value.toFixed(2)}`).join('')
      : '';

    const message = `Olá ${selectedClient.name}! 👋\n\nSua Ordem de Serviço foi registrada:\n\n📋 *OS ${formatId(workOrder.id)}*\n🚗 ${currentData.vehicle} - ${currentData.plate}\n🔧 Serviço: ${currentData.service}\n💰 Valor: ${formatCurrency(currentData.totalValue || 0)}${itemsText}\n⏱️ Prazo: ${workOrder.deadline}\n\nStatus: ${currentStatus}\n\nAguardamos sua confirmação!\n\n${companySettings.name}`;
    
    let method = 'manual';

    if (isWhatsAppConnected) {
        method = await showOptions({
            title: 'Enviar OS',
            message: 'Como deseja enviar esta Ordem de Serviço?',
            options: [
                { label: '🤖 Automático (1 Token)', value: 'bot', variant: 'primary' },
                { label: '📱 Manual (WhatsApp Web)', value: 'manual', variant: 'secondary' }
            ]
        }) || 'cancel';
    }

    if (method === 'bot') {
        if ((subscription.tokenBalance || 0) < 1) {
            await showAlert({
                title: 'Saldo Insuficiente',
                message: 'Você precisa de 1 token para enviar via Robô. Recarregue sua carteira em Configurações.',
                type: 'warning'
            });
            return;
        }

        if (consumeTokens(1, `Envio OS #${workOrder.id}`)) {
            await showAlert({ title: 'Enviado', message: 'Mensagem enviada para a fila de disparo do Robô.', type: 'success' });
        } else {
            await showAlert({ title: 'Erro', message: 'Falha ao processar tokens.', type: 'error' });
        }
    } else if (method === 'manual') {
        window.open(getWhatsappLink(selectedClient.phone, message), '_blank');
    }
  };

  const handleSendTrackingLink = async () => {
    if (!selectedClient) {
      await showAlert({
        title: 'Atenção',
        message: 'Selecione um cliente para enviar o link.',
        type: 'warning'
      });
      return;
    }

    const trackingLink = `${window.location.origin}/track/${workOrder.id}`;
    const message = `Olá ${selectedClient.name}! 🚗\n\nAcompanhe o serviço do seu ${selectedVehicleObj?.model || 'veículo'} em tempo real, com fotos e status:\n${trackingLink}\n\nQualquer dúvida, estamos à disposição!`;

    let method = 'manual';
    if (isWhatsAppConnected) {
        method = await showOptions({
            title: 'Enviar Link de Acompanhamento',
            message: 'Como deseja enviar o link?',
            options: [
                { label: '🤖 Automático (1 Token)', value: 'bot', variant: 'primary' },
                { label: '📱 Manual (WhatsApp)', value: 'manual', variant: 'secondary' }
            ]
        }) || 'cancel';
    }

    if (method === 'bot') {
        if (consumeTokens(1, `Link Acompanhamento OS #${workOrder.id}`)) {
            await showAlert({ title: 'Enviado', message: 'Link enviado com sucesso!', type: 'success' });
        } else {
            await showAlert({ title: 'Erro', message: 'Saldo insuficiente.', type: 'warning' });
        }
    } else if (method === 'manual') {
        window.open(getWhatsappLink(selectedClient.phone, message), '_blank');
    }
  };

  const handlePreviewTracking = () => {
      // Navegação interna para evitar bloqueio de pop-up do ambiente de desenvolvimento
      navigate(`/track/${workOrder.id}`);
  };

  const handleSignatureSave = (signature: string) => {
    setClientSignature(signature);
    setIsSignaturePadOpen(false);
  };

  const currentExtrasTotal = additionalItems.reduce((acc, item) => acc + item.value, 0);
  const displaySubtotal = servicePrice + currentExtrasTotal;
  
  let displayDiscount = 0;
  if (discountType === 'percentage') {
      displayDiscount = displaySubtotal * (discountAmount / 100);
  } else {
      displayDiscount = discountAmount;
  }
  const displayTotal = Math.max(0, displaySubtotal - displayDiscount);

  const beforePhotos = damages.filter(d => d.photoUrl && d.photoUrl !== 'pending').map(d => ({ url: d.photoUrl!, desc: d.description }));
  const afterPhotos = dailyLog.flatMap(log => log.photos.map(url => ({ url, desc: log.description })));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
      {/* ... (rest of the modal content) ... */}
      {isClientModalOpen && <ClientModal onClose={() => setIsClientModalOpen(false)} />}
      {isSignaturePadOpen && <SignaturePad onSave={handleSignatureSave} onClose={() => setIsSignaturePadOpen(false)} />}
      
      {/* ... (Damage Modal) ... */}
      {isDamageModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* ... (Damage Modal Content) ... */}
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Registrar Avaria</h3>
                <button onClick={() => setIsDamageModalOpen(false)} className="p-1 text-slate-400"><X size={20} /></button>
             </div>
             
             <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 capitalize">
                    Área: {currentDamageArea?.replace('_', ' ')}
                </p>
                <textarea 
                    value={damageDesc} 
                    onChange={(e) => setDamageDesc(e.target.value)} 
                    placeholder="Descreva o dano (ex: Risco profundo, amassado...)" 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                    rows={3}
                    autoFocus
                />
             </div>

             <label className="block w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-4">
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handlePhotoCapture}
                />
                {damagePhoto ? (
                    <div className="relative">
                        <img src={damagePhoto} alt="Preview" className="h-32 mx-auto rounded-lg object-cover shadow-sm" />
                        <div className="flex items-center justify-center gap-2 mt-2 text-green-600 dark:text-green-400 font-bold text-sm">
                            <CheckCircle2 size={16} /> Foto Anexada
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <Camera size={24} />
                        </div>
                        <span className="font-bold text-sm">Tirar Foto da Avaria</span>
                    </div>
                )}
             </label>

             <div className="flex gap-3">
                <button onClick={() => setIsDamageModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-colors">Cancelar</button>
                <button onClick={handleSaveDamage} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">Salvar</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-5xl max-h-[98vh] sm:max-h-[95vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 bg-slate-50/50 dark:bg-slate-900/50">
          {/* ... (Header content) ... */}
          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{formatId(workOrder.id)}</h2>
              <select 
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className={cn(
                  "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide border-none focus:ring-2 cursor-pointer text-xs sm:text-sm",
                  currentStatus === 'Aguardando Aprovação' 
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}
              >
                <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                <option value="Aguardando">Aguardando Início</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aguardando Peças">Aguardando Peças</option>
                <option value="Controle de Qualidade">Controle de Qualidade</option>
                <option value="Concluído">Concluído (Pronto)</option>
                <option value="Entregue">Entregue ao Cliente</option>
              </select>

              {selectedClientId && companySettings.gamification?.enabled && (
                <span className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white",
                  `bg-gradient-to-r ${clientTierConfig.color}`
                )}>
                  <Trophy size={10} />
                  {clientTierConfig.name} • {currentPoints} pts
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-1">
                    {selectedVehicleObj ? selectedVehicleObj.model : 'Veículo não selecionado'} • {selectedVehiclePlate || 'Placa?'}
                </p>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <div className="flex items-center gap-1">
                    <User size={12} className="text-slate-400" />
                    <select 
                        value={assignedTechnician}
                        onChange={(e) => setAssignedTechnician(e.target.value)}
                        className="bg-transparent border-none text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium focus:ring-0 cursor-pointer hover:text-blue-600"
                    >
                        <option value="A Definir">Técnico: A Definir</option>
                        {employees.filter(e => e.active).map(emp => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {currentStatus === 'Aguardando Aprovação' ? (
                <button 
                    onClick={handleApprove} 
                    disabled={isSaving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 animate-pulse disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 
                    <span className="hidden sm:inline">Aprovar & Definir Preço</span><span className="sm:hidden">Aprovar</span>
                </button>
            ) : (
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                    <span className="hidden sm:inline">Salvar Tudo</span><span className="sm:hidden">Salvar</span>
                </button>
            )}
            <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-600 text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-slate-700 transition-colors">
                <Printer size={14} /> <span className="hidden sm:inline">Imprimir</span><span className="sm:hidden">Print</span>
            </button>
            <button 
                onClick={handleSendWhatsApp} 
                className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-white rounded-lg text-[10px] sm:text-sm font-medium transition-colors",
                    isWhatsAppConnected ? "bg-purple-600 hover:bg-purple-700" : "bg-green-500 hover:bg-green-600"
                )}
            >
                {isWhatsAppConnected ? <Bot size={14} /> : <Send size={14} />} 
                <span className="hidden sm:inline">{isWhatsAppConnected ? 'Enviar (Híbrido)' : 'WhatsApp'}</span>
                <span className="sm:hidden">{isWhatsAppConnected ? 'Robô' : 'WA'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-2 sm:px-6 overflow-x-auto">
          {[
            { id: 'reception', label: 'Recepção & Vistoria', mobileLabel: 'Recepção', icon: ClipboardCheck },
            { id: 'execution', label: 'Execução & Diário', mobileLabel: 'Execução', icon: Hammer },
            { id: 'quality', label: 'Qualidade (QA)', mobileLabel: 'Qualidade', icon: ShieldCheck },
            { id: 'finance', label: 'Financeiro & Peças', mobileLabel: 'Financeiro', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <tab.icon size={14} className="hidden sm:block" />
              <tab.icon size={12} className="sm:hidden" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-50/30 dark:bg-slate-950/30">
          
          {/* TAB: RECEPTION */}
          {activeTab === 'reception' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-8">
              {/* ... (Client & Vehicle Selection - No changes) ... */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-2">
                 {/* ... (Client Selection Logic) ... */}
                 <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <User size={18} className="text-blue-600" />
                    Dados do Cliente & Veículo
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {/* Client Selection */}
                    <div className="relative">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5">Cliente</label>
                        <div className="flex gap-1 sm:gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    value={clientSearch}
                                    onChange={(e) => { setClientSearch(e.target.value); setShowClientList(true); }}
                                    onFocus={() => setShowClientList(true)}
                                    placeholder="Buscar cliente..."
                                    className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white"
                                />
                                {showClientList && clientSearch && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-32 sm:max-h-48 overflow-y-auto">
                                        {filteredClients.length > 0 ? filteredClients.map(c => (
                                            <button 
                                                key={c.id}
                                                onClick={() => handleClientSelect(c)}
                                                className="w-full text-left px-2 sm:px-4 py-1.5 sm:py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] sm:text-sm text-slate-700 dark:text-slate-300"
                                            >
                                                <span className="font-bold">{c.name}</span> <span className="text-[8px] sm:text-xs text-slate-500">({c.phone})</span>
                                            </button>
                                        )) : (
                                            <div className="px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm text-slate-500">Nenhum cliente encontrado.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsClientModalOpen(true)}
                                className="px-2 sm:px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                title="Novo Cliente"
                            >
                                <UserPlus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Vehicle Selection */}
                    <div>
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5">Veículo</label>
                        {selectedClientId ? (
                            <div className="flex gap-1 sm:gap-2">
                                <select 
                                    value={selectedVehiclePlate}
                                    onChange={(e) => handleVehicleChange(e.target.value)}
                                    className="flex-1 px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white"
                                >
                                    <option value="">Selecione o veículo...</option>
                                    {clientVehicles.map(v => (
                                        <option key={v.id} value={v.plate}>{v.model} - {v.plate}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                                    className="px-2 sm:px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    title="Adicionar Carro"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-sm text-slate-400 italic">
                                Selecione um cliente primeiro
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Quick Add Vehicle Form */}
                 {isAddingVehicle && selectedClientId && (
                    <div className="mt-2 sm:mt-4 p-2 sm:p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">Novo Veículo</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 sm:gap-3">
                            <input type="text" placeholder="Modelo" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                            <input type="text" placeholder="Placa" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                            <input type="text" placeholder="Cor" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                            <input type="text" placeholder="Ano" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm" />
                            <select value={newVehicle.size} onChange={e => setNewVehicle({...newVehicle, size: e.target.value as any})} className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm">
                                {Object.entries(VEHICLE_SIZES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-1 sm:gap-2 mt-2 sm:mt-3">
                            <button onClick={() => setIsAddingVehicle(false)} className="text-[10px] sm:text-xs font-bold text-slate-500 px-2 sm:px-3 py-1 sm:py-2">Cancelar</button>
                            <button onClick={handleQuickAddVehicle} className="text-[10px] sm:text-xs font-bold bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg">Salvar</button>
                        </div>
                    </div>
                 )}
              </div>

              {/* ... (rest of reception content) ... */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Camera size={18} className="text-blue-600" />
                  Inspeção do Veículo
                </h3>
                <VehicleDamageMap damages={damages} onAddDamage={handleAddDamage} />
              </div>

              <div className="lg:col-span-2 space-y-3 sm:space-y-6">
                {/* ... (Service Selection) ... */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Wrench size={18} className="text-blue-600" />
                    O que vamos fazer?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {/* ... (Multi Service Selection) ... */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5">Serviços a Realizar</label>
                      
                      <button 
                        onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                        className="w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between"
                      >
                        <span className="truncate text-xs sm:text-sm">
                            {selectedServiceIds.length > 0 
                                ? `${selectedServiceIds.length} serviço(s)` 
                                : 'Selecione os serviços...'}
                        </span>
                        <ChevronDown size={14} className="text-slate-400" />
                      </button>

                      {isServiceDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-40 sm:max-h-60 overflow-y-auto p-1 sm:p-2 space-y-0.5 sm:space-y-1">
                            {services.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => toggleService(s.id)}
                                    className={cn(
                                        "flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg cursor-pointer transition-colors",
                                        selectedServiceIds.includes(s.id) 
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                        selectedServiceIds.includes(s.id)
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "border-slate-300 dark:border-slate-600"
                                    )}>
                                        {selectedServiceIds.includes(s.id) && <Check size={12} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-sm font-medium truncate">{s.name}</p>
                                        <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400">{s.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                      )}

                      <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
                        {selectedServiceIds.map(id => {
                            const s = services.find(srv => srv.id === id);
                            if (!s) return null;
                            return (
                                <span key={id} className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[8px] sm:text-xs font-bold">
                                    <span className="truncate max-w-[100px] sm:max-w-none">{s.name}</span>
                                    <button onClick={() => toggleService(id)} className="hover:text-red-500 flex-shrink-0"><X size={10} /></button>
                                </span>
                            );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1.5">Valor Total (R$)</label>
                      <div className="relative">
                        <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">R$</span>
                        <input 
                            type="number"
                            value={servicePrice}
                            onChange={(e) => setServicePrice(Number(e.target.value))}
                            className="w-full pl-7 sm:pl-8 pr-2 sm:pr-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ... (Inventory & Signature) ... */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 sm:mb-4 text-sm sm:text-base">O que ficou no carro? (Inventário)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-4">
                    {Object.keys(inventory).filter(k => k !== 'pertences').map((key) => (
                      <label key={key} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input 
                          type="checkbox"
                          checked={(inventory as any)[key]}
                          onChange={(e) => setInventory({...inventory, [key]: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-[10px] sm:text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 sm:mt-4">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Outros Objetos</label>
                    <input 
                      type="text"
                      value={inventory.pertences}
                      onChange={(e) => setInventory({...inventory, pertences: e.target.value})}
                      placeholder="Ex: Óculos..."
                      className="w-full px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <PenTool size={18} className="text-blue-600" />
                    Acordo com o Cliente
                  </h3>
                  <button
                    onClick={() => setIsSignaturePadOpen(true)}
                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl h-24 sm:h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    {clientSignature ? (
                      <div className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2">
                        <CheckCircle2 size={20} /> Assinado Digitalmente
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-400 font-medium text-sm sm:text-base">Toque aqui para o cliente assinar</p>
                        <p className="text-xs text-slate-400 mt-1">Concordo com o estado do veículo descrito acima.</p>
                      </>
                    )}
                  </button>
                  {clientSignature && (
                    <img src={clientSignature} alt="Assinatura" className="w-full h-auto mt-3 sm:mt-4 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXECUTION (DIÁRIO DE OBRA + ESCOPO) */}
          {activeTab === 'execution' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* ... (Execution Content) ... */}
              <div className="lg:col-span-1 space-y-6">
                 {/* ... (Scope Checklist) ... */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ListTodo size={20} className="text-blue-600" />
                        Escopo do Serviço
                    </h3>
                    {/* ... */}
                    <div className="space-y-3">
                        {scopeList.length > 0 ? scopeList.map((item, idx) => (
                            <label key={item.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                item.completed 
                                    ? "bg-green-50 dark:bg-green-900/10 border-green-500" 
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            )}>
                                <input 
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => {
                                        const newList = [...scopeList];
                                        newList[idx].completed = !newList[idx].completed;
                                        setScopeList(newList);
                                    }}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className={cn(
                                        "text-sm font-bold block",
                                        item.completed ? "text-green-700 dark:text-green-400 line-through" : "text-slate-700 dark:text-slate-200"
                                    )}>
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                        {item.type === 'main' ? 'Principal' : 'Adicional'}
                                    </span>
                                </div>
                            </label>
                        )) : (
                            <div className="text-center py-8 text-slate-400">
                                <p>Nenhum item de escopo definido.</p>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* ... (Gallery) ... */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-purple-600" />
                        Galeria: Antes x Depois
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Antes (Avarias)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {beforePhotos.length > 0 ? beforePhotos.map((p, i) => (
                                    <img key={i} src={p.url} className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700" alt="Antes" />
                                )) : <p className="text-xs text-slate-400 italic">Sem fotos.</p>}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-slate-500 uppercase">Depois (Resultado)</p>
                                <label className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    <Plus size={12} /> Adicionar Foto
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment"
                                        className="hidden" 
                                        onChange={handleQuickAfterPhoto}
                                    />
                                </label>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {afterPhotos.length > 0 ? afterPhotos.map((p, i) => (
                                    <img key={i} src={p.url} className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700" alt="Depois" />
                                )) : <p className="text-xs text-slate-400 italic">Sem fotos.</p>}
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* COL 2 & 3: DIÁRIO DE BORDO */}
              <div className="lg:col-span-2 space-y-6">
                {/* ... (Daily Log) ... */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarClock size={20} className="text-blue-600" />
                    Diário de Bordo (Timeline)
                  </h3>
                  
                  <div className="flex gap-2 mb-6 items-start">
                    <div className="flex-1 space-y-2">
                        <input 
                        type="text"
                        value={newLogText}
                        onChange={(e) => setNewLogText(e.target.value)}
                        placeholder="O que foi feito agora? (Ex: Lixamento concluído)"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                        />
                        {newLogPhoto && (
                            <div className="relative w-20 h-20 group">
                                <img src={newLogPhoto} alt="Preview" className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                <button 
                                    onClick={() => setNewLogPhoto(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <label className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors h-10 w-10 flex items-center justify-center">
                        <Camera size={20} />
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={handleLogPhotoSelect}
                        />
                    </label>

                    <button 
                      onClick={handleAddLog}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 h-10"
                    >
                      Registrar
                    </button>
                  </div>

                  <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-8 max-h-[400px] overflow-y-auto pr-2">
                    {dailyLog.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[41px] bg-blue-600 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900" />
                        <p className="text-xs text-slate-400 mb-1">{new Date(log.date).toLocaleString('pt-BR')}</p>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-slate-800 dark:text-slate-200 text-sm mb-2">{log.description}</p>
                          {log.photos && log.photos.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                  {log.photos.map((photo, idx) => (
                                      <img key={idx} src={photo} alt="Log" className="w-24 h-24 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-600" />
                                  ))}
                              </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2 font-medium">Por: {log.author}</p>
                        </div>
                      </div>
                    ))}
                    {dailyLog.length === 0 && (
                      <div className="flex flex-col items-center py-8 text-slate-400">
                        <Smile size={32} className="mb-2 opacity-50" />
                        <p className="text-sm italic">Ainda não começamos o diário.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                    <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">Deixe o cliente tranquilo</h3>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                      Envie um link para ele acompanhar as fotos do serviço em tempo real. Isso gera confiança!
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSendTrackingLink}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 size={14} /> Enviar Link de Acompanhamento
                      </button>
                      <button 
                        onClick={handlePreviewTracking}
                        className="px-4 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        title="Ver o que o cliente vê"
                      >
                        <Eye size={14} /> Preview
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* ... (Rest of Tabs: Quality, Finance) ... */}
          {/* TAB: QUALITY (QA) */}
          {activeTab === 'quality' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Padrão Crystal Care</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Vamos garantir que o carro saia impecável?
                  </p>
                </div>

                <div className="space-y-4">
                  {qaList.map((item, idx) => (
                    <label key={item.id} className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      item.checked 
                        ? "border-green-500 bg-green-50 dark:bg-green-900/10" 
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        item.checked ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-slate-600"
                      )}>
                        {item.checked && <CheckCircle2 size={14} />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={item.checked}
                        onChange={() => {
                          const newList = [...qaList];
                          newList[idx].checked = !newList[idx].checked;
                          setQaList(newList);
                        }}
                      />
                      <div>
                        <p className={cn("font-bold", item.checked ? "text-green-800 dark:text-green-300" : "text-slate-700 dark:text-slate-300")}>
                          {item.label}
                        </p>
                        {item.required && <span className="text-xs text-red-500 font-medium uppercase">Obrigatório</span>}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {!canComplete && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                      <Lock size={18} />
                      <span className="text-sm font-bold">Opa! Falta conferir alguns itens obrigatórios.</span>
                    </div>
                  )}
                  <button 
                    disabled={!canComplete}
                    onClick={() => handleStatusChange('Entregue')}
                    className="w-full py-4 bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition-all"
                  >
                    Aprovar Qualidade e Liberar
                  </button>
                </div>
              </div>

              {/* NPS Section (Only visible if Delivered) */}
              {workOrder.status === 'Entregue' && (
                <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center animate-in slide-in-from-bottom">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Avaliação do Cliente (NPS)</h3>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                      <button
                        key={score}
                        onClick={() => handleNPS(score)}
                        className={cn(
                          "w-8 h-8 rounded-full font-bold text-sm transition-all",
                          npsScore === score 
                            ? "bg-blue-600 text-white scale-110" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  {npsScore !== null && (
                    <p className="text-sm text-green-600 font-bold animate-in fade-in">
                      Nota {npsScore} registrada! Obrigado.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Resumo Financeiro
                </h3>
                
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Serviço (Tabela)</span>
                    <span>{formatCurrency(servicePrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Peças/Extras</span>
                    <span>{formatCurrency(currentExtrasTotal)}</span>
                    </div>
                </div>

                {/* CAMPAIGN ATTRIBUTION (NEW) */}
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Megaphone size={16} className="text-purple-600" />
                        Origem / Campanha
                    </h4>
                    <div className="relative">
                        <select 
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">Selecione a origem...</option>
                            {campaigns.filter(c => c.status !== 'draft').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Vincule este serviço a uma campanha para calcular o ROI.
                        </p>
                    </div>
                </div>

                {/* DISCOUNT SECTION */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag size={16} className="text-blue-600" />
                    Aplicar Desconto
                  </h4>
                  
                  <div className="space-y-3">
                    {/* VOUCHER INPUT */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Código Promocional (Voucher)</label>
                        <div className="relative">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            placeholder="Ex: DESC-1234"
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white uppercase"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleApplyVoucher}
                        disabled={!voucherCode}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        Aplicar
                      </button>
                    </div>

                    {appliedVoucher && (
                      <div className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Voucher {appliedVoucher} aplicado com sucesso!
                      </div>
                    )}

                    <div className="border-t border-slate-200 dark:border-slate-700 my-3"></div>

                    <div className="flex gap-2">
                      {(['percentage', 'value', 'service'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => {setDiscountType(type); setDiscountAmount(0);}}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                            discountType === type
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          )}
                        >
                          {type === 'percentage' ? '%' : type === 'value' ? 'R$' : 'Serviço'}
                        </button>
                      ))}
                    </div>

                    {discountType === 'percentage' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Porcentagem de Desconto</label>
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white"
                            placeholder="Ex: 10"
                          />
                          <span className="py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300">%</span>
                        </div>
                        {discountAmount > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Desconto: {formatCurrency((servicePrice + currentExtrasTotal) * (discountAmount / 100))}</p>
                        )}
                      </div>
                    )}

                    {discountType === 'value' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Valor de Desconto (R$)</label>
                        <div className="flex gap-2">
                          <span className="py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300">R$</span>
                          <input 
                            type="number"
                            min="0"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(Number(e.target.value))}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white"
                            placeholder="Ex: 50.00"
                          />
                        </div>
                      </div>
                    )}

                    {discountType === 'service' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Motivo do Desconto</label>
                        <input 
                          type="text"
                          value={discountDescription}
                          onChange={(e) => setDiscountDescription(e.target.value)}
                          placeholder="Ex: Cliente VIP, Cortesia..."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                        />
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 mt-2">Valor a Descontar (R$)</label>
                        <input 
                          type="number"
                          min="0"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white"
                          placeholder="Ex: 100.00"
                        />
                      </div>
                    )}

                    {discountAmount > 0 && (
                      <button
                        onClick={() => {setDiscountAmount(0); setDiscountDescription(''); setAppliedVoucher(null); setVoucherCode('');}}
                        className="w-full py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Remover Desconto
                      </button>
                    )}
                  </div>
                </div>

                {/* --- GAMIFICATION SECTION --- */}
                {selectedClientId && companySettings.gamification?.enabled && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-sm">
                        <Trophy size={18} className="text-indigo-600" />
                        Programa de Fidelidade
                      </h4>
                      <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded text-indigo-600 border border-indigo-100 dark:border-indigo-800">
                        {currentPoints} pontos disponíveis
                      </span>
                    </div>

                    <div className="space-y-3">
                      {getRewardsByLevel(currentTierId).map(reward => {
                        const canClaim = currentPoints >= reward.requiredPoints;
                        const missing = reward.requiredPoints - currentPoints;
                        const progress = Math.min(100, (currentPoints / reward.requiredPoints) * 100);

                        // Helper to claim and apply immediately
                        const handleClaimAndApply = async () => {
                            const confirm = await showConfirm({
                                title: 'Resgatar Recompensa',
                                message: `Deseja trocar ${reward.requiredPoints} pontos por "${reward.name}" e aplicar nesta OS agora?`,
                                confirmText: 'Sim, Resgatar e Aplicar'
                            });

                            if (confirm) {
                                const result = claimReward(selectedClientId, reward.id);
                                if (result.success && result.voucherCode) {
                                    setVoucherCode(result.voucherCode);
                                    // Apply discount logic immediately
                                    const details = getVoucherDetails(result.voucherCode);
                                    if (details && details.reward) {
                                        if (details.reward.rewardType === 'discount') {
                                            setDiscountType('percentage');
                                            setDiscountAmount(details.reward.percentage || 0);
                                            setDiscountDescription(`Fidelidade: ${reward.name}`);
                                        } else if (details.reward.rewardType === 'service' || details.reward.rewardType === 'free_service') {
                                            setDiscountType('service');
                                            setDiscountAmount(servicePrice); 
                                            setDiscountDescription(`Fidelidade: ${reward.gift || reward.name}`);
                                        }
                                        setAppliedVoucher(result.voucherCode);
                                        await showAlert({ title: 'Sucesso', message: 'Pontos resgatados e desconto aplicado!', type: 'success' });
                                    }
                                } else {
                                    await showAlert({ title: 'Erro', message: result.message, type: 'danger' });
                                }
                            }
                        };

                        return (
                          <div key={reward.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{reward.name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{reward.description}</p>
                              </div>
                              {canClaim ? (
                                 <button
                                   onClick={handleClaimAndApply}
                                   disabled={!!appliedVoucher} // Disable if a voucher is already applied
                                   className="px-3 py-1.5 bg-green-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1 whitespace-nowrap"
                                 >
                                   <Gift size={12} /> Usar Agora
                                 </button>
                              ) : (
                                 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap">
                                   Faltam {missing} pts
                                 </span>
                              )}
                            </div>
                            {/* Progress Bar for locked rewards */}
                            {!canClaim && (
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {getRewardsByLevel(currentTierId).length === 0 && (
                        <p className="text-xs text-center text-slate-500 italic">Nenhuma recompensa disponível para o nível {clientTierConfig?.name}.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* FINAL TOTALS */}
                <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Subtotal</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(displaySubtotal)}</span>
                    </div>
                    {displayDiscount > 0 && (
                      <div className="flex justify-between py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                            <Tag size={12} />
                            Desconto ({discountDescription || (discountType === 'percentage' ? discountAmount + '%' : 'Valor')})
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">-{formatCurrency(displayDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <span className="font-bold text-lg text-slate-900 dark:text-white">Total Final</span>
                      <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                        {formatCurrency(displayTotal)}
                      </span>
                    </div>
                </div>

                {/* --- PAYMENT SECTION --- */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <CreditCard size={18} className="text-green-600" />
                        Registro de Pagamento
                    </h4>
                    
                    {isPaid ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Pago com sucesso
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Via {paymentMethod} em {new Date(paymentDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <button 
                                onClick={handleUndoPayment} 
                                className="text-xs text-slate-500 hover:text-red-500 underline"
                            >
                                Desfazer
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Método</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                                    >
                                        <option value="Pix">Pix</option>
                                        <option value="Cartão Crédito">Cartão Crédito</option>
                                        <option value="Cartão Débito">Cartão Débito</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Transferência">Transferência</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data</label>
                                    <input 
                                        type="date" 
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleRegisterPayment}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <DollarSign size={16} /> Confirmar Recebimento
                            </button>
                        </div>
                    )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
