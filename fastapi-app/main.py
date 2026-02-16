from fastapi import FastAPI, HTTPException
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Union, List, Literal
from fastapi.responses import RedirectResponse
import json

app = FastAPI(title="Commands API")
DB = Path(__file__).parent / "commands.json"

@app.get("/")
async def root():
    return RedirectResponse(url="http://127.0.0.1:8501")

# ==========================================
# MODELS PARA ACTIONS SYSTEM
# ==========================================

class Condition(BaseModel):
    """Modelo para condições de execução"""
    type: Literal["comparison", "chance", "permission", "role", "channel", "user"]
    
    # Para comparison
    value1: Optional[Union[str, int, float]] = None
    operator: Optional[Literal["==", "!=", ">", "<", ">=", "<="]] = None
    value2: Optional[Union[str, int, float]] = None
    
    # Para chance
    chance: Optional[int] = Field(None, ge=0, le=100)
    
    # Para permission
    permission: Optional[str] = None
    
    # Para role
    roleId: Optional[str] = None
    roleName: Optional[str] = None
    
    # Para channel
    channelId: Optional[str] = None
    
    # Para user
    userId: Optional[str] = None

class Button(BaseModel):
    """Modelo para botões interativos"""
    label: str
    style: Literal["Primary", "Secondary", "Success", "Danger", "Link"]
    customId: Optional[str] = None
    url: Optional[str] = None
    emoji: Optional[str] = None
    actions: Optional[List['Action']] = None

class SelectOption(BaseModel):
    """Modelo para opção de select menu"""
    label: str
    value: str
    description: Optional[str] = None
    emoji: Optional[str] = None
    actions: Optional[List['Action']] = None

class SelectMenu(BaseModel):
    """Modelo para select menu"""
    customId: str
    placeholder: Optional[str] = None
    minValues: Optional[int] = None
    maxValues: Optional[int] = None
    options: List[SelectOption]

class ActionEmbed(BaseModel):
    """Modelo para embed customizado de uma action"""
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None
    thumbnail: Optional[str] = None
    footer: Optional[str] = None

class Action(BaseModel):
    """Modelo para ações do comando"""
    type: Literal[
        "send_message",
        "send_channel", 
        "send_dm",
        "random_reply",
        "add_role",
        "remove_role",
        "delete_message",
        "timeout_user"
    ]
    
    # Condições
    conditions: Optional[List[Condition]] = None
    
    # Para mensagens
    content: Optional[str] = None
    messages: Optional[List[str]] = None  # Para random_reply
    
    # Para send_channel
    channelId: Optional[str] = None
    
    # Para send_dm
    userId: Optional[str] = None
    
    # Para roles
    roleId: Optional[str] = None
    
    # Para timeout
    duration: Optional[int] = None
    
    # Componentes interativos
    buttons: Optional[List[Button]] = None
    selectMenu: Optional[SelectMenu] = None
    
    # Embed customizado
    embed: Optional[ActionEmbed] = None

# Permite referências circulares
Button.model_rebuild()
SelectOption.model_rebuild()
Action.model_rebuild()

# ==========================================
# MODELS PARA COMANDOS
# ==========================================

class CommandData(BaseModel):
    """Modelo para comando completo"""
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
    
    # Sistema de actions
    actions: Optional[List[Action]] = None
    requireConfirmation: Optional[bool] = None
    confirmationMessage: Optional[str] = None

class AddCommandRequest(BaseModel):
    """Modelo para adicionar comando"""
    name: str
    command: Union[str, CommandData]

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def load_commands():
    """Carrega comandos do arquivo JSON"""
    return json.loads(DB.read_text(encoding="utf-8"))

def save_commands(data):
    """Salva comandos no arquivo JSON"""
    DB.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/commands")
async def all_commands():
    """Lista todos os comandos"""
    return load_commands()

@app.get("/commands/{name}")
async def command(name: str):
    """Busca um comando específico"""
    data = load_commands()
    if name not in data:
        raise HTTPException(status_code=404, detail="Command not found")
    return {name: data[name]}

@app.post("/commands")
async def add_command(request: AddCommandRequest):
    """Adiciona um novo comando"""
    data = load_commands()
    
    if request.name in data:
        raise HTTPException(status_code=400, detail=f"Command '{request.name}' already exists")
    
    if isinstance(request.command, str):
        data[request.name] = request.command
    else:
        command_dict = request.command.model_dump(exclude_none=True)
        data[request.name] = command_dict
    
    save_commands(data)
    
    return {"message": f"Command '{request.name}' added successfully", "command": data[request.name]}

@app.put("/commands/{name}")
async def update_command(name: str, command: Union[str, CommandData]):
    """Atualiza um comando existente"""
    data = load_commands()
    
    if name not in data:
        raise HTTPException(status_code=404, detail=f"Command '{name}' not found")
    
    if isinstance(command, str):
        data[name] = command
    else:
        command_dict = command.model_dump(exclude_none=True)
        data[name] = command_dict
    
    save_commands(data)
    
    return {"message": f"Command '{name}' updated successfully", "command": data[name]}

@app.delete("/commands/{name}")
async def delete_command(name: str):
    """Remove um comando"""
    data = load_commands()
    
    if name not in data:
        raise HTTPException(status_code=404, detail=f"Command '{name}' not found")
    
    deleted_command = data.pop(name)
    save_commands(data)
    
    return {"message": f"Command '{name}' deleted successfully", "deleted_command": deleted_command}

@app.post("/commands/batch")
async def add_commands_batch(commands: dict):
    """Adiciona múltiplos comandos"""
    data = load_commands()
    
    added_commands = []
    errors = []
    
    for name, command_data in commands.items():
        if name in data:
            errors.append(f"Command '{name}' already exists")
            continue
        
        data[name] = command_data
        added_commands.append(name)
    
    if added_commands:
        save_commands(data)
    
    return {
        "message": f"Added {len(added_commands)} commands successfully",
        "added_commands": added_commands,
        "errors": errors
    }
