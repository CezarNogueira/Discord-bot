# 🤖 Discord RPG Bot

Bot Discord modular para múltiplos RPGs construído com Node.js + TypeScript. Suporta comandos slash dinâmicos carregados via API REST ou arquivo JSON, com embeds estilizados e suporte a GIFs.

## ✨ Funcionalidades

- 🎯 **Comandos Slash Dinâmicos** - Carrega comandos automaticamente do JSON/API
- 🎨 **Embeds Estilizados** - Respostas visuais com autor, título e cores personalizadas
- 🎬 **Suporte a GIFs** - Adicione GIFs animados aos comandos para mais imersão
- ⏱️ **Sistema de Cooldown** - Controle de tempo entre usos por usuário
- 🔄 **Dual Source** - API FastAPI ou arquivo JSON local como fallback
- 📝 **TypeScript** - Código type-safe com validação Zod
- 🚀 **Hot Reload** - Desenvolvimento rápido com tsx
- 🌐 **Multi-RPG** - Adaptável para qualquer sistema de RPG (Harry Potter, Naruto, etc.)
- 🔧 **API REST** - CRUD completo de comandos via API HTTP

## 🛠️ Tecnologias

- **Discord.js v14** - Biblioteca oficial para Discord
- **TypeScript** - Linguagem type-safe
- **Zod** - Validação de schema e tipos
- **tsx** - Runtime TypeScript rápido
- **FastAPI** - API opcional para comandos (Python)
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📁 Estrutura do Projeto

```
discord-bot/
├── src/
│   ├── commands/
│   │   └── registerCommands.ts    # Registra slash commands no Discord
│   ├── events/
│   │   ├── ready.ts               # Evento de conexão do bot
│   │   └── interactionCreate.ts   # Processa comandos dos usuários
│   ├── types/
│   │   └── command.d.ts           # Definições de tipos TypeScript
│   ├── utils/
│   │   └── commandLoader.ts       # Carrega comandos (API/JSON)
│   └── index.ts                   # Arquivo principal do bot
├── fastapi-app/
│   ├── main.py                    # API FastAPI (opcional)
│   ├── commands.json                # Dados dos comandos
│   └── requirements.txt           # Dependências Python
├── .env                           # Configurações (NÃO versionar!)
├── .env.example                   # Modelo de configuração
├── package.json                   # Dependências e scripts Node.js
└── tsconfig.json                  # Configuração TypeScript
```

## 🔧 Instalação e Configuração

### 1. Pré-requisitos

