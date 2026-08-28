# Etapa 6 — Lixeira e logs de acesso: implementação prática

## Lixeira com exclusão lógica

A exclusão deve retirar o registro das listas normais sem apagar imediatamente a informação. Ao excluir uma vistoria, cliente, avaliação, foto ou configuração, o sistema deve capturar uma cópia do registro e criar um item na lixeira.

### Fluxo de exclusão

```text
Usuário clica em excluir
      ↓
Sistema mostra entidade, responsável e consequência
      ↓
Usuário informa motivo e confirma
      ↓
Registro recebe deleted_at/deleted_by
      ↓
Cópia íntegra vai para trash_items
      ↓
Lista normal deixa de exibir o registro
      ↓
Evento é gravado em access_logs
```

Para entidades relacionais, preferir exclusão lógica no registro principal e em seus filhos. Não apagar fotos, itens de checklist ou comparações automaticamente sem uma política clara de retenção. O backup e o snapshot devem continuar identificando a versão original.

### Campos mínimos

| Campo | Uso |
|---|---|
| `deleted_at` | Data/hora da exclusão lógica |
| `deleted_by` | Usuário que solicitou a exclusão |
| `deletion_reason` | Motivo informado |
| `organization_id` | Isolamento por cliente contratante |
| `entity_type` | Tipo da entidade |
| `entity_id` | ID do registro original |
| `snapshot_json` | Estado recuperável no momento da exclusão |
| `restored_at` | Data/hora da restauração |
| `restored_by` | Usuário que restaurou |
| `permanently_deleted_at` | Data/hora da exclusão definitiva |
| `permanently_deleted_by` | Responsável pela exclusão definitiva |

### Regras da interface

A tela da lixeira deve ficar em Configurações para o cliente contratante e em um módulo administrativo para o Master. Exibir filtros por tipo, período, usuário e status. Cada item deve mostrar nome, data, responsável e motivo.

As ações devem ser:

```text
Restaurar
Excluir definitivamente
```

A exclusão definitiva deve exigir confirmação explícita, apresentar a consequência e não permitir recuperação pelo sistema depois de concluída. Para registros assinados ou relacionados a obrigação de retenção, bloquear ou exigir uma política específica antes da exclusão.

## Logs de acesso e auditoria

Diferenciar **log de acesso** de **diário de atividade**. O diário é uma informação funcional para o usuário; o log de acesso é uma trilha de segurança que não deve ser apagada pelo cliente comum.

### Eventos obrigatórios

| Evento | Exemplos |
|---|---|
| Autenticação | `login_success`, `login_failure`, `logout`, `session_expired` |
| Dados | `record_created`, `record_updated`, `record_deleted`, `record_restored` |
| Documentos | `pdf_viewed`, `pdf_exported`, `document_signed`, `share_created` |
| Segurança | `password_changed`, `permission_changed`, `user_invited` |
| Integração | `backup_exported`, `sync_started`, `sync_completed`, `sync_failed` |
| Administração | `organization_created`, `subscription_changed`, `financial_viewed` |

### Fluxo de registro

Toda requisição autenticada deve receber um `request_id`. A API deve registrar o evento depois de validar a identidade e a autorização, informando sucesso ou falha. Nunca registrar senhas, tokens, chaves privadas ou payloads completos com dados sensíveis.

```text
Receber requisição
      ↓
Identificar usuário e organização
      ↓
Validar permissão
      ↓
Executar ou rejeitar ação
      ↓
Registrar resultado e recurso
```

### Campos recomendados

```text
organization_id
user_id
event_code
outcome
resource_type
resource_id
ip_address
user_agent
request_id
metadata_json
occurred_at
```

As datas devem ser armazenadas em UTC. A interface pode converter para o fuso do usuário. O Master pode visualizar logs de plataforma; o cliente contratante pode visualizar somente os logs da própria organização, conforme sua política.

## Offline e sincronização

No modo offline, os eventos de auditoria entram em uma fila local, por exemplo `prumo.pendingAccessLogs`. O aplicativo deve marcar esses eventos como pendentes e enviá-los somente depois que houver conexão e autenticação válida. Se ocorrer conflito, manter o evento original e registrar a tentativa de sincronização.

A fila offline não substitui o log confiável do servidor. Para ações críticas, como exclusão definitiva, alteração de permissões e assinatura, exigir conexão com o servidor e não permitir execução somente com o relógio do aparelho.

## Retenção e proteção

Definir prazo de retenção com a organização e orientação profissional adequada. Restringir leitura de logs por função, impedir edição direta, proteger cópias de backup e registrar exportações dos próprios logs. Monitorar falhas de gravação: uma ação crítica não deve ser apresentada como concluída se o registro de auditoria obrigatório falhar.

## Critérios de aceite

A implementação estará aprovada quando uma entidade excluída desaparecer da lista normal, aparecer na lixeira com autor e motivo, puder ser restaurada, e a exclusão definitiva exigir confirmação. Também deve ser possível localizar login, alteração, exportação, sincronização, restauração e exclusão por organização, usuário e período, sem expor dados de outro tenant.
