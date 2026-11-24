# Stand Up Comercial · VMI Médica

Formulário diário (D-1) e dashboard para a reunião de stand up do Comercial.

- **`index.html`**: o formulário. Cada pessoa entra com o seu e-mail e preenche os setores liberados para ela.
- **`dashboard.html`**: o painel da reunião. Mostra o preenchimento do dia, os indicadores de meta, os gráficos do mês e as observações, e se atualiza sozinho quando alguém salva. Também tem o botão **Exportar para Excel**.
- **Base de dados: Supabase** (PostgreSQL). Só quem tem login vê os dados, e cada pessoa só grava nos setores liberados para ela.

```
├── index.html / dashboard.html
├── assets/js/config.js        <- endereço do projeto + chave PÚBLICA do Supabase (você edita)
├── assets/js/dados.js         acesso ao Supabase
├── assets/js/acesso.js        login, sair, alterar senha
├── assets/js/lib.js           campos de cada setor e cálculos
└── supabase/
    ├── 01_criar_base.sql      cria tabelas, regras de acesso, feriados e visões
    ├── 02_importar_json.sql   importa os .json da versão anterior (pasta "dados" do Teams)
    └── 03_usuarios.sql        libera e-mails e setores
```

---

## Passo a passo da implantação

### 1. Criar o projeto no Supabase
1. Acesse **supabase.com** e entre na sua conta. Clique em **New project**.
2. Dê um nome, por exemplo `standup-comercial`, e escolha a região **South America (São Paulo)**.
3. Em **Database Password**, gere uma senha e guarde-a no cofre de senhas da empresa. Não envie essa senha por chat nem por e-mail. O site não usa essa senha.
4. Clique em **Create new project** e aguarde 1 a 2 minutos.

### 2. Criar a base (SQL Editor)
1. No menu lateral, clique em **SQL Editor** e depois em **New query**.
2. Abra o arquivo `supabase/01_criar_base.sql`, copie todo o conteúdo e cole no editor.
3. Clique em **Run**. O resultado esperado é *Success. No rows returned*.
4. Confira em **Table Editor**: devem aparecer as tabelas `registros`, `usuarios` e `feriados`.

### 3. Importar os dados que vocês já têm (.json)
Os arquivos estão na pasta `dados` do Teams: `juridico.json`, `publico.json`, `captacao.json`, `privado.json`, `especialista.json`, `geral.json` e `config.json`.

1. No SQL Editor, clique em **New query** e cole o conteúdo de `supabase/02_importar_json.sql`.
2. Para **cada arquivo**:
   1. Abra o arquivo no **Bloco de Notas**, aperte **Ctrl+A** e depois **Ctrl+C**.
   2. No bloco do setor correspondente, apague a palavra `COLE_AQUI` e cole com **Ctrl+V**. As linhas `$json$` acima e abaixo precisam continuar lá.
   3. Selecione com o mouse **só aquele bloco**, do `select` até o `;`, e clique em **Run**. O resultado mostra quantos registros entraram.
3. O `config.json` só precisa ser importado se vocês incluíram feriados extras. Os feriados nacionais já foram criados no passo 2.
4. No fim, rode a consulta de conferência que está no final do arquivo. Ela mostra quantos registros há por setor e o período de cada um.

> Pode repetir a importação sem medo: um registro da mesma data é atualizado, nunca duplicado.

### 4. Configurar o login
1. Vá em **Authentication > Sign In / Providers > Email**. Deixe **Email** ativado e **desative "Allow new users to sign up"**. Assim, só o administrador cria contas.
2. Ainda em **Authentication**, abra **URL Configuration**. Em **Site URL**, informe `https://mgabriiell.github.io/Standup/` e clique em **Save**.
3. Para cada pessoa, vá em **Authentication > Users > Add user > Create new user**:
   - informe o e-mail da empresa e uma senha provisória;
   - marque **Auto Confirm User** e clique em **Create user**.
   - Entregue a senha provisória pessoalmente ou por um canal seguro. Depois do primeiro acesso, a pessoa troca a senha pelo botão **Alterar senha**, no topo do site.

### 5. Liberar os setores de cada pessoa
1. No SQL Editor, abra `supabase/03_usuarios.sql`.
2. Troque os e-mails de exemplo pelos reais, em minúsculas. Em `setores`, use:
   - `'{*}'` para administrador, com acesso a todos os setores;
   - `'{juridico}'`, `'{privado,publico}'` etc. para setores específicos;
   - `'{}'` para quem só vê o dashboard.
3. Clique em **Run**.

Quem tem login mas não está nessa lista vê a mensagem "Acesso não liberado".

