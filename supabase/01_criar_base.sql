-- =====================================================================
-- AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
-- Modelo: Claude Opus 5.5 (claude-opus-5-5)
-- Solicitante: rosameire.henriques@vmimedica.com.br
--
-- Stand Up Comercial · VMI Médica — criação da base no Supabase
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run.
-- Pode ser executado mais de uma vez sem apagar dados.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------

-- Quem pode usar o sistema e quais setores cada pessoa preenche.
-- setores: lista com 'juridico','juridico_brisa','publico','captacao','privado','especialista','geral'
--          ou '{*}' para todos (administrador). Lista vazia = só visualiza o dashboard.
create table if not exists public.usuarios (
  email      text primary key check (email = lower(email)),
  nome       text,
  setores    text[] not null default '{}',
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- Um registro por setor por dia. Os campos de cada setor ficam em "dados" (JSON),
-- no mesmo formato usado pelos arquivos .json da versão anterior.
create table if not exists public.registros (
  id             bigint generated always as identity primary key,
  setor          text not null check (setor in ('juridico','juridico_brisa','publico','captacao','privado','especialista','geral')),
  data_ref       date not null,
  dados          jsonb not null default '{}'::jsonb,
  responsavel    text not null,
  registrado_por text,
  registrado_em  timestamptz not null default now(),
  constraint registros_setor_data_unq unique (setor, data_ref)
);
create index if not exists registros_data_idx on public.registros (data_ref);

-- Feriados usados no cálculo de dias úteis.
create table if not exists public.feriados (
  data       date primary key,
  descricao  text not null
);

-- ---------------------------------------------------------------------
-- 2. Funções de apoio às regras de acesso
-- ---------------------------------------------------------------------
create or replace function public.email_atual()
returns text language sql stable
set search_path = ''
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.usuario_ativo()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.usuarios u where u.email = public.email_atual() and u.ativo)
$$;

create or replace function public.pode_editar(p_setor text)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios u
    where u.email = public.email_atual() and u.ativo
      and ('*' = any(u.setores) or p_setor = any(u.setores))
  )
$$;

-- Preenche quem gravou e quando (o navegador não consegue falsificar).
create or replace function public.registros_carimbo()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then            -- gravação feita pelo site
    new.registrado_por := public.email_atual();
    new.registrado_em  := now();
  else                                      -- importação pelo SQL Editor
    new.registrado_em  := coalesce(new.registrado_em, now());
  end if;
  return new;
end $$;

drop trigger if exists registros_carimbo on public.registros;
create trigger registros_carimbo before insert or update on public.registros
for each row execute function public.registros_carimbo();

-- ---------------------------------------------------------------------
-- 3. Segurança (Row Level Security)
--    Sem login ninguém lê nem grava. Logado e cadastrado em "usuarios":
--    vê tudo; grava/exclui só os setores liberados para ele.
-- ---------------------------------------------------------------------
alter table public.usuarios  enable row level security;
alter table public.registros enable row level security;
alter table public.feriados  enable row level security;

revoke all on public.usuarios, public.registros, public.feriados from anon;
grant select on public.usuarios, public.feriados to authenticated;
grant select, insert, update, delete on public.registros to authenticated;

drop policy if exists usuarios_ver_proprio on public.usuarios;
create policy usuarios_ver_proprio on public.usuarios
  for select to authenticated using (email = public.email_atual());

drop policy if exists feriados_ler on public.feriados;
create policy feriados_ler on public.feriados
  for select to authenticated using (public.usuario_ativo());

drop policy if exists registros_ler on public.registros;
create policy registros_ler on public.registros
  for select to authenticated using (public.usuario_ativo());

drop policy if exists registros_incluir on public.registros;
create policy registros_incluir on public.registros
  for insert to authenticated with check (public.pode_editar(setor));

drop policy if exists registros_alterar on public.registros;
create policy registros_alterar on public.registros
  for update to authenticated using (public.pode_editar(setor)) with check (public.pode_editar(setor));

drop policy if exists registros_excluir on public.registros;
create policy registros_excluir on public.registros
  for delete to authenticated using (public.pode_editar(setor));

-- ---------------------------------------------------------------------
-- 4. Importação dos arquivos .json da versão anterior
--    (só pode ser chamada pelo SQL Editor; o site não tem acesso)
-- ---------------------------------------------------------------------
create or replace function public.importar_json(p_setor text, p_conteudo jsonb)
returns integer language plpgsql
set search_path = ''
as $$
declare
  v_lista jsonb;
  v_n     integer;
