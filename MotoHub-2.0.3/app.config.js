module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const plugins = (config.plugins ?? []).filter((item) =>
    (Array.isArray(item) ? item[0] : item) !== 'react-native-maps');

  return {
    ...config,
    extra: { ...config.extra, androidMapsConfigured: Boolean(googleMapsApiKey) },
    plugins: googleMapsApiKey
      ? [
          ...plugins,
          ['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }],
        ]
      : plugins,
  };
};
