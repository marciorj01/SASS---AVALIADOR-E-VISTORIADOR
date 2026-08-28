# Etapa 7 — Melhorias profissionais nos PDFs

## Objetivo

Transformar o PDF atual em uma família de relatórios profissionais, com identidade visual da empresa, capa configurável e modelos adequados para cada tipo de serviço, sem perder fotos, memória de cálculo, rastreabilidade e funcionamento offline.

## 1. Identidade visual da empresa

Adicionar em **Configurações** um bloco de identidade do relatório com:

| Campo | Uso no PDF |
|---|---|
| Logotipo principal | Capa, cabeçalho e assinatura visual |
| Nome da empresa | Capa e rodapé |
| CNPJ ou documento empresarial | Capa e identificação institucional |
| Telefone e e-mail | Capa, rodapé e contato |
| Endereço comercial | Capa ou rodapé |
| Cor principal | Títulos, linhas e destaques |
| Cor secundária | Elementos de apoio |
| Texto institucional | Apresentação opcional |

O logotipo deve ser carregado como PNG ou JPEG, com orientação para fundo claro e boa resolução. A aplicação deve redimensioná-lo sem deformação e manter uma versão local para uso offline.

## 2. Capa personalizada

A capa deve conter apenas as informações essenciais, com boa área de respiro:

```text
[Logotipo]
Nome da empresa

RELATÓRIO DE VISTORIA
ou
RELATÓRIO DE AVALIAÇÃO MERCADOLÓGICA

Imóvel: endereço resumido
Cliente ou solicitante
Código do relatório
Data
Responsável técnico e registro profissional
```

Permitir escolher se a capa terá imagem de destaque do imóvel, desde que a foto esteja salva localmente e tenha sido autorizada para uso no documento. Evitar colocar muitas informações na capa; detalhes devem ficar na seção de identificação.

## 3. Modelos de relatório

### Modelo A — Vistoria de entrada

Destinado à entrega inicial do imóvel. Deve priorizar:

1. identificação das partes e do imóvel;
2. condições por ambiente e item;
3. registro fotográfico contextualizado;
4. medidores, chaves e observações;
5. pendências identificadas na entrada;
6. assinatura do responsável e do cliente.

### Modelo B — Vistoria de saída

Destinado à conferência da devolução. Deve priorizar:

1. identificação da vistoria de referência;
2. comparação entre entrada e saída;
3. itens alterados;
4. pendências abertas e resolvidas;
5. fotos de evidência na saída;
6. observações finais e aceite.

### Modelo C — Relatório comparativo

Destinado à análise de mudanças entre duas vistorias. Deve conter:

| Seção | Conteúdo |
|---|---|
| Resumo executivo | Total alterado, pendências abertas, resolvidas e inalteradas |
| Tabela de diferenças | Ambiente, item, entrada, saída, resultado e colunas personalizadas |
| Evidências | Fotos relacionadas a cada ambiente/item |
| Observações | Texto separado da entrada e da saída |
| Conclusão | Síntese objetiva do estado comparado |

### Modelo D — Avaliação mercadológica

Destinado ao perito ou avaliador. Deve conter:

1. identificação e finalidade;
2. metodologia e limitações;
3. imóvel avaliando;
4. amostra de comparáveis;
5. fatores de homogeneização;
6. média, mediana, dispersão e precisão;
7. valor indicativo projetado;
8. memória de cálculo;
9. fontes e datas dos dados;
10. assinatura e registro profissional.

### Modelo E — Laudo completo 2-em-1

Combina vistoria física e avaliação mercadológica em um documento único, mantendo capítulos separados para não misturar evidência de estado físico com conclusão de valor.

## 4. Cabeçalho e rodapé

O cabeçalho deve exibir o logotipo reduzido, o nome da empresa e o código do documento. O rodapé deve exibir número da página, data de emissão, versão do modelo e uma indicação de que o documento foi gerado pelo Prumo.

Não colocar textos importantes somente no cabeçalho ou rodapé; toda informação essencial deve aparecer também no corpo do relatório.

## 5. Fotos e evidências

Organizar as fotos por ambiente e item. Para cada imagem, exibir:

```text
Foto nº
Legenda
Ambiente
Item vistoriado
Data e hora
Observações vinculadas
```

No modelo comparativo, manter a distinção entre foto da entrada e foto da saída. Quando houver pares comparáveis, apresentar as duas imagens em sequência ou em colunas, desde que o tamanho continue legível.

## 6. Configuração do modelo

Adicionar uma preferência de modelo com opções como:

```text
Vistoria de entrada
Vistoria de saída
Relatório comparativo
Avaliação mercadológica
Laudo completo 2-em-1
```

Salvar a preferência no armazenamento local e incluir no backup. O usuário deve conseguir gerar um relatório sem logotipo, usando o modelo padrão do Prumo, caso ainda não tenha configurado a identidade visual.

## 7. Assinatura e validação

Na versão inicial, manter a assinatura visual com nome, função e registro profissional. Em etapa posterior, adicionar assinatura digital avançada com registro de identidade, data, hash do documento e histórico de validação. Não apresentar a assinatura visual como equivalente automático a uma assinatura digital certificada.

## 8. Critérios de qualidade

Antes de liberar os modelos, verificar:

| Critério | Aprovação |
|---|---|
| Identidade | Logotipo nítido, sem deformação e com contraste adequado |
| Leitura | Texto legível em tela e impressão A4 |
| Paginação | Tabelas e fotos não são cortadas de forma indevida |
| Evidência | Toda foto possui ambiente, item e legenda quando aplicável |
| Comparação | Entrada, saída, resultado e pendências são distinguíveis |
| Cálculo | Valores, unidades, fatores e memória são preservados |
| Privacidade | Dados pessoais desnecessários não aparecem |
| Offline | PDF continua sendo gerado sem internet |
| Repetibilidade | Mesmo conjunto de dados produz relatório consistente |

## Ordem recomendada de implementação

1. salvar identidade visual no perfil e no backup;
2. inserir logotipo e dados institucionais no cabeçalho/rodapé;
3. criar capa padrão configurável;
4. separar modelos de entrada, saída, comparação e avaliação;
5. aplicar o modelo completo 2-em-1;
6. testar PDFs com e sem logotipo em computador e celular;
7. só depois avaliar assinatura digital avançada.
