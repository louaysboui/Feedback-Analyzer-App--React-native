module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          allowlist: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};