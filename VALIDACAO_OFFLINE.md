# Validação prática do modo offline

## O que o Prumo salva

O Prumo usa três mecanismos diferentes. O **Cache Storage** guarda a estrutura da aplicação, como HTML, JavaScript, CSS, manifesto e service worker. O **localStorage** guarda os registros de trabalho, como vistorias, checklist, avaliações, medições, configurações e sessões. O backup JSON é uma cópia manual baixada pelo usuário para uma pasta normal do sistema.

As chaves de dados usam o prefixo:

```text
prumo.*
```

Para consultar o localStorage no Chrome ou Edge:

```text
F12 → Aplicativo/Application → Armazenamento/Storage → Local Storage → http://localhost
```

Para consultar o cache do PWA:

```text
F12 → Aplicativo/Application → Cache Storage
```

Não editar esses dados diretamente. Use a exportação e a restauração do próprio Prumo.

## Teste recomendado

1. Abra `http://localhost/prumo/` com Apache ativo.
2. Crie uma vistoria de teste com cliente, endereço e checklist.
3. Adicione uma foto, uma medição e uma observação.
4. Gere o PDF e exporte o backup JSON.
5. Recarregue a página e confirme que tudo permaneceu.
6. Abra F12, vá à aba **Network/Rede** e marque **Offline**.
7. Recarregue a aplicação.
8. Navegue para Vistorias, Calculadora e Configurações.
9. Abra a vistoria criada e confira os dados.
10. Crie uma nova observação offline e salve.
11. Reative a rede e confirme que a observação permanece.
12. Faça novo backup e compare o conteúdo.

## Critérios de aprovação

| Teste | Aprovado quando |
|---|---|
| App shell | A tela abre após o carregamento inicial mesmo sem rede |
| Registros | Vistorias e avaliações continuam visíveis |
| Salvamento | Alterações salvas offline permanecem após recarregar |
| Fotos | Fotos vinculadas continuam disponíveis conforme o limite do navegador |
| PDF | O relatório é gerado sem consulta obrigatória à internet |
| Backup | O JSON pode ser baixado sem internet |
| Sincronização | O envio fica pendente sem rede e só ocorre quando solicitado com conexão |

## Limitações importantes

O modo offline depende de o aplicativo ter sido aberto ao menos uma vez com internet para carregar o app shell. O Cache Storage e o localStorage pertencem ao navegador e à origem local; limpar os dados do site, usar outro navegador ou trocar de dispositivo não leva os dados automaticamente. Antes de limpar cache, desinstalar o PWA ou trocar de aparelho, exporte o backup JSON.

O `localStorage` tem capacidade limitada e não é adequado para uma biblioteca ilimitada de fotos. Se o uso crescer, a evolução recomendada é migrar registros e imagens para IndexedDB ou armazenamento local dedicado, mantendo backup e sincronização controlados.
