# Image Processing Server

API Node.js para receber imagens JPEG enviadas por uma ESP32-CAM, salvar capturas, registrar metadados, comparar a imagem atual com a anterior do mesmo dispositivo e enviar alerta por e-mail quando houver uma mudanca relevante.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

A API sobe por padrao em `http://localhost:3000`.

## Deploy na Vercel com Supabase + Google Drive

Para deploy na Vercel, use Google Drive para os arquivos das imagens e Supabase Postgres para os metadados. O filesystem da Vercel nao e persistente, entao `STORAGE_PROVIDER=local` deve ficar apenas para desenvolvimento.

Configure estas variaveis no painel da Vercel:

```env
NODE_ENV=production
PUBLIC_BASE_URL=https://seu-projeto.vercel.app
STORAGE_PROVIDER=google-drive
CAPTURES_REPOSITORY=supabase
MAX_IMAGE_SIZE_BYTES=5242880
MOTION_DIFF_THRESHOLD=25

SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_CAPTURES_TABLE=captures

GOOGLE_DRIVE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_DRIVE_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_DRIVE_FOLDER_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-senha-de-app-sem-espacos
MAIL_FROM=ESP32-CAM Monitor <seu-email@gmail.com>
ALERT_EMAIL_TO=gabriel.garcia.dev@gmail.com
```

Crie a tabela no Supabase:

```sql
create table if not exists public.captures (
  id text primary key,
  device_id text not null,
  capture_source text,
  image_url text not null,
  image_path text not null,
  size_bytes bigint not null,
  mime_type text not null default 'image/jpeg',
  captured_at timestamptz not null,
  trigger_command text,
  diff_score numeric,
  motion_detected boolean not null default false,
  email_alert_sent boolean not null default false
);

create index if not exists captures_device_id_captured_at_idx
  on public.captures (device_id, captured_at desc);

create index if not exists captures_motion_detected_captured_at_idx
  on public.captures (motion_detected, captured_at desc);
```

## Endpoints

### Enviar captura

```bash
curl -X POST http://localhost:3000/captures \
  -H "Content-Type: image/jpeg" \
  -H "x-device-id: esp32cam-01" \
  -H "x-trigger-command: 0x1C" \
  --data-binary "@foto.jpg"
```

Resposta esperada:

```json
{
  "id": "...",
  "deviceId": "esp32cam-01",
  "imageUrl": "http://localhost:3000/uploads/esp32cam-01/...",
  "motionDetected": false,
  "diffScore": 0,
  "emailAlertSent": false,
  "capturedAt": "..."
}
```

### Listar capturas

```bash
curl "http://localhost:3000/captures?page=1&pageSize=20&deviceId=esp32cam-01"
```

Filtros opcionais:

- `deviceId`
- `motionDetected=true|false`
- `from=2026-06-10T00:00:00.000Z`
- `to=2026-06-10T23:59:59.999Z`

### Ultima captura de um dispositivo

```bash
curl "http://localhost:3000/captures/latest?deviceId=esp32cam-01"
```

### Detalhe de uma captura

```bash
curl "http://localhost:3000/captures/<id>"
```

O frontend pode renderizar a imagem usando o campo `imageUrl` retornado por qualquer um desses endpoints. No modo Firebase, esse campo e uma URL assinada do Firebase Storage.

## Configuracao

Por padrao, em desenvolvimento local, as imagens sao salvas em `uploads/` e os metadados em `data/captures.json`.

Em producao na Vercel, use:

- `STORAGE_PROVIDER=google-drive`
- `CAPTURES_REPOSITORY=supabase`

Assim as imagens vao para Google Drive e os metadados para Supabase Postgres. O campo `imageUrl` salvo na tabela `captures` fica publico para o front consumir depois.

### Google Drive

O provider do Google Drive usa OAuth com `refresh_token`, porque assim os uploads usam a conta Google autenticada, incluindo o Drive da faculdade.

Passos resumidos:

1. No Google Cloud Console, crie ou escolha um projeto.
2. Ative a Google Drive API.
3. Configure a tela de consentimento OAuth. Em conta institucional, prefira publicar como app interno quando a organizacao permitir. Se o app ficar em modo testing, o refresh token pode expirar depois de alguns dias.
4. Crie um OAuth Client ID e guarde `client_id` e `client_secret`.
5. Gere um `refresh_token` autorizando o escopo `https://www.googleapis.com/auth/drive`.
6. Crie uma pasta no Drive da faculdade para as capturas e copie o id da pasta pela URL. Esse valor vai em `GOOGLE_DRIVE_FOLDER_ID`.

Variaveis do Drive:

- `GOOGLE_DRIVE_CLIENT_ID`: OAuth client id.
- `GOOGLE_DRIVE_CLIENT_SECRET`: OAuth client secret.
- `GOOGLE_DRIVE_REFRESH_TOKEN`: refresh token da conta Google que recebera os uploads.
- `GOOGLE_DRIVE_FOLDER_ID`: pasta onde as imagens serao criadas.
- `GOOGLE_DRIVE_PUBLIC_URL_TEMPLATE`: opcional. Template de URL publica com `{fileId}`. Padrao: `https://drive.google.com/uc?export=view&id={fileId}`.

Variaveis principais:

- `MAX_IMAGE_SIZE_BYTES`: limite do body JPEG. Padrao: `5242880` (5 MB).
- `MOTION_DIFF_THRESHOLD`: pontuacao minima para considerar movimento. Padrao: `25`.
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_CAPTURES_TABLE`: configuracao do Supabase usada no servidor.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`: SMTP usado pelo `nodemailer`.
- `ALERT_EMAIL_TO`: destinatario do alerta.

Se o SMTP nao estiver configurado, a API continua funcionando e registra no log que o alerta nao foi enviado.
