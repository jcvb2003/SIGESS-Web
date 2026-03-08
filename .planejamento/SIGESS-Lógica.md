# DOCUMENTAÇÃO TÉCNICA — SISTEMA DE GESTÃO PARA SINDICATOS DE PESCADORES ARTESANAIS

**Idioma do código:** Inglês (componentes, funções, variáveis, hooks, services, tipos)  
**Idioma da interface:** Português brasileiro  
**Convenção de nomenclatura:** Nome de componente responde "o que representa ou faz", nunca "onde aparece fisicamente na tela". Nomes categóricos/estruturais (table, modal, dialogs) são permitidos — descrevem o tipo do conteúdo, não posição física. A regra "o que representa, não onde aparece" vale para arquivos.
**Data: Banc-end no formato ISO e Front-end no formarto BR (DD/MM/AAAA)

---

## 1. VISÃO GERAL

Sistema web de gestão completa para sindicatos de pescadores artesanais. Inclui cadastro de membros, geração de documentos PDF preenchíveis, relatórios gerenciais e administração organizacional.

**Características obrigatórias:**
- Multi-usuário com sessão compartilhada e logout automático após 30 minutos de inatividade (individual para cada nevagador)
- Tema verde customizável com modo claro e escuro (next-themes — funciona com Vite, não é exclusivo do Next.js)
- Responsivo com prioridade para desktop Windows Chrome/Firefox; mobile Chrome Android como secundário
- Geração de PDFs preenchíveis via pdf-lib
- Importação em massa de fotos via File System Access API (Chrome/Edge/Opera apenas; exibir mensagem clara para Firefox)
- Busca e filtros avançados com debounce

---

## 2. STACK TECNOLÓGICO

| Camada | Tecnologia |
|---|---|
| Frontend | React 18.3+ com TypeScript 5.5+ |
| Build | Vite 5.4+ |
| CSS | Tailwind CSS 3.4+ com shadcn/ui |
| Roteamento | React Router DOM 6.26+ |
| Server state | TanStack Query (React Query) 5.56+ |
| Client state | Context API |
| Formulários | React Hook Form 7.53+ com Zod 3.23+ |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| PDFs | pdf-lib 1.17+ com @pdf-lib/fontkit 1.1+ |
| Animações | Framer Motion 12.12+ |
| Notificações | Sonner 1.5+ |
| Tema | next-themes (standalone, compatível com Vite) |

---

## 3. ARQUITETURA

### 3.1 Princípios

**Feature-first (vertical slice):** cada módulo em `modules/` é autossuficiente — agrupa componentes, hooks, services, context e types da mesma funcionalidade. Nenhum módulo importa diretamente de outro módulo.

**Camada `shared/`:** contém exclusivamente código genérico reutilizável sem conhecimento de domínio de negócio. Qualquer código que mencione "sócio", "requerimento", "localidade" ou outro conceito do negócio pertence a um módulo, não ao shared.

**Separação de responsabilidades dentro de cada módulo:**
- `components/` — UI pura; recebe props, emite eventos; zero lógica de negócio
- `hooks/` — encapsula lógica de negócio e side effects; orquestra services
- `services/` — comunicação exclusiva com Supabase; retorna sempre `ServiceResponse<T>` (nunca lança exceção)
- `types/` — interfaces e tipos do domínio do módulo
- `context/` — quando necessário compartilhar estado entre componentes do módulo
- `queryKeys.ts` — chaves do TanStack Query específicas do módulo

**Barrel files:** Nenhum. Todos os imports são diretos em todo o projeto.

**Direção de dependências:** app/ → modules/ → shared/. Módulos nunca importam diretamente de outros módulos.

**Pages:** orquestram módulos e layout; não contêm lógica própria; são finas por design.

## 4. BANCO DE DADOS

### 4.1 Tabelas

**socios** — tabela central do sistema  
Armazena todos os dados dos membros do sindicato. O campo `codigodosocio` é gerado automaticamente por trigger (nunca pelo frontend). O campo `cpf` é único e obrigatório e serve como chave natural para associação com fotos. O campo `situacao` usa valores compostos como `'1 - ATIVO'`, `'2 - APOSENTADO'`, etc. Defaults importantes: `cidade = 'OEIRAS DO PARÁ'`, `uf = 'PA'`, `profissao = 'PESCADOR(A)'`, `loctrabalho = 'PROPRIEDADE DA UNIÃO'`, `nacionalidade = 'BRASILEIRA'`.

Campos de identificação: `id` (UUID PK), `codigodosocio` (único, gerado por trigger)  
Campos pessoais: `nome`, `apelido`, `datadenascimento`, `pai`, `mae`, `sexo`, `estadocivil`, `nacionalidade`, `naturalidade`, `ufnaturalidade`, `alfabetizado`  
Campos de endereço: `endereco`, `num`, `bairro`, `cidade`, `uf`, `cep`  
Campos de contato: `telefone`, `email`  
Campos de documentos: `cpf`, `rg`, `ssp`, `dtexpedicaorg`, `titulo`, `zona`, `secao`, `caepf`, `pis`, `cei`, `nit`, `embrgp`, `emissaorgp`, `rgpuf`, `senhagovinss`  
Campos administrativos: `datadeadmissao`, `codigolocalidade`, `situacao`, `situacaompa`, `profissao`, `loctrabalho`, `observacoes`

O campo `situacao` deve ter constraint CHECK explícita no banco aceitando apenas os seis valores válidos: `'1 - ATIVO'`, `'2 - APOSENTADO'`, `'3 - FALECIDO'`, `'4 - TRANSFERIDO'`, `'5 - CANCELADO'`, `'6 - SUSPENSO'`. Isso garante integridade independente do frontend.  
Timestamps: `created_at`, `updated_at`

