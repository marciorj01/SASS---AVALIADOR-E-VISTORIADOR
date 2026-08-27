# Simulação MySQL do Prumo no XAMPP

Esta pasta contém o esquema inicial do banco relacional do Prumo. A versão atual do aplicativo continua usando `localStorage` para preservar o funcionamento offline. O banco MySQL será usado primeiro como ambiente de simulação e, depois, como base para sincronização e uso em equipe.

## Importação pelo phpMyAdmin

1. Inicie **Apache** e **MySQL** no painel do XAMPP.
2. Abra `http://localhost/phpmyadmin/`.
3. Acesse a aba **Importar**.
4. Selecione o arquivo `database/prumo.sql`.
5. Mantenha o formato SQL e execute a importação.
6. Confirme se o banco `prumo` foi criado e se as tabelas aparecem no painel esquerdo.

O script cria a estrutura sem inserir senhas reais ou dados pessoais. Ele também cria as colunas padrão do relatório comparativo: Ambiente, Item, Entrada, Saída, Resultado e Observações.

## Tabelas principais

| Grupo | Tabelas |
|---|---|
| Acesso e perfil | `users`, `profiles`, `clients` |
| Vistorias | `inspections`, `checklists`, `checklist_rooms`, `checklist_items` |
| Campos personalizados | `comparison_columns`, `checklist_item_custom_values` |
| Evidências | `photos`, `photo_notes` |
| Campo | `field_logs`, `field_readings`, `key_records`, `measurements` |
| Avaliação | `assessments`, `comparables` |
| Histórico | `activities` |

## Verificação

Após importar, execute no phpMyAdmin:

```sql
USE prumo;
SHOW TABLES;
SELECT * FROM comparison_columns ORDER BY column_order;
```

## Importante sobre o modo offline

A criação do banco não substitui ainda o armazenamento local. O aplicativo continuará funcionando sem internet e gravando no navegador. Essa separação é intencional: primeiro validamos o modelo relacional no XAMPP; depois criamos a API e a sincronização, sem remover o modo offline antes de haver uma rotina segura de backup e reconciliação.
