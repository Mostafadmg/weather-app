export default {
  base: '/weather-app/',
  css: {
    devSourcemap: true,
  },
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
};
