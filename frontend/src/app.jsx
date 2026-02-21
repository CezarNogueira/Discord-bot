import { useState, useEffect, useCallback, useRef } from "react";

const API = "/api";

// ── Variáveis disponíveis ─────────────────────────────────────────────────────
const VARIABLES = [
  { label: "@usuário",   syntax: "{{ user.mention }}",      preview: "@João",         group: "Usuário",  desc: "Menciona quem usou o comando" },
  { label: "nome",       syntax: "{{ user.name }}",         preview: "joao123",       group: "Usuário",  desc: "Username do Discord" },
  { label: "apelido",   syntax: "{{ user.displayName }}",  preview: "João Silva",    group: "Usuário",  desc: "Nome de exibição no servidor" },
  { label: "ID",         syntax: "{{ user.id }}",           preview: "123456789",     group: "Usuário",  desc: "ID numérico do usuário" },
  { label: "servidor",   syntax: "{{ server.name }}",       preview: "Meu Servidor",  group: "Servidor", desc: "Nome do servidor" },
  { label: "aleatório",  syntax: "{{ random(1, 100) }}",    preview: "42",            group: "Funções",  desc: "Número aleatório — edite os valores min/max" },
  { label: "arredondar", syntax: "{{ round(3.7) }}",        preview: "4",             group: "Funções",  desc: "Arredonda um número — edite o valor" },
  { label: "argumento",  syntax: "{{ arguments.get(1) }}", preview: "<arg1>",        group: "Funções",  desc: "Argumento do usuário — edite o índice (1, 2, …)" },
];

// ── Render de preview (substitui vars por valores de exemplo) ─────────────────
const renderPreview = (text = "") => {
  if (!text) return "";
  return text
    .replace(/\{\{\s*user\.mention\s*\}\}/g, "@João Silva")
    .replace(/\{\{\s*user\.name\s*\}\}/g, "joao123")
    .replace(/\{\{\s*user\.displayName\s*\}\}/g, "João Silva")
    .replace(/\{\{\s*user\.id\s*\}\}/g, "123456789")
    .replace(/\{\{\s*server\.name\s*\}\}/g, "Meu Servidor")
    .replace(/\{\{\s*random\((\d+),\s*(\d+)\)\s*\}\}/g, (_, a, b) =>
      String(Math.floor(Math.random() * (Number(b) - Number(a) + 1)) + Number(a))
    )
    .replace(/\{\{\s*round\(([\d.]+)\)\s*\}\}/g, (_, n) => String(Math.round(Number(n))))
    .replace(/\{\{\s*arguments\.get\((\d+)\)\s*\}\}/g, (_, i) => `<arg${i}>`)
    .replace(/\{\{[^}]+\}\}/g, "?");
};

