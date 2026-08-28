# Requisitos práticos — tema, offline e operação multitenant

## Decisões de produto

O Prumo terá dois contextos de operação. O **Master** administra a plataforma, clientes contratantes, revendedores, afiliados e visão financeira. Cada **cliente contratante** administra sua própria operação, usuários, dados, relatórios e lixeira. Os dados de uma organização nunca podem ser exibidos para outra organização.

## Tema claro

O sistema deve permitir alternar entre tela escura e tela clara pelo cabeçalho. A preferência deve ser salva localmente e respeitar contraste suficiente para textos, campos, botões, estados online/offline e mensagens de erro. O tema escuro continua disponível para uso em ambientes com pouca luz.

## Offline

O modo offline deve ser validado em três camadas:

| Camada | O que fica salvo | Local de armazenamento |
|---|---|---|
| App shell | HTML, JavaScript, CSS, manifesto e service worker | Cache Storage do navegador |
| Dados de trabalho | Vistorias, checklists, avaliações, fotos, medições e configurações | `localStorage` com chaves `prumo.*` |
| Backup manual | Cópia completa dos dados | Arquivo JSON baixado pelo usuário |

O service worker não deve ser tratado como banco de dados. Fotos e dados precisam continuar recuperáveis pela aplicação, e o usuário deve saber exportar um backup antes de limpar o navegador ou trocar de dispositivo.

## Tela Master

A tela Master deve ficar separada do painel do cliente e exigir autenticação própria. Ela terá:

| Módulo | Função |
|---|---|
| Clientes contratantes | Cadastrar, ativar, suspender e consultar organizações |
| Revendedores | Cadastrar parceiros comerciais e acompanhar carteira |
| Afiliados | Registrar indicações, origem e situação |
| Financeiro | Planos, cobranças, pagamentos, inadimplência e comissões |
| Saúde da plataforma | Organizações ativas, uso, sincronizações e erros |
| Auditoria | Acessos, alterações administrativas e exportações |

A tela Master não deve aparecer para usuários de clientes comuns. No modo local atual, ela deve ser tratada como uma etapa de arquitetura; a implementação real depende de autenticação online e banco multitenant.

## Lixeira

Toda exclusão feita pelo Master ou pelo cliente contratante deve ser uma exclusão lógica. O registro recebe `deleted_at`, `deleted_by` e `deletion_reason`, deixando de aparecer nas listas comuns e indo para a lixeira da organização.

A lixeira deve permitir restaurar ou excluir definitivamente. A exclusão definitiva deve exigir confirmação, registrar auditoria e respeitar dependências; por exemplo, não excluir uma vistoria sem tratar fotos, checklist, comparações e snapshots relacionados.

## Logs de acesso

Registrar login bem-sucedido, falha de autenticação, logout, sessão expirada, visualização de relatório, exportação, sincronização, compartilhamento, restauração e exclusão definitiva.

| Dado | Finalidade |
|---|---|
| Organização | Isolar o evento por tenant |
| Usuário | Identificar o responsável |
| Ação | Saber o que ocorreu |
| Recurso | Identificar vistoria, PDF, cliente ou configuração |
| Data/hora UTC | Ordenar e auditar eventos |
| Resultado | Sucesso ou falha |
| IP/dispositivo | Apoio à segurança, conforme política de privacidade |
| Metadados | Contexto técnico sem armazenar segredos |

Em ambiente offline, os eventos devem entrar em uma fila local e ser enviados ao servidor somente após autenticação e conexão. O sistema deve informar quando um log ainda está pendente de sincronização.

## Ordem recomendada

1. Liberar o tema claro e testar contraste.
2. Executar o teste offline documentado no Manual do Usuário.
3. Adicionar campos de tenant e exclusão lógica ao modelo online.
4. Criar autenticação online e tela Master separada.
5. Implementar lixeira e restauração com auditoria.
6. Implementar logs de acesso e fila offline.
7. Criar painel financeiro depois que clientes, planos e pagamentos estiverem definidos.

## Limites da versão local

No XAMPP atual, o tema claro e os dados offline podem funcionar imediatamente. Master, financeiro, permissões reais, lixeira centralizada e logs confiáveis exigem autenticação e API no servidor; não devem ser simulados como segurança apenas escondendo telas no React.