**fotos** — fotos dos membros  
Associa CPF do membro à URL pública no Supabase Storage. Relação 1:1 com `socios` via `cpf`. Possui `ON DELETE CASCADE` — ao excluir membro, a referência da foto é excluída automaticamente (o arquivo no Storage deve ser removido manualmente pelo service).

**localidades** — comunidades e regiões  
Lista de localidades cadastradas. `codigo_localidade` é único e gerado sequencialmente por trigger. Usado como FK em `socios.codigolocalidade`.

**entidade** — dados do sindicato  
Tabela singleton (uma única linha). Armazena dados institucionais: nome, CNPJ, endereço, contatos, federação, confederação, polo, fundação, comarca.

**parametros** — configurações do sistema  
Tabela singleton (uma única linha). Armazena dados usados nos PDFs de requerimento INSS: data de publicação, número de publicação, local de pesca, dois períodos de defeso (início e fim de cada), espécies proibidas.

**reqinss** — histórico de requerimentos INSS  
Persiste requerimentos gerados. `codreqinss` gerado por trigger. FK para `socios` via `codigodosocio`. Armazena snapshot dos dados do membro no momento da geração (não referência viva).

**document_templates** — templates de PDFs  
Armazena metadados dos templates PDF enviados para o Storage. Campo `type` aceita: `'requerimento_inss'`, `'declaracao_residencia'`, `'termo_representacao'`. Campo `is_active` controla qual template está em uso.

### 4.2 Triggers e Sequences

Todos os campos de código sequencial (`codigodosocio`, `codigo_localidade`, `codreqinss`) são gerados exclusivamente por triggers no banco de dados usando sequences PostgreSQL. O frontend nunca calcula esses valores — apenas lê o valor retornado pelo banco após o INSERT.

O trigger `update_updated_at_column` atualiza `updated_at` automaticamente em todas as tabelas relevantes a cada UPDATE.

### 4.3 Índices

Índices obrigatórios para performance: `socios.nome`, `socios.cpf`, `socios.situacao`, `socios.codigolocalidade`, `socios.datadeadmissao DESC`, `socios.datadenascimento`, `fotos.cpf`, `localidades.nome`, `reqinss.codigodosocio`, `reqinss.data DESC`, `document_templates.type`.

### 4.4 RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Política padrão: usuários autenticados têm acesso completo (SELECT, INSERT, UPDATE, DELETE). Storage `fotos-membros` permite leitura pública mas escrita apenas para autenticados. Storage `documentos-templates` requer autenticação para todas as operações.

### 4.5 Storage Buckets

**fotos-membros:** público para leitura; limite 5MB; aceita JPEG e PNG; nome do arquivo: `{cpf_sem_mascara}.jpg`

**documentos-templates:** privado; limite 10MB; aceita apenas PDF; estrutura: `{tipo}/{nome}.pdf`

---

## 5. CATÁLOGO DE COMPONENTES

### 5.1 Shared — Layout

**DashboardLayout** — layout principal do sistema com sidebar, header e área de conteúdo. Gerencia estado de expansão da sidebar. Contém a proteção de rota: redireciona para `/auth` se não autenticado; redireciona para `/dashboard` se autenticado tentando acessar `/auth`.

**AppSidebar** — navegação principal com ícones. Itens: Início, Sócios, Cadastro, Documentos, Relatórios, Configurações. Indica visualmente a rota ativa. Recebe prop `onNavigate` para fechar em mobile após navegação.

**Header** — logo/nome do sistema, botão de menu mobile, dropdown do usuário logado, toggle de tema claro/escuro.

### 5.2 Shared — Form Fields

Todos os campos de formulário seguem um contrato comum: integração com React Hook Form via `control` e `name`, prop `label`, prop `required`, mensagem de erro automática via `formState.errors`. São construídos sobre `BaseField` que implementa o wrapper padrão com label e área de erro.

**BaseField** — wrapper base com label, asterisco de obrigatório e área de mensagem de erro. Todos os campos específicos o utilizam internamente.

**FieldWrapper** — container de espaçamento e layout para grupos de campos.

**TextInputField** — campo de texto genérico sem máscara.

**CPFField** — aplica máscara `000.000.000-00` em tempo real. Validação via algoritmo completo dos dígitos verificadores (ver seção de validadores).

**PhoneField** — aplica máscara adaptativa: `(00) 0000-0000` para 10 dígitos e `(00) 0 0000-0000` para 11 dígitos.

**CEPField** — aplica máscara `00000-000` e dispara busca automática na API ViaCEP ao completar 8 dígitos. Preenche endereço, bairro, cidade e UF automaticamente.

**DateField** — aplica máscara `DD/MM/YYYY`. Converte entre formatos conforme contexto (input HTML usa YYYY-MM-DD; exibição usa DD/MM/YYYY; banco usa ISO).

**NITField** — aplica máscara `000.00000.00-0`.

**CAEPFField** — aplica máscara `00.000.000/00000-0`.

**SelectField** — select genérico que recebe array de `{ value, label }`.

**UFSelect** — select pré-populado com todos os 27 estados brasileiros.

**ElectoralZoneField** — campo numérico para zona eleitoral.

**ElectoralSectionField** — campo numérico para seção eleitoral.

### 5.3 Shared — Feedback

**LoadingSpinner** — spinner de carregamento com variantes de tamanho (sm, md, lg) e prop opcional de texto. Usado exclusivamente para ações do usuário (salvar, excluir, gerar PDF).

**EmptyState** — estado vazio genérico com ícone, título, descrição e ação opcional.

**ErrorState** — estado de erro com mensagem e botão de retry.

**SuccessMessage** — mensagem de sucesso com auto-hide.

