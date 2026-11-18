/* AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
   Modelo: Claude Opus 5.5 (claude-opus-5-5)
   Solicitante: rosameire.henriques@vmimedica.com.br

   Núcleo compartilhado: estrutura dos dados, datas, números e cálculos.
   Os dados ficam em arquivos JSON, um por setor, numa pasta compartilhada. */
(function (root) {
  'use strict';

  // ---------- Estrutura ----------
  const OBS = { k: 'obs', l: 'Observações', t: 'texto' };
  const SETORES = [
    { id: 'juridico', nome: 'Jurídico', campos: [
      { k: 'previsto_d1', l: 'Previsão de recebimento do dia (R$)', t: 'moeda', req: true },
      { k: 'recebido_d1', l: 'Recebido de fato no dia (R$)', t: 'moeda', req: true },
      { k: 'diferenca', l: 'Diferença recebido - previsto (R$)', t: 'moeda', calc: true },
      { k: 'previsao_hoje', l: 'Previsão de recebimento para o dia seguinte (R$)', t: 'moeda', req: true },
      { k: 'recebido_mes', l: 'Total recebido no mês (R$)', t: 'moeda', req: true },
      OBS ] },
    { id: 'publico', nome: 'Público', campos: [ OBS ],
      itens: { campos: [
        { k: 'venda', l: 'Venda (órgão / processo)', t: 'texto', req: true },
        { k: 'valor', l: 'Valor (R$)', t: 'moeda', req: true },
        { k: 'equipamentos', l: 'Equipamentos', t: 'texto' } ] } },
    { id: 'captacao', nome: 'Captação', campos: [
      { k: 'captacao', l: 'Captação (nº)', t: 'int', req: true },
      { k: 'obs', l: 'Observação', t: 'texto' } ] },
    { id: 'privado', nome: 'Privado', campos: [
      { k: 'propostas', l: 'Propostas geradas (nº)', t: 'int', req: true },
      { k: 'vendas', l: 'Vendas (nº)', t: 'int', req: true },
      OBS ] },
    { id: 'especialista', nome: 'Especialista', campos: [
      { k: 'pre_analises', l: 'Pré-análises (nº)', t: 'int', req: true },
      { k: 'propostas', l: 'Propostas (nº)', t: 'int', req: true },
      { k: 'fund_recurso', l: 'Fund. técnicas - Recurso (nº)', t: 'int', req: true },
      { k: 'fund_impugnacao', l: 'Fund. técnicas - Impugnações (nº)', t: 'int', req: true },
      { k: 'contrarrazoes', l: 'Contrarrazões (nº)', t: 'int', req: true },
      { k: 'diligencias', l: 'Diligências (nº)', t: 'int', req: true },
      OBS ] },
    { id: 'geral', nome: 'Geral', campos: [
      { k: 'total_pedidos_ano', l: 'Total de pedidos no ano (R$)', t: 'moeda', req: true },
      { k: 'meta_global', l: 'Meta global do ano (R$)', t: 'moeda', req: true },
      OBS ] }
  ];
  function setor(id) { return SETORES.find(s => s.id === id); }
  function arquivoSetor(id) { return id + '.json'; }
  const ARQ_CONFIG = 'config.json';
  const VERSAO = 1;

  const FERIADOS_PADRAO = [
    ['2026-01-01', 'Confraternização Universal'], ['2026-02-16', 'Carnaval'], ['2026-02-17', 'Carnaval'],
    ['2026-04-03', 'Sexta-feira Santa'], ['2026-04-21', 'Tiradentes'], ['2026-05-01', 'Dia do Trabalho'],
    ['2026-06-04', 'Corpus Christi'], ['2026-09-07', 'Independência'], ['2026-10-12', 'Nossa Senhora Aparecida'],
    ['2026-11-02', 'Finados'], ['2026-11-15', 'Proclamação da República'], ['2026-11-20', 'Consciência Negra'],
    ['2026-12-25', 'Natal'],
    ['2027-01-01', 'Confraternização Universal'], ['2027-02-08', 'Carnaval'], ['2027-02-09', 'Carnaval'],
    ['2027-03-26', 'Sexta-feira Santa'], ['2027-04-21', 'Tiradentes'], ['2027-05-01', 'Dia do Trabalho'],
    ['2027-05-27', 'Corpus Christi'], ['2027-09-07', 'Independência'], ['2027-10-12', 'Nossa Senhora Aparecida'],
    ['2027-11-02', 'Finados'], ['2027-11-15', 'Proclamação da República'], ['2027-11-20', 'Consciência Negra'],
    ['2027-12-25', 'Natal']
  ].map(([data, descricao]) => ({ data, descricao }));
  function configPadrao() {
    return { versao: VERSAO, observacao: 'Feriados usados no cálculo de dias úteis. Inclua feriados municipais/estaduais e emendas da empresa (formato AAAA-MM-DD).', feriados: FERIADOS_PADRAO };
  }

  // ---------- Datas (meia-noite UTC = dia civil) ----------
  const DIA = 86400000;
  function d(y, m, dd) { return new Date(Date.UTC(y, m - 1, dd)); }
  function hojeUTC() { const n = new Date(); return d(n.getFullYear(), n.getMonth() + 1, n.getDate()); }
  function agoraLocalIso() {
    const n = new Date(), p = x => String(x).padStart(2, '0');
    return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate()) + 'T' + p(n.getHours()) + ':' + p(n.getMinutes()) + ':' + p(n.getSeconds());
  }
  function iso(dt) { return dt.toISOString().slice(0, 10); }
  function deIso(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? d(+m[1], +m[2], +m[3]) : null;
  }
  function br(dt) { return iso(dt).split('-').reverse().join('/'); }
  function brHora(s) { // 'AAAA-MM-DDTHH:MM:SS' (hora local)
    if (!s) return '';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] : String(s);
  }
  function ehUtil(dt, feriados) { const w = dt.getUTCDay(); return w !== 0 && w !== 6 && !feriados.has(iso(dt)); }
  function diaUtilAnterior(dt, feriados) {
    let x = new Date(dt.getTime() - DIA);
    while (!ehUtil(x, feriados)) x = new Date(x.getTime() - DIA);
    return x;
  }
  function contarUteis(ini, fim, feriados) {
    let n = 0;
    for (let x = ini.getTime(); x <= fim.getTime(); x += DIA) if (ehUtil(new Date(x), feriados)) n++;
    return n;
  }
  /* Dias úteis faltantes: do dia seguinte à data de referência até 31/12 (inclusive).
     Dias úteis trabalhados: de 01/01 até a data de referência (inclusive). */
  function indicadoresGeral(ref, total, meta, feriados) {
    const ano = ref.getUTCFullYear();
    const faltantes = contarUteis(new Date(ref.getTime() + DIA), d(ano, 12, 31), feriados);
    const trabalhados = contarUteis(d(ano, 1, 1), ref, feriados);
    const falta = Math.max(0, (meta || 0) - (total || 0));
    return { faltantes, trabalhados, falta, pct: meta ? (total || 0) / meta : null, metaDiaria: faltantes > 0 ? falta / faltantes : null };
  }

  // ---------- Números ----------
  function parseNum(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = String(v).trim().replace(/R\$\s?/i, '').replace(/\s/g, '');
    if (!s) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return isFinite(n) ? n : null;
  }
  const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const vazio = n => n === null || n === undefined || isNaN(n);
  function moeda(n) { return vazio(n) ? '—' : fmtMoeda.format(n); }
  function inteiro(n) { return vazio(n) ? '—' : fmtInt.format(n); }
  function pct(n) { return vazio(n) ? '—' : (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'; }

  // ---------- Arquivos JSON ----------
  /* Formato de cada arquivo de setor:
     { "setor": "juridico", "versao": 1, "atualizado_em": "...", "registros": [ { "data_ref": "AAAA-MM-DD", ..., "responsavel": "...", "registrado_em": "..." } ] } */
  function arquivoVazio(setorId) { return { setor: setorId, versao: VERSAO, atualizado_em: null, registros: [] }; }
  function validarArquivo(obj, setorId) {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.registros)) throw new Error('O arquivo ' + arquivoSetor(setorId) + ' não está no formato esperado.');
    if (obj.setor && obj.setor !== setorId) throw new Error('O arquivo ' + arquivoSetor(setorId) + ' pertence a outro setor (' + obj.setor + ').');
    return obj;
  }
  /* Converte registros do arquivo para uso nas telas (data_ref vira Date). */
  function registros(obj) {
    return (obj.registros || []).map(r => Object.assign({}, r, { data_ref: deIso(r.data_ref) }))
      .filter(r => r.data_ref).sort((a, b) => a.data_ref - b.data_ref);
  }
  /* Inclui ou substitui o registro da data (um registro por setor por dia). */
  function gravarRegistro(obj, data, rec, responsavel) {
    const k = iso(data);
    obj.registros = obj.registros.filter(r => r.data_ref !== k);
    obj.registros.push(Object.assign({ data_ref: k }, rec, { responsavel, registrado_em: agoraLocalIso() }));
    obj.registros.sort((a, b) => a.data_ref < b.data_ref ? -1 : 1);
    obj.atualizado_em = agoraLocalIso();
    return obj;
  }
  function excluirRegistro(obj, data) {
    const k = iso(data), n = obj.registros.length;
    obj.registros = obj.registros.filter(r => r.data_ref !== k);
    obj.atualizado_em = agoraLocalIso();
    return n !== obj.registros.length;
  }
  function feriadosDe(config) {
    return new Set(((config && config.feriados) || []).map(f => (typeof f === 'string' ? f : f.data)).filter(x => deIso(x)));
  }
  function registroDoDia(lista, data) { const k = iso(data); return (lista || []).find(r => iso(r.data_ref) === k) || null; }
  function totalVendas(r) { return (r && r.itens || []).reduce((a, i) => a + (i.valor || 0), 0); }

  const api = { SETORES, setor, arquivoSetor, ARQ_CONFIG, VERSAO, configPadrao,
    d, hojeUTC, iso, deIso, br, brHora, ehUtil, diaUtilAnterior, contarUteis, indicadoresGeral, DIA,
    parseNum, moeda, inteiro, pct, arquivoVazio, validarArquivo, registros, gravarRegistro, excluirRegistro,
    feriadosDe, registroDoDia, totalVendas };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Base = api;
})(typeof window !== 'undefined' ? window : globalThis);
