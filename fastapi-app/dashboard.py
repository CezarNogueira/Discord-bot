import streamlit as st
import requests

API_URL = "http://127.0.0.1:8000"

# Configuração da página em modo expandido (Wide)
st.set_page_config(page_title="Dashboard", page_icon="🤖", layout="wide")

# --- GERENCIADOR DE TELAS ---
# Se a variável 'tela_atual' não existir, cria ela dizendo que estamos na 'lista'
if 'tela_atual' not in st.session_state:
    st.session_state.tela_atual = 'lista'

def mudar_tela(nova_tela):
    st.session_state.tela_atual = nova_tela

# ==========================================
# TELA 1: LISTA DE COMANDOS (Página Inicial)
# ==========================================
if st.session_state.tela_atual == 'lista':
    st.title("Custom Commands")
    
    # Botão para ir para a tela de criação
    if st.button("➕ ADD NEW COMMAND", type="secondary"):
        mudar_tela('criar')
        st.rerun()
        
    st.divider()
    
    # Listar Comandos
    try:
        resposta = requests.get(f"{API_URL}/commands")
        if resposta.status_code == 200:
            comandos = resposta.json()
            if comandos:
                for nome, detalhes in comandos.items():
                    with st.expander(f"⚡ !{nome}"):
                        st.json(detalhes)
                        if st.button(f"🗑️ Deletar {nome}", key=f"del_{nome}"):
                            requests.delete(f"{API_URL}/commands/{nome}")
                            st.rerun()
            else:
                st.info("Nenhum comando registrado.")
    except requests.exceptions.ConnectionError:
        st.error("A API não está rodando na porta 8000.")

# ==========================================
# TELA 2: CRIAR NOVO COMANDO
# ==========================================
elif st.session_state.tela_atual == 'criar':
    
    # Cabeçalho com botão de Voltar
    col_titulo, col_botoes = st.columns([4, 1])
    with col_titulo:
        st.title("Create New Command")
    with col_botoes:
        st.write("") # Espaço
        if st.button("✖", type="tertiary", use_container_width=True):
            mudar_tela('lista')
            st.rerun()

    # O Formulário Gigante
    with st.form("form_criacao_avancada"):
        st.subheader("General Settings")
        col1, col2 = st.columns([3, 1])
        with col1:
            nome = st.text_input("Command Name (ex: lumos)*")
        with col2:
            cooldown = st.number_input("Cooldown (seconds)", min_value=0, value=0)

        st.divider()

        st.subheader("🎨 Embed Content Template")
        
        cor_embed = st.color_picker("Embed Color", "#0099FF")
        
        col_author1, col_author2, col_author3 = st.columns(3)
        with col_author1:
            author_name = st.text_input("Author Name")
        with col_author2:
            author_url = st.text_input("Author URL")
        with col_author3:
            author_icon = st.text_input("Author Icon URL")

        title = st.text_input("Embed Title")
        desc_embed = st.text_area("Embed Description*", height=150)
        
        col_img1, col_img2 = st.columns(2)
        with col_img1:
            image_url = st.text_input("Image URL")
        with col_img2:
            thumbnail_url = st.text_input("Thumbnail URL")
            
        footer_text = st.text_input("Footer Text")

        st.write("")
        submit = st.form_submit_button("💾 SAVE COMMAND", type="secondary", use_container_width=True)

        if submit:
            if not nome or not desc_embed:
                st.error("O Nome do Comando e a Descrição do Embed são obrigatórios!")
            else:
                # Monta os dados mesclando as opções avançadas
                dados = {
                    "name": nome.lower(),
                    "command": {
                        "description": desc_embed,
                        "cooldown": cooldown if cooldown > 0 else None,
                        "gif": image_url if image_url else None,
                        "color": cor_embed,
                        "title": title if title else None,
                        "author_name": author_name if author_name else None,
                        "author_url": author_url if author_url else None,
                        "author_icon": author_icon if author_icon else None,
                        "thumbnail_url": thumbnail_url if thumbnail_url else None,
                        "footer_text": footer_text if footer_text else None,
                    }
                }
                
                resposta = requests.post(f"{API_URL}/commands", json=dados)
                if resposta.status_code == 200:
                    st.success("Comando salvo com sucesso!")
                    mudar_tela('lista')
                    st.rerun()
                else:
                    st.error(f"Erro: {resposta.json().get('detail')}")