**ErrorBoundary** — componente de classe que captura erros não tratados na árvore React. Deve envolver a árvore de rotas completa. Exibe tela de erro amigável com botão para voltar ao dashboard.

### 5.4 Module: auth

**LoginForm** — formulário com campos de email e senha. Exibe mensagem de erro retornada pelo Supabase de forma amigável. Botão de submit com estado de loading durante autenticação.

**AuthLayout** — layout centrado da página de login com logo e card de formulário.

### 5.5 Module: dashboard

**StatCard** — card de estatística com ícone, título, valor numérico e variação opcional. Aceita prop de cor para diferenciar categorias (total, Feminino, Masculino, Assinaturas).

**BirthdayList** — lista de aniversariantes do mês ordenados por dia. Destaca visualmente aniversários do dia atual. Exibe foto miniatura, nome completo e data formatada.

**RecentMembersList** — lista dos últimos 5 membros cadastrados com foto, nome e data de cadastro. Cada item é clicável e navega para a edição do membro.

**DashboardMemberCard** — card de membro individual usado nas listas do dashboard. Diferente do `MemberSelectorCard` do módulo documents.

### 5.6 Module: settings

**SettingsTabsNav** — navegação por tabs: Dados, Entidade, Parâmetros, Senhas.

**EntityBasicInfo** — seção com nome completo, nome abreviado e CNPJ da entidade.

**EntityAddress** — seção com endereço completo da entidade.

**EntityContact** — seção com telefones e email da entidade.

**EntityInstitutionalInfo** — seção com federação, confederação, polo, fundação e comarca.

**ParametersFormHeader** — cabeçalho do formulário de parâmetros com título e botão salvar.

**FishingPeriodsSection** — seção com dois períodos de defeso (datas de início e fim de cada).

**PublicationSection** — seção com número e data de publicação e área de pesca.

**ImportExportCard** — card com ações de importar e exportar membros via CSV.

**DocumentsCard** — card para gerenciar templates de PDF (upload, listagem, ativação).

**LocalitiesCard** — card com listagem de localidades e botão para adicionar nova.

**LocalityManagementDialog** — dialog para criar e editar localidades.

**ImportDialog** — dialog de importação de CSV com preview dos dados antes da confirmação.

**ExportDialog** — dialog de exportação com opções de formato e filtros.

**PasswordChangeForm** — formulário com senha atual, nova senha e confirmação. Valida mínimo de 6 caracteres e que nova senha difere da atual.

**UserManagementSection** — listagem de usuários cadastrados com ações de redefinir senha e desativar.

**CreateUserDialog** — dialog para criar novo usuário com email e senha.

**ResetPasswordDialog** — dialog de confirmação para redefinir senha de usuário.

### 5.7 Module: members — Table

**MembersTableContainer** — wrapper externo da tabela com controles de paginação.

**MembersTableHeader** — cabeçalho com colunas clicáveis para ordenação. Colunas: Foto, Nome, CPF, Data de Nascimento, Idade, Situação, Ações.

**MembersTableBody** — corpo da tabela; delega para os estados de feedback quando necessário.

**MembersTableRow** — linha individual; recebe objeto membro e callbacks de ação.

**MemberTableActions** — célula de ações com dropdown contendo: Ver detalhes, Editar, Excluir, Gerar documentos.

**MemberBasicInfoCell** — célula com foto miniatura (40×40px, fallback com inicial do nome) e nome completo.

**MemberCpfCell** — célula com CPF formatado.

**MemberDateCell** — célula com data formatada para DD/MM/YYYY.

**MemberStatusCell** — célula com badge colorido de situação.

**TableLoadingState** — 10 linhas skeleton enquanto dados carregam. Usar Skeleton (não Spinner) pois é carregamento inicial de dados.

**TableEmptyState** — mensagem amigável quando não há resultados. Diferencia "sem membros cadastrados" de "busca sem resultados".

**TableErrorState** — mensagem de erro com botão de retry.

**Nota:** `table/states/` foi renomeado para `table/feedback/` para evitar conflito com o conceito de state do React.

### 5.8 Module: members — Modal

**MemberDetailsModal** — modal principal de detalhes do membro. Exibe foto ampliável, tabs de informações e ações.

**MemberModalHeader** — cabeçalho do modal com foto, nome, código e badge de situação.

**MemberModalActions** — botões de Editar, Excluir e Gerar Documentos.

**PersonalInfoSection** — seção com dados pessoais (nome, nascimento, filiação, sexo, estado civil, etc.).

**AddressContactSection** — seção com endereço completo e contatos.

**MemberDocumentsTab** — tab com todos os documentos do membro (CPF, RG, título, NIT, CAEPF, RGP, etc.).

**MemberExternalRefsSection** — seção com links externos relevantes para o membro (e.g., consulta INSS, gov.br).

**PhotoFullscreenModal** — modal sobreposto para exibir foto em tamanho ampliado com botão de fechar.

### 5.9 Module: members — Registration

**RegistrationForm** — formulário principal com duas tabs. É usado tanto para cadastro novo quanto para edição de existente (distingue pelo parâmetro `id` na rota).

**RegistrationActions** — botões Salvar e Cancelar com estado de loading durante submissão.

**RegistrationTabs** — navegação entre as duas abas do formulário.

**PersonalDataTabContent** — conteúdo da aba de dados principais: seções de registro, dados pessoais, endereço/contato e foto.

**PersonalDataGrid** — grid responsivo de campos da aba de dados pessoais.

**PersonalDataHeader** — cabeçalho da aba com título e indicadores de campos obrigatórios.

**DocumentsTabContent** — conteúdo da aba de documentos: documentos pessoais, documentos profissionais e situação.

**RegistrationTabTransition** — animação de transição entre abas usando Framer Motion.

