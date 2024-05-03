const { createMetroConfiguration } = require("expo-yarn-workspaces");

const config = createMetroConfiguration(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
  extraNodeModules: {
    ...require("node-libs-react-native"),
    ...require("expo-crypto-polyfills"),
  },
};

config.resolver.blockList = [config.resolver?.blockList ?? [], /\/\.build\/.*/].flat();

module.exports = config;
