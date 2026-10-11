// metro.config.js
//
// IMPORTANTE: O projeto está em um HD externo formatado em NTFS (fuseblk).
// O Linux não suporta inotify em NTFS, então o Metro falha ao tentar iniciar
// o watch mode com o watcher nativo.
//
// Solução: forçar polling via `watchman: false` + opção de intervalo.
// O Watchman (se instalado) funciona mesmo em NTFS; sem ele, o Metro usa
// o NativeWatcher que depende de inotify — por isso precisamos do polling.
//
// Referência: https://metrobundler.dev/docs/configuration#watcheroptions

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Força polling para compatibilidade com NTFS (HD externo fuseblk)
// sem depender de inotify ou watchman
config.watchFolders = [__dirname];
config.watcher = {
  // Desabilita watchman e inotify; usa poll-based watcher
  healthCheck: {
    enabled: false,
  },
  additionalExts: ['mjs', 'cjs'],
};

module.exports = config;
