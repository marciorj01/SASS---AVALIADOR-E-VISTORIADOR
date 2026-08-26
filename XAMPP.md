# Executar o Prumo no XAMPP

O Prumo é um frontend React/PWA. Na versão atual, os dados de autenticação, fotos, vistorias e medições ficam no `localStorage` do navegador; portanto, **não existe PHP, API ou banco MySQL para iniciar**. O XAMPP será usado apenas como servidor Apache para entregar a build estática.

## Preparar a build

No computador que possui Node.js instalado, dentro da pasta do projeto, execute:

```bash
npm install
npm run typecheck
npm test
npm run build
```

A pasta `dist/` será criada com os arquivos prontos para o Apache.

## Copiar para o XAMPP no Windows

Com o XAMPP instalado em `C:\xampp`:

1. Abra o painel do XAMPP e inicie o módulo **Apache**. Não é necessário iniciar o MySQL para esta versão.
2. Remova ou renomeie uma instalação anterior em `C:\xampp\htdocs\prumo`.
3. Crie `C:\xampp\htdocs\prumo` e copie **todo o conteúdo de `dist/`** para dentro dela. A estrutura deve conter `index.html`, `assets/`, `manifest.webmanifest`, `sw.js` e `.htaccess`.
4. Acesse `http://localhost/prumo/` no navegador.
5. Para testar o PWA e a câmera, prefira `localhost` ou HTTPS e conceda as permissões solicitadas pelo navegador.

No Linux, o equivalente é copiar o conteúdo de `dist/` para uma subpasta de `/opt/lampp/htdocs/`, por exemplo `/opt/lampp/htdocs/prumo/`, e acessar `http://localhost/prumo/`.

## Testes de aceitação

Entre com `admin` / `admin`, crie um vistoriado, registre uma medição, adicione uma foto, vincule-a a uma vistoria, altere o perfil e exporte um backup JSON. Depois atualize a página e confirme que os dados permanecem no mesmo navegador. Para limpar o ambiente de teste, use as ferramentas de armazenamento do navegador ou a opção de redefinição disponível nas configurações.

## Observações importantes

O arquivo `public/.htaccess` é copiado automaticamente para `dist/.htaccess` durante o build. Ele permite que o Apache preserve arquivos reais e encaminhe as demais rotas para `index.html`. A configuração `base: "./"` em `vite.config.js` é necessária para que os assets funcionem quando o projeto estiver em `/prumo/`, em vez da raiz do domínio.

Se a intenção for que vários usuários compartilhem os mesmos dados, que exista login real ou que as fotos sejam armazenadas no servidor, o próximo passo será criar um backend PHP/MySQL ou migrar a persistência para uma API. Isso não é necessário para executar a versão atual no XAMPP.
