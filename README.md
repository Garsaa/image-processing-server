# Image Processing Server

API Node.js para receber imagens JPEG enviadas por uma ESP32-CAM, salvar capturas, registrar metadados, comparar a imagem atual com a anterior do mesmo dispositivo e enviar alerta por e-mail quando houver uma mudanca relevante.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

A API sobe por padrao em `http://localhost:3000`.

## Deploy na Vercel com Supabase

Para deploy na Vercel, use Supabase Storage para as imagens e Supabase Postgres para os metadados, porque o filesystem da Vercel nao e persistente.

Configure estas variaveis no painel da Vercel:

```env
NODE_ENV=production
PUBLIC_BASE_URL=https://seu-projeto.vercel.app
STORAGE_PROVIDER=supabase
CAPTURES_REPOSITORY=supabase
MAX_IMAGE_SIZE_BYTES=5242880
MOTION_DIFF_THRESHOLD=25

SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_BUCKET=captures
SUPABASE_CAPTURES_TABLE=captures

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-senha-de-app-sem-espacos
MAIL_FROM=ESP32-CAM Monitor <seu-email@gmail.com>
ALERT_EMAIL_TO=gabriel.garcia.dev@gmail.com
```

Crie um bucket `captures` no Supabase Storage. Para simplificar o frontend, deixe o bucket publico. Depois crie a tabela:

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

- `STORAGE_PROVIDER=supabase`
- `CAPTURES_REPOSITORY=supabase`

Assim as imagens vao para Supabase Storage e os metadados para Supabase Postgres.

Variaveis principais:

- `MAX_IMAGE_SIZE_BYTES`: limite do body JPEG. Padrao: `5242880` (5 MB).
- `MOTION_DIFF_THRESHOLD`: pontuacao minima para considerar movimento. Padrao: `25`.
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET`: configuracao do Supabase usada no servidor.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`: alternativa opcional com Firebase Admin SDK.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`: SMTP usado pelo `nodemailer`.
- `ALERT_EMAIL_TO`: destinatario do alerta.

Se o SMTP nao estiver configurado, a API continua funcionando e registra no log que o alerta nao foi enviado.
