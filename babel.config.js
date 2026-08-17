module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // Prevent babel-preset-expo from loading react-native-worklets/plugin.
          // We provide a no-op stub so react-native-css-interop/babel.js can
          // require() it without error, but we don't want the real worklet
          // transform (there are no 'worklet' directives in this codebase).
          worklets: false,
          // Let babel-preset-expo auto-load react-native-reanimated/plugin —
          // NativeWind (react-native-css-interop) uses reanimated v3 at runtime.
        },
      ],
      'nativewind/babel',
    ],
  };
};
