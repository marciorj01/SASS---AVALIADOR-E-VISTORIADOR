# Etapa 3 — Assinatura digital avançada

> **Nota de conformidade:** sou uma IA, não um advogado. Este documento é uma especificação técnica de trabalho, não aconselhamento jurídico. Antes de usar a assinatura em laudos formais, contratos ou documentos com efeitos legais, valide o fluxo com advogado e profissional de certificação digital.

## Objetivo

Adicionar ao Prumo um fluxo de assinatura que preserve a integridade do PDF, identifique quem assinou, registre quando assinou e permita verificar se o documento foi alterado depois da assinatura.

A assinatura visual com nome, cargo e registro profissional já existente no PDF não deve ser apresentada como equivalente automática a uma assinatura digital avançada. A assinatura digital precisa ter identidade, evidência criptográfica e histórico de validação.

## Níveis de implementação

| Nível | Descrição | Uso recomendado |
|---|---|---|
| 1. Aceite eletrônico | Usuário confirma nome, documento, data, IP ou dispositivo e versão do documento | Fluxos internos e aceite operacional |
| 2. Assinatura avançada | Identidade vinculada ao signatário, autenticação forte, hash do documento e trilha de auditoria | Laudos e relatórios que exigem maior evidência |
| 3. Certificado digital | Assinatura com certificado compatível com a política adotada pela organização | Documentos que exigem validação formal específica |

O Prumo deve começar pelo nível 2 como arquitetura de produto, mas a escolha do provedor e a validade do uso devem ser confirmadas para o caso concreto.

## Fluxo recomendado

```text
Laudo concluído
      ↓
Congelar conteúdo e gerar PDF
      ↓
Calcular hash SHA-256 do arquivo
      ↓
Solicitar autenticação do signatário
      ↓
Registrar consentimento e assinatura
      ↓
Adicionar evidência ao documento
      ↓
Emitir versão assinada
      ↓
Permitir validação posterior
```

Depois que o documento for enviado para assinatura, alterações no conteúdo devem gerar uma nova versão. Nunca editar silenciosamente um PDF já assinado.

## Dados a registrar

Criar uma entidade `document_signatures` com:

| Campo | Finalidade |
|---|---|
| `id` | Identificador da assinatura |
| `document_id` | Documento ou laudo assinado |
| `document_type` | Vistoria, avaliação, comparação ou laudo completo |
| `document_version` | Versão exata assinada |
| `document_hash` | Hash do PDF no momento da assinatura |
| `signer_user_id` | Usuário que assinou |
| `signer_name` | Nome exibido no momento da assinatura |
| `signer_document` | Documento do signatário, se necessário e autorizado |
| `signer_role` | Perito, avaliador, vistoriador, cliente ou representante |
| `auth_method` | Senha, código, MFA, certificado ou provedor externo |
| `consent_text` | Texto aceito pelo signatário |
| `signed_at` | Data e hora em UTC |
| `signature_status` | Pendente, válida, revogada ou inválida |
| `provider_reference` | ID da operação no provedor, quando houver |
| `audit_metadata` | IP, dispositivo e eventos técnicos, conforme política de privacidade |

Não armazenar senha, chave privada ou segredo de certificado no navegador ou em texto puro.

## Assinatura offline e online

O modo offline pode preparar o documento, registrar uma intenção de assinatura e guardar uma fila local. A assinatura avançada propriamente dita deve ocorrer quando o dispositivo estiver conectado a um serviço de confiança ou ao servidor da organização.

| Situação | Comportamento |
|---|---|
| Offline antes da assinatura | Gerar rascunho e guardar hash local |
| Online para assinar | Autenticar, assinar e registrar auditoria |
| Offline após assinatura | Exibir a versão assinada já baixada e seu status local |
| Documento alterado | Invalidar a versão anterior e exigir nova assinatura |
| Falha de conexão | Não marcar como assinado; manter como pendente |

## Segurança técnica

A implementação futura deve:

1. gerar o hash no servidor para a versão final do PDF;
2. usar HTTPS em qualquer ambiente online;
3. exigir autenticação forte para signatários;
4. impedir alteração do PDF após a assinatura sem gerar nova versão;
5. registrar eventos de criação, envio, assinatura, rejeição e revogação;
6. manter relógio e datas em UTC no servidor;
7. proteger documentos e metadados contra acesso indevido;
8. separar assinatura do cliente, do avaliador e de outros responsáveis;
9. permitir baixar o PDF assinado e o comprovante de validação;
10. manter política de retenção e restauração dos registros.

## Interface proposta

No relatório final, apresentar:

```text
Status: Pronto para assinatura
Signatários: Avaliador · Cliente
Versão: 1.0
Hash: visível no comprovante
Ação: Solicitar assinatura
```

Após a assinatura:

```text
Status: Assinado
Assinante: Nome completo
Perfil: Perito avaliador
Data: DD/MM/AAAA HH:MM UTC
Validade: Validar assinatura
```

O cliente deve visualizar o documento final antes de confirmar. O consentimento precisa ser explícito e não pode estar escondido em uma ação ambígua.

## Etapas de implementação

| Fase | Entrega |
|---|---|
| 3.1 | Modelo de versões, hash e status no relatório |
| 3.2 | Tela de signatários e consentimento explícito |
| 3.3 | Registro local de auditoria e fila offline |
| 3.4 | API online de assinatura e autenticação forte |
| 3.5 | Integração com certificado ou provedor escolhido |
| 3.6 | Validador, comprovante e histórico de versões |
| 3.7 | Testes de alteração pós-assinatura, revogação e restauração |

## Critérios de aceite

A etapa será considerada pronta quando o sistema conseguir provar qual versão foi assinada, por quem, quando, usando qual método de autenticação, e detectar qualquer alteração posterior no documento. O PDF assinado, o comprovante e o histórico devem permanecer recuperáveis sem apagar a versão anterior.
