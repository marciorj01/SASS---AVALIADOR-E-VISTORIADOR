# Etapa 2 — Roteiro de testes e tabela de feedback

## Objetivo

Validar se o Prumo é compreensível, confiável e útil para **corretores, imobiliárias, vistoriadores e peritos/avaliadores**. O teste deve observar o uso real, não apenas confirmar se a tela abre.

## Como executar

Cada participante deve utilizar uma cópia de teste ou um perfil de teste. Não registrar CPF, documentos, endereço real completo, fotos de pessoas ou outros dados pessoais desnecessários. Para cada cenário, o observador deve registrar o tempo aproximado, a dificuldade encontrada, o resultado e a sugestão do participante.

### Escala de avaliação

| Nota | Significado |
|---:|---|
| 1 | Não conseguiu realizar |
| 2 | Conseguiu somente com ajuda |
| 3 | Conseguiu com alguma dificuldade |
| 4 | Conseguiu sem dificuldade relevante |
| 5 | Conseguiu rapidamente e considerou o fluxo claro |

## Roteiro comum a todos os perfis

| Código | Tarefa | Critério de aprovação |
|---|---|---|
| T01 | Abrir o Prumo no computador | Acessa a tela inicial sem erro |
| T02 | Criar um cliente/vistoriado de teste | Cadastro é salvo e aparece na lista |
| T03 | Criar uma nova vistoria | Vistoria é criada com código e data |
| T04 | Preencher CEP, UF e cidade | Endereço é completado ou pode ser inserido manualmente |
| T05 | Abrir o checklist | Ambientes e itens aparecem organizados |
| T06 | Alterar condição e salvar | Após atualizar a tela, o dado permanece |
| T07 | Criar uma coluna personalizada | Coluna aparece no item do checklist |
| T08 | Registrar leitura e chave | Dados são salvos e aparecem no relatório |
| T09 | Adicionar foto vinculada | Foto aparece com ambiente e item corretos |
| T10 | Gerar e revisar PDF | PDF contém dados, evidências e comparação |
| T11 | Exportar backup JSON | Arquivo é baixado com nome e conteúdo válidos |
| T12 | Enviar snapshot ao MySQL | Mensagem de sucesso e novo registro no banco |
| T13 | Desconectar a internet | Dados já carregados continuam acessíveis |
| T14 | Usar a calculadora com touch | Pontos podem ser movidos e inseridos em segmentos |

## Cenários por perfil

### Corretor

O corretor deve criar uma vistoria simples de entrada, preencher endereço, registrar observações visuais, adicionar fotos e gerar um relatório para conferência com o cliente. Observar principalmente rapidez, clareza dos campos e facilidade para trabalhar no celular.

### Imobiliária

A imobiliária deve simular vários clientes e vistorias, testar nomes padronizados, colunas como “responsável pelo reparo” e “prazo”, além de backup e recuperação. Observar organização, repetição de tarefas e necessidade de usuários/permissões.

### Vistoriador

O vistoriador deve realizar o fluxo completo em um celular: checklist por ambiente, fotos vinculadas, leituras de medidores, chaves, pendências e vistoria de saída. Observar uso com toque, funcionamento offline, salvamento explícito e qualidade das evidências.

### Perito ou avaliador

O perito deve criar uma avaliação mercadológica com imóvel avaliando, comparáveis, fatores de homogeneização, indicadores estatísticos, memória de cálculo e PDF. Observar precisão, rastreabilidade da fonte e separação entre vistoria e avaliação.

## Ficha de feedback

| Campo | Preenchimento |
|---|---|
| Participante | |
| Perfil | Corretor / Imobiliária / Vistoriador / Perito |
| Data | |
| Dispositivo e navegador | |
| Internet disponível? | Sim / Não / Intermitente |
| Cenários executados | |
| Nota geral de 1 a 5 | |
| Melhor recurso | |
| Maior dificuldade | |
| Campo ou informação ausente | |
| Erro encontrado | |
| Sugestão de melhoria | |
| Severidade | Bloqueador / Alta / Média / Baixa |
| Evidência anexada | Captura / vídeo / descrição |
| Ação recomendada | |

## Tabela consolidada de feedback

| ID | Perfil | Cenário | Resultado | Nota | Problema observado | Severidade | Evidência | Ação | Status |
|---|---|---|---|---:|---|---|---|---|---|
| F-001 | | | Aprovado / Parcial / Reprovado | | | | | | Aberto |
| F-002 | | | Aprovado / Parcial / Reprovado | | | | | | Aberto |
| F-003 | | | Aprovado / Parcial / Reprovado | | | | | | Aberto |
| F-004 | | | Aprovado / Parcial / Reprovado | | | | | | Aberto |
| F-005 | | | Aprovado / Parcial / Reprovado | | | | | | Aberto |

## Critério para encerrar a Etapa 2

Considerar a etapa aprovada quando os quatro perfis conseguirem completar o cenário principal sem bloqueio crítico, os dados permanecerem salvos após atualização, o PDF apresentar as evidências esperadas e o backup puder ser restaurado. Dificuldades repetidas por mais de um participante devem virar prioridade de desenvolvimento.