// Destaca vars com cor no texto exibido (na lista de comandos)
const highlightVars = (text = "") => {
  if (!text) return text;
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{/.test(part)) {
      const v = VARIABLES.find((v) => part.replace(/\s/g, "").includes(v.syntax.replace(/\s/g, "")));
      return (
        <span key={i} style={{ background: "#1a2240", color: "#5b8cff", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--mono)", fontSize: "0.82em" }}>
          {v?.label || part}
        </span>
      );
    }
    return part;
  });
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:      #0b0d12; --surface: #12151e; --border:  #1e2433;
    --accent:  #5b8cff; --accent2: #ff6b6b; --accent3: #43e97b;
    --muted:   #4a5270; --text:    #e8ecf5; --dim:     #7a86a8;
    --mono: 'Space Mono', monospace; --sans: 'Syne', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .layout { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; position: sticky; top: 0; height: 100vh; }
  .sidebar-logo { font-weight: 800; font-size: 1.1rem; padding: 0 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .sidebar-logo .dot { width: 10px; height: 10px; background: var(--accent3); border-radius: 50%; box-shadow: 0 0 8px var(--accent3); flex-shrink: 0; }
  .sidebar-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: var(--dim); transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: var(--border); color: var(--text); }
  .nav-item.active { background: #1a2240; color: var(--accent); }
  .sidebar-footer { margin-top: auto; padding: 16px 20px; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--muted); font-family: var(--mono); }

  .main { flex: 1; overflow-y: auto; }
  .page { padding: 40px 48px; max-width: 1200px; }
  .page-header { margin-bottom: 36px; }
  .page-title { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
  .page-subtitle { color: var(--dim); margin-top: 6px; font-size: 0.9rem; }

  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; }
  .stat-icon { font-size: 1.5rem; }
  .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
  .stat-label { color: var(--dim); font-size: 0.8rem; margin-top: 2px; }

  .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .search-input { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-family: var(--mono); font-size: 0.85rem; outline: none; transition: border-color 0.15s; }
  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--muted); }

  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-family: var(--sans); font-size: 0.875rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { filter: brightness(1.12); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }
  .btn-ghost { background: transparent; color: var(--dim); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--border); color: var(--text); }
  .btn-danger { background: transparent; color: var(--accent2); border: 1px solid #ff6b6b22; }
  .btn-danger:hover { background: #ff6b6b22; }
  .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
  .btn-icon { padding: 8px; aspect-ratio: 1; border-radius: 6px; font-size: 0.9rem; }

  .cmd-grid { display: flex; flex-direction: column; gap: 10px; }
  .cmd-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
  .cmd-card:hover { border-color: #2a3050; }
  .cmd-card-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; cursor: pointer; }
  .cmd-badge { font-family: var(--mono); font-size: 0.85rem; background: #1a2240; color: var(--accent); padding: 4px 10px; border-radius: 6px; }
  .cmd-type-badge { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
  .type-advanced { background: #2a1040; color: #c084fc; }
  .type-simple { background: #0a2a1a; color: var(--accent3); }
  .cmd-desc { flex: 1; color: var(--dim); font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cmd-actions { display: flex; gap: 6px; margin-left: auto; }
  .cmd-expand { padding: 16px 20px; border-top: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .json-block { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: var(--mono); font-size: 0.78rem; color: #a8c8ff; white-space: pre; max-height: 220px; overflow: auto; grid-column: 1 / -1; }
  .detail-label { font-size: 0.72rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 4px; }
  .detail-value { font-size: 0.875rem; line-height: 1.6; }

  .empty-state { text-align: center; padding: 80px 20px; color: var(--dim); }
  .empty-icon { font-size: 3rem; margin-bottom: 12px; }

  .editor-wrap { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
  .form-section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
  .section-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--dim); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .form-grid { display: grid; gap: 14px; }
  .form-grid-2 { grid-template-columns: 1fr 1fr; }
  .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 0.78rem; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .field input, .field textarea, .field select { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-family: var(--mono); font-size: 0.85rem; outline: none; transition: border-color 0.15s; width: 100%; }
  .field input:focus, .field textarea:focus, .field select:focus { border-color: var(--accent); }
  .field select { cursor: pointer; }
  .field textarea { resize: vertical; min-height: 90px; }
  .field input[type=color] { padding: 4px; height: 40px; cursor: pointer; }

  /* ── Smart text field ── */
  .smart-field { display: flex; flex-direction: column; gap: 0; }
  .smart-field > label { font-size: 0.78rem; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; display: block; }

  .var-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; padding: 8px 10px 6px; background: #0d1018; border: 1px solid var(--border); border-bottom: none; border-radius: 8px 8px 0 0; }
  .var-divider { width: 1px; height: 16px; background: var(--border); margin: 0 4px; flex-shrink: 0; }
  .var-group-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding-right: 2px; }

  .var-chip { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 5px; background: #1a2240; border: 1px solid #2a3560; color: var(--accent); font-size: 0.75rem; font-family: var(--mono); cursor: pointer; transition: all 0.12s; white-space: nowrap; }
  .var-chip:hover { background: #243060; border-color: var(--accent); transform: translateY(-1px); }
  .var-chip:active { transform: translateY(0); opacity: 0.7; }
  @keyframes chipPop { 0%,100% { transform: scale(1); } 50% { transform: scale(0.9); background: var(--accent); color: #fff; } }
  .var-chip.flash { animation: chipPop 0.25s ease; }

  .smart-textarea { background: var(--bg); border: 1px solid var(--border); border-top: none; border-radius: 0 0 8px 8px; padding: 10px 12px; color: var(--text); font-family: var(--mono); font-size: 0.85rem; outline: none; transition: border-color 0.15s; width: 100%; resize: vertical; min-height: 90px; }
  .smart-textarea:focus { border-color: var(--accent); }
  .smart-textarea::placeholder { color: var(--muted); }
  .smart-input { background: var(--bg); border: 1px solid var(--border); border-top: none; border-radius: 0 0 8px 8px; padding: 10px 12px; color: var(--text); font-family: var(--mono); font-size: 0.85rem; outline: none; transition: border-color 0.15s; width: 100%; }
  .smart-input:focus { border-color: var(--accent); }

  .preview-bubble { margin-top: 6px; padding: 8px 12px; background: #0d1523; border: 1px solid #5b8cff33; border-radius: 6px; font-size: 0.82rem; color: #c9d8f5; line-height: 1.5; display: flex; gap: 6px; align-items: flex-start; }
  .preview-bubble-icon { color: var(--accent); flex-shrink: 0; }

  /* ── Actions ── */
  .action-list { display: flex; flex-direction: column; gap: 8px; }
  .action-item { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
  .action-type-pill { font-family: var(--mono); font-size: 0.75rem; background: #1a2240; color: var(--accent); padding: 3px 8px; border-radius: 4px; flex-shrink: 0; }
  .action-summary { flex: 1; color: var(--dim); font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .action-form-panel { background: var(--bg); border: 1px dashed #5b8cff66; border-radius: 8px; padding: 16px; margin-top: 8px; }

  .cond-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; font-family: var(--mono); font-size: 0.8rem; color: var(--dim); margin-bottom: 6px; }

  /* ── Preview panel ── */
  .preview-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; position: sticky; top: 24px; }
  .preview-header { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); display: flex; align-items: center; gap: 6px; }
  .discord-mock { background: #313338; padding: 16px; }
  .discord-embed-wrap { border-left: 4px solid var(--accent); background: #2b2d31; border-radius: 0 4px 4px 0; padding: 12px 16px; }
  .embed-author { font-size: 0.78rem; color: #c9cdd8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .embed-author-avatar { width: 18px; height: 18px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
  .embed-title-text { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; }
  .embed-desc-text { font-size: 0.85rem; color: #c9cdd8; line-height: 1.5; white-space: pre-wrap; }
  .embed-footer-text { font-size: 0.72rem; color: #888d96; margin-top: 10px; }
  .json-preview { padding: 14px 16px; border-top: 1px solid var(--border); }
  .json-preview pre { font-family: var(--mono); font-size: 0.72rem; color: #a8c8ff; white-space: pre-wrap; word-break: break-all; max-height: 280px; overflow-y: auto; }

  .alert { border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 16px; }
  .alert-error { background: #2a0a0a; border: 1px solid #ff6b6b44; color: var(--accent2); }
  .alert-success { background: #0a2a1a; border: 1px solid #43e97b44; color: var(--accent3); }
  .alert-info { background: #0a1228; border: 1px solid #5b8cff44; color: var(--accent); font-size: 0.82rem; }

  .tabs { display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
  .tab-btn { padding: 10px 18px; border: none; background: none; font-family: var(--sans); font-size: 0.875rem; font-weight: 700; color: var(--dim); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-btn:hover:not(.active) { color: var(--text); }

  .tag { display: inline-flex; align-items: center; gap: 4px; background: var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; font-family: var(--mono); color: var(--dim); }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── SmartTextField ─────────────────────────────────────────────────────────────
// Campo com barra de chips clicáveis que inserem variáveis Nunjucks na posição do cursor.
function SmartTextField({ label, value, onChange, placeholder, multiline = false }) {
  const inputRef = useRef(null);
  const [flashIdx, setFlashIdx] = useState(null);

  const insertAt = (syntax, idx) => {
    const el = inputRef.current;
    if (!el) { onChange(value + " " + syntax + " "); return; }

    const start = el.selectionStart ?? value.length;
    const end   = el.selectionEnd   ?? value.length;
    const before = value.slice(0, start);
    const after  = value.slice(end);
    const pad1 = before.length && !/[\s\n]$/.test(before) ? " " : "";
    const pad2 = after.length  && !/^[\s\n]/.test(after)  ? " " : "";
    const next = before + pad1 + syntax + pad2 + after;
    onChange(next);

    const cursor = start + pad1.length + syntax.length + pad2.length;
    setTimeout(() => { el.focus(); el.setSelectionRange(cursor, cursor); }, 0);

    setFlashIdx(idx);
    setTimeout(() => setFlashIdx(null), 300);
  };

  const preview = /\{\{/.test(value) ? renderPreview(value) : null;

  const groups = [
    { name: "Usuário",  vars: VARIABLES.filter(v => v.group === "Usuário") },
    { name: "Servidor", vars: VARIABLES.filter(v => v.group === "Servidor") },
    { name: "Funções",  vars: VARIABLES.filter(v => v.group === "Funções") },
  ];

  return (
    <div className="smart-field">
      <label>{label}</label>
      <div className="var-toolbar">
        {groups.map((g, gi) => (
          <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {gi > 0 && <span className="var-divider" />}
            <span className="var-group-label">{g.name}</span>
            {g.vars.map((v) => {
              const idx = VARIABLES.indexOf(v);
              return (
                <button
                  key={v.syntax}
                  type="button"
                  className={`var-chip${flashIdx === idx ? " flash" : ""}`}
                  title={`${v.desc}\n\nInsere: ${v.syntax}\nExemplo: ${v.preview}`}
                  onClick={() => insertAt(v.syntax, idx)}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {multiline
        ? <textarea ref={inputRef} className="smart-textarea" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input    ref={inputRef} className="smart-input"    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
      {preview && (
        <div className="preview-bubble">
          <span className="preview-bubble-icon">💬</span>
          <span>{preview}</span>
        </div>
      )}
    </div>
  );
}

// ── ConditionEditor ───────────────────────────────────────────────────────────
function ConditionEditor({ conditions = [], onChange }) {
  const [form, setForm] = useState({ type: "chance", chance: 50 });
  const add = () => {
    const c = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "" && v != null));
    onChange([...conditions, c]);
    setForm({ type: "chance", chance: 50 });
  };
  return (
    <div>
      {conditions.map((c, i) => (
        <div key={i} className="cond-item">
          <span className="tag">{c.type}</span>
          <span style={{ flex: 1 }}>{JSON.stringify(c).replace(/"/g, "").slice(1, -1)}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onChange(conditions.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginTop: 4 }}>
        <div className="form-grid">
          <div className="field">
            <label>Tipo</label>
            <select value={form.type} onChange={e => setForm({ type: e.target.value })}>
              {["comparison","chance","permission","role","channel","user"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {form.type === "comparison" && (
            <div className="form-grid form-grid-3">
              <div className="field"><label>Valor 1</label><input value={form.value1||""} onChange={e => setForm({...form,value1:e.target.value})} /></div>
              <div className="field"><label>Op</label>
                <select value={form.operator||"=="} onChange={e => setForm({...form,operator:e.target.value})}>
                  {["==","!=",">","<",">=","<="].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field"><label>Valor 2</label><input value={form.value2||""} onChange={e => setForm({...form,value2:e.target.value})} /></div>
            </div>
          )}
          {form.type === "chance" && (
            <div className="field">
              <label>Chance: {form.chance}%</label>
              <input type="range" min={0} max={100} value={form.chance} onChange={e => setForm({...form,chance:Number(e.target.value)})} style={{accentColor:"var(--accent)"}} />
            </div>
          )}
          {form.type === "permission" && <div className="field"><label>Permissão</label><input value={form.permission||""} onChange={e=>setForm({...form,permission:e.target.value})} /></div>}
          {form.type === "role" && (
            <div className="form-grid form-grid-2">
              <div className="field"><label>Role ID</label><input value={form.roleId||""} onChange={e=>setForm({...form,roleId:e.target.value})} /></div>
              <div className="field"><label>Role Name</label><input value={form.roleName||""} onChange={e=>setForm({...form,roleName:e.target.value})} /></div>
            </div>
          )}
          {form.type === "channel" && <div className="field"><label>Channel ID</label><input value={form.channelId||""} onChange={e=>setForm({...form,channelId:e.target.value})} /></div>}
          {form.type === "user" && <div className="field"><label>User ID</label><input value={form.userId||""} onChange={e=>setForm({...form,userId:e.target.value})} /></div>}
          <button className="btn btn-primary btn-sm" style={{marginTop:4}} onClick={add}>+ Adicionar Condição</button>
        </div>
      </div>
    </div>
  );
}

// ── ActionForm ────────────────────────────────────────────────────────────────
function ActionForm({ initial = {}, onSave, onCancel }) {
  const [data, setData] = useState({ type: "send_message", content: "", conditions: [], ...initial });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const MSG_TYPES  = ["send_message","send_channel","send_dm"];
  const ROLE_TYPES = ["add_role","remove_role"];
  const ALL_TYPES  = ["send_message","send_channel","send_dm","random_reply","add_role","remove_role","delete_message","timeout_user"];

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0))
  );

  return (
    <div className="action-form-panel">
      <div className="form-grid" style={{marginBottom:14}}>
        <div className="field">
          <label>Tipo da Action</label>
          <select value={data.type} onChange={e => set("type", e.target.value)}>
            {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {MSG_TYPES.includes(data.type) && (
          <>
            <SmartTextField
              label="Conteúdo *"
              multiline
              value={data.content || ""}
              onChange={v => set("content", v)}
              placeholder="Digite a mensagem… Clique nos botões acima para inserir variáveis."
            />
            {data.type === "send_channel" && (
              <div className="field"><label>Channel ID *</label><input value={data.channelId||""} onChange={e=>set("channelId",e.target.value)} /></div>
            )}
          </>
        )}

        {data.type === "random_reply" && (
          <div>
            <div className="detail-label" style={{marginBottom:10}}>Mensagens (mín. 2) — uma será sorteada aleatoriamente</div>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{marginBottom:10}}>
                <SmartTextField
                  label={`Mensagem ${i+1}${i<2?" *":""}`}
                  value={(data.messages||[])[i]||""}
                  onChange={v => { const m=[...(data.messages||[])]; m[i]=v; set("messages",m); }}
                  placeholder={`Opção ${i+1}…`}
                />
              </div>
            ))}
          </div>
        )}

        {ROLE_TYPES.includes(data.type) && (
          <div className="field"><label>Role ID *</label><input value={data.roleId||""} onChange={e=>set("roleId",e.target.value)} /></div>
        )}
        {data.type === "timeout_user" && (
          <div className="field"><label>Duração (segundos)</label><input type="number" value={data.duration||""} onChange={e=>set("duration",Number(e.target.value))} /></div>
        )}
      </div>

      <details style={{marginBottom:12}}>
        <summary style={{cursor:"pointer",color:"var(--dim)",fontSize:"0.82rem",fontWeight:700,marginBottom:8}}>
          🎯 Condições ({data.conditions?.length||0})
        </summary>
        <div style={{marginTop:8}}>
          <ConditionEditor conditions={data.conditions||[]} onChange={c=>set("conditions",c)} />
        </div>
      </details>

      <div style={{display:"flex",gap:8}}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(cleaned)}>💾 Salvar Action</button>
        {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>}
      </div>
    </div>
  );
}

// ── ActionsEditor ─────────────────────────────────────────────────────────────
function ActionsEditor({ actions = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  return (
    <div>
      <div className="action-list">
        {actions.map((a, i) => (
          <div key={i}>
            <div className="action-item">
              <span className="action-type-pill">{a.type}</span>
              <span className="action-summary">
                {a.content
                  ? renderPreview(a.content).slice(0, 60)
                  : (a.messages||[]).map(m=>renderPreview(m)).join(" | ").slice(0, 60) || a.roleId || ""}
              </span>
              {(a.conditions?.length||0) > 0 && <span className="tag">⚡ {a.conditions.length}</span>}
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditIdx(editIdx===i?null:i)}>✏️</button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => onChange(actions.filter((_,j)=>j!==i))}>🗑</button>
            </div>
            {editIdx === i && (
              <ActionForm
                initial={a}
                onSave={u => { const arr=[...actions]; arr[i]=u; onChange(arr); setEditIdx(null); }}
                onCancel={() => setEditIdx(null)}
              />
            )}
          </div>
        ))}
      </div>
      {adding
        ? <ActionForm onSave={a=>{onChange([...actions,a]);setAdding(false);}} onCancel={()=>setAdding(false)} />
        : <button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={()=>setAdding(true)}>+ Nova Action</button>
      }
    </div>
  );
}

// ── CommandList ───────────────────────────────────────────────────────────────
function CommandList({ onNew, onEdit }) {
  const [commands, setCommands] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/commands`);
      if (!r.ok) throw new Error();
      setCommands(await r.json());
      setError(null);
    } catch {
      setError("Não foi possível conectar à API. Verifique se o servidor está rodando.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (name) => {
    setDeleting(name);
    await fetch(`${API}/commands/${name}`, { method: "DELETE" });
    setDeleting(null); setExpanded(null); load();
  };

  const filtered = commands
    ? Object.entries(commands).filter(([n]) => n.toLowerCase().includes(search.toLowerCase()))
    : [];
  const total    = commands ? Object.keys(commands).length : 0;
  const advanced = commands ? Object.values(commands).filter(c => typeof c === "object" && c.actions?.length).length : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Commands</h1>
        <p className="page-subtitle">Gerencie os slash commands do seu bot RPG</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {commands && (
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-icon">📊</div><div><div className="stat-value">{total}</div><div className="stat-label">Total</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{color:"#c084fc"}}>⚡</div><div><div className="stat-value">{advanced}</div><div className="stat-label">Com Actions</div></div></div>
          <div className="stat-card"><div className="stat-icon" style={{color:"var(--accent3)"}}>📝</div><div><div className="stat-value">{total-advanced}</div><div className="stat-label">Simples</div></div></div>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="Buscar comando…" value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={onNew}>+ Novo Comando</button>
      </div>

      <div className="cmd-grid">
        {commands === null && !error && <div style={{display:"flex",justifyContent:"center",padding:60}}><div className="spinner"/></div>}
        {filtered.length === 0 && commands !== null && (
          <div className="empty-state"><div className="empty-icon">🗂</div><div>{search?"Nenhum resultado":"Nenhum comando. Crie um novo!"}</div></div>
        )}
        {filtered.map(([name, det]) => {
          const isObj = typeof det === "object";
          const isAdv = isObj && det.actions?.length > 0;
          const open  = expanded === name;
          return (
            <div key={name} className="cmd-card">
              <div className="cmd-card-header" onClick={() => setExpanded(open?null:name)}>
                <span className="cmd-badge">/{name}</span>
                <span className={`cmd-type-badge ${isAdv?"type-advanced":"type-simple"}`}>{isAdv?`⚡ ${det.actions.length} actions`:"simples"}</span>
                {isObj && det.cooldown && <span className="tag">⏱ {det.cooldown}s</span>}
                <span className="cmd-desc">{isObj ? renderPreview(det.description) : det}</span>
                <div className="cmd-actions" onClick={e=>e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onEdit(name,det)}>✏️</button>
                  <button className="btn btn-danger btn-icon btn-sm" disabled={deleting===name} onClick={()=>del(name)}>{deleting===name?"…":"🗑"}</button>
                </div>
                <span style={{color:"var(--muted)",fontSize:"0.8rem",marginLeft:4}}>{open?"▲":"▼"}</span>
              </div>
              {open && (
                <div className="cmd-expand">
                  {isObj && det.description && (
                    <div><div className="detail-label">Descrição</div><div className="detail-value">{highlightVars(det.description)}</div></div>
                  )}
                  {isObj && det.color && (
                    <div>
                      <div className="detail-label">Cor</div>
                      <div className="detail-value" style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{width:14,height:14,borderRadius:3,background:det.color,display:"inline-block",border:"1px solid var(--border)"}}/>
                        {det.color}
                      </div>
                    </div>
                  )}
                  <div className="json-block">{JSON.stringify(det,null,2)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CommandEditor ─────────────────────────────────────────────────────────────
function CommandEditor({ initial = null, editName = null, onBack }) {
  const isEdit = !!editName;
  const [tab, setTab]               = useState(0);
  const [name, setName]             = useState(editName || "");
  const [description, setDesc]      = useState(initial?.description || "");
  const [color, setColor]           = useState(initial?.color || "#5b8cff");
  const [title, setTitle]           = useState(initial?.title || "");
  const [cooldown, setCooldown]     = useState(initial?.cooldown || 0);
  const [gif, setGif]               = useState(initial?.gif || "");
  const [authorName, setAuthor]     = useState(initial?.author_name || "");
  const [thumbnail, setThumb]       = useState(initial?.thumbnail_url || "");
  const [footer, setFooter]         = useState(initial?.footer_text || "");
  const [actions, setActions]       = useState(initial?.actions || []);
  const [reqConfirm, setReqConfirm] = useState(initial?.requireConfirmation || false);
  const [confirmMsg, setConfirmMsg] = useState(initial?.confirmationMessage || "");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(false);

  const previewDesc = renderPreview(description);

  const buildPayload = () => {
    const cmd = { color, description: description || `Comando ${name}` };
    if (title)      cmd.title          = title;
    if (cooldown>0) cmd.cooldown       = cooldown;
    if (gif)        cmd.gif            = gif;
    if (authorName) cmd.author_name    = authorName;
    if (thumbnail)  cmd.thumbnail_url  = thumbnail;
    if (footer)     cmd.footer_text    = footer;
    if (actions.length>0) cmd.actions  = actions;
    if (reqConfirm) { cmd.requireConfirmation = true; if (confirmMsg) cmd.confirmationMessage = confirmMsg; }
    return cmd;
  };

  const save = async () => {
    setError(null);
    if (!name.trim())                              { setError("Nome é obrigatório"); return; }
    if (!description.trim() && actions.length===0) { setError("Adicione uma descrição ou pelo menos uma action"); return; }
    setSaving(true);
    try {
      const body = isEdit ? buildPayload() : { name: name.toLowerCase(), command: buildPayload() };
      const r = await fetch(
        isEdit ? `${API}/commands/${editName}` : `${API}/commands`,
        { method: isEdit?"PUT":"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) }
      );
      const json = await r.json();
      if (!r.ok) throw new Error(json.detail || "Erro desconhecido");
      setSuccess(true);
      setTimeout(onBack, 1200);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-header" style={{display:"flex",alignItems:"center",gap:16}}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Voltar</button>
        <div>
          <h1 className="page-title">{isEdit?`Editar /${editName}`:"Novo Comando"}</h1>
          <p className="page-subtitle">{isEdit?"Modifique os dados do comando":"Configure um novo slash command"}</p>
        </div>
      </div>

      {error   && <div className="alert alert-error">✗ {error}</div>}
      {success && <div className="alert alert-success">✓ Salvo com sucesso!</div>}

      <div className="tabs">
        {["📋 Básico","⚡ Actions","⚙️ Avançado"].map((t,i) => (
          <button key={i} className={`tab-btn${tab===i?" active":""}`} onClick={()=>setTab(i)}>{t}</button>
        ))}
      </div>

      <div className="editor-wrap">
        <div>
          {tab === 0 && (
            <>
              <div className="form-section">
                <div className="section-title">Identificação</div>
                <div className="form-grid form-grid-2">
                  <div className="field">
                    <label>Nome do Comando *</label>
                    <input value={name} onChange={e=>setName(e.target.value.toLowerCase().replace(/\s/g,"-"))} placeholder="ataque" disabled={isEdit} />
                  </div>
                  <div className="field">
                    <label>Cooldown (segundos)</label>
                    <input type="number" min={0} max={3600} value={cooldown} onChange={e=>setCooldown(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Embed</div>
                <div className="form-grid">
                  <div className="form-grid form-grid-2">
                    <div className="field"><label>Cor</label><input type="color" value={color} onChange={e=>setColor(e.target.value)} /></div>
                    <div className="field"><label>Título</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título do embed" /></div>
                  </div>
                  <SmartTextField
                    label="Descrição (opcional com actions)"
                    multiline
                    value={description}
                    onChange={setDesc}
                    placeholder="Digite a mensagem… Clique nos botões acima para inserir variáveis."
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Mídia & Autor</div>
                <div className="form-grid form-grid-2">
                  <div className="field"><label>Autor</label><input value={authorName} onChange={e=>setAuthor(e.target.value)} /></div>
                  <div className="field"><label>Footer</label><input value={footer} onChange={e=>setFooter(e.target.value)} /></div>
                  <div className="field"><label>GIF / Imagem URL</label><input value={gif} onChange={e=>setGif(e.target.value)} placeholder="https://…" /></div>
                  <div className="field"><label>Thumbnail URL</label><input value={thumbnail} onChange={e=>setThumb(e.target.value)} placeholder="https://…" /></div>
                </div>
              </div>
            </>
          )}

          {tab === 1 && (
            <div className="form-section">
              <div className="section-title">Actions ({actions.length})</div>
              <div className="alert alert-info" style={{marginBottom:16}}>
                💡 Se não adicionar descrição, o bot executa apenas as actions sem mostrar embed inicial.
              </div>
              <ActionsEditor actions={actions} onChange={setActions} />
            </div>
          )}

          {tab === 2 && (
            <div className="form-section">
              <div className="section-title">Confirmação</div>
              <div className="field" style={{flexDirection:"row",alignItems:"center",gap:10}}>
                <input type="checkbox" id="rc" checked={reqConfirm} onChange={e=>setReqConfirm(e.target.checked)} style={{width:16,height:16,cursor:"pointer"}} />
                <label htmlFor="rc" style={{textTransform:"none",fontSize:"0.875rem",cursor:"pointer"}}>Requer confirmação antes de executar</label>
              </div>
              {reqConfirm && (
                <div className="field" style={{marginTop:12}}>
                  <label>Mensagem de confirmação</label>
                  <input value={confirmMsg} onChange={e=>setConfirmMsg(e.target.value)} placeholder="Tem certeza que deseja executar este comando?" />
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={saving||success}
            style={{width:"100%",justifyContent:"center",padding:"14px",marginTop:4}}
            onClick={save}
          >
            {saving?"Salvando…":success?"✓ Salvo!":isEdit?"💾 Salvar Alterações":"💾 Criar Comando"}
          </button>
        </div>

        {/* Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <span style={{width:8,height:8,borderRadius:"50%",background:"#ff5f57",display:"inline-block"}}/>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#febc2e",display:"inline-block"}}/>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#28c840",display:"inline-block"}}/>
            <span style={{marginLeft:8}}>Preview do Discord</span>
          </div>
          <div className="discord-mock">
            <div className="discord-embed-wrap" style={{borderLeftColor:color}}>
              <div className="embed-author">
                <div className="embed-author-avatar">J</div>
                João Silva usou o comando
              </div>
              <div className="embed-title-text" style={{color}}>
                {title || (name?name.toUpperCase():"TÍTULO")}
              </div>
              {description
                ? <div className="embed-desc-text">{previewDesc}</div>
                : actions.length > 0
                  ? <div className="embed-desc-text" style={{color:"var(--accent3)",fontStyle:"italic"}}>✓ {actions.length} action{actions.length!==1?"s":""} configurada{actions.length!==1?"s":""}</div>
                  : <div className="embed-desc-text" style={{color:"var(--muted)",fontStyle:"italic"}}>Descrição aparecerá aqui…</div>
              }
              {footer && <div className="embed-footer-text">{footer}{cooldown>0?` | ⏱️ Cooldown: ${cooldown}s`:""}</div>}
            </div>
          </div>
          <div className="json-preview">
            <div className="detail-label" style={{marginBottom:8}}>JSON salvo</div>
            <pre>{JSON.stringify({[name||"comando"]:buildPayload()},null,2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState("list");
  const [editData, setEditData] = useState(null);

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo"><div className="dot"/>Bot Dashboard</div>
          <nav className="sidebar-nav">
            <button className={`nav-item${page==="list"?" active":""}`} onClick={()=>{setEditData(null);setPage("list");}}>
              <span>⚔️</span> Commands
            </button>
            <button className="nav-item" disabled style={{opacity:0.35}}><span>📊</span> Analytics</button>
            <button className="nav-item" disabled style={{opacity:0.35}}><span>⚙️</span> Configurações</button>
          </nav>
          <div className="sidebar-footer">v1.0.0 · RPG Bot</div>
        </aside>
        <main className="main">
          {page==="list" && (
            <CommandList
              onNew={()=>{setEditData(null);setPage("editor");}}
              onEdit={(name,det)=>{setEditData({name,det});setPage("editor");}}
            />
          )}
          {page==="editor" && (
            <CommandEditor
              initial={editData?.det??null}
              editName={editData?.name??null}
              onBack={()=>{setEditData(null);setPage("list");}}
            />
          )}
        </main>
      </div>
    </>
  );
}