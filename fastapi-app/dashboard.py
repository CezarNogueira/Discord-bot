import streamlit as st
import requests
import json
import re

API_URL = "http://127.0.0.1:8000"

st.set_page_config(page_title="Command Dashboard", page_icon="🤖", layout="wide")

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
    }
    .stTabs [data-baseweb="tab"] {
        height: 3rem;
        padding: 0 2rem;
        font-size: 1.1rem;
    }
</style>
""", unsafe_allow_html=True)

# Estado
if 'tela_atual' not in st.session_state:
    st.session_state.tela_atual = 'lista'
if 'actions' not in st.session_state:
    st.session_state.actions = []
if 'editing_action_index' not in st.session_state:
    st.session_state.editing_action_index = None

def mudar_tela(nova_tela):
    st.session_state.tela_atual = nova_tela
    st.session_state.actions = []
    st.session_state.editing_action_index = None

# Validação Nunjucks
def validate_nunjucks(text):
    if not text:
        return True, []
    errors = []
    open_br = text.count('{{')
    close_br = text.count('}}')
    if open_br != close_br:
        errors.append(f"❌ Chaves desbalanceadas: {open_br} {{ {{ vs {close_br} }} }}")
    return len(errors) == 0, errors

def render_nunjucks_preview(text):
    if not text:
        return ""
    preview = text
    replacements = {
        r'\{\{\s*user\.mention\s*\}\}': '@Usuario',
        r'\{\{\s*user\.name\s*\}\}': 'usuario123',
        r'\{\{\s*user\.displayName\s*\}\}': 'Nome Display',
        r'\{\{\s*user\.id\s*\}\}': '123456789',
        r'\{\{\s*server\.name\s*\}\}': 'Meu Servidor',
        r'\{\{\s*random\((\d+),\s*(\d+)\)\s*\}\}': r'[random \1-\2]',
        r'\{\{\s*round\(([\d.]+)\)\s*\}\}': lambda m: str(round(float(m.group(1)))),
        r'\{\{\s*arguments\.get\((\d+)\)\s*\}\}': r'<arg\1>',
    }
    for pattern, replacement in replacements.items():
        if callable(replacement):
            preview = re.sub(pattern, replacement, preview)
        else:
            preview = re.sub(pattern, replacement, preview)
    return preview

def render_nunjucks_help():
    with st.expander("📖 Guia de Variáveis Nunjucks"):
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**👤 Usuário:**")
            st.code("{{ user.mention }}", language="jinja2")
            st.caption("→ @Usuario")
            st.code("{{ user.name }}", language="jinja2")
            st.caption("→ NomeUsuario")
        with col2:
            st.markdown("**🎲 Funções:**")
            st.code("{{ random(1, 100) }}", language="jinja2")
            st.caption("→ Número aleatório")
            st.code("{{ round(3.7) }}", language="jinja2")
            st.caption("→ 4")

# Renderizadores
def render_condition_editor(prefix="cond", key_suffix=""):
    st.markdown("### 🎯 Condições")
    if f'{prefix}_conditions{key_suffix}' not in st.session_state:
        st.session_state[f'{prefix}_conditions{key_suffix}'] = []
    conditions = st.session_state[f'{prefix}_conditions{key_suffix}']
    
    if conditions:
        for i, cond in enumerate(conditions):
            col1, col2 = st.columns([6, 1])
            with col1:
                st.markdown(f"**Condição {i+1}: {cond['type']}**")
                st.json(cond)
            with col2:
                st.write("")
                if st.button("🗑️", key=f"del_cond_{prefix}_{i}{key_suffix}"):
                    conditions.pop(i)
                    st.rerun()
            st.divider()
    
    with st.expander("➕ Adicionar Condição"):
        cond_type = st.selectbox("Tipo", ["comparison", "chance", "permission", "role", "channel", "user"],
                                key=f"new_cond_type_{prefix}{key_suffix}")
        new_cond = {"type": cond_type}
        
        if cond_type == "comparison":
            col1, col2, col3 = st.columns(3)
            with col1:
                new_cond["value1"] = st.text_input("Valor 1", key=f"cond_v1_{prefix}{key_suffix}")
            with col2:
                new_cond["operator"] = st.selectbox("Op", ["==", "!=", ">", "<", ">=", "<="], 
                                                    key=f"cond_op_{prefix}{key_suffix}")
            with col3:
                new_cond["value2"] = st.text_input("Valor 2", key=f"cond_v2_{prefix}{key_suffix}")
        elif cond_type == "chance":
            new_cond["chance"] = st.slider("Chance %", 0, 100, 50, key=f"cond_chance_{prefix}{key_suffix}")
        elif cond_type == "permission":
            new_cond["permission"] = st.text_input("Permissão", key=f"cond_perm_{prefix}{key_suffix}")
        elif cond_type == "role":
            col1, col2 = st.columns(2)
            with col1:
                new_cond["roleId"] = st.text_input("Role ID", key=f"cond_role_id_{prefix}{key_suffix}")
            with col2:
                new_cond["roleName"] = st.text_input("Role Name", key=f"cond_role_name_{prefix}{key_suffix}")
        elif cond_type == "channel":
            new_cond["channelId"] = st.text_input("Channel ID", key=f"cond_ch_{prefix}{key_suffix}")
        elif cond_type == "user":
            new_cond["userId"] = st.text_input("User ID", key=f"cond_user_{prefix}{key_suffix}")
        
        if st.button("✅ Adicionar", key=f"add_cond_{prefix}{key_suffix}", type="primary"):
            conditions.append({k: v for k, v in new_cond.items() if v})
            st.rerun()
    return conditions

def render_button_editor(prefix="btn", key_suffix=""):
    st.markdown("### 🔘 Botões")
    if f'{prefix}_buttons{key_suffix}' not in st.session_state:
        st.session_state[f'{prefix}_buttons{key_suffix}'] = []
    buttons = st.session_state[f'{prefix}_buttons{key_suffix}']
    
    if buttons:
        for i, btn in enumerate(buttons):
            col1, col2 = st.columns([6, 1])
            with col1:
                st.markdown(f"**{btn['label']}** ({btn['style']})")
            with col2:
                if st.button("🗑️", key=f"del_btn_{prefix}_{i}{key_suffix}"):
                    buttons.pop(i)
                    st.rerun()
            st.divider()
    
    with st.expander("➕ Adicionar Botão"):
        col1, col2 = st.columns(2)
        with col1:
            btn_label = st.text_input("Label*", key=f"new_btn_label_{prefix}{key_suffix}")
        with col2:
            btn_style = st.selectbox("Estilo", ["Primary", "Secondary", "Success", "Danger", "Link"],
                                    key=f"new_btn_style_{prefix}{key_suffix}")
        
        col1, col2 = st.columns(2)
        with col1:
            btn_emoji = st.text_input("Emoji", key=f"new_btn_emoji_{prefix}{key_suffix}")
        with col2:
            btn_url = st.text_input("URL", key=f"new_btn_url_{prefix}{key_suffix}")
        
        if st.button("✅ Adicionar", key=f"add_btn_{prefix}{key_suffix}", type="primary"):
            if btn_label:
                new_btn = {"label": btn_label, "style": btn_style}
                if btn_emoji: new_btn["emoji"] = btn_emoji
                if btn_url: new_btn["url"] = btn_url
                buttons.append(new_btn)
                st.rerun()
    return buttons

def render_select_menu_editor(prefix="sel", key_suffix=""):
    st.markdown("### 📋 Select Menu")
    use_select = st.checkbox("Adicionar Select Menu", key=f"use_select_{prefix}{key_suffix}")
    if not use_select:
        return None
    
    select_custom_id = st.text_input("Custom ID*", key=f"sel_id_{prefix}{key_suffix}")
    
    if f'{prefix}_select_options{key_suffix}' not in st.session_state:
        st.session_state[f'{prefix}_select_options{key_suffix}'] = []
    options = st.session_state[f'{prefix}_select_options{key_suffix}']
    
    if options:
        for i, opt in enumerate(options):
            col1, col2 = st.columns([6, 1])
            with col1:
                st.markdown(f"**{opt['label']}** (`{opt['value']}`)")
            with col2:
                if st.button("🗑️", key=f"del_opt_{prefix}_{i}{key_suffix}"):
                    options.pop(i)
                    st.rerun()
    
    with st.expander("➕ Adicionar Opção"):
        col1, col2 = st.columns(2)
        with col1:
            opt_label = st.text_input("Label*", key=f"opt_label_{prefix}{key_suffix}")
        with col2:
            opt_value = st.text_input("Value*", key=f"opt_value_{prefix}{key_suffix}")
        
        if st.button("✅ Adicionar", key=f"add_opt_{prefix}{key_suffix}", type="primary"):
            if opt_label and opt_value:
                options.append({"label": opt_label, "value": opt_value})
                st.rerun()
    
    if select_custom_id and options:
        return {"customId": select_custom_id, "options": options}
    return None

def render_action_form(action_index=None):
    prefix = f"action_{action_index}" if action_index is not None else "new_action"
    st.markdown("### ⚡ Configurar Action")
    
    action_type = st.selectbox("Tipo", 
        ["send_message", "send_channel", "send_dm", "random_reply", "add_role", "remove_role"],
        key=f"{prefix}_type")
    action_data = {"type": action_type}
    
    with st.expander("🎯 Condições", expanded=False):
        conditions = render_condition_editor(prefix=prefix)
        if conditions:
            action_data["conditions"] = conditions
    
    if action_type in ["send_message", "send_channel", "send_dm"]:
        content_text = st.text_area("Conteúdo*", key=f"{prefix}_content", height=100,
                                   placeholder="Use {{ user.mention }}, {{ random(1,100) }}, etc.")
        if content_text:
            is_valid, errors = validate_nunjucks(content_text)
            if is_valid:
                st.success("✅ Sintaxe válida")
                with st.expander("👁️ Preview"):
                    st.info(render_nunjucks_preview(content_text))
            else:
                for err in errors:
                    st.warning(err)
        action_data["content"] = content_text
        
        render_nunjucks_help()
        
        if action_type == "send_channel":
            action_data["channelId"] = st.text_input("Channel ID*", key=f"{prefix}_channel")
        
        buttons = render_button_editor(prefix=prefix)
        if buttons:
            action_data["buttons"] = buttons
        
        select_menu = render_select_menu_editor(prefix=prefix)
        if select_menu:
            action_data["selectMenu"] = select_menu
    
    elif action_type == "random_reply":
        num_messages = st.number_input("Nº Mensagens", 2, 10, 3, key=f"{prefix}_num_msgs")
        messages = []
        for i in range(num_messages):
            msg = st.text_input(f"Mensagem {i+1}", key=f"{prefix}_msg_{i}")
            if msg:
                messages.append(msg)
        if messages:
            action_data["messages"] = messages
    
    elif action_type in ["add_role", "remove_role"]:
        action_data["roleId"] = st.text_input("Role ID*", key=f"{prefix}_role")
    
    return {k: v for k, v in action_data.items() if v}

# TELA 1: LISTA
if st.session_state.tela_atual == 'lista':
    st.markdown('<h1 class="main-header">🤖 Commands Dashboard</h1>', unsafe_allow_html=True)
    
    if st.button("➕ NOVO COMANDO", type="primary"):
        mudar_tela('criar')
        st.rerun()
    
    st.divider()
    
    try:
        resp = requests.get(f"{API_URL}/commands")
        if resp.status_code == 200:
            cmds = resp.json()
            if cmds:
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("📊 Total", len(cmds))
                with col2:
                    st.metric("⚡ Com Actions", sum(1 for c in cmds.values() if isinstance(c, dict) and 'actions' in c))
                with col3:
                    st.metric("📝 Simples", sum(1 for c in cmds.values() if isinstance(c, str) or 'actions' not in c))
                
                st.divider()
                
                for nome, det in cmds.items():
                    with st.expander(f"⚡ `/{nome}`"):
                        if isinstance(det, dict):
                            col1, col2, col3 = st.columns(3)
                            with col1:
                                st.metric("Tipo", "⚡ Avançado" if "actions" in det else "📝 Simples")
                            with col2:
                                st.metric("Cooldown", f"{det.get('cooldown', 0)}s")
                            with col3:
                                st.metric("Actions", len(det.get('actions', [])))
                            
                            if det.get('description'):
                                st.markdown("**📄 Descrição:**")
                                st.code(det['description'], language="jinja2")
                                with st.expander("👁️ Preview"):
                                    st.info(render_nunjucks_preview(det['description']))
                        
                        with st.expander("🔍 JSON"):
                            st.json(det)
                        
                        col1, col2 = st.columns(2)
                        with col2:
                            if st.button("🗑️ Deletar", key=f"del_{nome}"):
                                requests.delete(f"{API_URL}/commands/{nome}")
                                st.rerun()
            else:
                st.info("📝 Nenhum comando. Crie um novo!")
    except:
        st.error("❌ API offline. Execute: `uvicorn main:app --port 8000`")

# TELA 2: CRIAR
elif st.session_state.tela_atual == 'criar':
    col1, col2 = st.columns([4, 1])
    with col1:
        st.markdown('<h1 class="main-header">✨ Novo Comando</h1>', unsafe_allow_html=True)
    with col2:
        if st.button("← Voltar"):
            mudar_tela('lista')
            st.rerun()
    
    tab1, tab2, tab3 = st.tabs(["📋 Básico", "⚡ Actions", "👁️ Preview"])
    
    with tab1:
        col1, col2 = st.columns([3, 1])
        with col1:
            nome = st.text_input("Nome*", placeholder="ataque")
        with col2:
            cooldown = st.number_input("Cooldown (s)", 0, 3600, 0)
        
        st.divider()
        
        st.info("💡 **Dica:** Se você usar Actions, a descrição é opcional. O comando pode funcionar apenas com actions!")
        
        col1, col2 = st.columns(2)
        with col1:
            cor_embed = st.color_picker("Cor", "#0099FF")
            title = st.text_input("Título")
            desc_embed = st.text_area("Descrição (opcional com actions)", height=200,
                placeholder="Use {{ user.mention }}, {{ random(1,100) }}. Deixe vazio se usar apenas actions.")
            
            if desc_embed:
                is_valid, errors = validate_nunjucks(desc_embed)
                if is_valid:
                    st.success("✅ Sintaxe OK")
                    with st.expander("👁️ Preview"):
                        st.info(render_nunjucks_preview(desc_embed))
                else:
                    for err in errors:
                        st.warning(err)
        
        with col2:
            author_name = st.text_input("Autor")
            image_url = st.text_input("Imagem URL")
            thumbnail_url = st.text_input("Thumbnail URL")
            footer_text = st.text_input("Footer")
        
        render_nunjucks_help()
    
    with tab2:
        st.markdown("## ⚡ Actions")
        
        if st.session_state.actions:
            for i, act in enumerate(st.session_state.actions):
                col1, col2, col3 = st.columns([5, 1, 1])
                with col1:
                    st.markdown(f"**Action {i+1}: {act['type']}**")
                with col2:
                    if st.button("✏️", key=f"edit_act_{i}"):
                        st.session_state.editing_action_index = i
                        st.rerun()
                with col3:
                    if st.button("🗑️", key=f"del_act_{i}"):
                        st.session_state.actions.pop(i)
                        st.rerun()
                with st.expander("Ver"):
                    st.json(act)
                st.divider()
        
        if st.session_state.editing_action_index is not None:
            action_data = render_action_form(st.session_state.editing_action_index)
            col1, col2 = st.columns(2)
            with col1:
                if st.button("💾 Salvar", type="primary"):
                    st.session_state.actions[st.session_state.editing_action_index] = action_data
                    st.session_state.editing_action_index = None
                    st.rerun()
            with col2:
                if st.button("❌ Cancelar"):
                    st.session_state.editing_action_index = None
                    st.rerun()
        else:
            with st.expander("➕ Nova Action", expanded=True):
                action_data = render_action_form()
                if st.button("➕ Adicionar", type="primary"):
                    st.session_state.actions.append(action_data)
                    st.rerun()
    
    with tab3:
        if nome:
            preview = {
                "color": cor_embed,
                "title": title or nome.upper(),
                "cooldown": cooldown if cooldown > 0 else None,
                "gif": image_url if image_url else None,
                "author_name": author_name if author_name else None,
                "thumbnail_url": thumbnail_url if thumbnail_url else None,
                "footer_text": footer_text if footer_text else None,
            }
            
            # Só adiciona descrição se tiver
            if desc_embed:
                preview["description"] = desc_embed
            
            if st.session_state.actions:
                preview["actions"] = st.session_state.actions
            
            st.markdown("### 🎮 Preview Discord")
            
            if desc_embed:
                st.markdown(f"**{preview['title']}**")
                st.info(render_nunjucks_preview(desc_embed))
            elif st.session_state.actions:
                st.success("✅ Comando funciona apenas com Actions (sem embed principal)")
                st.caption("O bot executará as actions diretamente sem mostrar embed inicial")
            else:
                st.warning("⚠️ Adicione uma descrição OU pelo menos uma action")
            
            st.divider()
            st.markdown("### 📄 JSON")
            st.json({nome: {k: v for k, v in preview.items() if v is not None}})
        else:
            st.warning("⚠️ Preencha o nome do comando")
    
    st.divider()
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("💾 SALVAR", type="primary", use_container_width=True):
            if not nome:
                st.error("❌ Nome é obrigatório!")
            elif not desc_embed and not st.session_state.actions:
                st.error("❌ Você precisa adicionar uma descrição OU pelo menos uma action!")
            else:
                # Valida sintaxe apenas se tiver descrição
                syntax_valid = True
                if desc_embed:
                    is_valid, _ = validate_nunjucks(desc_embed)
                    if not is_valid:
                        st.error("❌ Corrija a sintaxe Nunjucks!")
                        syntax_valid = False
                
                if syntax_valid:
                    dados = {
                        "name": nome.lower(),
                        "command": {
                            "cooldown": cooldown if cooldown > 0 else None,
                            "gif": image_url if image_url else None,
                            "color": cor_embed,
                            "title": title if title else None,
                            "author_name": author_name if author_name else None,
                            "thumbnail_url": thumbnail_url if thumbnail_url else None,
                            "footer_text": footer_text if footer_text else None,
                        }
                    }
                    
                    # Só adiciona descrição se tiver
                    if desc_embed:
                        dados["command"]["description"] = desc_embed
                    else:
                        # Se não tiver descrição, usa placeholder
                        dados["command"]["description"] = f"Comando {nome}"
                    
                    # Adiciona actions se existirem
                    if st.session_state.actions:
                        dados["command"]["actions"] = st.session_state.actions
                    
                    # Remove valores None
                    dados["command"] = {k: v for k, v in dados["command"].items() if v is not None}
                    
                    resp = requests.post(f"{API_URL}/commands", json=dados)
                    if resp.status_code == 200:
                        st.success(f"✅ Comando `/{nome}` salvo!")
                        st.balloons()
                        mudar_tela('lista')
                        st.rerun()
                    else:
                        st.error(f"❌ Erro: {resp.json().get('detail')}")
                        