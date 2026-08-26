# PRUMO · Vistoria & Avaliação de Imóveis

Sistema web profissional (PWA) de campo para **peritos e vistoriadores** de avaliação imobiliária.
Funciona offline no celular, instala como aplicativo e guarda todos os dados no próprio dispositivo.

> **Acesso inicial** — usuário: `admin` · senha: `admin`
> (altere a senha em *Configurações → Segurança de acesso*)

---

## O que o sistema faz

| Módulo | Recursos |
| --- | --- |
| **Painel de campo** | relógio de campo, próxima vistoria, indicadores (área total medida, fotos, medições), diário de atividade, status do PWA |
| **Calculadora de medidas** | terreno (retângulo, triângulo por Heron, trapézio, círculo e **polígono irregular** pela fórmula de Gauss com pré-visualização), planta com cômodos e taxa de ocupação, conversor agrário (ha, alqueires, tarefa, acre…) |
| **Fotos & anotações** | câmera ao vivo do celular, envio de imagens com compressão automática, categorias e **anotações extras do perito em cada foto** |
| **Vistorias** | fichas por cliente com fluxo Agendada → Em campo → Concluída, fotos e medições vinculadas, **relatório imprimível e exportação em PDF** (jsPDF) |
| **Cadastro do avaliador** | nome, atuação (CNAI/CRECI/CREA/CAU), registro, contato — usado nas assinaturas dos relatórios |
| **Configurações** | nome do avaliador, **cadastro de vistoriados (clientes)**, alteração de senha, backup em JSON, instalação do app |

## Tecnologias

React 18 · TypeScript · Vite · Tailwind CSS v4 · jsPDF + autotable · PWA (service worker + manifest) · localStorage

## Rodando localmente

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm run typecheck  # verifica os tipos TypeScript
npm test           # executa os testes automatizados
npm run build      # gera a pasta dist/ (versão de produção)
npm run preview    # testa a build de produção
```

Para publicar a build no Apache do XAMPP, consulte o [guia de execução no XAMPP](./XAMPP.md).

---

# Como guardar este projeto no GitHub

Repositório de destino: `https://github.com/marciorj01/ROJEX-AVALIADOR-E-VISTORIADOR-IMOB.git`

## 1) Pré-requisitos

1. Instale o Git: https://git-scm.com/downloads (no Windows, marque as opções padrão).
2. Crie/acesse sua conta em https://github.com — usuário **marciorj01**.
3. Verifique se o repositório `ROJEX-AVALIACAO-VISTORIA-IMOB` já foi criado no GitHub
   (botão **New repository** → nome `ROJEX-AVALIACAO-VISTORIA-IMOB`).
   - Se pedir para adicionar README/LICENSE ao criar, **não marque nada** (repositório vazio é mais simples).

## 2) Autenticação (uma vez só)

O GitHub não aceita mais senha no terminal — use um **token** ou o **GitHub Desktop**:

- **Token:** GitHub → *Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token* → marque `repo`. Copie e guarde; quando o terminal pedir a senha, cole o token.
- **Alternativa visual:** baixe o [GitHub Desktop](https://desktop.github.com/) e use *File → Add local repository* seguindo os mesmos passos abaixo pelos botões.

## 3) Enviando o projeto (terminal, dentro da pasta do projeto)

```bash
git init
git add .
git commit -m "Sistema Prumo: vistoria e avaliacao de imoveis (PWA)"
git branch -M main
git remote add origin https://github.com/marciorj01/ROJEX-AVALIACAO-VISTORIA-IMOB.git
git push -u origin main
```

**Se o repositório no GitHub já tiver arquivos** (ex.: você marcou "Add README" ao criar),
sincronize antes do push:

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

> A pasta `node_modules` e o build `dist/` **não sobem** — o arquivo `.gitignore` já cuida disso.
> Qualquer pessoa que clonar o repositório roda `npm install && npm run dev` para usar.

## 4) Atualizando depois (a cada mudança)

```bash
git add .
git commit -m "descricao da mudanca"
git push
```

---

# Publicando online (opcional, para acessar de qualquer lugar)

## GitHub Pages

```bash
npm run build -- --base=./
```

Depois envie também a pasta `dist/` (ou use a action oficial `actions/deploy-pages` apontando para `dist/`)
e ative em *Settings → Pages → Branch: gh-pages (ou GitHub Actions)*.

## Netlify ou Vercel (mais simples, sem mexer em nada)

1. Crie conta em https://app.netlify.com ou https://vercel.com e clique em **Import from GitHub**.
2. Selecione `ROJEX-AVALIACAO-VISTORIA-IMOB`.
3. Configuração automática: build command `npm run build` · publish directory `dist`.
4. Pronto — o link gerado já funciona como PWA (instalável, com HTTPS).

---

## Notas de segurança

- As credenciais e os dados (fotos, vistorias, medições) ficam **somente no dispositivo** (localStorage), com senha protegida por hash.
- Use a funcionalidade *Configurações → Exportar JSON* para fazer backups.

*PRUMO v1.1 — feito para trabalho de campo.*
