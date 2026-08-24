#!/usr/bin/env bash

# TaQuanto? — Script de Inicialização Linux

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CD_MOBILE="$PROJECT_DIR/mobile"
CD_BACKEND="$PROJECT_DIR/backend"

LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="127.0.0.1"
fi

TUNNEL_SUBDOMAIN="taquantoapp-cleilton"
TUNNEL_DOMAIN="https://${TUNNEL_SUBDOMAIN}.loca.lt"

# .env do próprio projeto (onde o NGROK_AUTHTOKEN fica salvo)
PROJECT_ENV="$PROJECT_DIR/backend/.env"

# PIDs globais para cleanup
TUNNEL_PID=""
BACKEND_PID=""

cleanup() {
    echo ""
    echo "🛑 Encerrando todos os processos iniciados..."
    [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "=================================================="
echo "🛒 TAQUANTO? — SELECIONE O MODO DE EXECUÇÃO"
echo "=================================================="
echo "1) Localtunnel completo (Backend + Tunnel + Expo via tunnel)"
echo "   ↳ API:   ${TUNNEL_DOMAIN}"
echo "   ↳ Metro: tunnel — Expo Go funciona sem rede local"
echo "2) Rede Local (Backend + Expo via LAN)"
echo "   ↳ URL: http://${LOCAL_IP}:8000"
echo "3) Apenas Backend (FastAPI)"
echo "4) Apenas Frontend — Expo via tunnel"
echo "5) Apenas Localtunnel (Porta 8000)"
echo "6) Backend + Localtunnel (sem Expo) — para APK instalado no celular"
echo "   ↳ API via túnel: ${TUNNEL_DOMAIN}"
echo "=================================================="

if [ -n "$1" ]; then
    CHOICE="$1"
else
    read -p "Escolha a opção (1-6) [padrão: 2]: " CHOICE
    CHOICE=${CHOICE:-2}
fi

echo ""

# Atualiza o .env do mobile com a URL da API (preserva outras variáveis)
update_mobile_env() {
    local target_url="$1"
    local env_file="$CD_MOBILE/.env"

    if [ -f "$env_file" ] && grep -q "EXPO_PUBLIC_API_URL=" "$env_file"; then
        # Atualiza apenas a linha existente, sem apagar o restante
        sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${target_url}|" "$env_file"
    else
        # Adiciona se não existir
        echo "EXPO_PUBLIC_API_URL=${target_url}" >> "$env_file"
    fi
    echo "✅ mobile/.env configurado com API URL: ${target_url}"
}

start_backend() {
    echo "🧹 Limpando porta 8000 caso esteja ocupada..."
    fuser -k 8000/tcp 2>/dev/null
    sleep 1
    echo "🔄 Iniciando Backend em http://0.0.0.0:8000 ..."
    cd "$CD_BACKEND" || exit
    source venv/bin/activate
    uvicorn app.main:app --reload --reload-exclude 'venv' --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo "✅ Backend rodando (PID: $BACKEND_PID)"
    sleep 2
}

start_tunnel() {
    local MAX_RETRIES=10
    local RETRY_WAIT=15

    echo "🌐 Iniciando Localtunnel no subdomínio '${TUNNEL_SUBDOMAIN}'..."

    for attempt in $(seq 1 $MAX_RETRIES); do
        LT_LOG="/tmp/lt_taquanto_$$.log"
        rm -f "$LT_LOG"

        npx localtunnel --port 8000 --subdomain "$TUNNEL_SUBDOMAIN" > "$LT_LOG" 2>&1 &
        TUNNEL_PID=$!

        echo "⏳ Tentativa ${attempt}/${MAX_RETRIES} — aguardando resposta do túnel..."

        for i in {1..12}; do
            if grep -q "your url is:" "$LT_LOG" 2>/dev/null; then
                break
            fi
            sleep 1
        done

        ACTUAL_TUNNEL_URL=$(grep "your url is:" "$LT_LOG" 2>/dev/null | awk '{print $4}')

        if [ "$ACTUAL_TUNNEL_URL" = "$TUNNEL_DOMAIN" ]; then
            echo "✅ Subdomínio correto obtido: ${ACTUAL_TUNNEL_URL}"
            update_mobile_env "$ACTUAL_TUNNEL_URL"
            return 0
        fi

        echo "⚠️  Subdomínio indisponível (obteve: '${ACTUAL_TUNNEL_URL:-nenhum}'). Aguardando ${RETRY_WAIT}s para nova tentativa..."
        kill "$TUNNEL_PID" 2>/dev/null
        wait "$TUNNEL_PID" 2>/dev/null
        TUNNEL_PID=""
        sleep "$RETRY_WAIT"
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ ERRO: Não foi possível obter o subdomínio '${TUNNEL_DOMAIN}'"
    echo "   após ${MAX_RETRIES} tentativas."
    echo ""
    echo "   Possíveis causas:"
    echo "   • Outra sessão sua ainda está segurando o subdomínio"
    echo "   • O servidor loca.lt está com instabilidade"
    echo ""
    echo "   O que fazer:"
    echo "   1. Aguarde ~2 minutos e rode o script novamente (opção 6)"
    echo "   2. Se persistir, acesse ${TUNNEL_DOMAIN} no navegador"
    echo "      para forçar liberação do subdomínio"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚙️  O backend continua rodando em http://localhost:8000"
    echo "   Pressione Ctrl+C para encerrar."
}

# Configura o authtoken do ngrok (lido do backend/.env do próprio projeto)
configure_ngrok() {
    NGROK_TOKEN=$(grep -E '^NGROK_AUTHTOKEN=' "$PROJECT_ENV" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')

    if [ -z "$NGROK_TOKEN" ]; then
        echo "⚠️  ATENÇÃO: NGROK_AUTHTOKEN não encontrado em '${PROJECT_ENV}'"
        echo "   Adicione a linha: NGROK_AUTHTOKEN=seu_token"
        return 1
    fi

    echo "🔑 Configurando ngrok authtoken..."
    ngrok authtoken "$NGROK_TOKEN" > /dev/null 2>&1 && echo "✅ Ngrok autenticado com sucesso."
}

# Expo via tunnel do Metro — Expo Go acessa via internet (sem precisar de rede local)
start_frontend_tunnel() {
    configure_ngrok
    echo "📱 Iniciando Frontend (Expo — Metro via tunnel)..."
    echo "   → O QR code gerado funcionará via internet no Expo Go"
    cd "$CD_MOBILE" || exit
    npx expo start --tunnel --clear
}

# Expo via LAN — Expo Go precisa estar na mesma rede Wi-Fi
start_frontend_lan() {
    echo "📱 Iniciando Frontend (Expo — Metro via LAN)..."
    cd "$CD_MOBILE" || exit
    export REACT_NATIVE_PACKAGER_HOSTNAME="$LOCAL_IP"
    npx expo start --clear
}

case "$CHOICE" in
    1)
        start_backend
        start_tunnel
        start_frontend_tunnel
        ;;
    2)
        update_mobile_env "http://${LOCAL_IP}:8000"
        start_backend
        start_frontend_lan
        ;;
    3)
        start_backend
        echo "📌 Pressione Ctrl+C para encerrar o backend."
        wait $BACKEND_PID
        ;;
    4)
        update_mobile_env "$TUNNEL_DOMAIN"
        start_frontend_tunnel
        ;;
    5)
        npx localtunnel --port 8000 --subdomain "$TUNNEL_SUBDOMAIN"
        ;;
    6)
        start_backend
        start_tunnel
        echo ""
        echo "📱 APK pronto para conectar em: ${ACTUAL_TUNNEL_URL:-$TUNNEL_DOMAIN}/api/v1"
        echo "📌 Pressione Ctrl+C para encerrar o backend e o túnel."
        wait $BACKEND_PID
        ;;
    *)
        echo "❌ Opção inválida. Use de 1 a 6."
        exit 1
        ;;
esac
