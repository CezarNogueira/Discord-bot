from fastapi import FastAPI, HTTPException
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Union
from fastapi.responses import RedirectResponse
import json

app = FastAPI(title="Commands API")
DB = Path(__file__).parent / "commands.json"  # commands.json ao lado

@app.get("/")
async def root():
    # Redireciona a página principal direto para a porta do Streamlit (8501)
    return RedirectResponse(url="http://127.0.0.1:8501")

# Modelo para comando completo
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

# Modelo para adicionar comando (aceita string ou objeto)
class AddCommandRequest(BaseModel):
    name: str
    command: Union[str, CommandData]

def load_commands():
    return json.loads(DB.read_text(encoding="utf-8"))

def save_commands(data):
    DB.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

@app.get("/commands")
async def all_commands():
    return load_commands()

@app.get("/commands/{name}")
async def command(name: str):
    data = load_commands()
    if name not in data:
        raise HTTPException(status_code=404, detail="Command not found")
    return {name: data[name]}

@app.post("/commands")
async def add_command(request: AddCommandRequest):
    """Adiciona um novo comando ao arquivo commands.json"""
    data = load_commands()
    
    # Verifica se comando já existe
    if request.name in data:
        raise HTTPException(status_code=400, detail=f"Command '{request.name}' already exists")
    
    # Adiciona o comando (mantém formato original - string ou objeto)
    if isinstance(request.command, str):
        data[request.name] = request.command
    else:
        # Converte para dict removendo campos None
        command_dict = request.command.model_dump(exclude_none=True)
        data[request.name] = command_dict
    
    # Salva o arquivo
    save_commands(data)
    
    return {"message": f"Command '{request.name}' added successfully", "command": data[request.name]}

@app.put("/commands/{name}")
async def update_command(name: str, command: Union[str, CommandData]):
    """Atualiza um comando existente"""
    data = load_commands()
    
    if name not in data:
        raise HTTPException(status_code=404, detail=f"Command '{name}' not found")
    
    # Atualiza o comando
    if isinstance(command, str):
        data[name] = command
    else:
        command_dict = command.dict(exclude_none=True)
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
    """Adiciona múltiplos comandos de uma vez diretamente do formato JSON"""
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

@app.post("/commands/single")
async def add_single_command(command_data: dict):
    """Adiciona um único comando onde a chave é o nome e o valor é o comando"""
    data = load_commands()
    
    if len(command_data) != 1:
        raise HTTPException(status_code=400, detail="Must provide exactly one command")
    
    name, command = next(iter(command_data.items()))
    
    if name in data:
        raise HTTPException(status_code=400, detail=f"Command '{name}' already exists")
    
    data[name] = command
    save_commands(data)
    
    return {"message": f"Command '{name}' added successfully", "command": {name: command}}