### 5.10 Module: members — Forms

**PersonalInfoForm** — subformulário de dados pessoais (nome, apelido, nascimento, filiação, sexo, estado civil, nacionalidade, naturalidade, alfabetizado).

**AddressForm** — subformulário de endereço e contato com busca de CEP automática.

**MemberDocumentsForm** — subformulário de documentos pessoais e profissionais da aba verso.

**MembershipInfoForm** — subformulário de dados de registro: número (read-only, gerado pelo banco), data de admissão, localidade e observações.

**MemberPhotoSection** — área de upload de foto com preview, drag-and-drop, botão de remover e clique para ampliar.

### 5.11 Module: members — Filters e Search

**FilterPanel** — painel lateral ou modal com todos os filtros disponíveis.

**FilterSection** — seção individual de filtro com label e controles.

**FilterActions** — botões Aplicar e Limpar filtros com contador de filtros ativos.

**SearchBar** — campo de busca global com botão de limpar e indicador de tipo de busca detectado.

**SearchTypeHint** — dica visual que informa ao usuário o tipo de busca detectado (por nome, por CPF, por RG).

### 5.12 Module: members — Dialogs

**MemberDeleteDialog** — confirmação de exclusão com nome do membro. Avisa que a foto também será excluída.

**EditConfirmDialog** — confirmação de que dados foram alterados antes de sair sem salvar.

### 5.13 Module: reports

**ReportFilters** — painel de filtros compartilhado entre relatórios.

**ReportTable** — tabela base de relatório com export.

**ReportSummary** — seção de totalizadores e resumo estatístico.

**ReportExportButtons** — botões de exportar para PDF e Excel.

**GeridFiltersSection** — filtros específicos do relatório GERID.

**GeridTableSection** — tabela do relatório GERID com paginação.

**GeridTable** — tabela interna do GERID.

**GeridSummarySection** — resumo do GERID com totais.

**GeridChart** — gráfico de evolução do GERID.

**GeridLegend** — legenda do gráfico.

**GeridPagination** — controles de paginação específicos do GERID.

### 5.14 Module: documents

**DocumentsHeader** — cabeçalho da página de documentos com título e seletor de membro.

**DocumentsTabs** — navegação entre tipos de documento.

**DocumentsTabsList** — lista das abas de tipos de documento.

**MemberSelect** — campo select/autocomplete para escolher membro. Reutiliza dados já carregados em cache pelo React Query.

**MemberSearch** — campo de busca dentro do seletor de membros.

**MemberAutocomplete** — lista de sugestões ao digitar no campo de busca.

**MemberSelectorCard** — card de membro na lista de sugestões do seletor. Diferente do `DashboardMemberCard`.

**MemberInfoBar** — barra com foto e dados resumidos do membro selecionado (nome, CPF, situação).

**InssRequestDocument** — componente raiz do documento de requerimento INSS com suas três tabs.

**ApplicantTab** — tab com dados do requerente pré-carregados do cadastro. Todos os campos são editáveis antes de gerar o PDF.

**FishingPeriodTab** — tab com dados de períodos de defeso pré-carregados dos parâmetros do sistema. Campos editáveis.

**DocumentPreviewTab** — tab com botão de gerar PDF, preview do documento e opções de download ou salvar histórico.

**ApplicantPhotoDisplay** — exibição da foto do requerente dentro do formulário de requerimento.

**ResidenceDeclaration** — componente raiz da declaração de residência.

**ResidenceForm** — formulário de declaração com campos de endereço, data e testemunhas opcionais.

**ResidencePdf** — geração e preview do PDF de declaração de residência.

**RepresentationTerm** — componente raiz do termo de representação.

**TermForm** — formulário do termo com dados do representado (auto) e do representante (manual).

**TermPdf** — geração e preview do PDF do termo de representação.

### 5.15 Module: import

**PhotoImportForm** — formulário inicial com botão de selecionar pasta. Exibe mensagem de browser não suportado para Firefox. Exibe progresso durante varredura.

**PhotoPreviewTable** — tabela de pré-visualização das correspondências arquivo → membro. Exibe status (encontrado exato, por CPF, não encontrado) e permite desmarcar itens antes de confirmar.

**PhotoImportReport** — relatório final da importação com contadores de sucesso, falha e ignorados.

**PhotoImportProgress** — barra de progresso durante o upload paralelo.

---

## 6. CATÁLOGO DE HOOKS

### 6.1 Shared Hooks

**use-mobile** — detecta se está em dispositivo mobile via media query. Retorna boolean.

**use-toast** — hook do Sonner para exibir notificações.

**useLoadingState** — gerencia estado de loading para operações assíncronas. Fornece helper para wrapping de chamadas async.

**useFormValidation** — funções de validação reutilizáveis para uso em regras Zod.

**useFormActions** — handlers padrão de sucesso e erro para submissões de formulário.

**useDataFormatters** — acesso conveniente aos utilitários de formatação via hook.

**useInputMasks** — acesso conveniente às funções de máscara via hook.

**useToastNotifications** — helpers tipados para notificações padronizadas (success, error, info, warning).

**useErrorHandler** — consome `ServiceResponse<T>` e trata erros de forma unificada via Sonner. Único ponto de exibição de erros de serviço.

### 6.2 Module: auth

**useLogin** — lógica de autenticação: chama `authService`, armazena timestamp de atividade, agenda logout automático, navega para `/dashboard` em caso de sucesso.

