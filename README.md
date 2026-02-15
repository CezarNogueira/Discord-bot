# 🤖 Discord RPG Bot

## 🛠️ Tecnologias

- **Discord.js v14** - Biblioteca oficial para Discord
- **TypeScript** - Linguagem type-safe
- **Zod** - Validação de schema e tipos
- **tsx** - Runtime TypeScript rápido
- **FastAPI** - API opcional para comandos (Python)
- **dotenv** - Gerenciamento de variáveis de ambiente
- **Streamlit** - Interface da Api (Python)

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
# Registra comandos slash no Discord após ter criado ele na interface
npm run register
```

## 🚀 Execução

### Modo Completo (Bot + API + Interface)

**Terminal 1 - Iniciar API FastAPI:**
```bash
cd fastapi-app
python -m uvicorn main:app --reload
```

**Terminal 2 - Iniciar Bot:**
```bash
npm run dev
```

**Terminal 3 - Iniciar Interface:**
```bash
cd fastapi-app
streamlit run dashboard.py
```

### Produção

```bash
npm run build
npm start
```

## 🎯 Como Usar

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