# Manual do Usuário — Prumo

## Vistoria e Avaliação de Imóveis

**Versão:** MVP local/offline com simulação MySQL no XAMPP
**Público:** peritos, avaliadores, vistoriadores, corretores e equipes imobiliárias

> O Prumo é um sistema 2-em-1 para registrar evidências de vistoria e organizar avaliações mercadológicas. A operação principal funciona no navegador e os dados locais ficam armazenados no dispositivo. O MySQL é utilizado nesta fase como cópia de segurança e simulação de futura sincronização em nuvem.

---

## 1. Visão geral do sistema

O Prumo possui os seguintes módulos principais:

| Módulo | Utilização |
|---|---|
| Painel | Visão geral das atividades e atalhos |
| Calculadora | Áreas, polígonos, terrenos e medições |
| Fotos | Registro fotográfico e anotações |
| Vistorias | Vistorias de entrada, saída e conferência |
| Avaliação mercadológica | Imóvel avaliando, comparáveis e homogeneização |
| Cadastro | Clientes e vistoriados |
| Configurações | Perfil, backup, colunas do comparativo e sincronização |

### Fluxo recomendado

```text
Cadastrar cliente
      ↓
Criar vistoria ou avaliação
      ↓
Preencher endereço e dados do imóvel
      ↓
Registrar checklist, medições, fotos e observações
      ↓
Salvar cada módulo
      ↓
Revisar comparação e cálculo
      ↓
Gerar PDF
      ↓
Exportar backup JSON
      ↓
Enviar snapshot ao MySQL, quando disponível
```

---

## 2. Instalação no XAMPP

### 2.1 Pré-requisitos

No computador, instale ou mantenha disponíveis:

- XAMPP com Apache e MySQL;
- Node.js e npm para gerar a distribuição;
- Git, caso a atualização seja feita pelo GitHub;
- navegador atualizado.

### 2.2 Atualizar pelo VS Code

Abra no VS Code a pasta do código-fonte, normalmente:

```text
C:\xampp\htdocs\SASS---AVALIADOR-E-VISTORIADOR
```

A pasta correta contém `package.json`, `src`, `public`, `database` e `api`.

No terminal do VS Code, execute:

```powershell
cd "C:\xampp\htdocs\SASS---AVALIADOR-E-VISTORIADOR"
git pull origin master
npm install
npm run build
robocopy ".\dist" "C:\xampp\htdocs\prumo" /MIR
```

### Ilustração do caminho de publicação

```text
Pasta do código-fonte
C:\xampp\htdocs\SASS---AVALIADOR-E-VISTORIADOR
              │
              │ npm run build
              ▼
Pasta gerada pelo Vite
C:\xampp\htdocs\SASS---AVALIADOR-E-VISTORIADOR\dist
              │
              │ robocopy
              ▼
Pasta servida pelo Apache
C:\xampp\htdocs\prumo
```

### 2.3 Abrir o sistema

Inicie o Apache no painel do XAMPP e abra:

```text
http://localhost/prumo/
```

O navegador deve exibir a tela de acesso do Prumo.

---

## 3. Instalar o banco MySQL local

### 3.1 Criar as tabelas

No painel do XAMPP, inicie o MySQL e abra:

```text
http://localhost/phpmyadmin/
```

Selecione o banco **prumo**. Se ainda não existir, importe o arquivo:

```text
database\prumo.sql
```

O script cria a estrutura do banco e as colunas padrão do comparativo. Não apague o banco `saas-avaliador-vistoriador`; ele é diferente do banco `prumo`.

### 3.2 Verificar as tabelas

Na aba **SQL** do banco `prumo`, execute:

```sql
USE prumo;
SHOW TABLES;
```

Entre as tabelas esperadas estão:

```text
inspections
checklists
checklist_rooms
checklist_items
comparison_columns
photos
measurements
assessments
comparables
sync_snapshots
```

### 3.3 Configurar a API

Depois de copiar o `dist` para o XAMPP, confirme se existe:

```text
C:\xampp\htdocs\prumo\api\config.example.php
```

Faça uma cópia com o nome:

```text
C:\xampp\htdocs\prumo\api\config.php
```

Para a configuração padrão do XAMPP, utilize:

```php
<?php
return [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'prumo',
    'username' => 'root',
    'password' => '',
];
```

Se o MySQL possuir senha, substitua o valor vazio de `password`. O arquivo `config.php` é local e não deve ser enviado ao GitHub.

### 3.4 Testar a API

Abra:

```text
http://localhost/prumo/api/health.php
```

O resultado esperado é semelhante a:

```json
{
  "ok": true,
  "database": "prumo",
  "tables": 19,
  "message": "Conexão MySQL do Prumo funcionando."
}
```

