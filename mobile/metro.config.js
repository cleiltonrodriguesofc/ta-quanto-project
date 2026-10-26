// metro.config.js
//
// IMPORTANTE: O projeto está em um HD externo formatado em NTFS (fuseblk).
// O Linux não suporta inotify/fanotify em NTFS, então o Metro pode travar
// ao tentar iniciar o file watcher nativo.
//
// Medidas tomadas:
// 1. EXPO_NO_METRO_WORKSPACE_ROOT=1 no start.sh → não monitora o diretório pai
// 2. watchFolders restrito a __dirname (mobile/) apenas
// 3. Exclui node_modules_old e .expo do watch (se existirem)
// 4. watchman desabilitado (não está instalado; evita timeout na detecção)
//
// Referência: https://metrobundler.dev/docs/configuration

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Restringe o watch apenas ao diretório mobile/
config.watchFolders = [__dirname];

// Exclui pastas pesadas que o Metro não precisa monitorar
// (node_modules_old é um backup antigo que duplica o crawl em NTFS)
const blockList = config.resolver.blockList
  ? Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]
  : [];

blockList.push(
  new RegExp(path.resolve(__dirname, 'node_modules_old').replace(/[/\\]/g, '[/\\\\]') + '.*'),
);

config.resolver.blockList = blockList;

// Desabilita watchman (não instalado) e health check para NTFS
config.watcher = {
  watchman: {
    enabled: false,
  },
  healthCheck: {
    enabled: false,
  },
  additionalExts: ['mjs', 'cjs'],
};

module.exports = config;
