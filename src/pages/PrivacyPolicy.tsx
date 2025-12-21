import React from 'react';
import { ArrowLeft, Lock, Eye, Database, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSuperAdmin } from '../context/SuperAdminContext';

export default function PrivacyPolicy() {
  const { saasSettings } = useSuperAdmin();
  const platformName = saasSettings?.platformName || 'Cristal Care ERP';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <span className="font-bold text-lg">{platformName}</span>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12">
          <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="prose dark:prose-invert max-w-none space-y-8 text-sm sm:text-base">
            <section>
              <p>
                A sua privacidade é importante para nós. É política da {platformName} respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no sistema {platformName} e outros sites que possuímos e operamos.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <Database className="text-blue-600" size={24} />
                1. Informações que Coletamos
              </h2>
              <p>
                Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Dados de Cadastro:</strong> Nome, e-mail, telefone, nome da empresa, CNPJ/CPF.</li>
                <li><strong>Dados de Uso:</strong> Informações sobre como você interage com nosso serviço, logs de acesso e preferências.</li>
                <li><strong>Dados de Clientes:</strong> Informações que você insere no sistema sobre seus clientes (nome, veículo, telefone) são armazenadas de forma segura e são de sua propriedade exclusiva.</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <Eye className="text-blue-600" size={24} />
                2. Uso das Informações
              </h2>
              <p>
                Utilizamos as informações coletadas para:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Fornecer, operar e manter nosso serviço;</li>
                <li>Melhorar, personalizar e expandir nosso serviço;</li>
                <li>Entender e analisar como você usa nosso serviço;</li>
                <li>Desenvolver novos produtos, serviços, características e funcionalidades;</li>
                <li>Comunicar com você, diretamente ou através de um dos nossos parceiros, para atendimento ao cliente, atualizações e fins de marketing.</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <Lock className="text-blue-600" size={24} />
                3. Segurança dos Dados
              </h2>
              <p>
                Valorizamos sua confiança em nos fornecer suas informações pessoais, portanto, estamos nos esforçando para usar meios comercialmente aceitáveis de protegê-las. Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <Globe className="text-blue-600" size={24} />
                4. Compartilhamento de Dados
              </h2>
              <p>
                Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei ou para prestadores de serviços essenciais (como processamento de pagamentos e hospedagem em nuvem), que são obrigados a manter a confidencialidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Seus Direitos (LGPD)</h2>
              <p>
                Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados. Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais a qualquer momento.
              </p>
            </section>

            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
              <p className="text-sm text-slate-500">
                Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco em <a href={`mailto:${saasSettings.supportEmail}`} className="text-blue-600 hover:underline">{saasSettings.supportEmail}</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
