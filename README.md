# Stand Up Comercial · VMI Médica

Formulário diário (D-1) e dashboard para a reunião de stand up do Comercial.

- **`index.html`**: o formulário. Cada responsável preenche o seu setor (Jurídico, Público, Captação, Privado, Especialista ou Geral).
- **`dashboard.html`**: o painel da reunião. Mostra quem já preencheu, os indicadores de meta, os gráficos do mês e as observações. Tem um botão para **exportar tudo para Excel**.

O site fica publicado no GitHub Pages. **Os dados não ficam no GitHub.** Eles ficam numa pasta compartilhada da equipe (Teams/OneDrive), com um arquivo JSON por setor.

```
dados/                 <- pasta compartilhada no Teams (NÃO vai para o GitHub)
├── config.json        feriados usados no cálculo de dias úteis
├── juridico.json
├── publico.json
├── captacao.json
├── privado.json
├── especialista.json
└── geral.json
```

Cada pessoa grava só o arquivo do seu setor. Assim, duas pessoas salvando ao mesmo tempo não apagam o registro uma da outra.

---

## 1. Publicar no GitHub Pages (uma vez)

1. No GitHub, crie um repositório. Exemplo: `standup-comercial`.
2. Envie todo o conteúdo desta pasta para o repositório: `index.html`, `dashboard.html`, `assets/`, `.nojekyll`, `.gitignore` e este `README.md`.
   - Pelo navegador: no repositório, clique em **Add file > Upload files**, arraste os arquivos e pastas e clique em **Commit changes**.
3. Vá em **Settings > Pages**.
4. Em **Source**, escolha **Deploy from a branch**. Em **Branch**, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
5. Depois de 1 ou 2 minutos, o endereço aparece no topo da página. Exemplo: `https://<usuario-ou-organizacao>.github.io/standup-comercial/`.
   - Formulário: `.../standup-comercial/`
   - Dashboard: `.../standup-comercial/dashboard.html`

> **Visibilidade:** o endereço do GitHub Pages pode ser acessado por qualquer pessoa que tenha o link, mesmo com o repositório privado. A exceção é o plano GitHub Enterprise com Pages privado. O site só contém o código, e os dados continuam na pasta da equipe. Mesmo assim, não divulgue o link fora da empresa.

## 2. Criar a pasta de dados no Teams (uma vez)

1. No Teams, abra o time ou canal do Comercial e clique em **Arquivos**.
2. Clique em **+ Novo > Pasta** e crie, por exemplo, `StandUp Comercial`. Dentro dela, crie a pasta **`dados`**, que pode ficar vazia.
3. Todos os membros do time já podem editar.

## 3. O que cada pessoa faz (uma vez por computador)

1. No Teams, abra a pasta `StandUp Comercial` e clique em **Adicionar atalho ao OneDrive** ou em **Sincronizar**. A pasta passa a aparecer no Explorador de Arquivos.
2. Abra o link do formulário no **Microsoft Edge** ou no **Google Chrome** (no computador). Dica: salve nos favoritos ou fixe como aba no canal do Teams.
3. Clique em **Selecionar pasta de dados**, escolha a pasta **`dados`** (dentro de `StandUp Comercial`, no OneDrive) e permita a edição.
   - Se o navegador mostrar **"Permitir em todas as visitas"**, marque essa opção. Assim o formulário já abre conectado nas próximas vezes.
   - Se não marcar, nas próximas vezes basta clicar em **Reconectar** e confirmar.
4. A primeira pessoa a conectar uma pasta vazia vê a pergunta "Iniciar a base de dados do Stand Up nela?". Responda **OK** e o `config.json` é criado.

## 4. Uso diário

- **Formulário:** escolha o setor, confira a data (o padrão é o dia útil anterior), preencha e clique em **Salvar**.
  - Se o setor já tiver registro na data, os valores são carregados e salvar substitui o registro.
  - **Excluir registro desta data** remove um lançamento feito por engano.
  - Clique numa data em "Últimos registros" para abrir e corrigir aquele dia.
- **Dashboard:** abra na reunião. Ele se atualiza a cada 2 minutos, ou ao clicar em **Atualizar dados**. Para ver outro dia, use as setas.
- **Excel:** no dashboard, clique em **Exportar para Excel**. A planilha baixada tem um resumo, uma aba por setor, as vendas do Público e os feriados.

## Regras de cálculo

| Indicador | Cálculo |
|---|---|
| Dias úteis faltantes | Dias úteis do dia seguinte à data de referência até 31/12, sem os feriados do `config.json` |
| Dias úteis trabalhados | Dias úteis de 01/01 até a data de referência |
| Meta diária | (Meta global - Total de pedidos no ano) / Dias úteis faltantes |
| Propostas do mês · Privado | Soma de "Propostas geradas" do Privado no mês |
| Propostas do mês · Público | Soma de "Propostas público do dia" informadas no Geral, no mês |
| Propostas do mês · Total | Privado + Público |
| Vendas do Privado | Quantidade e valor vêm da lista "Vendas do dia" (cliente, valor, equipamento) |
| Recebido no mês (Jurídico) | Sugerido como o acumulado anterior do mês mais o recebido do dia. Pode ser editado |

## Atualizar o site

Para publicar uma nova versão, envie os arquivos alterados para o repositório (Add file > Upload files > Commit). Em 1 a 2 minutos o site é atualizado. A equipe não precisa fazer nada, só recarregar a página. A conexão com a pasta de dados continua valendo.

## Manutenção

- **Feriados:** edite `dados/config.json` no Bloco de Notas e inclua os feriados municipais e estaduais e as emendas da empresa, no formato:
  ```json
  { "data": "2026-12-24", "descricao": "Véspera de Natal (emenda)" }
  ```
  Os feriados de 2026 e 2027 já vêm cadastrados. Inclua os de 2028 até o fim de 2027.
- **Não edite os arquivos dos setores à mão.** Use o formulário para corrigir ou excluir registros.
- **Backup:** o OneDrive/Teams guarda o histórico de versões de cada arquivo (botão direito no arquivo > **Histórico de versões**).
- **Conflitos do OneDrive:** se aparecer um arquivo com o nome do computador (ex.: `juridico-NOTEBOOK01.json`), houve conflito de sincronização. Confira os dados no formulário e apague a cópia.

## Problemas comuns

| Situação | O que fazer |
|---|---|
| "Navegador não compatível" | Use Edge ou Chrome no computador. Celular e Firefox não gravam na pasta |
| "O acesso à pasta expirou" | Clique em **Reconectar** e salve de novo. O que foi digitado não se perde |
| "A pasta de dados não foi encontrada" | A pasta foi movida ou o OneDrive parou de sincronizar. Clique em **Selecionar pasta de dados** de novo |
| O dashboard não mostra o que alguém salvou | Aguarde a sincronização do OneDrive (ícone verde) e clique em **Atualizar dados** |

## Componentes de terceiros

- [Chart.js](https://www.chartjs.org/) 4.6.1, licença MIT (`assets/vendor/LICENSE-chartjs.md`)
- [ExcelJS](https://github.com/exceljs/exceljs) 4.4.0, licença MIT (`assets/vendor/LICENSE-exceljs.txt`)

---

AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
Modelo: Claude Opus 5.5 (claude-opus-5-5)
Solicitante: rosameire.henriques@vmimedica.com.br
