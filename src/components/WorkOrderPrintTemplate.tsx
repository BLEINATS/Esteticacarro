import React from 'react';
import { WorkOrder, Client, ServiceCatalogItem } from '../types';
import { formatCurrency } from '../lib/utils';

interface WorkOrderPrintTemplateProps {
  workOrder: WorkOrder;
  client?: Client;
  service?: ServiceCatalogItem;
}

export default function WorkOrderPrintTemplate({ workOrder, client, service }: WorkOrderPrintTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white text-black">
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-300 pb-6">
        <h1 className="text-4xl font-bold mb-2">ORDEM DE SERVIÇO</h1>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold">Oficina: Cristal Care Auto Detail</p>
            <p className="text-sm">Endereço: [Endereço da Oficina]</p>
            <p className="text-sm">Telefone: [Telefone]</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">OS #{workOrder.id}</p>
            <p className="text-sm text-gray-600">Data: {formatDate(workOrder.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Client & Vehicle Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Client Info */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg mb-3 border-b pb-2">CLIENTE</h3>
          {client ? (
            <>
              <p><span className="font-semibold">Nome:</span> {client.name}</p>
              <p><span className="font-semibold">Telefone:</span> {client.phone}</p>
              <p><span className="font-semibold">Email:</span> {client.email}</p>
              {client.address && <p><span className="font-semibold">Endereço:</span> {client.address}</p>}
            </>
          ) : (
            <p className="text-gray-500">Dados do cliente não disponíveis</p>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg mb-3 border-b pb-2">VEÍCULO</h3>
          <p><span className="font-semibold">Modelo:</span> {workOrder.vehicle}</p>
          <p><span className="font-semibold">Placa:</span> {workOrder.plate}</p>
          <p><span className="font-semibold">Status:</span> {workOrder.status}</p>
          <p><span className="font-semibold">Técnico:</span> {workOrder.technician}</p>
        </div>
      </div>

      {/* Services */}
      <div className="mb-8 border border-gray-300 p-4 rounded">
        <h3 className="font-bold text-lg mb-3 border-b pb-2">SERVIÇOS SOLICITADOS</h3>
        <p className="text-lg mb-3">{workOrder.service}</p>
        {workOrder.damages && workOrder.damages.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold mb-2">Danos Identificados:</p>
            <ul className="list-disc pl-5 space-y-1">
              {workOrder.damages.map(damage => (
                <li key={damage.id} className="text-sm">
                  {damage.area.toUpperCase()}: {damage.description} ({damage.type})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Vehicle Inventory */}
      {workOrder.vehicleInventory && (
        <div className="mb-8 border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg mb-3 border-b pb-2">INVENTÁRIO DO VEÍCULO</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>Estepe: {workOrder.vehicleInventory.estepe ? '✓ Presente' : '✗ Ausente'}</p>
            <p>Macaco: {workOrder.vehicleInventory.macaco ? '✓ Presente' : '✗ Ausente'}</p>
            <p>Chave de Roda: {workOrder.vehicleInventory.chaveRoda ? '✓ Presente' : '✗ Ausente'}</p>
            <p>Tapetes: {workOrder.vehicleInventory.tapetes ? '✓ Presente' : '✗ Ausente'}</p>
            <p>Manual: {workOrder.vehicleInventory.manual ? '✓ Presente' : '✗ Ausente'}</p>
            <p>Antena: {workOrder.vehicleInventory.antena ? '✓ Presente' : '✗ Ausente'}</p>
          </div>
          {workOrder.vehicleInventory.pertences && (
            <p className="text-sm mt-3">
              <span className="font-semibold">Pertences Guardados:</span> {workOrder.vehicleInventory.pertences}
            </p>
          )}
        </div>
      )}

      {/* Additional Items */}
      {workOrder.additionalItems && workOrder.additionalItems.length > 0 && (
        <div className="mb-8 border border-gray-300 p-4 rounded">
          <h3 className="font-bold text-lg mb-3 border-b pb-2">ITENS ADICIONAIS</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Descrição</th>
                <th className="text-right pb-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {workOrder.additionalItems.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.description}</td>
                  <td className="text-right py-2">{formatCurrency(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Summary */}
      <div className="mb-8 border-2 border-gray-300 p-4 rounded bg-gray-50">
        <h3 className="font-bold text-lg mb-4 border-b pb-2">RESUMO FINANCEIRO</h3>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span>Valor Total:</span>
            <span className="font-bold text-xl text-blue-600">{formatCurrency(workOrder.totalValue)}</span>
          </div>
          {workOrder.insuranceDetails?.isInsurance && (
            <>
              <div className="flex justify-between text-sm border-t pt-2">
                <span>Cobertura Seguro:</span>
                <span>{formatCurrency(workOrder.insuranceDetails.insuranceCoveredAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Franquia:</span>
                <span>{formatCurrency(workOrder.insuranceDetails.deductibleAmount || 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mb-8 text-xs text-gray-600 border border-gray-300 p-4 rounded bg-gray-50">
        <h3 className="font-bold mb-2">TERMOS E CONDIÇÕES</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>O cliente autoriza os reparos descritos nesta OS</li>
          <li>Fotos antes e depois serão tiradas para documentação</li>
          <li>Qualquer dano adicional encontrado durante o serviço será informado ao cliente</li>
          <li>Prazo estimado: {workOrder.deadline}</li>
          <li>A oficina não se responsabiliza por pertences deixados no veículo</li>
        </ul>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-12">
        <div className="text-center border-t border-gray-400 pt-4">
          <p className="text-sm font-semibold">Assinatura do Cliente</p>
          <p className="text-xs text-gray-600">__________________</p>
        </div>
        <div className="text-center border-t border-gray-400 pt-4">
          <p className="text-sm font-semibold">Assinatura do Técnico</p>
          <p className="text-xs text-gray-600">__________________</p>
        </div>
        <div className="text-center border-t border-gray-400 pt-4">
          <p className="text-sm font-semibold">Data</p>
          <p className="text-xs text-gray-600">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Obrigado por confiar em nossos serviços!</p>
        <p>Cristal Care Auto Detail - Estética Automotiva e Funilaria</p>
      </div>
    </div>
  );
}
