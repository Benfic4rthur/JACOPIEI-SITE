// Dados ainda não definidos ficam nulos: nunca exibir links fictícios.
export const product = Object.freeze({
  name: 'JáCopiei?',
  version: '0.3.0',
  price: { amount: 29.99, currency: 'BRL', interval: 'mês' },
  release: {
    metadataUrl: 'https://raw.githubusercontent.com/Benfic4rthur/JaCopiei-Releases/main/latest.json',
    releasesUrl: 'https://github.com/Benfic4rthur/JaCopiei-Releases/releases',
    repositoryUrl: 'https://github.com/Benfic4rthur/JaCopiei-Releases',
  },
  subscriptionAvailable: false,
  siteUrl: 'https://jacopiei.arthur-benfica.chatgpt.site',
  contact: null,
  company: { name: 'Allm4', cnpj: null, address: null },
  links: { product: null, privacy: null, terms: null },
});
