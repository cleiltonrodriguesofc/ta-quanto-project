import { useEffect, useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const HEALTH_URL = `${API_URL}/health`;
// Tempo máximo para aguardar o cold start do Render Free (plano free hiberna)
const WARMUP_TIMEOUT_MS = 35_000;

export type WarmupStatus = 'loading' | 'ready' | 'timeout' | 'error';

export interface BackendHealth {
  status: WarmupStatus;
  /** Latência do DB reportada pelo backend (ms), disponível quando status === 'ready' */
  dbLatencyMs?: number;
  /** Uptime do processo no Render (s), disponível quando status === 'ready' */
  uptimeSeconds?: number;
  /** Tempo total do warmup (ms) */
  elapsedMs?: number;
}

/**
 * Faz um ping no /health do backend assim que o app abre.
 * Resolve o problema de cold start do Render (plano free): acorda o servidor
 * antes do usuário tentar logar, evitando timeout de 30s na tela de login.
 *
 * @example
 * const { status, dbLatencyMs } = useBackendWarmup();
 * if (status === 'loading') return <WarmingUpBanner />;
 */
export function useBackendWarmup(): BackendHealth {
  const [health, setHealth] = useState<BackendHealth>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, WARMUP_TIMEOUT_MS);

    const ping = async () => {
      try {
        console.log(`[Warmup] Pingando ${HEALTH_URL}...`);
        const response = await fetch(HEALTH_URL, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (cancelled) return;

        const elapsed = Date.now() - started;

        if (response.ok) {
          const data = await response.json();
          console.log(`[Warmup] Backend pronto em ${elapsed}ms`, data);
          setHealth({
            status: 'ready',
            dbLatencyMs: data?.database?.latency_ms,
            uptimeSeconds: data?.uptime_seconds,
            elapsedMs: elapsed,
          });
        } else {
          // Backend respondeu mas com erro (ex: DB fora — 503)
          console.warn(`[Warmup] Backend respondeu com status ${response.status}`);
          setHealth({ status: 'error', elapsedMs: elapsed });
        }
      } catch (err: any) {
        if (cancelled) return;
        const elapsed = Date.now() - started;

        if (err?.name === 'AbortError') {
          console.warn(`[Warmup] Timeout após ${elapsed}ms — backend não respondeu.`);
          setHealth({ status: 'timeout', elapsedMs: elapsed });
        } else {
          console.error('[Warmup] Erro de rede:', err?.message);
          setHealth({ status: 'error', elapsedMs: elapsed });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    ping();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return health;
}
