-- =====================================================================
-- AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
-- Modelo: Claude Opus 5.5 (claude-opus-5-5)
-- Solicitante: rosameire.henriques@vmimedica.com.br
--
-- Liberar acesso das pessoas. Antes, crie o login de cada uma em
-- Authentication > Users > Add user > Create new user.
-- Aqui você define QUAIS setores cada pessoa pode preencher:
--   '{*}'                    -> todos os setores (administrador)
--   '{juridico}'             -> só Jurídico
--   '{privado,publico}'      -> mais de um setor
--   '{}'                     -> só visualiza o dashboard
-- Setores: juridico, publico, captacao, privado, especialista, geral
-- E-mails sempre em minúsculas.
-- =====================================================================

insert into public.usuarios (email, nome, setores) values
  ('rosameire.henriques@vmimedica.com.br', 'Rosameire Henriques', '{*}'),
  ('nome.sobrenome@vmimedica.com.br',      'Nome do Jurídico',    '{juridico}'),
  ('outra.pessoa@vmimedica.com.br',        'Nome do Privado',     '{privado}')
on conflict (email) do update set nome = excluded.nome, setores = excluded.setores, ativo = true;

-- Bloquear alguém (sem apagar o histórico):
-- update public.usuarios set ativo = false where email = 'fulano@vmimedica.com.br';

-- Ver quem tem acesso:
select email, nome, setores, ativo from public.usuarios order by nome;
