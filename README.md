# JáCopiei? by Allm4 — Site

Site de apresentação do JáCopiei?, com visual inspirado no aplicativo e demonstração interativa inteiramente fictícia. HTML, CSS e JavaScript nativos; nenhuma dependência de produção, backend ou acesso aos arquivos do visitante.

## Executar

Requer Node.js 20 ou superior.

```sh
npm install
npm run dev
```

Abra http://127.0.0.1:4173. O conteúdo publicável está em `dist/`, que contém os arquivos-fonte estáticos e não deve ser apagada como pasta de build. Não existe etapa de compilação.

## Configuração do lançamento

Edite `dist/config.js`: preço, versão, disponibilidade pública, link HTTPS real do instalador, contratação dentro do app, contato e links institucionais. O botão de download exige `publicAvailable: true` e `downloadUrl` válido. Use somente o endereço de um instalador real; nunca um arquivo de código-fonte. O estado inicial é pré-lançamento, preço previsto de R$ 29,99/mês e contratação indisponível.

Campos institucionais ausentes ficam `null`, sem links fictícios. O link para a seção “Como seus arquivos são conferidos” é uma explicação do produto, não uma política jurídica. A marca responsável é Allm4. CNPJ, endereço e documentos jurídicos permanecem sem preenchimento até existirem dados reais. Quando mudar o domínio, atualize `siteUrl` e as URLs absolutas do canonical e das imagens sociais em `dist/index.html`.

## Demonstrações

A janela modal mantém a página compacta e apresenta duas abas claramente separadas. Na 0.2.0: 50 arquivos fictícios, 48 correspondências e dois itens sem cópia encontrada. Permite pausar, continuar, ir ao resultado, filtrar e repetir. A comparação simulada não copia, transfere, apaga ou lê arquivos reais. Com movimento reduzido, o botão apresenta o resultado imediatamente. Ao sair da aba, a animação pausa.

A aba “Copiar faltantes · 0.3” é marcada como “Em desenvolvimento para a versão 0.3”. Simula seleção, revisão de quantidade/tamanho/espaço, aviso sobre mesmo volume, cópia seguida de conferência, cancelamento e nova tentativa dos pendentes. Somente uma conferência concluída atualiza o total confirmado. Nenhuma operação real de arquivo acontece. Os oito recursos previstos estão disponíveis em uma seção expansível.

Release verificada em 7 de outubro de 2026: v0.2.0 publicada, sem instaladores anexados. A release inclui código-fonte; por isso o site mantém a distribuição pública em preparação e não exibe download.

## Verificação

```sh
npx playwright install chromium
npm run check
npm test
```

Os testes cobrem a demonstração, seus filtros e controles, cópia simulada da 0.3, cancelamento/retentativa, modal por teclado, finalização automática, movimento reduzido, FAQ por teclado, navegação, estágio de lançamento, responsividade (320, 390, 768 e 1440px) e WCAG A/AA com axe. Capturas de revisão são geradas em `test-results/` e não são versionadas.

## Assets e publicação

A marca `dist/assets/brand.svg` foi reutilizada do projeto original JáCopiei?. A imagem de compartilhamento `dist/assets/social.png` foi criada para este site. Fontes usam Tahoma e alternativas locais, sem requisições externas de fontes, bibliotecas ou analytics.

Qualquer hospedagem estática pode servir `dist/`. A configuração de prévia privada no Sites está em `.openai/hosting.json`. O repositório de referência é https://github.com/Benfic4rthur/JACOPIEI-SITE.
