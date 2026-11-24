/* AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
   Modelo: Claude Opus 5.5 (claude-opus-5-5)
   Solicitante: rosameire.henriques@vmimedica.com.br

   Tela de login, área do usuário no topo e troca de senha (formulário e dashboard). */
(function (root) {
  'use strict';
  const D = root.Dados;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function tela(html) { const t = $('telaLogin'); t.innerHTML = html; t.classList.remove('oculto'); }
  function esconderTela() { $('telaLogin').classList.add('oculto'); }

  function formLogin(opts, erro) {
    tela('<h2>Entrar</h2><p class="sub-login">Use o e-mail da empresa e a senha cadastrada pelo administrador.</p>' +
      '<form id="fLogin" autocomplete="on">' +
      '<label for="lgEmail">E-mail</label><input id="lgEmail" type="email" autocomplete="username" required>' +
      '<label for="lgSenha">Senha</label><input id="lgSenha" type="password" autocomplete="current-password" required>' +
      '<button class="btn" type="submit" id="lgBtn">Entrar</button>' +
      '<div id="lgMsg" class="aviso erro' + (erro ? '' : ' oculto') + '">' + esc(erro || '') + '</div></form>' +
      '<p class="sub-login">Esqueceu a senha? Peça ao administrador para redefini-la.</p>');
    const ultimo = localStorage.getItem('vmim-ultimo-email'); if (ultimo) { $('lgEmail').value = ultimo; $('lgSenha').focus(); } else $('lgEmail').focus();
    $('fLogin').onsubmit = async ev => {
      ev.preventDefault();
      const b = $('lgBtn'); b.disabled = true; b.textContent = 'Entrando...';
      try {
        await D.entrar($('lgEmail').value, $('lgSenha').value);
        localStorage.setItem('vmim-ultimo-email', $('lgEmail').value.trim().toLowerCase());
        await verificar(opts);
      } catch (e) {
        $('lgMsg').textContent = e.message; $('lgMsg').classList.remove('oculto');
        b.disabled = false; b.textContent = 'Entrar';
      }
    };
  }

  function areaUsuario(perfil) {
    const a = $('areaUsuario');
    a.innerHTML = '<span class="pill ok">Conectado</span><span class="usuario" title="' + esc(perfil.email) + '">' + esc(perfil.nome || perfil.email) + '</span>' +
      '<button class="btn sec peq" type="button" id="btSenha">Alterar senha</button><button class="btn sec peq" type="button" id="btSair">Sair</button>';
    $('btSair').onclick = async () => { await D.sair(); location.reload(); };
    $('btSenha').onclick = dialogoSenha;
  }

  function dialogoSenha() {
    let dlg = $('dlgSenha');
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'dlgSenha'; dlg.className = 'dlg';
      dlg.innerHTML = '<form method="dialog" id="fSenha"><h2>Alterar senha</h2>' +
        '<label for="sn1">Nova senha (mínimo 8 caracteres)</label><input id="sn1" type="password" autocomplete="new-password" minlength="8" required>' +
        '<label for="sn2">Repita a nova senha</label><input id="sn2" type="password" autocomplete="new-password" minlength="8" required>' +
        '<div id="snMsg" class="aviso oculto"></div>' +
        '<div class="acoes-dlg"><button class="btn sec" type="button" id="snCancelar">Cancelar</button><button class="btn" type="submit" id="snOk">Salvar senha</button></div></form>';
      document.body.appendChild(dlg);
      $('snCancelar').onclick = () => dlg.close();
      $('fSenha').onsubmit = async ev => {
        ev.preventDefault();
        const m = $('snMsg'), a = $('sn1').value, b = $('sn2').value;
        const erro = t => { m.className = 'aviso erro'; m.textContent = t; };
        if (a.length < 8) return erro('A senha precisa ter pelo menos 8 caracteres.');
        if (a !== b) return erro('As duas senhas não são iguais.');
        try { await D.alterarSenha(a); m.className = 'aviso ok'; m.textContent = 'Senha alterada.'; setTimeout(() => dlg.close(), 1200); }
        catch (e) { erro(e.message); }
      };
    }
    $('sn1').value = ''; $('sn2').value = ''; $('snMsg').className = 'aviso oculto';
    dlg.showModal(); $('sn1').focus();
  }

  async function verificar(opts) {
    let perfil;
    try {
      const s = await D.sessao();
      if (!s) return formLogin(opts);
      perfil = await D.perfil();
    } catch (e) { return formLogin(opts, e.message); }
    if (!perfil || !perfil.liberado) {
      tela('<h2>Acesso não liberado</h2><p>O e-mail <b>' + esc(perfil ? perfil.email : '') + '</b> entrou com sucesso, mas ainda não foi liberado no sistema.</p>' +
        '<p class="sub-login">Peça ao administrador para incluir o seu e-mail na tabela <b>usuarios</b> do Supabase.</p>' +
        '<button class="btn sec" type="button" id="btSairBloq">Sair</button>');
      $('btSairBloq').onclick = async () => { await D.sair(); location.reload(); };
      return;
    }
    esconderTela(); areaUsuario(perfil);
    await opts.aoEntrar(perfil);
  }

  root.Acesso = {
    async iniciar(opts) {
      if (!D.configurado()) {
        tela('<h2>Configuração pendente</h2><p>Preencha o endereço do projeto e a chave pública do Supabase no arquivo <b>assets/js/config.js</b> (veja o passo a passo no README).</p>');
        return;
      }
      await verificar(opts);
    },
    esc
  };
})(window);
