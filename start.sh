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
# O LocalTunnel (loca.lt) está instável. Usaremos localhost.run para o backend de forma dinâmica.
TUNNEL_DOMAIN="Túnel Dinâmico (localhost.run)"

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
echo "1) Túnel Completo (Backend via ssh + Expo via tunnel)"
echo "   ↳ API:   ${TUNNEL_DOMAIN}"
echo "   ↳ Metro: tunnel — Expo Go funciona sem rede local"
echo "2) Rede Local (Backend + Expo via LAN)"
echo "   ↳ URL: http://${LOCAL_IP}:8000"
echo "3) Apenas Backend (FastAPI)"
echo "4) Apenas Frontend — Expo via tunnel (Requer Backend já online)"
echo "5) Apenas Tunnel SSH (Porta 8000)"
echo "6) Backend + Tunnel SSH (sem Expo) — para APK instalado no celular"
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
    echo "🌐 Iniciando Túnel SSH (localhost.run) para o backend..."
    
    LT_LOG="/tmp/lt_taquanto_$$.log"
    rm -f "$LT_LOG"

    ssh -o StrictHostKeyChecking=no -R 80:localhost:8000 nokey@localhost.run > "$LT_LOG" 2>&1 &
    TUNNEL_PID=$!

    echo "⏳ Aguardando obtenção da URL do túnel..."

    ACTUAL_TUNNEL_URL=""
    for i in {1..15}; do
        ACTUAL_TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.lhr\.life' "$LT_LOG" | head -n 1)
        if [ -n "$ACTUAL_TUNNEL_URL" ]; then
            break
        fi
        sleep 1
    done

    if [ -n "$ACTUAL_TUNNEL_URL" ]; then
        echo "✅ URL do túnel obtida: ${ACTUAL_TUNNEL_URL}"
        update_mobile_env "$ACTUAL_TUNNEL_URL"
        
        # Para opção 4, salva a URL num arquivo temporário
        echo "$ACTUAL_TUNNEL_URL" > /tmp/taquanto_tunnel_url.txt
        return 0
    else
        echo "⚠️  Não foi possível obter a URL via localhost.run."
        echo "LOG:"
        cat "$LT_LOG"
        echo ""
        echo "⚙️  O backend continua rodando em http://localhost:8000"
        return 1
    fi
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
        if [ -f /tmp/taquanto_tunnel_url.txt ]; then
            ACTUAL_TUNNEL_URL=$(cat /tmp/taquanto_tunnel_url.txt)
            update_mobile_env "$ACTUAL_TUNNEL_URL"
        else
            echo "⚠️  Aviso: Nenhuma URL de túnel dinâmico encontrada."
            echo "Certifique-se de ter rodado o túnel (Opção 1, 5 ou 6) primeiro."
        fi
        start_frontend_tunnel
        ;;
    5)
        ssh -o StrictHostKeyChecking=no -R 80:localhost:8000 nokey@localhost.run
        ;;
    6)
        start_backend
        start_tunnel
        echo ""
        echo "📱 APK pronto para conectar em: ${ACTUAL_TUNNEL_URL}/api/v1"
        echo "📌 Pressione Ctrl+C para encerrar o backend e o túnel."
        wait $BACKEND_PID
        ;;
    *)
        echo "❌ Opção inválida. Use de 1 a 6."
        exit 1
        ;;
esac
