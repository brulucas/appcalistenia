# Publicar na Netlify

## 1. Arquivos

Publique o conteúdo desta pasta como site estático. A estrutura mínima é:

```text
index.html
manifest.json
sw.js
package.json
netlify.toml
icons/icon-192.png
icons/icon-512.png
netlify/functions/hotmart-webhook.js
netlify/functions/check-access.js
```

O bundle existente do app continua sendo carregado de `/assets/index-7wfL7imm.js`.

## 2. Publicação

### Opção recomendada: GitHub + Netlify

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta, incluindo a pasta `netlify/functions` e a pasta `icons`.
3. No Netlify, selecione **Add new site → Import an existing project**.
4. Escolha o repositório.
5. Use estas configurações:
   - **Build command:** deixe vazio.
   - **Publish directory:** `.`
   - **Functions directory:** `netlify/functions`.
6. Publique o site.

### Opção alternativa: Netlify CLI

Na pasta do projeto:

```bash
npm install
npx netlify login
npx netlify init
npx netlify deploy --prod
```

Quando solicitado, use `.` como pasta publicada e `netlify/functions` como pasta de Functions.

## 3. Variável de ambiente

Crie exatamente esta variável no Netlify em **Site configuration → Environment variables**:

```text
HOTMART_HOTTOK=seu_hottok_da_configuracao_de_webhook
```

Depois de criar ou alterar a variável, faça um novo deploy.

## 4. Configuração do Hotmart

Na configuração do webhook da Hotmart, informe a URL pública:

```text
https://SEU-SITE.netlify.app/.netlify/functions/hotmart-webhook
```

Use a versão de eventos **2.0.0**. O código valida o header `X-HOTMART-HOTTOK`, registra compras aprovadas/completas e remove acesso em reembolso, chargeback, cancelamento, expiração e protesto.

## 5. Endereços finais das Functions

```text
https://SEU-SITE.netlify.app/.netlify/functions/hotmart-webhook
https://SEU-SITE.netlify.app/.netlify/functions/check-access
```

## 6. IDs configurados

- Produto principal: `k01suv1q`
- Bono 1: `qan5s17k`
- Bono 2: `uwk9lei2`
- Bono 3: `w0gj1zdu`

O app guarda o e-mail e o último resultado de acesso no `localStorage`. Se estiver sem internet, ele usa o último resultado salvo e não bloqueia um cliente já liberado.

## 7. Testar sem comprar

Para simular um evento aprovado, substitua os valores e execute:

```bash
curl -i -X POST "https://SEU-SITE.netlify.app/.netlify/functions/hotmart-webhook" \
  -H "Content-Type: application/json" \
  -H "X-HOTMART-HOTTOK: SEU_HOTMART_HOTTOK" \
  -d '{
    "event": "PURCHASE_APPROVED",
    "data": {
      "product": {"ucode": "k01suv1q", "name": "Protocolo 21 Dias"},
      "buyer": {"email": "teste@example.com"},
      "purchase": {"offer": {"code": "k01suv1q"}}
    }
  }'
```

Depois, no app, informe `teste@example.com` e toque em **CONTINUAR**. Para simular reembolso, repita o teste com `PURCHASE_REFUNDED`.

Para consultar diretamente:

```bash
curl -X POST "https://SEU-SITE.netlify.app/.netlify/functions/check-access" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com"}'
```

## 8. Testar a instalação

### Android / Chrome

1. Abra o site publicado em HTTPS.
2. Use o botão **Instalar app** quando ele aparecer ou o menu do Chrome → **Instalar app**.
3. Abra pelo ícone instalado e confirme que abre em modo standalone.

### iPhone / Safari

1. Abra o site no Safari.
2. Toque em **Compartilhar**.
3. Toque em **Adicionar à Tela de Início**.
4. Abra pelo novo ícone.

O service worker usa a versão `calistenia-militar-v1`, armazena o app e os arquivos same-origin em cache e nunca intercepta `/.netlify/functions/`. Para forçar uma atualização futura, altere o nome da constante `CACHE_VERSION` em `sw.js`.