O número pode variar se novas tabelas forem adicionadas. O ponto principal é aparecer `"ok": true` e `"database": "prumo"`.

---

## 4. Criar uma nova vistoria

1. Abra o menu **Vistorias**.
2. Clique em **Nova vistoria**.
3. Selecione ou cadastre o cliente.
4. Informe o tipo de serviço e a data.
5. Digite o CEP. O sistema tentará preencher o logradouro, bairro, cidade e UF.
6. Selecione a UF e depois a cidade.
7. Se o CEP não for localizado, preencha o endereço manualmente.
8. Salve a vistoria.

### Ilustração do endereço inteligente

```text
CEP completo
    ↓
Consulta automática
    ↓
Logradouro + bairro + cidade + UF
    ↓
Número e complemento preenchidos manualmente
```

Se não houver internet, o endereço pode ser preenchido manualmente e a vistoria continuará disponível offline.

---

## 5. Preencher o checklist

1. Abra a vistoria criada.
2. Acesse a aba **Checklist**.
3. Selecione um ambiente.
4. Escolha a condição de cada item.
5. Marque pendências quando necessário.
6. Registre observações, danos e ações recomendadas.
7. Preencha eventuais campos personalizados.
8. Clique em **Salvar checklist**.

> Cada alteração importante deve ser seguida do botão **Salvar checklist**. O preenchimento visual na tela não substitui o salvamento.

### Campos personalizados

Para criar campos adicionais:

```text
Configurações → Colunas do resumo comparativo
```

Exemplos:

```text
Responsável pelo reparo
Prioridade
Prazo
Custo estimado
Número do chamado
```

Depois de criar a coluna, ela aparecerá nos itens do checklist e poderá ser exibida no comparativo e no PDF.

---

## 6. Registrar leituras e chaves

Na aba **Dados de campo**, registre:

| Registro | Informações |
|---|---|
| Água | Número do medidor, leitura, unidade e observação |
| Energia | Número do medidor, leitura, unidade e observação |
| Gás | Número do medidor, leitura, unidade e observação |
| Chaves | Identificação, quantidade, situação e observação |

Após preencher ou alterar qualquer registro, clique em **Salvar**. O relatório utiliza somente dados que foram salvos.

---

## 7. Registrar fotos

O fluxo recomendado para cada ambiente é:

```text
Foto geral do ambiente
      ↓
Foto aproximada da condição observada
      ↓
Vínculo com ambiente e item do checklist
      ↓
Legenda objetiva
      ↓
Anotação adicional, se necessário
```

Uma boa legenda informa o local e a condição, por exemplo:

```text
Parede lateral da sala com três furos próximos à tomada, observados na vistoria de saída.
```

Evite legendas genéricas como “foto do imóvel”.

---

## 8. Criar uma avaliação mercadológica

1. Abra **Avaliação mercadológica**.
2. Informe o endereço do imóvel avaliando.
3. Preencha CEP, UF e cidade.
4. Registre área, dormitórios, vagas, conservação e topografia.
5. Adicione imóveis comparáveis.
6. Informe preço, área, fonte e data da coleta.
7. Ajuste fatores de localização, conservação e oferta.
8. Revise média, mediana, coeficiente de variação e valor indicado.
9. Gere o relatório ou rascunho em PDF.

A indicação de valor deve ser analisada pelo profissional responsável antes de ser utilizada em um laudo formal.

---

## 9. Comparar vistoria de entrada e saída

1. Crie ou selecione a vistoria de entrada.
2. Salve o checklist inicial.
3. Crie ou selecione a vistoria de saída.
4. Salve o checklist final.
5. Na vistoria final, abra a aba **Comparação**.
6. Revise itens alterados, pendências abertas e pendências resolvidas.
7. Confira os campos personalizados.
8. Abra a aba **Relatório**.
9. Gere o PDF.

### Interpretação dos resultados

| Resultado | Significado |
|---|---|
| Inalterado | O item permaneceu na mesma condição |
| Alterado | A condição ou observação mudou |
| Pendência aberta | Um problema foi identificado na vistoria atual |
| Pendência resolvida | Uma pendência anterior deixou de existir |

---

## 10. Gerar o relatório PDF

Antes de gerar o PDF, confirme:

- endereço e identificação do imóvel;
- data e tipo da vistoria;
- checklist salvo;
- dados de campo salvos;
- fotos vinculadas e legendadas;
- comparação revisada;
- observações do profissional;
- dados profissionais e registro configurados.

O PDF reúne identificação, medições, dados de campo, checklist, comparação, fotos e observações.

---

## 11. Backup JSON

Para criar uma cópia local:

```text
Configurações → Backup dos dados de campo → Exportar JSON
```

