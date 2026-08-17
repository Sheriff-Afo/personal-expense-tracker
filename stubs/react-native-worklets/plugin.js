/**
 * No-op Babel plugin stub for react-native-worklets/plugin.
 *
 * react-native-css-interop/babel.js (used by nativewind/babel) unconditionally
 * requires this plugin for reanimated-v4 worklet transform support. Our app does
 * not use worklets at runtime — the drawer and all animations use React Native's
 * built-in Animated API. Providing a no-op plugin satisfies the require() without
 * adding any native Android module that would need to be compiled by Gradle.
 */
module.exports = function reactNativeWorkletsPlugin() {
  return {
    visitor: {},
  };
};
