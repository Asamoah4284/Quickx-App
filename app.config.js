/**
 * Adds settings that only development builds should have on top of app.json.
 *
 * Release builds talk to the live HTTPS server only, so plain-HTTP access is off.
 * Development builds (APP_VARIANT=development, set in eas.json) may reach a backend on
 * your computer over the local network.
 */
module.exports = ({ config }) => {
  const dev = process.env.APP_VARIANT === 'development';
  if (!dev) return config;

  return {
    ...config,
    name: `${config.name} (dev)`,
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios.bundleIdentifier}.dev`,
      infoPlist: {
        ...config.ios.infoPlist,
        NSLocalNetworkUsageDescription: 'QuickX Learn uses your local network to reach the QuickX server while developing.',
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true, NSAllowsLocalNetworking: true },
      },
    },
    android: {
      ...config.android,
      package: `${config.android.package}.dev`,
      usesCleartextTraffic: true,
    },
  };
};
