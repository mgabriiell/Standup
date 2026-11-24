/* AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
   Modelo: Claude Opus 5.5 (claude-opus-5-5)
   Solicitante: rosameire.henriques@vmimedica.com.br

   Acesso aos dados no Supabase: login, leitura, gravação, exclusão e tempo real.
   Usa a chave pública definida em assets/js/config.js; a segurança fica nas
   regras de acesso (Row Level Security) da base. */
(function (root) {
  'use strict';
  const B = root.Base;
  let cli = null;

  function configurado() {
    const c = root.STANDUP_CONFIG || {};
    return /^https:\/\/.+/.test(c.supabaseUrl || '') && !/SEU-PROJETO/.test(c.supabaseUrl) &&
      !!c.supabaseChave && !/COLE_AQUI/.test(c.supabaseChave);
  }
  function cliente() {
    if (!cli) {
      if (!configurado()) throw new Error('O endereço e a chave pública do Supabase ainda não foram preenchidos em assets/js/config.js.');
      const c = root.STANDUP_CONFIG;
      cli = root.supabase.createClient(c.supabaseUrl, c.supabaseChave, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'vmim-standup-sessao' }
      });
    }
    return cli;
  }
  function falha(error, acao) {
    if (!error) return;
    const m = error.message || String(error);
    if (/row-level security|permission denied|42501/i.test(m + ' ' + (error.code || '')))
      throw new Error('Sem permissão para ' + acao + '. Verifique com o administrador se o seu e-mail está liberado para este setor.');
    if (/JWT|token|expired/i.test(m)) throw new Error('Sua sessão expirou. Saia e entre novamente.');
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) throw new Error('Sem conexão com o Supabase. Verifique a internet e tente de novo.');
    throw new Error(m);
  }
  // timestamptz -> 'AAAA-MM-DDTHH:MM:SS' no horário local do computador
  function localIso(ts) {
    if (!ts) return null;
    const d = new Date(ts); if (isNaN(d)) return null;
    const p = x => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function paraRegistro(l) {
    return Object.assign({}, l.dados || {}, {
      data_ref: B.deIso(l.data_ref), responsavel: l.responsavel,
      registrado_por: l.registrado_por, registrado_em: localIso(l.registrado_em), _ts: l.registrado_em
    });
  }

  const Dados = {
    configurado,
    async sessao() {
      const { data, error } = await cliente().auth.getSession(); falha(error, 'ler a sessão');
      return data.session;
    },
    async entrar(email, senha) {
      const { data, error } = await cliente().auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
      if (error) {
        if (/invalid login|invalid credentials/i.test(error.message)) throw new Error('E-mail ou senha incorretos.');
        if (/not confirmed/i.test(error.message)) throw new Error('Este e-mail ainda não foi confirmado. Fale com o administrador.');
        falha(error, 'entrar');
      }
      return data.session;
    },
    async sair() { await cliente().auth.signOut(); },
    async alterarSenha(nova) {
      const { error } = await cliente().auth.updateUser({ password: nova }); falha(error, 'alterar a senha');
    },
    aoMudarSessao(cb) { cliente().auth.onAuthStateChange((ev, s) => cb(ev, s)); },
    /* Linha do usuário em "usuarios" (null = sem acesso liberado). */
    async perfil() {
      const s = await this.sessao(); if (!s) return null;
      const { data, error } = await cliente().from('usuarios').select('email,nome,setores,ativo').maybeSingle();
      falha(error, 'ler o seu cadastro');
      if (!data || !data.ativo) return { email: s.user.email, nome: '', setores: [], liberado: false };
      const todos = (data.setores || []).includes('*');
      return { email: data.email, nome: data.nome || '', setores: todos ? B.SETORES.map(x => x.id) : (data.setores || []), liberado: true };
    },
    async lerFeriados() {
      const { data, error } = await cliente().from('feriados').select('data,descricao').order('data');
      falha(error, 'ler os feriados');
      return data || [];
    },
    /* Lê todos os registros (em páginas de 1000) e monta a mesma estrutura usada pelas telas. */
    async lerTudo() {
      const feriados = await this.lerFeriados();
      const out = { config: { feriados }, feriados: B.feriadosDe({ feriados }), setores: {}, modificado: 0 };
      B.SETORES.forEach(s => { out.setores[s.id] = []; });
      const PAG = 1000;
      for (let ini = 0; ; ini += PAG) {
        const { data, error } = await cliente().from('registros')
          .select('setor,data_ref,dados,responsavel,registrado_por,registrado_em')
          .order('data_ref', { ascending: true }).order('setor', { ascending: true }).range(ini, ini + PAG - 1);
        falha(error, 'ler os registros');
        (data || []).forEach(l => {
          if (out.setores[l.setor]) out.setores[l.setor].push(paraRegistro(l));
          const t = Date.parse(l.registrado_em); if (t > out.modificado) out.modificado = t;
        });
        if (!data || data.length < PAG) break;
      }
      return out;
    },
    async lerRegistro(setorId, data) {
      const { data: l, error } = await cliente().from('registros')
        .select('setor,data_ref,dados,responsavel,registrado_por,registrado_em')
        .eq('setor', setorId).eq('data_ref', B.iso(data)).maybeSingle();
      falha(error, 'ler o registro');
      return l ? paraRegistro(l) : null;
    },
    async gravar(setorId, data, rec, responsavel) {
      const { error } = await cliente().from('registros')
        .upsert({ setor: setorId, data_ref: B.iso(data), dados: rec, responsavel }, { onConflict: 'setor,data_ref' });
      falha(error, 'gravar neste setor');
    },
    async excluir(setorId, data) {
      const { data: apagados, error } = await cliente().from('registros').delete()
        .eq('setor', setorId).eq('data_ref', B.iso(data)).select('id');
      falha(error, 'excluir neste setor');
      if (!apagados || !apagados.length) throw new Error('Nada foi excluído. O registro não existe mais ou você não tem permissão neste setor.');
    },
    /* Avisa quando qualquer registro muda (para o dashboard atualizar sozinho). */
    aoMudarRegistros(cb) {
      try {
        return cliente().channel('registros-standup')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'registros' }, () => cb())
          .subscribe();
      } catch (e) { return null; }
    }
  };
  root.Dados = Dados;
})(window);