- Node.js 18+ 
- Python 3.8+ (opcional, para API)
- Bot Discord criado no [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Clonar e Instalar

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/discord-bot.git
cd discord-bot

# Instalar dependências Node.js
npm install

# Configurar ambiente Python (opcional, para API FastAPI)
cd fastapi-app
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
cd ..
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Token do seu bot Discord
DISCORD_TOKEN=seu-token-aqui

# ID da aplicação Discord
CLIENT_ID=id-da-aplicacao

# ID do servidor para desenvolvimento (opcional - comandos instantâneos)
GUILD_ID=id-do-servidor-dev

# URL da API (opcional - se não definir, usa arquivo local)
commands_API_URL=http://127.0.0.1:8000/commands
```

### 4. Registrar Comandos

```bash
# Registra comandos slash no Discord
npm run register
```

## 🚀 Execução

### Modo Simples (apenas bot)

```bash
npm run dev
```

### Modo Completo (bot + API)

**Terminal 1 - Iniciar API FastAPI:**
```bash
cd fastapi-app
python -m uvicorn main:app --reload
```

**Terminal 2 - Iniciar Bot:**
```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## 📝 Formato dos Comandos

### Formato Simples (String)
```json
{
  "fireball": "🔥 Lança uma bola de fogo que causa 50 de dano"
}
```

### Formato Completo (Objeto com GIF e Cooldown)
```json
{
  "protego": {
    "description": "・𝐏𝐑𝐎𝐓𝐄𝐆𝐎\nㅤ\n✨Efeito: Anula 50% do Dano Recebido e Anula efeitos do ataque\n\n📕 Rank: 1º Ano\n💙Custo de Mana: 10% de Mana Base\n🔍Tipo: Defesa\nObs: Não funciona contra \"Imperdoáveis\"",
    "gif": "https://media.giphy.com/media/exemplo/giphy.gif",
    "cooldown": 30
  }
}
```

### Propriedades Disponíveis

- **`description`** (obrigatório): Texto do comando com formatação
- **`gif`** (opcional): URL do GIF animado
- **`rank`** (opcional): Rank/nível necessário
- **`manaCost`** (opcional): Custo de mana/energia
- **`type`** (opcional): Tipo do comando (Ataque, Defesa, etc.)
- **`obs`** (opcional): Observações especiais
- **`cooldown`** (opcional): Tempo em segundos antes de poder usar novamente

## 🎯 Como Usar

### 📝 Adicionar Comandos

**Método 1: Editar arquivo JSON**
1. Edite `fastapi-app/commands.json`
2. Adicione seu comando no formato desejado
3. Execute `npm run register`

**Método 2: Via API (Formato Direto)**
```bash
curl -X 'POST' \
  'http://localhost:8000/commands/single' \
  -H 'Content-Type: application/json' \
  -d '{"protego": {"description": "🛡️ Escudo mágico", "cooldown": 30}}'
```

**Método 3: Via API (Formato Estruturado)**
```bash
curl -X 'POST' \
  'http://localhost:8000/commands' \
  -H 'Content-Type: application/json' \
  -d '{"name": "protego", "command": {"description": "🛡️ Escudo mágico", "cooldown": 30}}'
```

### 🎮 Usar no Discord
1. Digite `/nomedomando` no servidor
2. O bot responderá com embed estilizado
3. Aguarde o cooldown antes de usar novamente (se aplicável)

## 📋 Scripts Disponíveis

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Compilar TypeScript para JavaScript
- `npm start` - Executar versão compilada (produção)
- `npm run register` - Registrar comandos slash no Discord

## 🔧 Personalização

### Modificar Cores e Estilo dos Embeds

Edite `src/events/interactionCreate.ts`:

```typescript
const embed = new EmbedBuilder()
  .setColor(0x0099FF)  // Mude a cor aqui
  .setAuthor({
    name: `${interaction.user.displayName} usou o comando`,
    iconURL: interaction.user.displayAvatarURL(),
  });
```

### Adicionar Novo Sistema de RPG

1. Crie novo arquivo JSON: `fastapi-app/dnd-commands.json`
2. Modifique `.env`: `COMMANDS_API_URL=http://127.0.0.1:8000/dnd`
3. Atualize a API FastAPI para nova rota
4. Registre comandos: `npm run register`

### Customizar Ícones por Tipo

```typescript
// Em interactionCreate.ts
const iconMap = {
  'Ataque': '⚔️',
  'Defesa': '🛡️',
  'Cura': '💚',
  'Magia': '✨'
};
```

## 📚 API Endpoints (FastAPI)

### 📋 Consulta de Comandos
- `GET /commands` - Lista todos os comandos
- `GET /commands/{nome}` - Retorna comando específico

### ➕ Adicionar Comandos
- `POST /commands` - Adiciona comando (formato estruturado)
- `POST /commands/single` - Adiciona um comando (formato direto JSON)
- `POST /commands/batch` - Adiciona múltiplos comandos de uma vez

### ✏️ Gerenciar Comandos
- `PUT /commands/{nome}` - Atualiza comando existente
- `DELETE /commands/{nome}` - Remove comando

### 📖 Documentação
- `GET /docs` - Documentação interativa Swagger UI
- `GET /redoc` - Documentação alternativa ReDoc

## 🔗 Exemplos de Uso da API

### Adicionar Comando Único (Formato Direto)
```bash
curl -X 'POST' \
  'http://localhost:8000/commands/single' \
  -H 'Content-Type: application/json' \
  -d '{
  "expelliarmus": {
    "description": "⚡ Desarma o oponente\n📕 Rank: 2º Ano",
    "gif": "https://example.com/expelliarmus.gif",
    "cooldown": 45
  }
}'
```

### Adicionar Múltiplos Comandos
```bash
curl -X 'POST' \
  'http://localhost:8000/commands/batch' \
  -H 'Content-Type: application/json' \
  -d '{
  "lumos": {
    "description": "💡 Ilumina a ponta da varinha",
    "cooldown": 5
  },
  "nox": {
    "description": "🌑 Apaga a luz da varinha",
    "cooldown": 3
  }
}'
```

### Adicionar Comando (Formato Estruturado)
```bash
curl -X 'POST' \
  'http://localhost:8000/commands' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "avada_kedavra",
  "command": {
    "description": "💀 Maldição Imperdoável - Mata instantaneamente",
    "rank": "Proibido",
    "type": "Imperdoável",
    "cooldown": 300
  }
}'
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 🛠️ Troubleshooting

### Bot não responde aos comandos
- Verifique se o token está correto no `.env`
- Execute `npm run register` novamente
- Certifique-se que o bot tem permissões no servidor

### Comandos não aparecem
- Aguarde alguns minutos (comandos globais podem demorar)
- Use `GUILD_ID` no `.env` para comandos instantâneos em desenvolvimento
- Verifique se o `CLIENT_ID` está correto

### GIFs não aparecem
- Verifique se a URL do GIF é válida
- Certifique-se que a URL termina com `.gif`
- Teste a URL diretamente no navegador

### API não funciona
- Verifique se a API FastAPI está rodando: `uvicorn main:app --reload`
- Confirme se a URL no `.env` está correta: `COMMANDS_API_URL=http://127.0.0.1:8000/commands`
- Teste a API diretamente: `curl http://localhost:8000/commands`
- Verifique os logs da API para erros específicos

### Erro ao adicionar comandos via API
- Use `/commands/single` para formato direto: `{"nome": {...}}`
- Use `/commands` para formato estruturado: `{"name": "nome", "command": {...}}`
- Verifique se o JSON está válido
- Confirme se o comando não existe já (erro 400)