# Catálogo próprio de produtos

## Objetivo

Priorizar leituras no cache local e no catálogo central do TaQuanto?, usando fontes externas somente quando ainda não houver dados. Produtos de uso frequente ficam disponíveis no app para leituras futuras.

## Implementado

- Tabela própria por código de barras com nome, marca, imagem, categorias, fonte/licença, contagem de consultas e atualização.
- Todo preço com nome e código de barras semeia/atualiza o catálogo central.
- Consulta por código de barras verifica o catálogo e preços comunitários antes de Open Food Facts e Cosmos. Respostas externas encontradas são guardadas.
- O app verifica o AsyncStorage primeiro, baixa em segundo plano até 200 produtos mais consultados e grava resultados novos para leituras seguintes.
- Importador agendável percorre páginas por categoria, pausa entre chamadas e salva a página atual no banco para continuar na próxima execução.
- A tela de cadastro mostra a atribuição para registros de Open Food Facts.

## Importação agendada

O código está em `backend/scripts/sync_product_catalog.py`. A configuração inicial usa cinco categorias alimentares e importa até 50 itens por categoria em cada execução (até 250 itens por ciclo). O volume é configurável:

- `PRODUCT_CATALOG_CATEGORIES`: tags separadas por vírgula.
- `PRODUCT_CATALOG_PAGES_PER_RUN`: páginas por categoria (padrão 1).
- `PRODUCT_CATALOG_REQUEST_INTERVAL_SECONDS`: pausa entre chamadas (padrão 6 segundos).
- `TAQUANTO_CONTACT_URL`: URL identificadora no User-Agent.

Comando, a partir da pasta `backend`:

```sh
python -m scripts.sync_product_catalog
```

No Render, cria um **Cron Job** separado apontando para o mesmo repositório, diretório raiz `backend`, as mesmas variáveis do backend e o comando acima. Recomendo uma execução diária para começar; a posição de cada categoria fica no banco. Cron Jobs usam compute próprio e não estão disponíveis no plano gratuito. O código está no repositório, mas a criação do serviço no Render exige configuração no painel e pode gerar custo; não alterei o serviço hospedado.

## Fontes, qualidade e licença

A importação inicial usa Open Food Facts. A fonte informa que os dados são colaborativos e podem estar incompletos ou incorretos. O catálogo registra a fonte e a licença por produto. A base Open Food Facts está sob ODbL/DbCL, e imagens sob CC BY-SA; atribuição e compatibilidade de redistribuição devem ser mantidas ao combinar ou publicar os dados. Não adiciones uma fonte sem verificar seus termos de armazenamento e redistribuição.

Open Food Facts limita buscas a 10 requisições por minuto por IP e pede User-Agent identificável. O importador envia um User-Agent TaQuanto próprio, opera sequencialmente e usa intervalo configurável.

## Google

Não implementei scraping dos resultados do Google: a política oficial proíbe tráfego de pesquisa automatizado sem permissão. A Custom Search JSON API está fechada para novos clientes e será descontinuada em 1º de janeiro de 2027, por isso não é uma base sustentável para o catálogo. O abastecimento usa fontes de produto com API/dados próprios e termos verificáveis.

## Próximas etapas operacionais

1. Criar o Cron Job no Render e acompanhar a primeira execução.
2. Confirmar as categorias adequadas ao Brasil e avaliar bases abertas de higiene, beleza e pet com licença compatível.
3. Expandir a atribuição da fonte nas outras telas que exibem dados de produto.
4. Verificar/renovar os tokens Cosmos, UPCItemDB e Go-UPC antes de depender deles. O catálogo local continua servindo registros já importados ou contribuídos mesmo sem esses tokens.