**useIdleTimeout** — gerencia exclusivamente a lógica de timeout de inatividade. Registra eventos de atividade do usuário (`mousedown`, `keydown`, `scroll`, `touchstart`, `click`). Persiste timestamp da última atividade no `localStorage` para funcionar entre abas. Registra listener de `visibilitychange` para verificar expiração quando a aba volta ao foco (resolve problema de `setInterval` não rodar em aba em background no Chrome mobile). Usa `setTimeout` resetável por atividade, não `setInterval`. Sincroniza logout entre abas via `BroadcastChannel API`. Este hook está em `auth/hooks/` — pertence ao contexto de autenticação e é consumido pelo `AuthContext`.

### 6.3 Module: dashboard

**useDashboardData** — carrega todas as estatísticas do dashboard em queries paralelas: total por situação, aniversariantes do mês, cadastros recentes.

**useDashboardRefresh** — expõe função para invalidar e recarregar dados do dashboard.

### 6.4 Module: settings

**useDataManagement** — lógica de importação e exportação de CSV.

**useEntityData** — carrega e persiste dados da entidade (tabela singleton).

**useEntityValidation** — validações específicas de entidade: CNPJ, email, CEP.

**useParametersData** — carrega e persiste parâmetros do sistema (tabela singleton).

**usePasswordChange** — lógica de alteração de senha via Supabase Auth.

### 6.5 Module: members — Data

**useMemberData** — query principal de listagem de membros com suporte a filtros, busca, ordenação e paginação. `staleTime: 0` obrigatório (sistema multi-usuário).

**useMemberCache** — gerencia invalidação de cache após mutações (create, update, delete).

**useMemberDataLoader** — carrega dados de um membro específico pelo ID para o formulário de edição.

### 6.6 Module: members — Search

**useMemberSearch** — lógica de busca inteligente: detecta automaticamente tipo de busca por padrão da entrada (CPF se 11 dígitos numéricos, RG se numérico menor, nome se texto).

**useSearchDebounce** — aplica debounce de 300ms à entrada de busca.

### 6.7 Module: members — Edit

**useMemberEdit** — estado de edição: modo visualização vs edição, dados originais vs dados editados.

**useMemberSave** — submissão de atualização de membro com tratamento de conflito de CPF duplicado. Localizado em `members/hooks/edit/`.

**useMemberActions** — ações sobre membro: abrir modal, navegar para edição, confirmar exclusão, navegar para documentos. Localizado em `members/hooks/edit/`.

### 6.8 Module: members — Registration

**useRegistrationForm** — configuração do React Hook Form com schema Zod completo.

**useRegistrationFormDefaults** — valores padrão do formulário para novo cadastro (cidade, UF, profissão, loctrabalho, nacionalidade, datadeadmissao).

**useRegistrationFormValidation** — validações custom: CPF (algoritmo completo), data de nascimento no passado, email válido.

**useRegistrationFormTransform** — transforma dados do formulário para o formato esperado pelo banco (formatações, limpeza de máscaras, mapeamento de campos).

**useRegistrationState** — estado da página: carregando dados existentes, salvando, modo novo vs modo edição.

**useRegistrationSubmit** — orquestra o fluxo completo de submissão: valida, transforma, salva membro, faz upload de foto se necessário, invalida cache, exibe feedback, redireciona.

**useRegistrationNumber** — não é um hook; substituir por constante no componente: campo `codigodosocio` é sempre read-only com texto "Gerado automaticamente ao salvar".

### 6.9 Module: members — Filters

**useMemberFilters** — estado dos filtros ativos, aplicação e limpeza. Conta quantos filtros estão ativos para exibir no botão. Localizado em `members/hooks/filters/`.

### 6.10 Module: reports

**useMembersReport** — query de membros com filtros para relatório.

**useRequestsReport** — query de requerimentos INSS para relatório GERID.

**useReportExport** — geração de PDF e Excel de relatórios.

### 6.11 Module: documents

**useInssDocuments** — orquestra o fluxo completo do requerimento INSS: carrega dados do membro selecionado, carrega parâmetros do sistema, popula formulário.

**useRequestFormManagement** — estado do formulário de requerimento com edições inline dos dados pré-carregados.

**useRequestSave** — persiste requerimento na tabela `reqinss` após geração do PDF.

**useRequestDelete** — exclui requerimento do histórico.

**useExistingRequests** — lista requerimentos já gerados para o membro selecionado.

**usePdfGeneration** — orquestra geração de PDF: busca template no Storage, preenche campos via `pdfService`, oferece download ou preview. Retorna `generating` boolean para controle do Spinner.

**usePdfTemplates** — carrega templates disponíveis por tipo da tabela `document_templates`.

**useMultiDocumentGeneration** — gera múltiplos documentos de uma vez (INSS + Residência + Termo) e combina em arquivo único via `pdfCombiner`.

### 6.12 Module: import

**usePhotoImportLogic** — orquestra fluxo completo de importação: selecionar pasta (File System Access API), varrer recursivamente, associar com membros, exibir preview, upload paralelo com concorrência de 8, relatório final.

**usePhotoPreview** — estado da tabela de pré-visualização de correspondências com suporte a desmarcar itens.

**useFileValidation** — valida tipo (JPEG/PNG) e tamanho (máximo 5MB) de arquivos de imagem.

**useImportExportActions** — ações de importar e exportar CSV de membros.

**useFileSystemSupport** — detecta suporte do browser à File System Access API. Retorna `{ isSupported: boolean, message: string }`.

---

## 7. CATÁLOGO DE SERVICES

### 7.1 Contrato de Services

Todo service retorna `ServiceResponse<T>` — objeto com `data` em caso de sucesso ou `error` do tipo `AppError` em caso de falha. Services nunca lançam exceções — toda falha é encapsulada no `error` do retorno. `AppError` contém `message`, `code`, `statusCode` e `details` opcionais.

### 7.2 Shared

