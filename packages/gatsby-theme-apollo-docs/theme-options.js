const navConfig = {
  'Apollo Basics': {
    url: 'https://www.apollographql.com/docs',
    description:
      'Learn about each part of the Apollo platform and how they all work together.',
    omitLandingPage: true
  },
  'Apollo Server': {
    url: 'https://www.apollographql.com/docs/apollo-server',
    description:
      'Configure a production-ready GraphQL server to fetch and combine data from multiple sources.'
  },
  'Apollo Client (React)': {
    url: 'https://www.apollographql.com/docs/react',
    description:
      "Manage the entirety of your React app's state and seamlessly execute GraphQL operations."
  },
  'Apollo Studio': {
    url: 'https://www.apollographql.com/docs/graph-manager',
    description:
      "Build your graph with your team, evolve it safely, and keep it running smoothly."
  },
  'Apollo Client (iOS)': {
    url: 'https://www.apollographql.com/docs/ios',
    description:
      "Manage the entirety of your iOS app's state and seamlessly execute GraphQL operations."
  },
  'Apollo Client (Android)': {
    url: 'https://www.apollographql.com/docs/android',
    description:
      "Manage the entirety of your Android app's state and seamlessly execute GraphQL operations.",
    omitLandingPage: true
  }
};

const footerNavConfig = {
  Blog: {
    href: 'https://blog.apollographql.com/',
    target: '_blank',
    rel: 'noopener noreferrer'
  },
  Contribute: {
    href: 'https://www.apollographql.com/docs/community/'
  },
  'GraphQL Summit': {
    href: 'https://summit.graphql.com/',
    target: '_blank',
    rel: 'noopener noreferrer'
  }
};

module.exports = {
  siteName: 'Apollo Docs',
  pageTitle: 'Apollo GraphQL Docs',
  menuTitle: 'Apollo Platform',
  gaTrackingId: 'UA-74643563-13',
  algoliaApiKey: '768e823959d35bbd51e4b2439be13fb7',
  algoliaIndexName: 'apollodata',
  baseUrl: 'https://www.apollographql.com',
  twitterHandle: 'apollographql',
  spectrumHandle: 'apollo',
  youtubeUrl: 'https://www.youtube.com/channel/UC0pEW_GOrMJ23l8QcrGdKSw',
  logoLink: 'https://www.apollographql.com/docs/',
  baseDir: 'docs',
  contentDir: 'source',
  navConfig,
  footerNavConfig,
  ffWidgetId: '3131c43c-bfb5-44e6-9a72-b4094f7ec028'
};