O arquivo será salvo com nome semelhante a:

```text
prumo-backup-AAAA-MM-DD.json
```

Guarde esse arquivo em local seguro. Recomenda-se manter pelo menos duas cópias, em dispositivos diferentes.

### Restaurar backup

Use a opção de restauração disponível em **Configurações** e selecione o arquivo JSON exportado pelo Prumo. Depois da restauração, atualize a página e confira:

1. vistorias;
2. fotos;
3. checklists;
4. avaliações;
5. comparáveis;
6. colunas personalizadas.

Nunca substitua o arquivo original antes de confirmar que a restauração funcionou.

---

## 12. Enviar backup para o MySQL

A sincronização manual exige internet ou acesso à rede local e o MySQL ativo.

1. Confirme `"ok": true` em `api/health.php`.
2. Abra o Prumo.
3. Acesse **Configurações**.
4. Clique em **Enviar ao MySQL**.
5. Aguarde a mensagem de sucesso.
6. No phpMyAdmin, selecione o banco `prumo`.
7. Consulte a tabela `sync_snapshots`.

Use:

```sql
USE prumo;
SELECT id, payload_hash, created_at, source
FROM sync_snapshots
ORDER BY created_at DESC;
```

Cada linha representa um snapshot completo do estado offline no momento do envio.

> Nesta fase, o snapshot é uma cópia segura do JSON. A sincronização relacional, com distribuição automática para `inspections`, `photos`, `checklists` e `assessments`, será feita em uma etapa posterior.

---

## 13. Usar no celular

O celular deve estar na mesma rede do computador que executa o XAMPP.

### Descobrir o endereço do computador

No Windows, abra o PowerShell e execute:

```powershell
ipconfig
```

Procure o endereço IPv4, por exemplo:

```text
192.168.0.25
```

No celular, abra:

```text
http://192.168.0.25/prumo/
```

O endereço real depende da rede local.

### Instalar como aplicativo

No navegador do celular:

1. abra o endereço do Prumo;
2. carregue a aplicação com internet;
3. abra o menu do navegador;
4. escolha **Adicionar à tela inicial** ou **Instalar aplicativo**;
5. confirme a instalação.

### Testar o modo offline

Depois de abrir o Prumo pelo menos uma vez com internet:

1. abra os menus principais;
2. desligue a internet do celular;
3. tente abrir a vistoria;
4. preencha um checklist;
5. use a calculadora com toque;
6. verifique se os dados já salvos continuam acessíveis.

A consulta de CEP e o envio ao MySQL exigem conexão. O restante dos dados já carregados deve continuar disponível localmente.

---

## 14. Solução de problemas

| Problema | Verificação |
|---|---|
| Página não abre | Apache está iniciado? A pasta é `C:\xampp\htdocs\prumo`? |
| Versão antiga aparece | Execute `Ctrl + F5`, limpe o cache e confirme se o `dist` foi copiado |
| API não abre | Confirme se existe `C:\xampp\htdocs\prumo\api\health.php` |
| `ok: false` na API | Verifique `api/config.php`, MySQL ativo, banco e senha |
| `tables: 0` | Importe `database/prumo.sql` no banco `prumo` |
| Botão MySQL desabilitado | Confirme conexão de rede e indicador online |
| Foto não aparece no relatório | Verifique se a foto foi salva e vinculada à vistoria |
| Checklist não aparece | Abra o checklist, altere os dados e clique em **Salvar checklist** |
| Cidade não aparece | Selecione a UF primeiro ou use o preenchimento manual |
| Celular não acessa | Use o IPv4 do computador e permita o Apache na rede privada do Windows |

---

## 15. Checklist de encerramento de um laudo

Antes de entregar um relatório, confirme:

```text
[ ] Cliente e imóvel identificados
[ ] CEP, UF, cidade e endereço conferidos
[ ] Checklist salvo
[ ] Pendências classificadas
[ ] Leituras de medidores salvas
[ ] Chaves registradas
[ ] Fotos vinculadas e legendadas
[ ] Comparação entrada × saída revisada
[ ] Avaliação e comparáveis revisados
[ ] PDF aberto para conferência
[ ] Backup JSON exportado
[ ] Snapshot enviado ao MySQL, quando aplicável
```

---

## 16. Próximas evoluções

A versão atual está preparada para evoluir para:

1. testes estruturados com usuários reais;
2. assinatura digital avançada;
3. sincronização em nuvem;
4. contas de usuários por equipe;
5. controle de permissões;
6. modelos de PDF por tipo de serviço;
7. publicação em hospedagem online.

A recomendação é utilizar primeiro o MVP em situações reais, registrar dificuldades e só então priorizar as próximas funcionalidades.