begin
  if p_setor not in ('juridico','juridico_brisa','publico','captacao','privado','especialista','geral') then
    raise exception 'Setor inválido: %', p_setor;
  end if;
  if jsonb_typeof(p_conteudo) = 'object' then
    if p_conteudo ? 'setor' and p_conteudo ->> 'setor' <> p_setor then
      raise exception 'Este arquivo é do setor "%" e não de "%".', p_conteudo ->> 'setor', p_setor;
    end if;
    v_lista := coalesce(p_conteudo -> 'registros', '[]'::jsonb);
  else
    v_lista := p_conteudo;
  end if;

  insert into public.registros (setor, data_ref, dados, responsavel, registrado_em)
  select p_setor,
         (r ->> 'data_ref')::date,
         r - 'data_ref' - 'responsavel' - 'registrado_em' - 'registrado_por',
         coalesce(nullif(trim(r ->> 'responsavel'), ''), '(importado)'),
         case when r ->> 'registrado_em' is null then now()
              else (r ->> 'registrado_em')::timestamp at time zone 'America/Sao_Paulo' end
  from jsonb_array_elements(v_lista) as r
  where r ->> 'data_ref' is not null
  on conflict (setor, data_ref) do update
     set dados = excluded.dados, responsavel = excluded.responsavel, registrado_em = excluded.registrado_em;

  get diagnostics v_n = row_count;
  return v_n;
end $$;