**photoService** — ÚNICO serviço de fotos em todo o sistema (em `shared/services/`). Responsabilidades: upload para Supabase Storage (nome: `{cpf_limpo}.jpg`, upsert habilitado), salvar referência na tabela `fotos` (upsert por CPF), deletar arquivo do Storage e referência do banco, buscar URL da foto por CPF.

**apiClient** — cliente HTTP base para integrações externas (ViaCEP). Não usado para Supabase.

**storageService** — utilitários genéricos de Storage do Supabase. Usado por `photoService` internamente.

**base/serviceResponse** — contém `ServiceResponse<T>`, `AppError` e helpers usados por todos os services do sistema.

### 7.3 Module: auth

**authService** — `signInWithPassword`, `signOut`, `getSession`, `updatePassword`, `createUser` (admin). Trata erros do Supabase Auth e os mapeia para `AppError` com mensagens em português.

### 7.4 Module: dashboard

**dashboardService** — queries agregadas: contagem por situação, aniversariantes do mês, cadastros recentes (limite 10). Executa em paralelo com `Promise.all`.

### 7.5 Module: settings

**settingsService** — CRUD de entidade (singleton: sempre update, nunca insert), CRUD de parâmetros (singleton: sempre update, nunca insert), CRUD de localidades, CRUD de `document_templates`, gerenciamento de usuários via Supabase Admin.

### 7.6 Module: members

**memberService** — CRUD completo de membros. Busca paginada com filtros dinâmicos e ordenação server-side. Busca inteligente por nome (ilike), CPF (match exato), RG. Detecta e mapeia erro de CPF duplicado para `AppError` com code `'DUPLICATE_CPF'`. Nunca calcula `codigodosocio` — sempre omite o campo no INSERT.

**memberDataTransformer** — transforma dados do banco para o formato do formulário e vice-versa. Lida com formatação de datas, aplicação e remoção de máscaras, mapeamento de campos com nomes diferentes.

### 7.7 Module: reports

**reportService** — queries de relatório com filtros, geração de PDF de relatório via jsPDF ou similar, geração de Excel via SheetJS.

### 7.8 Module: documents

**documentService** — CRUD de `reqinss`, busca de requerimentos por membro, listagem de templates por tipo.

### 7.9 Shared — PDF (lib)

**pdfService** — orquestrador principal de geração de PDF. Carrega template do Storage, registra fontkit, embeda fontes Calibri (passadas como parâmetro — não hardcoded no serviço), preenche campos, salva e retorna bytes. Também oferece funções de download (cria link temporário e clica programaticamente) e preview (abre em nova aba).

**pdfFormFiller** — preenche campos individuais de PDFTextField, PDFCheckBox e PDFDropdown. Aplica fonte Calibri a campos de texto. Ignora silenciosamente campos não encontrados no template (warn no console, não erro).

**pdfDataProcessor** — prepara objeto de dados do domínio para o formato esperado pelo mapeamento de campos. Aplica formatações (CPF, datas, telefone) antes de passar para o filler.

**pdfFieldMappings** — define mapeamentos para cada tipo de documento. Estrutura correta: chave = nome do campo no PDF template (imutável, vem do arquivo PDF); valor = caminho no objeto de dados usando notação de ponto (ex: `'requerente.cpf'`). Inclui função `getValueByPath` para resolver paths aninhados.

**pdfCombiner** — combina múltiplos `Uint8Array` de PDFs em um único arquivo.

**pdfFieldFinder** — utilitário para listar todos os campos de um PDF template (usado durante desenvolvimento para descobrir nomes de campos).

**pdfFontExtractor** — utilitário para verificar fontes disponíveis em um PDF template.

---

## 8. REGRAS CRÍTICAS DE IMPLEMENTAÇÃO

### 8.1 Validação de CPF

A validação de CPF deve implementar o algoritmo completo dos dois dígitos verificadores. São inválidos: strings com menos ou mais de 11 dígitos numéricos, e strings com todos os dígitos iguais (ex: `11111111111`). Apenas verificar comprimento não é validação — CPFs como `111.111.111-11` passariam com 11 dígitos mas falhariam no algoritmo.

### 8.2 Timeout de Sessão

Implementação correta obrigatória:
- Persistir timestamp da última atividade em `localStorage` (não em memória)
- Registrar eventos de atividade: `mousedown`, `keydown`, `scroll`, `touchstart`, `click`
- Usar `setTimeout` que é resetado a cada atividade (não `setInterval`)
- Registrar listener de `visibilitychange`: ao aba ficar visível, verificar se expirou comparando timestamp atual com o do localStorage
- Usar `BroadcastChannel` para sincronizar logout entre abas abertas
- Esta lógica pertence ao hook `useIdleTimeout`, não diretamente no `AuthContext`

### 8.3 React Query Configuration

`staleTime: 0` obrigatório nas queries de listagem de membros e dados críticos. O sistema tem múltiplos usuários simultâneos — dados devem ser sempre frescos. `refetchOnWindowFocus: true` garante atualização ao retornar à aba.

### 8.4 Número de Registro

O campo `codigodosocio` é gerado exclusivamente por trigger no banco. O frontend nunca calcula esse valor. No formulário, o campo é read-only com texto explicativo. Ao fazer INSERT, o campo é omitido — o banco preenche automaticamente. O valor gerado é retornado pelo `.select()` após o INSERT.

### 8.5 Mapeamento de Campos PDF

A chave do mapeamento é sempre o nome do campo no PDF template (imutável — vem do arquivo PDF e não pode ser alterado). O valor é o path no objeto de dados. Esta direção é obrigatória: se invertida, o sistema tenta buscar campos com nomes do objeto de dados dentro do PDF, que não existem.

### 8.6 Serviço de Fotos

