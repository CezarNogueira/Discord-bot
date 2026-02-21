# Bot Dashboard

Dashboard React servido diretamente pelo FastAPI em `http://127.0.0.1:8000`.

## Estrutura

```
bot-dashboard/
├── fastapi-app/
│   ├── main.py          ← API + serve o frontend
│   └── commands.json    ← banco de dados
└── frontend/
    ├── src/
    │   ├── App.jsx      ← dashboard React
    │   └── main.jsx     ← entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Setup (primeira vez)

### 1. Instalar dependências do frontend
```bash
cd frontend
npm install
```

### 2. Buildar o frontend
```bash
npm run build
```
Isso gera `frontend/dist/` que o FastAPI vai servir automaticamente.

### 3. Instalar dependências Python
```bash
pip install fastapi uvicorn[standard]
```

### 4. Rodar o servidor
```bash
cd fastapi-app
uvicorn main:app --reload --port 8000
```

Acesse: **http://127.0.0.1:8000**

---

## Desenvolvimento

Para desenvolver o frontend com hot-reload:

```bash
# Terminal 1 — FastAPI
cd fastapi-app
uvicorn main:app --reload --port 8000

# Terminal 2 — Vite dev server (porta 5173, com proxy para /api → 8000)
cd frontend
npm run dev
```

Edite em `http://localhost:5173`. Quando terminar, faça `npm run build` e o FastAPI servirá a versão atualizada.

---

## Rotas da API

Todas as rotas da API ficam sob `/api/` para não conflitar com o frontend:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/commands` | Lista todos os comandos |
| GET | `/api/commands/{name}` | Busca um comando |
| POST | `/api/commands` | Cria um novo comando |
| PUT | `/api/commands/{name}` | Atualiza um comando |
| DELETE | `/api/commands/{name}` | Remove um comando |
| POST | `/api/commands/batch` | Cria múltiplos comandos |

> **Nota:** Se você usa `COMMANDS_API_URL` no bot TypeScript, atualize para apontar para `/api/commands`.