create or replace function public.importar_feriados(p_conteudo jsonb)
returns integer language plpgsql
set search_path = ''
as $$
declare v_n integer;
begin
  insert into public.feriados (data, descricao)
  select (case when jsonb_typeof(f) = 'string' then f #>> '{}' else f ->> 'data' end)::date,
         coalesce(case when jsonb_typeof(f) = 'object' then f ->> 'descricao' end, 'Feriado')
  from jsonb_array_elements(case when jsonb_typeof(p_conteudo) = 'object' then p_conteudo -> 'feriados' else p_conteudo end) as f
  on conflict (data) do update set descricao = excluded.descricao;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke execute on function public.importar_json(text, jsonb) from public, anon, authenticated;
revoke execute on function public.importar_feriados(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Feriados nacionais 2026 e 2027
--    (inclua municipais/estaduais e emendas em Table Editor > feriados)
-- ---------------------------------------------------------------------
insert into public.feriados (data, descricao) values
  ('2026-01-01','Confraternização Universal'), ('2026-02-16','Carnaval'), ('2026-02-17','Carnaval'),
  ('2026-04-03','Sexta-feira Santa'), ('2026-04-21','Tiradentes'), ('2026-05-01','Dia do Trabalho'),
  ('2026-06-04','Corpus Christi'), ('2026-09-07','Independência'), ('2026-10-12','Nossa Senhora Aparecida'),
  ('2026-11-02','Finados'), ('2026-11-15','Proclamação da República'), ('2026-11-20','Consciência Negra'),
  ('2026-12-25','Natal'),
  ('2027-01-01','Confraternização Universal'), ('2027-02-08','Carnaval'), ('2027-02-09','Carnaval'),
  ('2027-03-26','Sexta-feira Santa'), ('2027-04-21','Tiradentes'), ('2027-05-01','Dia do Trabalho'),
  ('2027-05-27','Corpus Christi'), ('2027-09-07','Independência'), ('2027-10-12','Nossa Senhora Aparecida'),
  ('2027-11-02','Finados'), ('2027-11-15','Proclamação da República'), ('2027-11-20','Consciência Negra'),
  ('2027-12-25','Natal')
on conflict (data) do nothing;

-- ---------------------------------------------------------------------
-- 6. Visões para consulta (Table Editor, Excel, Power BI).
--    security_invoker: respeitam as mesmas regras de acesso.
-- ---------------------------------------------------------------------
create or replace view public.v_juridico with (security_invoker = true) as
select data_ref,
       (dados->>'previsto_d1')::numeric   as previsto_dia,
       (dados->>'recebido_d1')::numeric   as recebido_dia,
       (dados->>'diferenca')::numeric     as diferenca,
       (dados->>'previsao_hoje')::numeric as previsao_dia_seguinte,
       (dados->>'recebido_mes')::numeric  as recebido_mes,
       dados->>'obs' as observacoes, responsavel, registrado_por, registrado_em
from public.registros where setor = 'juridico';

create or replace view public.v_captacao with (security_invoker = true) as
select data_ref, (dados->>'captacao')::int as captacao, dados->>'obs' as observacao,
       responsavel, registrado_por, registrado_em
from public.registros where setor = 'captacao';

create or replace view public.v_privado with (security_invoker = true) as
select data_ref, (dados->>'propostas')::int as propostas_geradas,
       coalesce(jsonb_array_length(dados->'itens'), (dados->>'vendas')::int, 0) as qtd_vendas,
       (select coalesce(sum((i->>'valor')::numeric),0) from jsonb_array_elements(coalesce(dados->'itens','[]')) i) as total_vendas,
       coalesce(jsonb_array_length(dados->'alugueis'), 0) as qtd_propostas_aluguel,
       (select coalesce(sum((i->>'valor')::numeric),0) from jsonb_array_elements(coalesce(dados->'alugueis','[]')) i) as total_propostas_aluguel,
       dados->>'obs' as observacoes, responsavel, registrado_por, registrado_em
from public.registros where setor = 'privado';

create or replace view public.v_especialista with (security_invoker = true) as
select data_ref,
       (dados->>'pre_analises')::int as pre_analises, (dados->>'propostas')::int as propostas,
       (dados->>'fund_recurso')::int as fund_recurso, (dados->>'fund_impugnacao')::int as fund_impugnacoes,
       (dados->>'contrarrazoes')::int as contrarrazoes, (dados->>'diligencias')::int as diligencias,
       dados->>'obs' as observacoes, responsavel, registrado_por, registrado_em
from public.registros where setor = 'especialista';

create or replace view public.v_geral with (security_invoker = true) as
select data_ref, (dados->>'total_pedidos_ano')::numeric as total_pedidos_ano,
       (dados->>'meta_global')::numeric as meta_global, (dados->>'propostas_publico')::int as propostas_publico,
       dados->>'obs' as observacoes, responsavel, registrado_por, registrado_em
from public.registros where setor = 'geral';

-- Uma linha por item: vendas do Público, vendas e propostas de aluguel do Privado
create or replace view public.v_itens with (security_invoker = true) as
select r.setor,
       case when l.lista = 'itens' then 'venda' else 'proposta de aluguel' end as tipo,
       r.data_ref, i.ord as item,
       coalesce(i.v->>'cliente', i.v->>'venda') as cliente_ou_venda,
       (i.v->>'valor')::numeric as valor, i.v->>'equipamentos' as equipamento,
       r.responsavel
from public.registros r
cross join lateral (values ('itens'), ('alugueis')) as l(lista)
cross join lateral jsonb_array_elements(coalesce(r.dados -> l.lista, '[]'::jsonb)) with ordinality as i(v, ord)
where r.setor in ('publico','privado');

grant select on public.v_juridico, public.v_captacao, public.v_privado, public.v_especialista, public.v_geral, public.v_itens to authenticated;
revoke all on public.v_juridico, public.v_captacao, public.v_privado, public.v_especialista, public.v_geral, public.v_itens from anon;

create or replace view public.v_juridico_brisa with (security_invoker = true) as
select data_ref,
       (dados->>'com_impugnacoes')::int as comercial_impugnacoes, (dados->>'com_recursos')::int as comercial_recursos,
       (dados->>'com_contrarrazoes')::int as comercial_contrarrazoes, (dados->>'com_direito_peticao')::int as comercial_direito_peticao,
       (dados->>'pv_orientacoes')::int as pos_venda_orientacoes, (dados->>'pv_analises')::int as pos_venda_analises,
       (dados->>'pv_confeccao')::int as pos_venda_confeccao_contratos, (dados->>'pv_notificacao')::int as pos_venda_resposta_notificacao,
       (dados->>'at_orientacoes')::int as assist_tecnica_orientacoes, (dados->>'at_analises')::int as assist_tecnica_analises,
       (dados->>'at_notificacao')::int as assist_tecnica_resposta_notificacao,
       (dados->>'si_orientacoes')::int as serv_imagem_orientacoes, (dados->>'si_analises')::int as serv_imagem_analises,
       (dados->>'si_notificacao')::int as serv_imagem_resposta_notificacao,
       (dados->>'fab_orientacoes')::int as fabrica_orientacoes, (dados->>'fab_analises')::int as fabrica_analises,
       dados->>'obs_com' as obs_comercial, dados->>'obs_pv' as obs_pos_venda, dados->>'obs_at' as obs_assist_tecnica,
       dados->>'obs_si' as obs_serv_imagem, dados->>'obs_fab' as obs_fabrica,
       responsavel, registrado_por, registrado_em
from public.registros where setor = 'juridico_brisa';
grant select on public.v_juridico_brisa to authenticated;
revoke all on public.v_juridico_brisa from anon;

-- ---------------------------------------------------------------------
-- 7. Atualização em tempo real do dashboard
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'registros') then
    alter publication supabase_realtime add table public.registros;
  end if;
end $$;
