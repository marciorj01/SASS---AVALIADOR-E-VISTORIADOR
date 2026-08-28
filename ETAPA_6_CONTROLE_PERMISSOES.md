# Etapa 6 — Controle de permissões

## Objetivo

Separar o que cada pessoa pode visualizar, criar, editar, assinar, exportar e administrar no Prumo. A autorização deve ser aplicada no servidor quando o sistema estiver online; esconder botões no frontend sozinho não é segurança suficiente.

## Perfis de acesso

| Perfil | Finalidade |
|---|---|
| Administrador | Configura a organização, usuários, permissões, modelos e integrações |
| Avaliador | Cria avaliações mercadológicas, comparáveis, memórias de cálculo e laudos |
| Vistoriador | Executa vistorias, checklists, fotos, medições, chaves e dados de campo |
| Cliente | Consulta documentos compartilhados e participa de aceite ou assinatura |

## Matriz inicial de permissões

| Recurso | Administrador | Avaliador | Vistoriador | Cliente |
|---|---:|---:|---:|---:|
| Painel da organização | Total | Próprio/equipe | Próprio/equipe | Compartilhado |
| Clientes | Criar, editar, excluir | Criar e editar | Consultar | Não |
| Vistorias | Total | Consultar e editar conforme atribuição | Criar e editar conforme atribuição | Consultar compartilhadas |
| Checklist | Total | Consultar | Criar e editar | Consultar |
| Fotos e evidências | Total | Consultar e anexar conforme atribuição | Criar, editar e anexar | Consultar compartilhadas |
| Avaliações | Total | Criar, editar e concluir | Consultar se autorizado | Consultar compartilhadas |
| Comparáveis | Total | Criar e editar | Consultar | Não |
| Relatórios PDF | Total | Gerar e exportar | Gerar conforme atribuição | Baixar compartilhados |
| Backup e restauração | Total | Exportar próprio trabalho | Exportar próprio trabalho | Não |
| Sincronização | Configurar | Usar conforme política | Usar conforme política | Não |
| Usuários e permissões | Total | Não | Não | Não |
| Identidade visual | Total | Consultar | Consultar | Não |
| Assinaturas | Administrar | Solicitar/assinar | Solicitar/assinar | Assinar/aceitar |

## Modelo técnico

Criar as entidades:

```text
organizations
users
roles
permissions
user_roles
role_permissions
resource_assignments
share_links
audit_events
```

Um usuário pode pertencer a uma organização e ter mais de uma função, desde que a política da organização permita. O acesso a um recurso deve considerar tanto o perfil quanto a atribuição específica ao imóvel, vistoria ou avaliação.

### Atribuição por recurso

Uma imobiliária pode permitir que o vistoriador veja somente as vistorias que lhe foram atribuídas. O avaliador pode consultar a vistoria física sem poder modificar as fotos originais. O cliente pode acessar somente um relatório compartilhado, com prazo de expiração e sem acesso ao painel interno.

## Regras de segurança

1. Validar permissões em toda requisição da API, não apenas na interface.
2. Aplicar isolamento por organização para impedir acesso cruzado entre clientes.
3. Usar sessões seguras e expiração de tokens.
4. Exigir autenticação forte para administrador e assinatura.
5. Registrar login, logout, criação, alteração, exclusão, exportação e compartilhamento.
6. Não permitir que cliente altere evidências, cálculos ou documentos concluídos.
7. Exigir confirmação adicional antes de excluir ou revogar documento.
8. Manter histórico de versões e autor das alterações.
9. Aplicar menor privilégio por padrão.
10. Revisar usuários e acessos periodicamente.

## Fluxos principais

### Administrador criando uma equipe

```text
Criar organização
      ↓
Convidar usuário
      ↓
Definir perfil
      ↓
Atribuir imóveis ou projetos
      ↓
Registrar aceite e auditoria
```

### Cliente recebendo um relatório

```text
Relatório concluído
      ↓
Administrador ou responsável gera compartilhamento
      ↓
Definir validade e permissões
      ↓
Cliente visualiza ou baixa
      ↓
Sistema registra acesso
```

## Permissões mínimas para a primeira versão online

A primeira versão online pode começar com quatro papéis fixos e uma matriz simples. Evitar criar um editor genérico de permissões antes de validar os fluxos com uma equipe real.

| Prioridade | Entrega |
|---|---|
| Alta | Login online e separação por organização |
| Alta | Administrador gerencia usuários |
| Alta | Vistoria e avaliação atribuídas a responsáveis |
| Alta | Cliente acessa apenas documentos compartilhados |
| Alta | Auditoria das ações críticas |
| Média | Permissões personalizadas por organização |
| Média | Expiração de compartilhamentos |
| Posterior | Integração com diretórios corporativos |

## Critérios de aceite

A etapa será considerada pronta quando um usuário não conseguir acessar uma organização, vistoria, avaliação, foto, backup ou PDF que não lhe foi autorizado; quando cada alteração crítica estiver registrada; e quando administrador, avaliador, vistoriador e cliente conseguirem completar seus fluxos sem receber permissões excessivas.