### 6. Ligar o site ao Supabase (`config.js`)
1. No Supabase, clique no botão **Connect**, no topo do projeto. Ali aparecem a **Project URL** (ex.: `https://abcdefghijkl.supabase.co`) e a **Publishable key** (começa com `sb_publishable_`).
   - As duas também ficam em **Project Settings > Data API** (URL) e **Project Settings > API Keys** (chave).
   - Use a **Publishable key**. A antiga "anon" ainda funciona, mas o Supabase vai desativá-la até o fim de 2026.
3. Abra `assets/js/config.js` no Bloco de Notas, troque `https://SEU-PROJETO.supabase.co` e `COLE_AQUI_A_CHAVE_PUBLICA` pelos seus valores e salve.

> **Nunca** use a **Secret key** ou a **service_role** no site, porque elas dão acesso total à base. A chave **pública** pode ficar no GitHub: a segurança vem do login e das regras de acesso criadas no passo 2.
> Não envie chaves nem senhas por chat ou por e-mail.

### 7. Publicar no GitHub
1. No repositório, clique em **Add file > Upload files**.
2. Arraste **todo o conteúdo** desta pasta: `index.html`, `dashboard.html`, `README.md` e as pastas `assets` e `supabase`. Depois clique em **Commit changes**.
3. Apague o arquivo antigo `assets/js/conexao.js`: abra o arquivo, clique nos três pontinhos (…), escolha **Delete file** e clique em **Commit changes**.
4. Espere 1 a 2 minutos e abra `https://mgabriiell.github.io/Standup/`.

### 8. Testar
1. Entre com o seu e-mail. Devem aparecer as abas dos seus setores.
2. Salve um registro de teste e abra o dashboard: o registro aparece na hora.
3. Exclua o registro de teste pelo botão **Excluir registro desta data**.

Depois de conferir os dados importados, a pasta `dados` do Teams não é mais usada e pode ser arquivada.

---

## Uso diário

- **Formulário:** entre, escolha o setor, confira a data (o padrão é o dia útil anterior), preencha e clique em **Salvar**. O login fica guardado no navegador.
- **Dashboard:** se atualiza sozinho quando alguém salva. Use as setas para navegar entre os dias e **Exportar para Excel** para baixar a planilha.

## Administração

| Tarefa | Onde |
|---|---|
| Nova pessoa | Authentication > Users > Add user e depois `03_usuarios.sql` |
| Trocar setores de alguém | `03_usuarios.sql` (rodar de novo) ou Table Editor > usuarios |
| Bloquear alguém | `update public.usuarios set ativo = false where email = '...';` |
| Senha esquecida | Authentication > Users > clicar na pessoa > definir nova senha provisória |
| Feriados (municipais, emendas) | Table Editor > feriados > Insert row |
| Consultar ou exportar dados | Table Editor, visões `v_juridico`, `v_privado`, `v_geral`, `v_especialista`, `v_captacao` e `v_itens` (vendas e aluguéis, uma linha por item) |

**Plano gratuito do Supabase:** projetos sem nenhum acesso por 7 dias são pausados. O uso diário evita isso. Se acontecer, entre no painel do Supabase e clique em **Restore project**.

## Regras de cálculo

| Indicador | Cálculo |
|---|---|
| Dias úteis faltantes | Dias úteis do dia seguinte à data de referência até 31/12, sem os feriados da tabela `feriados` |
| Dias úteis trabalhados | Dias úteis de 01/01 até a data de referência |
| Meta diária | (Meta global - Total de pedidos no ano) / Dias úteis faltantes |
| Propostas do mês · Privado | Soma de "Propostas geradas" do Privado no mês |
| Propostas do mês · Público | Soma de "Propostas público do dia" do Geral no mês |
| Propostas do mês · Total | Privado + Público |
| Vendas do Privado | Quantidade e valor vêm da lista "Vendas do dia" (cliente, valor, equipamento) |
| Recebido no mês (Jurídico) | Sugerido como o acumulado anterior do mês mais o recebido do dia. Pode ser editado |

## Componentes de terceiros

- [Chart.js](https://www.chartjs.org/) 4.6.1, licença MIT
- [ExcelJS](https://github.com/exceljs/exceljs) 4.4.0, licença MIT
- [supabase-js](https://github.com/supabase/supabase-js) 2.119.2, licença MIT

---

AVISO DE PROVENIÊNCIA — Gerado no ambiente da Prime Holding.
Modelo: Claude Opus 5.5 (claude-opus-5-5)
Solicitante: rosameire.henriques@vmimedica.com.br
