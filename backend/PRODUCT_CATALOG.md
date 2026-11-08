# Catálogo próprio de produtos

## Objetivo

Priorizar leituras no cache local e no catálogo central do TaQuanto?, usando fontes externas somente quando ainda não houver dados. Produtos de uso frequente ficam disponíveis no app para leituras futuras.

## Implementado

- Tabela própria por código de barras com nome, marca, imagem, categorias, fonte/licença, contagem de consultas e atualização.
- Todo preço com nome e código de barras semeia/atualiza o catálogo central.
- Consulta por código de barras verifica o catálogo e preços comunitários antes de Open Food Facts e Cosmos. Respostas externas encontradas são guardadas.
- O app verifica o AsyncStorage primeiro, baixa em segundo plano até 200 produtos mais consultados e grava resultados novos para leituras seguintes.
- O FastAPI inicia uma tarefa assíncrona no próprio processo e roda a importação automaticamente, com intervalo configurável. O progresso de cada categoria fica salvo no banco para retomar depois de reinícios.
- A tela de cadastro mostra a atribuição para registros de Open Food Facts.

## Agendador integrado ao FastAPI

O FastAPI inicia a rotina de importação no startup; não é preciso criar um Cron Job ou outro serviço no Render. A primeira execução começa após 60 segundos por padrão e se repete a cada 24 horas. Cada ciclo consulta as categorias configuradas, com pausa entre requisições. A posição de cada categoria permanece no banco, então a importação continua após reinício do processo.

Variáveis configuráveis:

- `PRODUCT_CATALOG_SYNC_ENABLED`: ativa/desativa a tarefa (padrão `true`).
- `PRODUCT_CATALOG_SYNC_INTERVAL_SECONDS`: intervalo entre ciclos (padrão `86400`).
- `PRODUCT_CATALOG_SYNC_START_DELAY_SECONDS`: atraso após o startup (padrão `60`).
- `PRODUCT_CATALOG_CATEGORIES`: tags separadas por vírgula.
- `PRODUCT_CATALOG_PAGES_PER_RUN`: páginas por categoria (padrão 1).
- `PRODUCT_CATALOG_REQUEST_INTERVAL_SECONDS`: pausa entre chamadas (padrão 6 segundos).
- `TAQUANTO_CONTACT_URL`: URL identificadora no User-Agent da Open Food Facts.

A rotina também pode ser executada manualmente a partir da pasta `backend`:

```sh
python -m scripts.sync_product_catalog
```

O Render gratuito suspende um web service após 15 minutos sem tráfego de entrada. Os pings frequentes do monitor de uptime contam como tráfego, então, enquanto eles continuarem chegando, o processo e o agendador permanecem ativos. Se houver suspensão ou reinício, tarefas em memória param; o ciclo volta no próximo startup e o progresso já salvo no banco é retomado. https://render.com/docs/free

## Fontes, qualidade e licença

A importação inicial usa Open Food Facts. A fonte informa que os dados são colaborativos e podem estar incompletos ou incorretos. O catálogo registra a fonte e a licença por produto. A base Open Food Facts está sob ODbL/DbCL, e imagens sob CC BY-SA; atribuição e compatibilidade de redistribuição devem ser mantidas ao combinar ou publicar os dados. Não adiciones uma fonte sem verificar seus termos de armazenamento e redistribuição.

Open Food Facts limita buscas a 10 requisições por minuto por IP e pede User-Agent identificável. O importador envia um User-Agent TaQuanto próprio, opera sequencialmente e usa intervalo configurável.

## Google

Não implementei scraping dos resultados do Google: a política oficial proíbe tráfego de pesquisa automatizado sem permissão. A Custom Search JSON API está fechada para novos clientes e será descontinuada em 1º de janeiro de 2027, por isso não é uma base sustentável para o catálogo. O abastecimento usa fontes de produto com API/dados próprios e termos verificáveis.

## Próximas etapas operacionais

1. Criar o Cron Job no Render e acompanhar a primeira execução.
2. Confirmar as categorias adequadas ao Brasil e avaliar bases abertas de higiene, beleza e pet com licença compatível.
3. Expandir a atribuição da fonte nas outras telas que exibem dados de produto.
4. Verificar no Render os segredos COSMOS_API_TOKEN e GO_UPC_API_KEY. UPCItemDB usa atualmente a rota trial sem chave no código; confirmar se ainda responde e respeitar a cota. O catálogo continua servindo registros importados ou contribuídos mesmo quando essas integrações falham.
