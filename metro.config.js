const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  return {
    ...defaultConfig,
    resolver: {
      sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
      assetExts: [...defaultConfig.resolver.assetExts, 'json'],
    },
  };
})();