-- =====================================================================
-- AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
-- Modelo: Claude Opus 5.5 (claude-opus-5-5)
-- Solicitante: rosameire.henriques@vmimedica.com.br
--
-- Atualização: novo setor "Jurídico Brisa" (id: juridico_brisa)
-- Onde rodar: Supabase > SQL Editor > New query > colar tudo > Run.
-- Pode ser executado mais de uma vez. Não apaga nenhum dado.
-- =====================================================================

-- 1. Aceitar o novo setor na tabela de registros
alter table public.registros drop constraint if exists registros_setor_check;
alter table public.registros add constraint registros_setor_check
  check (setor in ('juridico','juridico_brisa','publico','captacao','privado','especialista','geral'));

-- 2. Importação de .json reconhecendo o novo setor
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

revoke execute on function public.importar_json(text, jsonb) from public, anon, authenticated;

-- 3. Visão para consulta (Table Editor, Excel, Power BI)
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

-- 4. Liberar a aba para a Brisa (mantém os setores que ela já tem)
update public.usuarios
   set setores = array_append(setores, 'juridico_brisa')
 where email = 'brisa.oliveira@vmimedica.com.br'
   and not ('juridico_brisa' = any(setores));

-- Conferência: quem pode preencher o Jurídico Brisa
select email, nome, setores from public.usuarios
where 'juridico_brisa' = any(setores) or '*' = any(setores)
order by nome;