Deve existir exatamente um serviço de fotos em `shared/services/photoService.ts`. Não criar `socioPhotoManager` ou qualquer outro serviço de foto em módulos. Todos os módulos que precisam de operações com fotos importam de `shared/services/photoService`.

### 8.7 Organização de Tipos

Tipos de foto de membro devem ficar em `members/types/`. Tipos de importação devem ficar em `import/types/`. Tipos genéricos como `FileValidationResult` ficam em `shared/types/common/`. Não existe `shared/types/photo/`.

### 8.8 Guards de Rota (bidirecional)

O router deve ter dois guards:
1. Usuário não autenticado tentando acessar qualquer rota protegida → redirecionar para `/auth`
2. Usuário autenticado tentando acessar `/auth` → redirecionar para `/dashboard`

### 8.9 Nomes de Componentes Duplicados

Existem dois componentes com finalidades distintas que não devem ter o mesmo nome:
- `MemberSelectorCard` — card de membro na lista de sugestões do seletor em `documents/member-selector/`
- `DashboardMemberCard` — card de membro nas listas do dashboard em `dashboard/components/`

### 8.10 Loading States

Regra clara e sem exceções: **Skeleton** para carregamento inicial de dados (quando há layout conhecido esperando dados). **Spinner** para ações iniciadas pelo usuário (salvar, excluir, gerar PDF, importar). Nunca inverter.

### 8.11 ErrorBoundary

Deve envolver a árvore de rotas completa no arquivo de rotas. Opcionalmente, pode ser adicionado também ao redor de seções críticas (geração de PDF, formulário de cadastro).

### 8.12 File System Access API

Verificar suporte antes de exibir o botão de seleção. Para browsers não suportados (Firefox), exibir mensagem clara indicando que a funcionalidade requer Chrome, Edge ou Opera. Não usar `try/catch` de `AbortError` como indicador de não suporte — verificar `'showDirectoryPicker' in window`.

### 8.13 Upload Paralelo de Fotos

Usar padrão de workers com índice compartilhado ou `p-limit` para controlar concorrência de 8 uploads simultâneos. Evitar `Promise.all` com array completo (sem controle de concorrência) e evitar sequencial puro (muito lento para importações grandes).

### 8.14 Tratamento de Erros

Todos os services retornam `ServiceResponse<T>`. Hooks verificam `result.error` e passam para `useErrorHandler`. Nenhum componente chama service diretamente. Mensagens de erro são sempre em português.

---

## 9. FORMATADORES E VALIDADORES

### 9.1 Formatadores de Documentos (shared/utils/formatters/documentFormatters.ts)

**formatCpf** — formata string de 11 dígitos para `000.000.000-00`. Retorna input original se não tiver 11 dígitos.

**formatCnpj** — formata string de 14 dígitos para `00.000.000/0000-00`.

**formatCep** — formata string de 8 dígitos para `00000-000`.

**formatPhone** — formata 10 dígitos para `(00) 0000-0000`; 11 dígitos para `(00) 0 0000-0000`.

**formatNit** — formata string de 11 dígitos para `000.00000.00-0`.

**formatCaepf** — formata string de 14 dígitos para `00.000.000/00000-0`.

### 9.2 Formatadores de Data (shared/utils/formatters/dateFormatters.ts)

**formatDate** — converte qualquer formato de data para `DD/MM/YYYY` para exibição.

**formatDateForInput** — converte para `YYYY-MM-DD` para uso em inputs HTML type date.

**formatDateForDatabase** — garante formato ISO `YYYY-MM-DD` para envio ao banco.

**calculateAge** — calcula idade em anos a partir de data de nascimento. Considera dia e mês para não contar aniversário antes de acontecer.

### 9.3 Formatadores de String (shared/utils/formatters/stringFormatters.ts)

**normalizeString** — remove acentos, converte para minúsculas, remove caracteres especiais. Usado na busca e na associação de fotos por nome de arquivo.

**capitalize** e **toUpperCase** — utilitários de capitalização.

### 9.4 Validadores (shared/utils/validators/documentValidators.ts)

**validateCpf** — algoritmo completo dos dois dígitos verificadores. Rejeita strings com todos dígitos iguais. Retorna boolean.

**validateCnpj** — algoritmo completo dos dois dígitos verificadores do CNPJ. Retorna boolean.

**validateEmail** — regex padrão de email. Retorna boolean.

**validateCep** — verifica 8 dígitos numéricos. Retorna boolean.

**validatePhone** — verifica 10 ou 11 dígitos numéricos. Retorna boolean.

### 9.5 Validadores de Formulário (shared/utils/validators/formValidators.ts)

Funções puras para uso em regras Zod: `isRequired`, `minLength`, `maxLength`, `isDateInPast`, `isDateInFuture`.

### 9.6 Máscaras (shared/utils/masks/inputMasks.ts)

Funções que recebem valor parcialmente digitado e retornam valor com máscara aplicada progressivamente: `applyCpfMask`, `applyPhoneMask`, `applyCepMask`, `applyNitMask`, `applyCaepfMask`, `applyDateMask`.

### 9.7 Limpadores (shared/utils/masks/cleaners.ts)

Funções que removem máscaras: `cleanCpf`, `cleanPhone`, `cleanCep`, `cleanNit`, `cleanCaepf`, `cleanNumbers`.

---

## 10. MAPEAMENTOS (shared/utils/mappings/)

### 10.1 statusMappings.ts

Constante `MEMBER_STATUS` com os seis valores de situação como constantes tipadas. Funções `getStatusLabel`, `getStatusColor` e `getStatusVariant` (para badge do shadcn/ui).

### 10.2 selectOptions.ts

Arrays de `{ value, label }` para todos os selects do sistema: `BRAZILIAN_STATES` (27 estados), `MARITAL_STATUS`, `GENDER_OPTIONS`, `LITERACY_OPTIONS`, `MEMBER_SITUATION_OPTIONS`.

