from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Union, List, Literal
import json
import subprocess
import asyncio
import os

app = FastAPI(title="Commands API")

DB = Path(__file__).parent / "commands.json"

# Diretório raiz do projeto (um nível acima de fastapi-app/)
PROJECT_ROOT = Path(__file__).parent.parent

# ── Garante que o commands.json existe ──────────────────────────────────────
if not DB.exists():
    DB.write_text("{}", encoding="utf-8")

# ==========================================
# REGISTRO AUTOMÁTICO DE COMANDOS
# ==========================================

# Guarda o último resultado do register para o frontend consultar
register_status: dict = {"running": False, "success": None, "output": "", "error": ""}

async def run_register():
    """Roda 'npm run register' em background no diretório raiz do projeto."""
    global register_status
    register_status = {"running": True, "success": None, "output": "", "error": ""}

    try:
        proc = await asyncio.create_subprocess_exec(
            "npm", "run", "register",
            cwd=str(PROJECT_ROOT),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            # No Windows, npm é um .cmd — isso garante que funciona nos dois SOs
            shell=(os.name == "nt"),
        )
        stdout, stderr = await proc.communicate()

        register_status = {
            "running": False,
            "success": proc.returncode == 0,
            "output": stdout.decode("utf-8", errors="replace").strip(),
            "error":  stderr.decode("utf-8", errors="replace").strip(),
        }
    except Exception as e:
        register_status = {
            "running": False,
            "success": False,
            "output": "",
            "error": str(e),
        }

def trigger_register():
    """Dispara o register em background sem bloquear a resposta da API."""
    asyncio.create_task(run_register())

# ==========================================
# MODELS
# ==========================================

class Condition(BaseModel):
    type: Literal["comparison", "chance", "permission", "role", "channel", "user"]
    value1: Optional[Union[str, int, float]] = None
    operator: Optional[Literal["==", "!=", ">", "<", ">=", "<="]] = None
    value2: Optional[Union[str, int, float]] = None
    chance: Optional[int] = Field(None, ge=0, le=100)
    permission: Optional[str] = None
    roleId: Optional[str] = None
    roleName: Optional[str] = None
    channelId: Optional[str] = None
    userId: Optional[str] = None

class Button(BaseModel):
    label: str
    style: Literal["Primary", "Secondary", "Success", "Danger", "Link"]
    customId: Optional[str] = None
    url: Optional[str] = None
    emoji: Optional[str] = None
    actions: Optional[List['Action']] = None

class SelectOption(BaseModel):
    label: str
    value: str
    description: Optional[str] = None
    emoji: Optional[str] = None
    actions: Optional[List['Action']] = None

class SelectMenu(BaseModel):
    customId: str
    placeholder: Optional[str] = None
    minValues: Optional[int] = None
    maxValues: Optional[int] = None
    options: List[SelectOption]

class ActionEmbed(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None
    thumbnail: Optional[str] = None
    footer: Optional[str] = None

class Action(BaseModel):
    type: Literal[
        "send_message", "send_channel", "send_dm", "random_reply",
        "add_role", "remove_role", "delete_message", "timeout_user"
    ]
    conditions: Optional[List[Condition]] = None
    content: Optional[str] = None
    messages: Optional[List[str]] = None
    channelId: Optional[str] = None
    userId: Optional[str] = None
    roleId: Optional[str] = None
    duration: Optional[int] = None
    buttons: Optional[List[Button]] = None
    selectMenu: Optional[SelectMenu] = None
    embed: Optional[ActionEmbed] = None

Button.model_rebuild()
SelectOption.model_rebuild()
Action.model_rebuild()

class CommandData(BaseModel):
    description: str
    gif: Optional[str] = None
    cooldown: Optional[int] = None
    color: Optional[str] = None
    title: Optional[str] = None
    author_name: Optional[str] = None
    author_url: Optional[str] = None
    author_icon: Optional[str] = None
    thumbnail_url: Optional[str] = None
    footer_text: Optional[str] = None
    footer_icon: Optional[str] = None
    actions: Optional[List[Action]] = None
    requireConfirmation: Optional[bool] = None
    confirmationMessage: Optional[str] = None

class AddCommandRequest(BaseModel):
    name: str
    command: Union[str, CommandData]

# ==========================================
# HELPERS
# ==========================================

def load_commands():
    return json.loads(DB.read_text(encoding="utf-8"))

def save_commands(data):
    DB.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/api/commands")
async def all_commands():
    return load_commands()

@app.get("/api/commands/{name}")
async def get_command(name: str):
    data = load_commands()
    if name not in data:
        raise HTTPException(status_code=404, detail="Command not found")
    return {name: data[name]}

@app.post("/api/commands")
async def add_command(request: AddCommandRequest):
    data = load_commands()
    if request.name in data:
        raise HTTPException(status_code=400, detail=f"Command '{request.name}' already exists")
    data[request.name] = (
        request.command if isinstance(request.command, str)
        else request.command.model_dump(exclude_none=True)
    )
    save_commands(data)
    trigger_register()  # ← registra automaticamente
    return {
        "message": f"Command '{request.name}' added successfully",
        "command": data[request.name],
        "register": "running",
    }

@app.put("/api/commands/{name}")
async def update_command(name: str, command: Union[str, CommandData]):
    data = load_commands()
    if name not in data:
        raise HTTPException(status_code=404, detail=f"Command '{name}' not found")
    data[name] = command if isinstance(command, str) else command.model_dump(exclude_none=True)
    save_commands(data)
    trigger_register()  # ← re-registra automaticamente
    return {
        "message": f"Command '{name}' updated successfully",
        "command": data[name],
        "register": "running",
    }

@app.delete("/api/commands/{name}")
async def delete_command(name: str):
    data = load_commands()
    if name not in data:
        raise HTTPException(status_code=404, detail=f"Command '{name}' not found")
    deleted = data.pop(name)
    save_commands(data)
    trigger_register()  # ← remove do Discord também
    return {
        "message": f"Command '{name}' deleted successfully",
        "deleted_command": deleted,
        "register": "running",
    }

@app.post("/api/commands/batch")
async def add_commands_batch(commands: dict):
    data = load_commands()
    added, errors = [], []
    for name, cmd in commands.items():
        if name in data:
            errors.append(f"Command '{name}' already exists")
            continue
        data[name] = cmd
        added.append(name)
    if added:
        save_commands(data)
        trigger_register()  # ← registra após batch
    return {
        "message": f"Added {len(added)} commands",
        "added_commands": added,
        "errors": errors,
        "register": "running" if added else "skipped",
    }

@app.get("/api/register/status")
async def register_status_endpoint():
    """O frontend consulta este endpoint para saber se o register terminou."""
    return register_status

# ==========================================
# FRONTEND — serve os arquivos estáticos do React
# ==========================================

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(FRONTEND_DIR / "index.html")
else:
    @app.get("/")
    async def frontend_not_built():
        return {
            "error": "Frontend não buildado.",
            "instrucoes": ["cd frontend", "npm install", "npm run build"]
        }