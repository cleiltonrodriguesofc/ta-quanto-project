#!/bin/bash

# start.sh - Script de inicialização do TaQuanto

show_help() {
    echo "========================================="
    echo "🚀 TaQuanto? - Gerenciador de Serviços"
    echo "========================================="
    echo "Uso: ./start.sh [OPÇÃO]"
    echo ""
    echo "Opções disponíveis:"
    echo "  backend    - Inicia apenas o servidor FastAPI (com fallback de porta)"
    echo "  frontend   - Inicia apenas o app Expo Go"
    echo "  tunnel     - Inicia apenas o Localtunnel na porta definida"
    echo "  all        - Inicia TODOS simultaneamente (Backend + Tunnel + Frontend)"
    echo "  help       - Mostra esta mensagem de ajuda"
    echo "========================================="
}

find_available_port() {
    PORT=8000
    # Checa se a porta está respondendo. Se sim, está ocupada.
    while (echo > /dev/tcp/127.0.0.1/$PORT) >/dev/null 2>&1; do
        echo "⚠️ Porta $PORT em uso, tentando $((PORT+1))..."
        PORT=$((PORT+1))
    done
    echo "✅ Porta $PORT disponível e selecionada!"
}

start_backend() {
    echo "🟢 Iniciando Backend FastAPI na porta $PORT..."
    cd backend || exit
    source venv/bin/activate
    export DATABASE_URL="sqlite+aiosqlite:///./taquanto.db"
    
    # O on_startup do main.py já cria as tabelas automaticamente
    uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload
}

start_tunnel() {
    echo "🌐 Iniciando Localtunnel apontando para a porta $PORT..."
    echo "🔗 URL pública: https://taquanto.loca.lt"
    npx localtunnel --port $PORT --subdomain taquanto
}

start_frontend() {
    echo "📱 Iniciando Frontend Expo..."
    npx expo start -c --tunnel
}

start_all() {
    echo "🔥 Iniciando todo o ecossistema (Full Stack)..."

    find_available_port

    # Atualiza o .env para usar a URL do tunnel
    echo "EXPO_PUBLIC_API_URL=https://taquanto.loca.lt" > .env
    echo "✅ .env do frontend atualizado com a URL: https://taquanto.loca.lt"

    (start_backend) & 
    BACKEND_PID=$!
    
    sleep 2
    
    (start_tunnel) &
    TUNNEL_PID=$!

    sleep 3
    
    (start_frontend) &
    FRONTEND_PID=$!
    
    trap "echo -e '\n🔴 Encerrando processos (Backend, Tunnel e Frontend)...'; kill $BACKEND_PID $TUNNEL_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
    
    echo "✅ Ecossistema no ar! Pressione Ctrl+C para derrubar tudo."
    wait
}

case "$1" in
    backend)
        find_available_port
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    tunnel)
        find_available_port
        start_tunnel
        ;;
    all)
        start_all
        ;;
    *)
        show_help
        ;;
esac