---

## 11. ROTEAMENTO

**Rotas públicas:** `/auth` (Login)  
**Rotas protegidas (dentro de DashboardLayout):** `/dashboard` (index), `/members`, `/registration`, `/registration/:id`, `/documents`, `/reports`, `/reports/members`, `/reports/gerid`, `/settings`  
**Fallback:** `*` → NotFound

**Importação de fotos:** Acessada via aba "Dados" em Configurações, não é uma página separada.

Todas as rotas protegidas usam `DashboardLayout` como wrapper. O guard bidirecional vive no `DashboardLayout` — verifica `isAuthenticated` do `AuthContext` e redireciona conforme necessário. Code splitting via `React.lazy` em todas as páginas.

---

## 12. CONFIGURAÇÃO DO REACT QUERY

`staleTime: 0` — dados sempre stale para sistema multi-usuário  
`gcTime: 300000` — 5 minutos de cache  
`refetchOnWindowFocus: true` — refetch ao voltar para a aba  
`refetchOnReconnect: true` — refetch ao reconectar internet  
`retry: 1` para queries, `retry: 0` para mutations  
`retryDelay: 1000` — 1 segundo entre retries

---

## 13. BUSCA INTELIGENTE DE MEMBROS

O campo de busca detecta automaticamente o tipo baseado no input:
- 11 dígitos numéricos → busca por CPF (match exato após limpeza de máscara)
- Numérico com menos de 11 dígitos → busca por RG ou NIT (ilike)
- Texto → busca por nome (ilike normalizado, case-insensitive)

O `SearchTypeHint` exibe visualmente para o usuário qual tipo foi detectado.

---

## 14. ASSOCIAÇÃO DE FOTOS NA IMPORTAÇÃO

Ordem de tentativas para associar arquivo a membro:
1. Match exato: nome normalizado do arquivo == nome normalizado do membro
2. Match por CPF: se nome do arquivo contém apenas dígitos com 11 caracteres, busca por CPF
3. Não encontrado: item aparece na tabela com status "não encontrado" e pode ser ignorado

Normalização de string: remover acentos, converter minúsculas, remover caracteres especiais exceto dígitos e letras.

---

## 15. FONTES CALIBRI NOS PDFs

As fontes Calibri ficam em `public/fonts/` e são servidas estaticamente. O `pdfService` as recebe como parâmetro (não as busca diretamente com fetch hardcoded) — isso permite testar e trocar fontes sem alterar o serviço. O chamador (hook `usePdfGeneration`) é responsável por fazer o fetch das fontes e passá-las ao serviço. O fetch das fontes deve ser lazy — realizado apenas no momento em que o usuário aciona a geração do PDF, nunca no carregamento da página.

Variantes disponíveis: `calibri.ttf`, `calibri-bold.ttf`, `calibri-italic.ttf`, `calibri-bold-italic.ttf`.

---

## 16. TEMA VERDE

Cor primária: `verde`. O token `--primary` do shadcn/ui aponta para esta cor tanto no modo claro quanto no escuro. Todos os botões primários, badges ativos e destaques usam esta cor.

---

## 17. RESPONSIVIDADE

**Desktop (prioridade):** tabela completa com todas as colunas, sidebar fixa, grid de múltiplas colunas nos formulários.

**Mobile:** tabela transformada em cards empilhados (`hidden md:block` na tabela, `md:hidden` nos cards), sidebar em Sheet lateral acionada por botão hambúrguer, formulários em coluna única.

Breakpoint de transição: `md` (768px) para tabela/cards; `lg` (1024px) para sidebar.

---

## 18. ORDEM DE IMPLEMENTAÇÃO

1. **Setup e infraestrutura:** estrutura de pastas, Supabase (migrations, triggers, RLS, Storage), types TypeScript, utilitários (validators, formatters, masks, mappings), componentes base do shadcn/ui, ErrorBoundary
2. **Auth e layout:** AuthContext, useIdleTimeout, LoginForm, DashboardLayout, AppSidebar, Header, proteção de rotas, ThemeProvider
3. **Dashboard:** StatCard, BirthdayList, RecentMembersList, dashboardService
4. **Cadastro de membros:** formulário completo com duas tabs, validações, upload de foto, fluxo de edição
5. **Listagem de membros:** tabela, busca, filtros, modal de detalhes, ações, paginação
6. **Configurações:** todas as quatro tabs com funcionalidades completas
7. **Importação de fotos:** File System Access API, associação, upload paralelo, relatório
8. **Documentos e PDFs:** seletor de membro, requerimento INSS, declaração, termo, geração de PDF
9. **Relatórios:** membros e GERID
10. **Testes, ajustes e deploy**

---

## 19. GLOSSÁRIO

- **Defeso:** período de proibição de pesca para reprodução das espécies
- **CAEPF:** Cadastro de Atividade Econômica da Pessoa Física
- **NIT:** Número de Identificação do Trabalhador
- **RGP:** Registro Geral da Pesca (número identificador do pescador)
- **MPA:** Ministério da Pesca e Aquicultura
- **INSS:** Instituto Nacional do Seguro Social
- **GERID:** relatório gerencial específico do sistema
- **Localidade:** comunidade ou região onde o pescador atua
- **Situação:** estado cadastral do membro (Ativo, Aposentado, Falecido, Transferido, Cancelado, Suspenso)
- **Singleton:** tabela com uma única linha (`entidade`, `parametros`) — sempre update, nunca insert

---

*Este documento é a especificação definitiva de referência. Qualquer decisão de implementação não coberta aqui deve seguir os princípios de arquitetura estabelecidos na seção 3.1.*
