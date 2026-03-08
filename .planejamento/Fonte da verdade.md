SIGESS/
│
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── .eslintignore
├── components.json
├── vercel.json
├── README.md
│
├── supabase/
│   └── config.toml
│
├── public/
│   └── fonts/
│       ├── calibri.ttf
│       ├── calibri-bold.ttf
│       ├── calibri-italic.ttf
│       └── calibri-bold-italic.ttf
│
└── src/
    ├── main.tsx
    ├── vite-env.d.ts
    │
    ├── app/
    │   ├── providers/
    │   │   └── AppProviders.tsx          ← QueryClientProvider + ThemeProvider + AuthProvider (do modules/auth/context/) + Toaster
    │   ├── router/
    │   │   └── index.tsx                 ← React.lazy de todas as pages + rotas + ErrorBoundary
    │   └── styles/
    │       ├── globals.css               ← Tailwind directives + reset
    │       └── themes.css                ← CSS custom properties: tokens de cor claro/escuro
    │
    ├── pages/
    │   ├── Login/
    │   │   └── index.tsx
    │   ├── Dashboard/
    │   │   └── index.tsx
    │   ├── Members/
    │   │   └── index.tsx
    │   ├── Registration/
    │   │   └── index.tsx
    │   ├── Documents/
    │   │   └── index.tsx
    │   ├── Reports/
    │   │   └── index.tsx
    │   ├── Settings/
    │   │   └── index.tsx
    │   └── NotFound/
    │       └── index.tsx
    │
    ├── modules/
    │   │
    │   ├── auth/
    │   │   ├── components/
    │   │   │   ├── AuthLayout.tsx              ← layout centrado com logo e card
    │   │   │   ├── LoginForm.tsx               ← campos email/senha, loading, erro do Supabase
    │   │   │   ├── AnimatedBackground.tsx
    │   │   │   └── AnimatedBackground.css
    │   │   ├── hooks/
    │   │   │   ├── useLogin.ts                 ← chama authService, armazena atividade, navega
    │   │   │   └── useIdleTimeout.ts           ← timeout 30min, BroadcastChannel, visibilitychange
    │   │   ├── services/
    │   │   │   └── authService.ts              ← signIn, signOut, getSession, updatePassword, createUser
    │   │   ├── context/
    │   │   │   └── AuthContext.tsx             ← AuthProvider + useAuth hook
    │   │   └── types/
    │   │       └── auth.types.ts
    │   │
    │   ├── dashboard/
    │   │   ├── components/
    │   │   │   ├── StatCard.tsx                ← card com ícone, valor e variação
    │   │   │   ├── BirthdayList.tsx            ← aniversariantes do mês com destaque no dia atual
    │   │   │   ├── RecentMembersList.tsx        ← últimos 10 cadastros, clicável para edição
    │   │   │   └── DashboardMemberCard.tsx     ← card de membro nas listas do dashboard
    │   │   ├── hooks/
    │   │   │   ├── useDashboardData.ts         ← queries paralelas: stats, aniversários, recentes
    │   │   │   └── useDashboardRefresh.ts      ← invalida cache do dashboard
    │   │   ├── services/
    │   │   │   └── dashboardService.ts         ← queries agregadas em Promise.all
    │   │   └── queryKeys.ts
    │   │
    │   ├── settings/
    │   │   ├── components/
    │   │   │   ├── navigation/
    │   │   │   │   └── SettingsTabsNav.tsx     ← tabs: Dados, Entidade, Parâmetros, Senhas
    │   │   │   ├── entity/
    │   │   │   │   ├── EntityForm.tsx          ← formulário container da tab Entidade
    │   │   │   │   ├── EntityBasicInfo.tsx     ← nome completo, nome abreviado, CNPJ
    │   │   │   │   ├── EntityAddress.tsx       ← endereço completo
    │   │   │   │   ├── EntityContact.tsx       ← telefones e email
    │   │   │   │   └── EntityInstitutional.tsx ← federação, confederação, polo, fundação, comarca
    │   │   │   ├── parameters/
    │   │   │   │   ├── ParametersForm.tsx      ← formulário container da tab Parâmetros
    │   │   │   │   ├── ParametersFormHeader.tsx
    │   │   │   │   ├── FishingPeriodsSection.tsx ← dois períodos de defeso (início e fim)
    │   │   │   │   └── PublicationSection.tsx  ← número/data de publicação, área de pesca
    │   │   │   ├── data/
    │   │   │   │   ├── LocalitiesCard.tsx      ← lista localidades + botão adicionar
    │   │   │   │   ├── DocumentsCard.tsx       ← gerencia templates PDF (upload, ativar)
    │   │   │   │   ├── ImportExportCard.tsx    ← importar/exportar CSV de membros
    │   │   │   │   └── PhotoImportCard.tsx     ← entry point para importação em massa de fotos (acessado via aba Dados em Configurações)
    │   │   │   │   └── dialogs/
    │   │   │   │       ├── LocalityManagementDialog.tsx
    │   │   │   │       ├── ImportDialog.tsx    ← preview CSV antes de confirmar
    │   │   │   │       └── ExportDialog.tsx    ← opções de formato e filtros
    │   │   │   └── passwords/
    │   │   │       ├── UserManagementSection.tsx ← listagem de usuários, reset senha, desativar
    │   │   │       ├── PasswordChangeForm.tsx  ← senha atual, nova, confirmação
    │   │   │       └── dialogs/
    │   │   │           ├── CreateUserDialog.tsx
    │   │   │           └── ResetPasswordDialog.tsx
    │   │   ├── hooks/
    │   │   │   ├── useEntityData.ts            ← carrega/persiste entidade (singleton: always update)
    │   │   │   ├── useEntityValidation.ts      ← validação de CNPJ, email, CEP da entidade
    │   │   │   ├── useParametersData.ts        ← carrega/persiste parâmetros (singleton: always update)
    │   │   │   ├── useLocalitiesData.ts        ← CRUD localidades
    │   │   │   ├── usePasswordChange.ts        ← alteração de senha via Supabase Auth
    │   │   │   └── useDataManagement.ts        ← importação/exportação de CSV
    │   │   ├── services/
    │   │   │   └── settingsService.ts          ← entidade, parâmetros, localidades, templates, usuários
    │   │   └── types/
    │   │       └── settings.types.ts
    │   │
    │   ├── members/
    │   │   ├── components/
    │   │   │   ├── MemberStatusBadge.tsx       ← badge colorido de situação (usado em table e modal)
    │   │   │   ├── table/
    │   │   │   │   ├── MembersTableContainer.tsx  ← wrapper externo com paginação
    │   │   │   │   ├── MembersTableHeader.tsx     ← cabeçalho com colunas ordenáveis
    │   │   │   │   ├── MembersTableBody.tsx       ← delega para feedback quando necessário
    │   │   │   │   ├── MembersTableRow.tsx        ← linha individual
    │   │   │   │   ├── MembersTableActions.tsx    ← dropdown: ver, editar, excluir, documentos
    │   │   │   │   ├── MembersTablePagination.tsx ← controles de paginação da tabela
    │   │   │   │   ├── cells/
    │   │   │   │   │   ├── MemberBasicInfoCell.tsx  ← foto 40×40 + nome (fallback com inicial)
    │   │   │   │   │   ├── MemberCpfCell.tsx
    │   │   │   │   │   ├── MemberDateCell.tsx       ← data em DD/MM/YYYY
    │   │   │   │   │   └── MemberStatusCell.tsx     ← usa MemberStatusBadge
    │   │   │   │   └── feedback/
    │   │   │   │       ├── TableLoadingState.tsx    ← 10 linhas Skeleton (carregamento inicial)
    │   │   │   │       ├── TableEmptyState.tsx      ← diferencia "sem membros" de "sem resultados"
    │   │   │   │       └── TableErrorState.tsx      ← mensagem de erro + retry
    │   │   │   ├── modal/
    │   │   │   │   ├── MemberDetailsModal.tsx       ← modal principal com tabs e ações
    │   │   │   │   ├── MemberModalHeader.tsx        ← foto, nome, código, badge de situação
    │   │   │   │   ├── MemberModalActions.tsx       ← botões Editar, Excluir, Gerar Documentos
    │   │   │   │   ├── sections/
    │   │   │   │   │   ├── PersonalInfoSection.tsx      ← nome, nascimento, filiação, sexo, etc.
    │   │   │   │   │   ├── AddressContactSection.tsx    ← endereço completo e contatos
    │   │   │   │   │   ├── MemberDocumentsSection.tsx   ← CPF, RG, título, NIT, CAEPF, RGP, etc.
    │   │   │   │   │   └── MemberExternalRefsSection.tsx ← links externos (INSS, gov.br)
    │   │   │   │   └── tabs/
    │   │   │   │       ├── PrimaryInfoTab.tsx           ← dados principais (seções pessoal + endereço)
    │   │   │   │       └── ComplementaryInfoTab.tsx     ← dados complementares (documentos)
    │   │   │   ├── registration/
    │   │   │   │   ├── RegistrationForm.tsx             ← formulário principal: novo e edição
    │   │   │   │   ├── RegistrationActions.tsx          ← botões Salvar/Cancelar com loading
    │   │   │   │   ├── RegistrationTabs.tsx             ← navegação entre as duas abas
    │   │   │   │   └── tabs/
    │   │   │   │       ├── PersonalDataTabContent.tsx   ← conteúdo da aba dados pessoais
    │   │   │   │       ├── PersonalDataGrid.tsx         ← grid responsivo dos campos
    │   │   │   │       ├── PersonalDataHeader.tsx       ← título + indicadores de obrigatórios
    │   │   │   │       ├── DocumentsTabContent.tsx      ← conteúdo da aba documentos
    │   │   │   │       └── RegistrationTabTransition.tsx ← animação Framer Motion entre abas
    │   │   │   ├── forms/
    │   │   │   │   ├── PersonalInfoForm.tsx             ← nome, apelido, nascimento, filiação, sexo...
    │   │   │   │   ├── AddressForm.tsx                  ← endereço + busca CEP automática (ViaCEP)
    │   │   │   │   ├── MemberDocumentsForm.tsx          ← documentos pessoais e profissionais
    │   │   │   │   ├── MembershipInfoForm.tsx           ← código (read-only), admissão, localidade
    │   │   │   │   └── MemberPhotoSection.tsx           ← upload, preview, drag-drop, remover
    │   │   │   ├── filters/
    │   │   │   │   ├── FilterPanel.tsx                  ← painel lateral/modal com todos os filtros
    │   │   │   │   ├── FilterSection.tsx                ← seção individual de filtro
    │   │   │   │   └── FilterActions.tsx                ← Aplicar / Limpar + contador de ativos
    │   │   │   ├── search/
    │   │   │   │   ├── SearchBar.tsx                    ← campo de busca com limpar e hint de tipo
    │   │   │   │   └── SearchTypeHint.tsx               ← exibe tipo detectado (nome / CPF / RG)
    │   │   │   └── dialogs/
    │   │   │       ├── MemberDeleteDialog.tsx           ← confirmação com aviso de exclusão de foto
    │   │   │       ├── EditConfirmDialog.tsx            ← avisa sobre dados não salvos ao sair
    │   │   │       └── PhotoFullscreenModal.tsx         ← foto ampliada com botão fechar
    │   │   ├── hooks/
    │   │   │   ├── data/
    │   │   │   │   ├── useMemberData.ts          ← listagem paginada com filtros (staleTime: 0)
    │   │   │   │   ├── useMemberCache.ts         ← invalida cache após create/update/delete
    │   │   │   │   └── useMemberDataLoader.ts    ← carrega membro específico por ID para edição
    │   │   │   ├── search/
    │   │   │   │   ├── useMemberSearch.ts        ← detecção automática de tipo (nome/CPF/RG)
    │   │   │   │   └── useSearchDebounce.ts      ← debounce 300ms na entrada de busca
    │   │   │   ├── edit/
    │   │   │   │   ├── useMemberEdit.ts          ← estado: modo visualização vs edição
    │   │   │   │   ├── useMemberSave.ts          ← update com tratamento de DUPLICATE_CPF
    │   │   │   │   └── useMemberActions.ts       ← abrir modal, editar, excluir, ir para docs
    │   │   │   ├── filters/
    │   │   │   │   └── useMemberFilters.ts       ← estado dos filtros, aplicar, limpar, contador
    │   │   │   └── registration/
    │   │   │       ├── useRegistrationForm.ts          ← React Hook Form + schema Zod completo
    │   │   │       ├── useRegistrationFormDefaults.ts  ← defaults: cidade, UF, profissão, etc.
    │   │   │       ├── useRegistrationFormValidation.ts ← CPF algoritmo, data passada, email
    │   │   │       ├── useRegistrationFormTransform.ts ← form data → banco (masks, mapping)
    │   │   │       ├── useRegistrationState.ts         ← carregando, salvando, novo vs edição
    │   │   │       ├── useRegistrationSubmit.ts        ← valida → transforma → salva → foto → cache
    │   │   │       ├── usePhotoUpload.ts               ← upload para Storage via photoService
    │   │   │       └── usePhotoManager.ts              ← estado da foto no formulário
    │   │   ├── services/
    │   │   │   ├── memberService.ts              ← CRUD completo + busca paginada + filtros
    │   │   │   └── memberDataTransformer.ts      ← banco ↔ formulário (datas, máscaras, campos)
    │   │   ├── types/
    │   │   │   └── member.types.ts               ← Member, MemberFormData, MemberFilters, etc.
    │   │   └── queryKeys.ts
    │   │
    │   ├── reports/
    │   │   ├── components/
    │   │   │   ├── ReportFilters.tsx             ← painel de filtros compartilhado entre relatórios
    │   │   │   ├── ReportTable.tsx               ← tabela base de relatório com export
    │   │   │   ├── ReportSummary.tsx             ← totalizadores e resumo estatístico
    │   │   │   ├── ReportExportButtons.tsx       ← botões exportar PDF e Excel
    │   │   │   └── gerid/
    │   │   │       ├── GeridReport.tsx           ← componente raiz do relatório GERID
    │   │   │       ├── GeridTable.tsx
    │   │   │       ├── GeridChart.tsx            ← gráfico de evolução
    │   │   │       ├── GeridLegend.tsx
    │   │   │       ├── GeridPagination.tsx
    │   │   │       └── sections/
    │   │   │           ├── GeridFiltersSection.tsx
    │   │   │           ├── GeridSummarySection.tsx
    │   │   │           └── GeridTableSection.tsx
    │   │   ├── hooks/
    │   │   │   ├── useMembersReport.ts           ← query membros com filtros para relatório
    │   │   │   ├── useRequestsReport.ts          ← query requerimentos INSS para GERID
    │   │   │   └── useReportExport.ts            ← geração PDF e Excel
    │   │   ├── services/
    │   │   │   └── reportsService.ts
    │   │   └── queryKeys.ts
    │   │
    │   ├── documents/
    │   │   ├── components/
    │   │   │   ├── navigation/
    │   │   │   │   ├── DocumentsHeader.tsx       ← título da página + seletor de membro
    │   │   │   │   ├── DocumentsTabs.tsx         ← navegação entre tipos de documento
    │   │   │   │   └── DocumentsTabsList.tsx
    │   │   │   ├── member-selector/
    │   │   │   │   ├── MemberSelect.tsx          ← select/autocomplete para escolher membro
    │   │   │   │   ├── MemberSearch.tsx          ← campo de busca dentro do seletor
    │   │   │   │   ├── MemberAutocomplete.tsx    ← lista de sugestões ao digitar
    │   │   │   │   ├── MemberSelectorCard.tsx    ← card de membro na lista de sugestões
    │   │   │   │   └── MemberInfoBar.tsx         ← barra com foto e dados do membro selecionado
    │   │   │   └── templates/
    │   │   │       ├── inss-request/
    │   │   │       │   ├── InssRequestDocument.tsx      ← componente raiz com 3 tabs
    │   │   │       │   ├── ApplicantPhotoDisplay.tsx    ← foto do requerente no formulário
    │   │   │       │   └── tabs/
    │   │   │       │       ├── ApplicantTab.tsx         ← dados do requerente (editáveis)
    │   │   │       │       ├── FishingPeriodTab.tsx     ← períodos de defeso (editáveis)
    │   │   │       │       └── DocumentPreviewTab.tsx   ← gerar PDF, preview, download, histórico
    │   │   │       ├── residence-declaration/
    │   │   │       │   ├── ResidenceDeclaration.tsx     ← componente raiz
    │   │   │       │   ├── ResidenceForm.tsx            ← endereço, data, testemunhas
    │   │   │       │   └── ResidencePdf.tsx             ← geração e preview do PDF
    │   │   │       └── representation-term/
    │   │   │           ├── RepresentationTerm.tsx       ← componente raiz
    │   │   │           ├── TermForm.tsx                 ← representado (auto) + representante (manual)
    │   │   │           └── TermPdf.tsx                  ← geração e preview do PDF
    │   │   ├── hooks/
    │   │   │   ├── useInssDocuments.ts           ← orquestra fluxo INSS: membro + parâmetros + form
    │   │   │   ├── useRequestFormManagement.ts   ← estado do form com edições inline
    │   │   │   ├── useRequestSave.ts             ← persiste requerimento em reqinss
    │   │   │   ├── useRequestDelete.ts           ← exclui requerimento do histórico
    │   │   │   ├── useExistingRequests.ts        ← lista requerimentos do membro selecionado
    │   │   │   ├── usePdfGeneration.ts           ← busca template → preenche → download/preview
    │   │   │   ├── usePdfTemplates.ts            ← templates disponíveis por tipo
    │   │   │   └── useMultiDocumentGeneration.ts ← gera INSS + Residência + Termo combinados
    │   │   ├── services/
    │   │   │   ├── documentService.ts            ← CRUD reqinss, busca por membro, templates
    │   │   │   └── pdf/
    │   │   │       ├── pdfService.ts             ← orquestrador: carrega template, embeda fontes, preenche
    │   │   │       ├── pdfFormFiller.ts          ← preenche TextField, CheckBox, Dropdown
    │   │   │       ├── pdfDataProcessor.ts       ← prepara dados do domínio para o filler
    │   │   │       ├── pdfCombiner.ts            ← combina múltiplos Uint8Array em um PDF
    │   │   │       ├── pdfFieldMappings.ts       ← chave=campo no PDF; valor=path no objeto de dados
    │   │   │       ├── dataProcessing/
    │   │   │       │   └── inssDataProcessor.ts
    │   │   │       ├── fontConfiguration/
    │   │   │       │   └── fontConfig.ts
    │   │   │       ├── fontExtraction/
    │   │   │       │   └── fontExtractor.ts      ← dev util: verifica fontes no template
    │   │   │       └── fieldFinder/
    │   │   │           └── fieldFinder.ts        ← dev util: lista campos de um PDF template
    │   │   ├── context/
    │   │   │   ├── DocumentMemberContext.tsx     ← membro selecionado compartilhado entre templates
    │   │   │   └── TemplateSelectionContext.tsx  ← template ativo (tipo de documento)
    │   │   ├── types/
    │   │   │   └── document.types.ts             ← ReqInss, DocumentTemplate, DocumentType, etc.
    │   │   └── queryKeys.ts
    │   │
    │   └── import/
    │       ├── components/
    │       │   ├── PhotoImportForm.tsx           ← selecionar pasta, aviso para Firefox
    │       │   ├── PhotoPreviewTable.tsx         ← correspondências arquivo → membro + status
    │       │   ├── PhotoImportReport.tsx         ← relatório final: sucesso, falha, ignorados
    │       │   └── PhotoImportProgress.tsx       ← barra de progresso durante upload paralelo
    │       ├── hooks/
    │       │   ├── usePhotoImportLogic.ts        ← fluxo completo: pasta → associar → upload paralelo
    │       │   ├── usePhotoPreview.ts            ← estado da tabela de preview, desmarcar itens
    │       │   ├── useFileValidation.ts          ← valida tipo (JPEG/PNG) e tamanho (≤5MB)
    │       │   ├── useFileSystemSupport.ts       ← detecta File System Access API no browser
    │       │   └── useImportExportActions.ts     ← importar/exportar CSV de membros
    │       ├── services/
    │       │   └── importService.ts              ← upload paralelo (p-limit, 8 concurrent)
    │       └── types/
    │           └── import.types.ts               ← PhotoImportItem, ImportResult, ImportStatus
    │
    └── shared/
        ├── components/
        │   ├── ui/                               ← componentes shadcn/ui (gerados pelo CLI)
        │   │   ├── alert-dialog.tsx
        │   │   ├── alert.tsx
        │   │   ├── aspect-ratio.tsx
        │   │   ├── avatar.tsx
        │   │   ├── badge.tsx
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── checkbox.tsx
        │   │   ├── dialog.tsx
        │   │   ├── drawer.tsx
        │   │   ├── dropdown-menu.tsx
        │   │   ├── form.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── pagination.tsx
        │   │   ├── radio-group.tsx
        │   │   ├── select.tsx
        │   │   ├── separator.tsx
        │   │   ├── sheet.tsx
        │   │   ├── sidebar.tsx
        │   │   ├── skeleton.tsx
        │   │   ├── sonner.tsx
        │   │   ├── switch.tsx
        │   │   ├── table.tsx
        │   │   ├── tabs.tsx
        │   │   ├── textarea.tsx
        │   │   ├── toast.tsx
        │   │   ├── tooltip.tsx
        │   │   ├── ConfigurationCard.tsx         ← card padrão para seções de configuração
        │   │   └── FormattedFieldDisplay.tsx     ← exibe campo formatado em modo read-only
        │   ├── layout/
        │   │   ├── DashboardLayout.tsx           ← sidebar + header + área de conteúdo + route guard
        │   │   ├── AppSidebar.tsx                ← navegação: Início, Sócios, Cadastro, Docs, etc.
        │   │   └── Header.tsx                    ← logo, menu mobile, dropdown usuário, toggle tema
        │   ├── form-fields/
        │   │   ├── base/
        │   │   │   ├── BaseField.tsx             ← wrapper com label, asterisco, área de erro
        │   │   │   ├── FieldWrapper.tsx          ← container de espaçamento e layout
        │   │   │   └── MaskedInput.tsx           ← input com suporte a máscara progressiva
        │   │   └── fields/
        │   │       ├── TextField.tsx
        │   │       ├── SelectField.tsx           ← aceita array { value, label }
        │   │       ├── CpfField.tsx              ← máscara 000.000.000-00 + validação algoritmo
        │   │       ├── PhoneField.tsx            ← máscara adaptativa 10/11 dígitos
        │   │       ├── CepField.tsx              ← máscara + busca ViaCEP ao completar 8 dígitos
        │   │       ├── DateField.tsx             ← máscara DD/MM/YYYY + conversão de formatos
        │   │       ├── NitField.tsx              ← máscara 000.00000.00-0
        │   │       ├── CaepfField.tsx            ← máscara 00.000.000/00000-0
        │   │       ├── StateSelect.tsx           ← select com 27 estados brasileiros
        │   │       ├── ElectoralZoneField.tsx
        │   │       └── ElectoralSectionField.tsx
        │   └── feedback/
        │       ├── ErrorBoundary.tsx             ← envolve árvore de rotas; tela amigável com retry
        │       ├── EmptyState.tsx                ← estado vazio genérico: ícone + título + ação
        │       ├── ErrorState.tsx                ← estado de erro genérico + retry
        │       ├── SuccessMessage.tsx            ← mensagem de sucesso com auto-hide
        │       ├── LoadingSpinner.tsx            ← spinner sm/md/lg para ações do usuário
        │       └── NetworkStatusBanner.tsx       ← banner de offline/online
        ├── hooks/
        │   ├── useMobile.ts                      ← detecta mobile via media query
        │   ├── useNetworkStatus.ts               ← online/offline com evento de rede
        │   ├── useErrorHandler.ts                ← consome ServiceResponse<T>, exibe erro via Sonner
        │   ├── useToastNotifications.ts          ← helpers tipados: success, error, info, warning
        │   ├── useLoadingState.ts                ← gerencia estado loading para ops assíncronas
        │   ├── useFormValidation.ts              ← funções de validação reutilizáveis para Zod
        │   ├── useFormActions.ts                 ← handlers padrão de sucesso/erro para forms
        │   ├── useDataFormatters.ts              ← acesso conveniente aos formatadores via hook
        │   └── useInputMasks.ts                  ← acesso conveniente às máscaras via hook
        ├── lib/
        │   ├── supabase/
        │   │   ├── client.ts                     ← instância única do Supabase client
        │   │   └── database.types.ts             ← tipos gerados pelo Supabase CLI
        │   └── pdf/
        │       └── fontLoader.ts                 ← fetch lazy das fontes Calibri (só quando PDF é acionado)
        ├── services/
        │   ├── base/
        │   │   └── serviceResponse.ts            ← ServiceResponse<T>, AppError, helpers (usado por todos os services)
        │   ├── photoService.ts                   ← ÚNICO serviço de fotos do sistema (seção 8.6)
        │   ├── storageService.ts                 ← utilitários genéricos do Supabase Storage
        │   └── apiClient.ts                      ← HTTP client para integrações externas (ViaCEP)
        ├── types/
        │   └── common/
        │       ├── api.types.ts                  ← Paginated<T> e outros tipos API genéricos
        │       ├── ui.types.ts                   ← tipos de UI genéricos (SelectOption, etc.)
        │       └── file.types.ts                 ← FileValidationResult, FileType genérico
        └── utils/
            ├── formatters/
            │   ├── documentFormatters.ts         ← formatCpf, formatCnpj, formatCep, formatPhone, formatNit, formatCaepf
            │   ├── dateFormatters.ts             ← formatDate, formatDateForInput, formatDateForDatabase, calculateAge
            │   └── stringFormatters.ts           ← normalizeString, capitalize, toUpperCase
            ├── validators/
            │   ├── documentValidators.ts         ← validateCpf (algoritmo completo), validateCnpj, validateEmail, validateCep, validatePhone
            │   └── formValidators.ts             ← isRequired, minLength, maxLength, isDateInPast, isDateInFuture
            ├── masks/
            │   ├── inputMasks.ts                 ← applyCpfMask, applyPhoneMask, applyCepMask, applyNitMask, applyCaepfMask, applyDateMask
            │   └── cleaners.ts                   ← cleanCpf, cleanPhone, cleanCep, cleanNit, cleanCaepf, cleanNumbers
            └── mappings/
                ├── statusMappings.ts             ← MEMBER_STATUS, getStatusLabel, getStatusColor, getStatusVariant
                └── selectOptions.ts              ← BRAZILIAN_STATES, MARITAL_STATUS, GENDER_OPTIONS, LITERACY_OPTIONS, MEMBER_SITUATION_OPTIONS 