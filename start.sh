#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RENDER_API_URL="https://taquanto-jv0e.onrender.com"
LOCAL_IP=$(hostname -I | awk '{for (i = 1; i <= NF; i++) if ($i ~ /^[0-9.]+$/) { print $i; exit }}')

printf '%s\n' \
    '==================================================' \
    '🛒 TAQUANTO? — FRONTEND' \
    '==================================================' \
    '1) Expo via LAN — API no Render (produção)' \
    "   ↳ API:   $RENDER_API_URL" \
    '2) Expo via LAN — API local (requer backend rodando na porta 8000)' \
    '3) Expo via tunnel — API no Render' \
    '=================================================='

CHOICE=${1:-}
if [[ -z "$CHOICE" ]]; then
    read -r -p 'Escolha a opção (1-3) [padrão: 1]: ' CHOICE
    CHOICE=${CHOICE:-1}
fi

API_URL="$RENDER_API_URL"
METRO_MODE=--lan
case "$CHOICE" in
    1) ;;
    2)
        if [[ -z "$LOCAL_IP" ]]; then
            echo 'Conecta o computador à rede local para usar o backend no celular.' >&2
            exit 1
        fi
        API_URL="http://${LOCAL_IP}:8000"
        ;;
    3) METRO_MODE=--tunnel ;;
    *)
        echo 'Opção inválida. Use 1, 2 ou 3.' >&2
        exit 1
        ;;
esac

cd -- "$PROJECT_DIR/mobile"
if [[ ! -x node_modules/.bin/expo ]]; then
    echo 'Instala as dependências do app com: cd mobile && npm ci' >&2
    exit 1
fi

export EXPO_PUBLIC_API_URL="$API_URL"
export EXPO_NO_METRO_WORKSPACE_ROOT=1
export WATCHMAN_DISABLED=true
if [[ "$METRO_MODE" == --lan && -n "$LOCAL_IP" ]]; then
    export REACT_NATIVE_PACKAGER_HOSTNAME="$LOCAL_IP"
fi

printf '\n✅ API URL: %s\n' "$API_URL"
exec ./node_modules/.bin/expo start "$METRO_MODE" --clear
