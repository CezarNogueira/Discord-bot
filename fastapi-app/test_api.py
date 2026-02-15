"""
Script de exemplo para usar a API de comandos
Demonstra como adicionar, atualizar e remover comandos via API
"""

import requests
import json

# URL base da API
BASE_URL = "http://127.0.0.1:8000"

def add_simple_command():
    """Adiciona um comando simples (formato string)"""
    data = {
        "name": "lumos",
        "command": "💡 Ilumina a ponta da varinha por 5 minutos"
    }
    
    response = requests.post(f"{BASE_URL}/commands", json=data)
    print("Comando simples adicionado:")
    print(response.json())

def add_complex_command():
    """Adiciona um comando completo (formato objeto)"""
    data = {
        "name": "expecto_patronum",
        "command": {
            "description": "🛡️ Conjura um Patrono para proteger contra Dementadores por 10 minutos",
            "gif": "https://example.com/patronus.gif",
            "cooldown": 120,
            "rank": "6º Ano",
            "manaCost": "40% de Mana Base",
            "type": "Defesa/Proteção"
        }
    }
    
    response = requests.post(f"{BASE_URL}/commands", json=data)
    print("Comando completo adicionado:")
    print(response.json())

def list_commands():
    """Lista todos os comandos"""
    response = requests.get(f"{BASE_URL}/commands")
    print("Todos os comandos:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

def update_command():
    """Atualiza um comando existente"""
    data = {
        "description": "💡 Ilumina a ponta da varinha com luz brilhante por 10 minutos",
        "cooldown": 5
    }
    
    response = requests.put(f"{BASE_URL}/commands/lumos", json=data)
    print("Comando atualizado:")
    print(response.json())

def delete_command():
    """Remove um comando"""
    response = requests.delete(f"{BASE_URL}/commands/lumos")
    print("Comando removido:")
    print(response.json())

if __name__ == "__main__":
    print("=== Teste da API de Comandos ===\n")
    
    try:
        print("1. Listando comandos atuais:")
        list_commands()
        print("\n" + "="*50 + "\n")
        
        print("2. Adicionando comando simples:")
        add_simple_command()
        print("\n" + "="*50 + "\n")
        
        print("3. Adicionando comando completo:")
        add_complex_command()
        print("\n" + "="*50 + "\n")
        
        print("4. Listando comandos após adições:")
        list_commands()
        print("\n" + "="*50 + "\n")
        
        print("5. Atualizando comando:")
        update_command()
        print("\n" + "="*50 + "\n")
        
        print("6. Removendo comando:")
        delete_command()
        print("\n" + "="*50 + "\n")
        
        print("7. Listando comandos finais:")
        list_commands()
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro: API não está rodando. Execute 'python -m uvicorn main:app --reload' primeiro.")
    except Exception as e:
        print(f"❌ Erro: {e}")
