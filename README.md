# JáCopiei? by Allm4 — Site

Site de apresentação da versão 0.3.0 do JáCopiei?, com identidade inspirada no aplicativo, página compacta e demonstração ilustrativa completa. HTML, CSS e JavaScript nativos; nenhuma dependência de produção, backend ou acesso aos arquivos do visitante.

## Executar

Requer Node.js 20 ou superior.

```sh
npm install
npm run dev
```

Abra http://127.0.0.1:4173. Os arquivos-fonte publicáveis ficam em `dist/`; esta pasta é versionada e não deve ser apagada como build. Não há etapa de compilação.

## Distribuição e configuração

`dist/config.js` centraliza marca, preço planejado, versão de referência, contato, dados institucionais e URLs oficiais. `dist/release.js` consulta o `latest.json` público para obter versão, DMG, notas, arquiteturas, macOS mínimo e estado da distribuição. O manifesto é validado; somente um DMG HTTPS da release correspondente no repositório oficial pode virar download direto. Após falha HTTP, JSON inválido ou 4,5 segundos sem resposta, o botão leva à página de releases. Sem JavaScript, a página oferece essa mesma página funcional de releases.

Fontes verificadas nesta atualização:

- https://raw.githubusercontent.com/Benfic4rthur/JaCopiei-Releases/main/latest.json
- https://github.com/Benfic4rthur/JaCopiei-Releases/releases/tag/v0.3.0
- https://github.com/Benfic4rthur/JaCopiei-Releases/releases/download/v0.3.0/JaCopiei-0.3.0-universal.dmg

A release é uma pré-release: 0.3.0, build 6, universal arm64/x86_64, macOS 14+, DMG de 2.973.805 bytes. O link respondeu 302 → 200 e o tamanho coincide com os metadados. O SHA-256 do instalador é o declarado pelo manifesto; o site não recalcula o binário. Nenhum instalador foi executado. Assinatura ad hoc, sem notarização Apple e com atualização automática desativada; a arquitetura Intel foi compilada, sem validação em Mac Intel físico. Não são apresentadas instruções para desativar proteções do sistema.

R$ 29,99/mês permanece preço planejado. Não há checkout, assinatura, teste grátis, pagamentos, ativação nem licenças disponíveis. Campos institucionais ausentes ficam `null`; a marca responsável é Allm4. O link de explicação sobre os arquivos não representa uma política jurídica. Ao mudar de domínio, atualize `siteUrl`, canonical e URLs absolutas das imagens sociais em `dist/index.html`.

## Demonstração

A janela modal apresenta duas etapas do mesmo fluxo da 0.3.0. Escolha a origem e o destino fictícios, confira 50 arquivos, obtenha 48 correspondências, busque/filtre os resultados e clique em “Copiar itens sem cópia…”. Selecione todos ou alguns dos faltantes, revise destino, quantidade, tamanho, espaço e avisos. A cópia simulada é seguida por leitura do conteúdo e nova comparação de todos os 50 arquivos, incluindo o novo destino.

Somente depois dessa nova comparação o resumo é atualizado para 50/50 (ou 49/50 quando apenas um item é escolhido). O conflito de nome é exemplificado por `IMG_1048 (1).jpg`; as subpastas são preservadas no caminho fictício exibido. É possível pausar, continuar, cancelar e pular a animação. O cancelamento conserva os itens já confirmados. Nova tentativa dos pendentes solicita outra escolha do destino; interromper só a nova comparação permite repeti-la sem copiar novamente. Movimento reduzido apresenta o estado final imediatamente. Ao esconder a aba ou fechar a janela, a animação pausa.

Nenhuma comparação, gravação, transferência, exclusão, abertura de Finder ou seleção de arquivo real acontece no navegador. Todas as informações e operações da demonstração são fictícias.

## Conteúdo e limites

Recursos e FAQ descrevem comparação SHA-256, arquivos/pastas/arrastar e soltar no app, múltiplos destinos, filtros e busca, detalhes/Finder, progresso, seleções lembradas, CSV, cópia em lote, revisão, organização, conflitos de nomes, conferência após gravação, cancelamento, histórico e nova comparação. Os históricos guardam até 20 verificações e 20 operações de cópia, sujeito ao armazenamento local.

A comparação é somente leitura; a cópia é explícita, preservando os originais. O app atual não exige conta nem Acesso Total ao Disco. Arquivos só na nuvem não são baixados automaticamente. Bibliotecas do Fotos, aplicativos, pacotes especiais e links simbólicos ficam fora do escopo. Históricos descrevem o passado, não monitoram continuamente. Destino desconectado pode deixar temporário incompleto, sem retomada ou limpeza automática após reconectar. Mesmo volume não protege contra falha dele; volumes diferentes podem pertencer ao mesmo dispositivo físico. Os recursos futuros e limitações comerciais são apresentados em detalhes expansíveis.

## Verificação

```sh
npx playwright install chromium
npm run check
npm test
```

Testes cobrem o fluxo completo 48/50→50/50, seleção parcial, comparação após gravação, pause/cancelamento/retry, busca/filtros, avisos do mesmo volume, manifesto/fallback, teclado, FAQ, divulgação experimental, responsividade e WCAG A/AA com axe. Capturas de revisão são geradas em `test-results/` e não são versionadas. Não existe workflow de GitHub Actions.

## Assets e hospedagem

`dist/assets/brand.svg` reutiliza a marca do aplicativo. A imagem social existente é preservada. Fontes locais, sem fontes externas ou analytics. A única consulta externa da página é ao manifesto público de distribuição. Qualquer hospedagem estática pode servir `dist/`. `.openai/hosting.json` identifica a hospedagem Sites existente, preservando seu acesso privado. O repositório do site é https://github.com/Benfic4rthur/JACOPIEI-SITE.
