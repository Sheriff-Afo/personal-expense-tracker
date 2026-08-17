module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // Prevent babel-preset-expo from auto-loading react-native-worklets/plugin
          // a second time. nativewind/babel (via react-native-css-interop/babel.js)
          // already includes the worklets plugin in its own plugin list.
          // Double-loading the same Babel plugin causes transform conflicts.
          worklets: false,
        },
      ],
      'nativewind/babel',
    ],
  };
};
