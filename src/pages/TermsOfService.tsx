import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Scale, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <span className="font-bold text-lg">Cristal Care ERP</span>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12">
          <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="prose dark:prose-invert max-w-none space-y-8 text-sm sm:text-base">
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <FileText className="text-blue-600" size={24} />
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e utilizar o sistema Cristal Care ERP ("Serviço"), você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, você não deve utilizar nosso Serviço.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <Scale className="text-blue-600" size={24} />
                2. Descrição do Serviço
              </h2>
              <p>
                O Cristal Care ERP é uma plataforma SaaS (Software as a Service) projetada para gestão de estéticas automotivas e funilarias. O Serviço inclui, mas não se limita a, gestão de ordens de serviço, controle de estoque, CRM, gestão financeira e agendamento.
              </p>
              <p className="mt-2">
                Reservamo-nos o direito de modificar ou descontinuar, temporária ou permanentemente, o Serviço (ou qualquer parte dele) com ou sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Contas e Registro</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Você deve fornecer informações precisas e completas ao criar sua conta.</li>
                <li>Você é responsável por manter a segurança de sua senha e conta.</li>
                <li>A Cristal Care não se responsabiliza por qualquer perda ou dano decorrente do seu não cumprimento desta obrigação de segurança.</li>
                <li>Você é responsável por todo o conteúdo postado e atividades que ocorram sob sua conta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Pagamento e Assinatura</h2>
              <p>
                O Serviço é cobrado antecipadamente em base mensal ou anual e não é reembolsável. Não haverá reembolsos ou créditos por meses parciais de serviço, reembolsos de upgrade/downgrade, ou reembolsos por meses não utilizados com uma conta aberta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Cancelamento e Rescisão</h2>
              <p>
                Você é o único responsável pelo cancelamento adequado da sua conta. Um pedido de cancelamento por e-mail ou telefone não é considerado cancelamento. Você pode cancelar sua conta a qualquer momento através do painel de configurações do sistema.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <AlertCircle className="text-blue-600" size={24} />
                6. Limitação de Responsabilidade
              </h2>
              <p>
                Você entende e concorda expressamente que a Cristal Care não será responsável por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou exemplares, incluindo, mas não se limitando a, danos por perda de lucros, boa vontade, uso, dados ou outras perdas intangíveis resultantes do uso ou da incapacidade de usar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">7. Alterações nos Termos</h2>
              <p>
                Podemos revisar estes Termos de Uso de tempos em tempos. A versão mais atual estará sempre disponível em nosso site. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.
              </p>
            </section>

            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
              <p className="text-sm text-slate-500">
                Dúvidas sobre os termos? Entre em contato conosco em <a href="mailto:legal@cristalcare.com" className="text-blue-600 hover:underline">legal@cristalcare.com</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
