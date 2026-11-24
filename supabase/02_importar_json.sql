-- =====================================================================
-- AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
-- Modelo: Claude Opus 5.5 (claude-opus-5-5)
-- Solicitante: rosameire.henriques@vmimedica.com.br
--
-- Importar os arquivos .json da pasta "dados" (versão anterior).
-- Como usar, para CADA arquivo:
--   1. Abra o arquivo (ex.: juridico.json) no Bloco de Notas, Ctrl+A, Ctrl+C.
--   2. Aqui no SQL Editor, apague o texto COLE_AQUI do bloco do setor e cole (Ctrl+V)
--      entre as duas marcas $json$ (as marcas precisam ficar).
--   3. Selecione SÓ o bloco daquele setor (do "select" até o ";") e clique em Run.
--      O resultado mostra quantos registros foram importados.
-- Pode repetir: registros da mesma data são atualizados, não duplicados.
-- Blocos de arquivos que você não tem: simplesmente não rode.
-- =====================================================================

-- Jurídico (juridico.json)
select public.importar_json('juridico', $json$
COLE_AQUI
$json$);

-- Público (publico.json)
select public.importar_json('publico', $json$
COLE_AQUI
$json$);

-- Captação (captacao.json)
select public.importar_json('captacao', $json$
COLE_AQUI
$json$);

-- Privado (privado.json)
select public.importar_json('privado', $json$
COLE_AQUI
$json$);

-- Especialista (especialista.json)
select public.importar_json('especialista', $json$
COLE_AQUI
$json$);

-- Geral (geral.json)
select public.importar_json('geral', $json$
COLE_AQUI
$json$);

-- Feriados extras que vocês incluíram no config.json (opcional)
select public.importar_feriados($json$
COLE_AQUI
$json$);

-- Conferência: quantos registros por setor e período
select setor, count(*) as registros, min(data_ref) as primeira_data, max(data_ref) as ultima_data
from public.registros group by setor order by setor;
