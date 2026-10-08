# JáCopiei? by Allm4 — Site

Site de apresentação do JáCopiei?, com identidade inspirada no aplicativo, página compacta e demonstração ilustrativa completa. HTML, CSS e JavaScript nativos; nenhuma dependência de produção, backend ou acesso aos arquivos do visitante.

## Executar

Requer Node.js 20 ou superior.

```sh
npm install
npm run dev
```

Abra http://127.0.0.1:4173. Os arquivos-fonte publicáveis ficam em `dist/`; esta pasta é versionada e não deve ser apagada como build. Não há etapa de compilação.

## Distribuição e configuração

`dist/config.js` centraliza marca, preço do plano, contato, dados institucionais e URLs oficiais. `dist/release.js` consulta o `latest.json` público para obter versão, DMG, notas, arquiteturas, macOS mínimo e estado da distribuição. O manifesto é validado; somente um DMG HTTPS da release correspondente no repositório oficial pode virar download direto. Após falha HTTP, JSON inválido ou 4,5 segundos sem resposta, o botão leva à página de releases. Sem JavaScript, a página oferece essa mesma página funcional de releases.

Fontes oficiais de distribuição:

- https://raw.githubusercontent.com/Benfic4rthur/JaCopiei-Releases/main/latest.json
- https://github.com/Benfic4rthur/JaCopiei-Releases/releases

A versão disponível, o instalador, as notas, o macOS mínimo, as arquiteturas e as condições de instalação vêm exclusivamente do manifesto validado. Não existe versão de referência no config ou na inicialização. O HTML começa sem número de versão e com links para releases; falha de rede ou validação limpa também os dados de uma consulta anterior. O site não recalcula o hash nem executa instaladores. As informações de distribuição não determinam os textos de funcionalidades do produto.

O aplicativo oferece 7 dias grátis, sem cartão e sem cobrança automática. O período só começa ao clicar em “Começar meus 7 dias grátis” dentro do app. Instalar ou abrir não inicia o prazo; o contador de dias e a data de vencimento continuam ao fechar e reabrir. Após vencer, novas verificações, cópias e tentativas ficam bloqueadas; histórico, detalhes e exportação continuam disponíveis. Nenhum arquivo é apagado e cópias já iniciadas não são interrompidas pelo vencimento.

A área de licença existe antes, durante e depois do período gratuito. Ela apresenta o plano de R$ 29,99/mês. Pagamento e ativação paga estão em preparação; a contratação permanece dentro do aplicativo. O site não inicia trial, não recebe pagamentos e não oferece checkout. Essas informações são conteúdo editorial do produto, independente da versão atualmente distribuída. Nenhum servidor, pagamento, release ou GitHub Actions é configurado nesta atualização.

Campos institucionais ausentes ficam `null`; a marca responsável é Allm4. O link de explicação sobre os arquivos não representa uma política jurídica. Ao mudar de domínio, atualize `siteUrl`, canonical e URLs absolutas das imagens sociais em `dist/index.html`.

## Demonstração

A janela modal apresenta duas etapas do mesmo fluxo de conferência e cópia. Escolha a origem e o destino fictícios, confira 50 arquivos, obtenha 48 correspondências, busque/filtre os resultados e clique em “Copiar itens sem cópia…”. Selecione todos ou alguns dos faltantes, revise destino, quantidade, tamanho, espaço e avisos. A cópia simulada é seguida por leitura do conteúdo e nova comparação de todos os 50 arquivos, incluindo o novo destino.

Somente depois dessa nova comparação o resumo é atualizado para 50/50 (ou 49/50 quando apenas um item é escolhido). O conflito de nome é exemplificado por `IMG_1048 (1).jpg`; as subpastas são preservadas no caminho fictício exibido. É possível pausar, continuar, cancelar e pular a animação. O cancelamento conserva os itens já confirmados. Nova tentativa dos pendentes solicita outra escolha do destino; interromper só a nova comparação permite repeti-la sem copiar novamente. Movimento reduzido apresenta o estado final imediatamente. Ao esconder a aba ou fechar a janela, a animação pausa.

Nenhuma comparação, gravação, transferência, exclusão, abertura de Finder ou seleção de arquivo real acontece no navegador. Todas as informações e operações da demonstração são fictícias.

O console mostra uma mensagem bem-humorada uma vez ao carregar a página. Há uma barreira leve aos atalhos de inspeção e ao menu de contexto por mouse em áreas estáticas. Campos editáveis, links, botões, seleção de texto e menu de contexto por teclado permanecem disponíveis. Isso não protege o código-fonte nem impede abrir DevTools pelo menu do navegador.

## Conteúdo e limites

Recursos e FAQ descrevem comparação SHA-256, arquivos/pastas/arrastar e soltar no app, múltiplos destinos, filtros e busca, detalhes/Finder, progresso, seleções lembradas, CSV, cópia em lote, revisão, organização, conflitos de nomes, conferência após gravação, cancelamento, histórico e nova comparação. Os históricos guardam até 20 verificações e 20 operações de cópia, sujeito ao armazenamento local.

A comparação é somente leitura; a cópia é explícita, preservando os originais. O app atual não exige conta nem Acesso Total ao Disco. Arquivos só na nuvem não são baixados automaticamente. Bibliotecas do Fotos, aplicativos, pacotes especiais e links simbólicos ficam fora do escopo. Históricos descrevem o passado, não monitoram continuamente. Destino desconectado pode deixar temporário incompleto, sem retomada ou limpeza automática após reconectar. Mesmo volume não protege contra falha dele; volumes diferentes podem pertencer ao mesmo dispositivo físico. Os recursos futuros e limitações comerciais são apresentados em detalhes expansíveis.

## Verificação

```sh
npx playwright install chromium
npm run check
npm test
```

Testes cobrem o fluxo completo 48/50→50/50, seleção parcial, comparação após gravação, pause/cancelamento/retry, busca/filtros, avisos do mesmo volume, trial/licença, manifesto com versões diferentes, fallback e ausência de JavaScript, teclado, FAQ, avisos de instalação, responsividade e WCAG A/AA com axe. Capturas de revisão são geradas em `test-results/` e não são versionadas. Não existe workflow de GitHub Actions.

## Assets e hospedagem

`dist/assets/brand.svg` reutiliza a marca do aplicativo. A imagem social existente é preservada. Fontes locais, sem fontes externas ou analytics. A única consulta externa da página é ao manifesto público de distribuição. Qualquer hospedagem estática pode servir `dist/`. `.openai/hosting.json` identifica a hospedagem Sites existente, preservando seu acesso privado. O repositório do site é https://github.com/Benfic4rthur/JACOPIEI-SITE.
