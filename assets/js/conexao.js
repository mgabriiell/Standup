/* AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
   Modelo: Claude Opus 5.5 (claude-opus-5-5)
   Solicitante: rosameire.henriques@vmimedica.com.br

   Conexão com a pasta de dados (File System Access API, Edge/Chrome).
   A pasta é escolhida uma vez; o navegador guarda o acesso para as próximas visitas. */
(function (root) {
  'use strict';
  const DB = 'vmim-standup', STORE = 'pastas', CHAVE = 'dados';
  const suportado = 'showDirectoryPicker' in window;

  function idb() {
    return new Promise((ok, erro) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
    });
  }
  async function guardar(h) {
    try { const db = await idb(); await new Promise((ok, e) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(h, CHAVE); t.oncomplete = ok; t.onerror = () => e(t.error); }); } catch (e) { /* segue sem lembrar */ }
  }
  async function recuperar() {
    try { const db = await idb(); return await new Promise(ok => { const t = db.transaction(STORE, 'readonly'); const r = t.objectStore(STORE).get(CHAVE); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch (e) { return null; }
  }

  const Conexao = {
    suportado, pasta: null, nome: '',
    /* 'ok' = já conectado; 'permissao' = precisa de um clique em Reconectar; 'nenhum' = escolher a pasta */
    async restaurar(modo) {
      if (!suportado) return 'nenhum';
      const h = await recuperar(); if (!h) return 'nenhum';
      this.pasta = h; this.nome = h.name;
      return (await h.queryPermission({ mode: modo })) === 'granted' ? 'ok' : 'permissao';
    },
    async pedirPermissao(modo) { return (await this.pasta.requestPermission({ mode: modo })) === 'granted'; },
    async escolher(modo) {
      const h = await window.showDirectoryPicker({ id: 'vmim-standup', mode: modo });
      this.pasta = h; this.nome = h.name; await guardar(h);
    },
    /* Lista os nomes de arquivos da pasta (para checar se é a pasta certa). */
    async nomes() {
      const l = [];
      for await (const [nome, h] of this.pasta.entries()) if (h.kind === 'file') l.push(nome);
      return l;
    },
    async lerJSON(nome, padrao) {
      let fh;
      try { fh = await this.pasta.getFileHandle(nome); }
      catch (e) { if (e.name === 'NotFoundError') return { dados: padrao, modificado: null }; throw e; }
      const f = await fh.getFile(), txt = await f.text();
      if (!txt.trim()) return { dados: padrao, modificado: f.lastModified };
      try { return { dados: JSON.parse(txt), modificado: f.lastModified }; }
      catch (e) { throw new Error('O arquivo ' + nome + ' está corrompido ou foi editado manualmente (JSON inválido).'); }
    },
    async gravarJSON(nome, obj) {
      const fh = await this.pasta.getFileHandle(nome, { create: true });
      const w = await fh.createWritable();
      await w.write(JSON.stringify(obj, null, 2)); await w.close();
    },
    /* Confere se a pasta escolhida é a pasta de dados. Na primeira vez (pasta vazia), cria o config.json. */
    async prepararPasta(B, podeGravar) {
      const nomes = await this.nomes();
      const temDados = nomes.includes(B.ARQ_CONFIG) || B.SETORES.some(s => nomes.includes(B.arquivoSetor(s.id)));
      if (temDados) return true;
      if (!podeGravar) throw new Error('A pasta "' + this.nome + '" não tem dados do Stand Up. Escolha a pasta "dados" compartilhada pela equipe.');
      const msg = nomes.length
        ? 'A pasta "' + this.nome + '" não parece ser a pasta de dados do Stand Up (ela já tem outros arquivos). Usar esta pasta mesmo assim?'
        : 'A pasta "' + this.nome + '" está vazia. Iniciar a base de dados do Stand Up nela?';
      if (!confirm(msg)) return false;
      await this.gravarJSON(B.ARQ_CONFIG, B.configPadrao());
      return true;
    },
    /* Lê config e todos os setores. */
    async lerTudo(B) {
      const cfg = await this.lerJSON(B.ARQ_CONFIG, B.configPadrao());
      const out = { config: cfg.dados, feriados: B.feriadosDe(cfg.dados), arquivos: {}, setores: {}, modificado: cfg.modificado || 0 };
      for (const s of B.SETORES) {
        const r = await this.lerJSON(B.arquivoSetor(s.id), B.arquivoVazio(s.id));
        out.arquivos[s.id] = B.validarArquivo(r.dados, s.id);
        out.setores[s.id] = B.registros(r.dados);
        out.modificado = Math.max(out.modificado, r.modificado || 0);
      }
      return out;
    }
  };
  root.Conexao = Conexao;
})(window);
