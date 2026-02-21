import { useState, useEffect, useCallback } from "react";

const API_URL = "http://127.0.0.1:8000";

// ── Palette & Theme ─────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0b0d12;
    --surface:   #12151e;
    --border:    #1e2433;
    --accent:    #5b8cff;
    --accent2:   #ff6b6b;
    --accent3:   #43e97b;
    --muted:     #4a5270;
    --text:      #e8ecf5;
    --text-dim:  #7a86a8;
    --mono:      'Space Mono', monospace;
    --sans:      'Syne', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* Layout */
  .layout { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .sidebar-logo {
    font-family: var(--sans);
    font-weight: 800;
    font-size: 1.1rem;
    letter-spacing: -0.02em;
    padding: 0 20px 24px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sidebar-logo .dot {
    width: 10px; height: 10px;
    background: var(--accent3);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent3);
  }
  .sidebar-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-dim);
    transition: all 0.15s;
    border: none; background: none; width: 100%; text-align: left;
  }
  .nav-item:hover { background: var(--border); color: var(--text); }
  .nav-item.active { background: #1a2240; color: var(--accent); }
  .nav-item .icon { font-size: 1rem; }

  /* Main */
  .main { flex: 1; overflow-y: auto; }
  .page { padding: 40px 48px; max-width: 1200px; }

  /* Page header */
  .page-header { margin-bottom: 36px; }
  .page-title {
    font-size: 2.2rem; font-weight: 800; letter-spacing: -0.03em;
    line-height: 1;
  }
  .page-subtitle { color: var(--text-dim); margin-top: 6px; font-size: 0.9rem; font-weight: 400; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex; align-items: center; gap: 16px;
  }
  .stat-icon { font-size: 1.5rem; }
  .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
  .stat-label { color: var(--text-dim); font-size: 0.8rem; margin-top: 2px; }

  /* Search / toolbar */
  .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .search-input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--muted); }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 18px;
    border-radius: 8px;
    font-family: var(--sans);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-ghost {
    background: transparent; color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { background: var(--border); color: var(--text); }
  .btn-danger { background: transparent; color: var(--accent2); border: 1px solid var(--accent2)22; }
  .btn-danger:hover { background: var(--accent2)22; }
  .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
  .btn-icon { padding: 8px; font-size: 0.9rem; aspect-ratio: 1; border-radius: 6px; }

  /* Command list */
  .cmd-grid { display: flex; flex-direction: column; gap: 10px; }
  .cmd-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .cmd-card:hover { border-color: #2a3050; }
  .cmd-card-header {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px;
    cursor: pointer;
  }
  .cmd-badge {
    font-family: var(--mono);
    font-size: 0.85rem;
    background: #1a2240;
    color: var(--accent);
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.02em;
  }
  .cmd-type-badge {
    font-size: 0.72rem; font-weight: 700;
    padding: 2px 8px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .type-advanced { background: #2a1040; color: #c084fc; }
  .type-simple { background: #0a2a1a; color: var(--accent3); }
  .cmd-desc { flex: 1; color: var(--text-dim); font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cmd-actions { display: flex; gap: 6px; margin-left: auto; }
  .cmd-expand {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  .detail-row { display: flex; flex-direction: column; gap: 4px; }
  .detail-label { font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
  .detail-value { font-size: 0.875rem; }
  .json-block {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    font-family: var(--mono);
    font-size: 0.78rem;
    overflow-x: auto;
    color: #a8c8ff;
    white-space: pre;
    max-height: 200px;
    overflow-y: auto;
    grid-column: 1 / -1;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: var(--text-dim);
  }
  .empty-icon { font-size: 3rem; margin-bottom: 12px; }

  /* ── Form / Editor ─────────────────────────────── */
  .editor-wrap { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
  .form-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--text-dim);
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .form-grid { display: grid; gap: 14px; }
  .form-grid-2 { grid-template-columns: 1fr 1fr; }
  .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 0.78rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .field input, .field textarea, .field select {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }
  .field input:focus, .field textarea:focus, .field select:focus { border-color: var(--accent); }
  .field select { cursor: pointer; }
  .field textarea { resize: vertical; min-height: 90px; }
  .field input[type=color] { padding: 4px; height: 40px; cursor: pointer; }

  /* Nunjucks preview */
  .nj-preview {
    background: #0a1228;
    border: 1px solid var(--accent)44;
    border-radius: 6px;
    padding: 10px 12px;
    font-family: var(--mono);
    font-size: 0.8rem;
    color: #a8c8ff;
    margin-top: 6px;
  }
  .nj-valid { color: var(--accent3); font-size: 0.78rem; margin-top: 4px; }
  .nj-error { color: var(--accent2); font-size: 0.78rem; margin-top: 4px; }

  /* Actions list */
  .action-list { display: flex; flex-direction: column; gap: 8px; }
  .action-item {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 12px;
  }
  .action-type-pill {
    font-family: var(--mono);
    font-size: 0.75rem;
    background: #1a2240;
    color: var(--accent);
    padding: 3px 8px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .action-summary { flex: 1; color: var(--text-dim); font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Action form inline */
  .action-form-panel {
    background: var(--bg);
    border: 1px dashed var(--accent)66;
    border-radius: 8px;
    padding: 16px;
    margin-top: 8px;
  }

  /* Conditions */
  .cond-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--text-dim);
  }

  /* Sidebar preview */
  .preview-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    position: sticky;
    top: 24px;
  }
  .preview-header { padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); }
  .discord-embed {
    margin: 16px;
    border-left: 4px solid var(--accent);
    background: #1e2028;
    border-radius: 4px;
    padding: 12px 16px;
  }
  .embed-title { font-weight: 700; font-size: 0.95rem; color: var(--accent); margin-bottom: 6px; }
  .embed-desc { font-size: 0.85rem; color: #c9cdd8; line-height: 1.5; }
  .embed-footer { font-size: 0.75rem; color: var(--muted); margin-top: 10px; }
  .json-preview { padding: 16px; }
  .json-preview pre { font-family: var(--mono); font-size: 0.75rem; color: #a8c8ff; white-space: pre-wrap; word-break: break-all; }

  /* Alert */
  .alert { border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 16px; }
  .alert-error { background: #2a0a0a; border: 1px solid var(--accent2)44; color: var(--accent2); }
  .alert-success { background: #0a2a1a; border: 1px solid var(--accent3)44; color: var(--accent3); }
  .alert-info { background: #0a1228; border: 1px solid var(--accent)44; color: var(--accent); }

  /* Tabs */
  .tabs { display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
  .tab-btn {
    padding: 10px 18px;
    border: none; background: none;
    font-family: var(--sans);
    font-size: 0.875rem; font-weight: 700;
    color: var(--text-dim);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s;
  }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-btn:hover:not(.active) { color: var(--text); }

  /* Tags */
  .tag { display: inline-flex; align-items: center; gap: 4px; background: var(--border); border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; font-family: var(--mono); color: var(--text-dim); }

  /* Spinner */
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Tooltip container */
  .nj-help { margin-top: 8px; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; font-size: 0.8rem; }
  .nj-help-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .nj-tag { font-family: var(--mono); font-size: 0.75rem; color: var(--accent); background: #1a2240; padding: 2px 6px; border-radius: 4px; }
  .nj-tag-result { color: var(--text-dim); font-size: 0.75rem; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const nunjucksPreview = (text = "") => {
  if (!text) return "";
  return text
    .replace(/\{\{\s*user\.mention\s*\}\}/g, "@Usuario")
    .replace(/\{\{\s*user\.name\s*\}\}/g, "usuario123")
    .replace(/\{\{\s*user\.displayName\s*\}\}/g, "Nome Display")
    .replace(/\{\{\s*user\.id\s*\}\}/g, "123456789")
    .replace(/\{\{\s*server\.name\s*\}\}/g, "Meu Servidor")
    .replace(/\{\{\s*random\((\d+),\s*(\d+)\)\s*\}\}/g, (_, a, b) => `[rand ${a}-${b}]`)
    .replace(/\{\{\s*arguments\.get\((\d+)\)\s*\}\}/g, (_, i) => `<arg${i}>`);
};
const validateNunjucks = (text = "") => {
  const open = (text.match(/\{\{/g) || []).length;
  const close = (text.match(/\}\}/g) || []).length;
  return open === close;
};
const hexToColor = (h) => h || "#5b8cff";

// ── Sub-components ───────────────────────────────────────────────────────────

function NjField({ label, value, onChange, placeholder, textarea = false }) {
  const valid = value ? validateNunjucks(value) : null;
  const preview = nunjucksPreview(value);
  return (
    <div className="field">
      <label>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
      {value && (
        <span className={valid ? "nj-valid" : "nj-error"}>
          {valid ? "✓ Sintaxe válida" : "✗ Chaves desbalanceadas"}
        </span>
      )}
      {value && preview !== value && (
        <div className="nj-preview">💬 {preview}</div>
      )}
    </div>
  );
}

function NunjucksHelp() {
  const vars = [
    ["{{ user.mention }}", "→ @Usuario"],
    ["{{ user.name }}", "→ usuario123"],
    ["{{ server.name }}", "→ Meu Servidor"],
    ["{{ random(1,100) }}", "→ número aleatório"],
    ["{{ arguments.get(0) }}", "→ <arg0>"],
  ];
  return (
    <div className="nj-help">
      <div style={{ color: "var(--text-dim)", fontWeight: 700, fontSize: "0.78rem" }}>📖 Variáveis Nunjucks</div>
      <div className="nj-help-grid">
        {vars.map(([tag, res]) => (
          <div key={tag} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="nj-tag">{tag}</span>
            <span className="nj-tag-result">{res}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConditionEditor({ conditions = [], onChange }) {
  const [form, setForm] = useState({ type: "chance", chance: 50 });
  const types = ["comparison", "chance", "permission", "role", "channel", "user"];

  const add = () => {
    const cleaned = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "" && v !== null && v !== undefined));
    onChange([...conditions, cleaned]);
    setForm({ type: "chance", chance: 50 });
  };
  const remove = (i) => onChange(conditions.filter((_, idx) => idx !== i));

  return (
    <div>
      {conditions.map((c, i) => (
        <div key={i} className="cond-item" style={{ marginBottom: 6 }}>
          <span className="tag">{c.type}</span>
          <span style={{ flex: 1 }}>{JSON.stringify(c).replace(/"/g, "").slice(1, -1)}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginTop: 8 }}>
        <div className="form-grid">
          <div className="field">
            <label>Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ type: e.target.value })}>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {form.type === "comparison" && (
            <div className="form-grid form-grid-3">
              <div className="field"><label>Valor 1</label><input value={form.value1 || ""} onChange={(e) => setForm({ ...form, value1: e.target.value })} /></div>
              <div className="field"><label>Op</label>
                <select value={form.operator || "=="} onChange={(e) => setForm({ ...form, operator: e.target.value })}>
                  {["==", "!=", ">", "<", ">=", "<="].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="field"><label>Valor 2</label><input value={form.value2 || ""} onChange={(e) => setForm({ ...form, value2: e.target.value })} /></div>
            </div>
          )}
          {form.type === "chance" && (
            <div className="field">
              <label>Chance % ({form.chance})</label>
              <input type="range" min={0} max={100} value={form.chance} onChange={(e) => setForm({ ...form, chance: Number(e.target.value) })} style={{ width: "100%", accentColor: "var(--accent)" }} />
            </div>
          )}
          {form.type === "permission" && (
            <div className="field"><label>Permissão</label><input value={form.permission || ""} onChange={(e) => setForm({ ...form, permission: e.target.value })} /></div>
          )}
          {form.type === "role" && (
            <div className="form-grid form-grid-2">
              <div className="field"><label>Role ID</label><input value={form.roleId || ""} onChange={(e) => setForm({ ...form, roleId: e.target.value })} /></div>
              <div className="field"><label>Role Name</label><input value={form.roleName || ""} onChange={(e) => setForm({ ...form, roleName: e.target.value })} /></div>
            </div>
          )}
          {form.type === "channel" && (
            <div className="field"><label>Channel ID</label><input value={form.channelId || ""} onChange={(e) => setForm({ ...form, channelId: e.target.value })} /></div>
          )}
          {form.type === "user" && (
            <div className="field"><label>User ID</label><input value={form.userId || ""} onChange={(e) => setForm({ ...form, userId: e.target.value })} /></div>
          )}
          <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }} onClick={add}>+ Adicionar Condição</button>
        </div>
      </div>
    </div>
  );
}

function ActionForm({ initial = {}, onSave, onCancel }) {
  const [data, setData] = useState({ type: "send_message", content: "", conditions: [], ...initial });
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const msgTypes = ["send_message", "send_channel", "send_dm"];
  const roleTypes = ["add_role", "remove_role"];

  const summary = () => {
    if (data.content) return data.content.slice(0, 50);
    if (data.messages) return data.messages.slice(0, 2).join(" | ");
    if (data.roleId) return `role: ${data.roleId}`;
    return "";
  };

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
  );

  return (
    <div className="action-form-panel">
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Tipo da Action</label>
          <select value={data.type} onChange={(e) => set("type", e.target.value)}>
            {["send_message", "send_channel", "send_dm", "random_reply", "add_role", "remove_role", "delete_message", "timeout_user"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {msgTypes.includes(data.type) && (
          <>
            <NjField label="Conteúdo *" textarea value={data.content || ""} onChange={(v) => set("content", v)} placeholder="Use {{ user.mention }}, {{ random(1,100) }}, etc." />
            {data.type === "send_channel" && (
              <div className="field"><label>Channel ID *</label><input value={data.channelId || ""} onChange={(e) => set("channelId", e.target.value)} /></div>
            )}
          </>
        )}

        {data.type === "random_reply" && (
          <div>
            <div className="detail-label" style={{ marginBottom: 8 }}>Mensagens (mín. 2)</div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="field" style={{ marginBottom: 6 }}>
                <input
                  placeholder={`Mensagem ${i + 1}${i < 2 ? " *" : " (opcional)"}`}
                  value={(data.messages || [])[i] || ""}
                  onChange={(e) => {
                    const msgs = [...(data.messages || [])];
                    msgs[i] = e.target.value;
                    set("messages", msgs.filter((m, idx) => m || idx < i));
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {roleTypes.includes(data.type) && (
          <div className="field"><label>Role ID *</label><input value={data.roleId || ""} onChange={(e) => set("roleId", e.target.value)} /></div>
        )}

        {data.type === "timeout_user" && (
          <div className="field"><label>Duração (segundos)</label><input type="number" value={data.duration || ""} onChange={(e) => set("duration", Number(e.target.value))} /></div>
        )}
      </div>

      <details style={{ marginBottom: 12 }}>
        <summary style={{ cursor: "pointer", color: "var(--text-dim)", fontSize: "0.82rem", fontWeight: 700, marginBottom: 8 }}>🎯 Condições ({data.conditions?.length || 0})</summary>
        <ConditionEditor conditions={data.conditions || []} onChange={(c) => set("conditions", c)} />
      </details>

      <NunjucksHelp />

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(cleaned)}>💾 Salvar Action</button>
        {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>}
      </div>
    </div>
  );
}

function ActionsEditor({ actions = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  const remove = (i) => onChange(actions.filter((_, idx) => idx !== i));
  const saveNew = (a) => { onChange([...actions, a]); setAdding(false); };
  const saveEdit = (a) => { const arr = [...actions]; arr[editIdx] = a; onChange(arr); setEditIdx(null); };

  return (
    <div>
      <div className="action-list">
        {actions.map((a, i) => (
          <div key={i}>
            <div className="action-item">
              <span className="action-type-pill">{a.type}</span>
              <span className="action-summary">{a.content || a.messages?.join(" | ") || a.roleId || ""}</span>
              {a.conditions?.length > 0 && <span className="tag">⚡ {a.conditions.length} cond</span>}
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditIdx(editIdx === i ? null : i)}>✏️</button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(i)}>🗑</button>
            </div>
            {editIdx === i && <ActionForm initial={a} onSave={saveEdit} onCancel={() => setEditIdx(null)} />}
          </div>
        ))}
      </div>

      {adding ? (
        <div style={{ marginTop: 8 }}>
          <ActionForm onSave={saveNew} onCancel={() => setAdding(false)} />
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>+ Nova Action</button>
      )}
    </div>
  );
}

// ── Pages ────────────────────────────────────────────────────────────────────

function CommandList({ onNew, onEdit }) {
  const [commands, setCommands] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/commands`);
      if (!r.ok) throw new Error();
      setCommands(await r.json());
      setError(null);
    } catch {
      setError("API offline. Execute: uvicorn main:app --port 8000");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (name) => {
    setDeleting(name);
    await fetch(`${API_URL}/commands/${name}`, { method: "DELETE" });
    setDeleting(null);
    setExpanded(null);
    load();
  };

  const filtered = commands
    ? Object.entries(commands).filter(([n]) => n.toLowerCase().includes(search.toLowerCase()))
    : [];

  const total = commands ? Object.keys(commands).length : 0;
  const advanced = commands ? Object.values(commands).filter((c) => typeof c === "object" && c.actions?.length).length : 0;
  const simple = total - advanced;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Commands</h1>
        <p className="page-subtitle">Gerencie os slash commands do seu bot RPG</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {commands && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div><div className="stat-value">{total}</div><div className="stat-label">Total de Comandos</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: "#c084fc" }}>⚡</div>
            <div><div className="stat-value">{advanced}</div><div className="stat-label">Com Actions</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: "var(--accent3)" }}>📝</div>
            <div><div className="stat-value">{simple}</div><div className="stat-label">Simples</div></div>
          </div>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="Buscar comando…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={onNew}>+ Novo Comando</button>
      </div>

      <div className="cmd-grid">
        {commands === null && !error && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
        )}

        {filtered.length === 0 && commands !== null && (
          <div className="empty-state">
            <div className="empty-icon">🗂</div>
            <div>{search ? "Nenhum comando encontrado" : "Nenhum comando. Crie um novo!"}</div>
          </div>
        )}

        {filtered.map(([name, det]) => {
          const isObj = typeof det === "object";
          const isAdvanced = isObj && det.actions?.length > 0;
          const open = expanded === name;
          return (
            <div key={name} className="cmd-card">
              <div className="cmd-card-header" onClick={() => setExpanded(open ? null : name)}>
                <span className="cmd-badge">/{name}</span>
                <span className={`cmd-type-badge ${isAdvanced ? "type-advanced" : "type-simple"}`}>
                  {isAdvanced ? `⚡ ${det.actions.length} actions` : "simples"}
                </span>
                {isObj && det.cooldown && <span className="tag">⏱ {det.cooldown}s</span>}
                <span className="cmd-desc">{isObj ? det.description : det}</span>
                <div className="cmd-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(name, det)}>✏️</button>
                  <button className="btn btn-danger btn-icon btn-sm" disabled={deleting === name} onClick={() => del(name)}>
                    {deleting === name ? "…" : "🗑"}
                  </button>
                </div>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{open ? "▲" : "▼"}</span>
              </div>

              {open && isObj && (
                <div className="cmd-expand">
                  <div className="detail-row">
                    <div className="detail-label">Descrição</div>
                    <div className="detail-value">{det.description}</div>
                  </div>
                  {det.color && (
                    <div className="detail-row">
                      <div className="detail-label">Cor</div>
                      <div className="detail-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 4, background: det.color, display: "inline-block" }} />
                        {det.color}
                      </div>
                    </div>
                  )}
                  {det.gif && (
                    <div className="detail-row" style={{ gridColumn: "1/-1" }}>
                      <div className="detail-label">GIF</div>
                      <a href={det.gif} style={{ color: "var(--accent)", fontSize: "0.82rem" }} target="_blank" rel="noreferrer">{det.gif}</a>
                    </div>
                  )}
                  <div className="json-block">{JSON.stringify(det, null, 2)}</div>
                </div>
              )}
              {open && !isObj && (
                <div className="cmd-expand">
                  <div className="detail-value" style={{ gridColumn: "1/-1" }}>{det}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommandEditor({ initial = null, editName = null, onBack }) {
  const isEdit = !!editName;

  const [tab, setTab] = useState(0);
  const [name, setName] = useState(editName || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [color, setColor] = useState(initial?.color || "#5b8cff");
  const [title, setTitle] = useState(initial?.title || "");
  const [cooldown, setCooldown] = useState(initial?.cooldown || 0);
  const [gif, setGif] = useState(initial?.gif || "");
  const [authorName, setAuthorName] = useState(initial?.author_name || "");
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail_url || "");
  const [footer, setFooter] = useState(initial?.footer_text || "");
  const [actions, setActions] = useState(initial?.actions || []);
  const [requireConfirm, setRequireConfirm] = useState(initial?.requireConfirmation || false);
  const [confirmMsg, setConfirmMsg] = useState(initial?.confirmationMessage || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const preview = nunjucksPreview(description);
  const displayTitle = title || name.toUpperCase() || "TÍTULO";

  const buildPayload = () => {
    const cmd = { color, description: description || `Comando ${name}` };
    if (title) cmd.title = title;
    if (cooldown > 0) cmd.cooldown = cooldown;
    if (gif) cmd.gif = gif;
    if (authorName) cmd.author_name = authorName;
    if (thumbnail) cmd.thumbnail_url = thumbnail;
    if (footer) cmd.footer_text = footer;
    if (actions.length > 0) cmd.actions = actions;
    if (requireConfirm) { cmd.requireConfirmation = true; if (confirmMsg) cmd.confirmationMessage = confirmMsg; }
    return cmd;
  };

  const save = async () => {
    setError(null);
    if (!name.trim()) { setError("Nome é obrigatório"); return; }
    if (!description.trim() && actions.length === 0) { setError("Adicione uma descrição ou pelo menos uma action"); return; }
    setSaving(true);
    try {
      let r;
      if (isEdit) {
        r = await fetch(`${API_URL}/commands/${editName}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
      } else {
        r = await fetch(`${API_URL}/commands`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.toLowerCase(), command: buildPayload() }),
        });
      }
      const json = await r.json();
      if (!r.ok) throw new Error(json.detail || "Erro desconhecido");
      setSuccess(true);
      setTimeout(onBack, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Voltar</button>
        <div>
          <h1 className="page-title">{isEdit ? `Editar /${editName}` : "Novo Comando"}</h1>
          <p className="page-subtitle">{isEdit ? "Modifique os dados do comando" : "Configure um novo slash command"}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">✗ {error}</div>}
      {success && <div className="alert alert-success">✓ Salvo com sucesso!</div>}

      <div className="tabs">
        {["📋 Básico", "⚡ Actions", "⚙️ Avançado"].map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>{t}</button>
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
                    <input value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s/g, "-"))} placeholder="ataque" disabled={isEdit} />
                  </div>
                  <div className="field">
                    <label>Cooldown (segundos)</label>
                    <input type="number" min={0} max={3600} value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Embed</div>
                <div className="form-grid">
                  <div className="form-grid form-grid-2">
                    <div className="field">
                      <label>Cor do Embed</label>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Título</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do embed" />
                    </div>
                  </div>
                  <NjField label="Descrição (opcional com actions)" textarea value={description} onChange={setDescription} placeholder="Use {{ user.mention }}, {{ random(1,100) }}…" />
                  <NunjucksHelp />
                </div>
              </div>

              <div className="form-section">
                <div className="section-title">Mídia & Autor</div>
                <div className="form-grid">
                  <div className="form-grid form-grid-2">
                    <div className="field"><label>Autor</label><input value={authorName} onChange={(e) => setAuthorName(e.target.value)} /></div>
                    <div className="field"><label>Thumbnail URL</label><input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://…" /></div>
                    <div className="field"><label>GIF / Imagem URL</label><input value={gif} onChange={(e) => setGif(e.target.value)} placeholder="https://…" /></div>
                    <div className="field"><label>Footer</label><input value={footer} onChange={(e) => setFooter(e.target.value)} /></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 1 && (
            <div className="form-section">
              <div className="section-title">Actions ({actions.length})</div>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                💡 Actions permitem que o comando execute comportamentos avançados. Se não adicionar descrição, o bot executa apenas as actions.
              </div>
              <ActionsEditor actions={actions} onChange={setActions} />
            </div>
          )}

          {tab === 2 && (
            <div className="form-section">
              <div className="section-title">Confirmação</div>
              <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="reqConf" checked={requireConfirm} onChange={(e) => setRequireConfirm(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                <label htmlFor="reqConf" style={{ textTransform: "none", fontSize: "0.875rem", cursor: "pointer" }}>Requer confirmação antes de executar</label>
              </div>
              {requireConfirm && (
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Mensagem de confirmação</label>
                  <input value={confirmMsg} onChange={(e) => setConfirmMsg(e.target.value)} placeholder="Tem certeza que deseja executar este comando?" />
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary" disabled={saving || success} style={{ width: "100%", justifyContent: "center", padding: "14px" }} onClick={save}>
            {saving ? "Salvando…" : success ? "✓ Salvo!" : isEdit ? "💾 Salvar Alterações" : "💾 Criar Comando"}
          </button>
        </div>

        {/* Preview panel */}
        <div className="preview-panel">
          <div className="preview-header">Preview do Discord</div>
          <div>
            <div className="discord-embed" style={{ borderLeftColor: color }}>
              <div className="embed-title" style={{ color }}>{displayTitle}</div>
              {(description || preview) && <div className="embed-desc">{preview || description}</div>}
              {!description && actions.length > 0 && (
                <div className="embed-desc" style={{ color: "var(--accent3)", fontStyle: "italic" }}>
                  ✓ {actions.length} action{actions.length > 1 ? "s" : ""} configurada{actions.length > 1 ? "s" : ""}
                </div>
              )}
              {footer && <div className="embed-footer">{footer}</div>}
            </div>

            <div className="json-preview">
              <div className="detail-label" style={{ marginBottom: 8 }}>JSON</div>
              <pre>{JSON.stringify({ [name || "comando"]: buildPayload() }, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("list");
  const [editData, setEditData] = useState(null);

  const goNew = () => { setEditData(null); setPage("editor"); };
  const goEdit = (name, det) => { setEditData({ name, det }); setPage("editor"); };
  const goList = () => { setEditData(null); setPage("list"); };

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="dot" />
            Bot Dashboard
          </div>
          <nav className="sidebar-nav">
            <button className={`nav-item${page === "list" ? " active" : ""}`} onClick={goList}>
              <span className="icon">⚔️</span> Commands
            </button>
            <button className="nav-item" disabled style={{ opacity: 0.4 }}>
              <span className="icon">📊</span> Analytics
            </button>
            <button className="nav-item" disabled style={{ opacity: 0.4 }}>
              <span className="icon">⚙️</span> Configurações
            </button>
          </nav>
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
            v1.0.0 · RPG Bot
          </div>
        </aside>

        <main className="main">
          {page === "list" && <CommandList onNew={goNew} onEdit={goEdit} />}
          {page === "editor" && (
            <CommandEditor
              initial={editData ? editData.det : null}
              editName={editData ? editData.name : null}
              onBack={goList}
            />
          )}
        </main>
      </div>
    </>
  );
}
