export const adminFormStyles = `
.cms-form { display:flex; flex-direction:column; gap:1rem; padding-bottom:2rem; }
.cms-section { background:#fbfcff; border:1px solid #e6eaf1; border-radius:16px; padding:1.15rem; box-shadow:0 6px 18px rgba(30,42,70,.035); }
.cms-section-title { display:flex; align-items:center; gap:.5rem; margin:0 0 1.1rem; padding-bottom:.7rem; border-bottom:1px solid #eef0f5; color:#172033; font-size:.95rem; font-weight:900; }
.cms-row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
.cms-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.75rem; }
.cms-field { display:flex; flex-direction:column; gap:.35rem; margin-bottom:.75rem; }
.cms-field:last-child { margin-bottom:0; }
.cms-label { color:#59647b; font-size:.83rem; font-weight:800; }
.cms-input, .cms-textarea, .cms-select { width:100%; padding:.7rem .85rem; border:1px solid #dfe4ed; border-radius:10px; background:#fff; color:#172033; font:inherit; outline:none; transition:border-color .18s,box-shadow .18s; }
.cms-input:focus, .cms-textarea:focus, .cms-select:focus { border-color:#6d4aff; box-shadow:0 0 0 3px #6d4aff19; }
.cms-textarea { min-height:72px; resize:vertical; line-height:1.7; }
.cms-toggle-wrap { display:flex; align-items:center; gap:.75rem; }
.cms-toggle-label { color:#334155; cursor:pointer; font-size:.9rem; font-weight:700; user-select:none; }
.cms-switch { position:relative; width:48px; height:26px; flex-shrink:0; }
.cms-switch input { width:0; height:0; opacity:0; }
.cms-slider { position:absolute; inset:0; border-radius:13px; background:#d8deea; cursor:pointer; transition:background .3s; }
.cms-slider::before { content:''; position:absolute; left:3px; bottom:3px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.18); transition:transform .3s; }
.cms-switch input:checked + .cms-slider { background:#6d4aff; }
.cms-switch input:checked + .cms-slider::before { transform:translateX(22px); }
.cms-array-list { display:flex; flex-direction:column; gap:.6rem; }
.cms-array-item { display:grid; grid-template-columns:1fr auto; gap:.7rem; align-items:start; padding:.85rem; border:1px solid #e6eaf1; border-radius:11px; background:#fff; }
.cms-array-item__num { margin-bottom:.4rem; color:#8993a8; font-size:.72rem; font-weight:800; }
.cms-array-item__del { align-self:flex-start; flex-shrink:0; padding:.35rem .55rem; border:0; border-radius:8px; background:#fff1f3; color:#c24b67; cursor:pointer; font-size:1rem; line-height:1; }
.cms-array-item__del:hover { background:#ffe2e8; }
.cms-add-btn { width:100%; margin-top:.5rem; padding:.65rem 1rem; border:1.5px dashed #a99bff; border-radius:10px; background:#f0edff; color:#5540c9; cursor:pointer; font:inherit; font-weight:800; }
.cms-add-btn:hover { background:#e8e3ff; }
.cms-button { padding:.65rem 1rem; border:0; border-radius:10px; background:#6d4aff; color:#fff; cursor:pointer; font:inherit; font-weight:800; }
.cms-button:hover { background:#5536df; }
.cms-button--secondary { border:1px solid #dfe4ed; background:#fff; color:#5540c9; }
.cms-button--secondary:hover { background:#f4f1ff; }
.cms-image-field { display:flex; flex-direction:column; gap:.5rem; }
.cms-image-preview { width:88px; height:72px; border:1px solid #e6eaf1; border-radius:8px; background:#f1f3f8; object-fit:cover; }
.cms-image-actions { display:flex; align-items:center; flex-wrap:wrap; gap:.5rem; }
.cms-upload-btn { padding:.45rem .75rem; border:1px solid #d4cdfd; border-radius:8px; background:#f0edff; color:#5540c9; cursor:pointer; font:inherit; font-size:.82rem; font-weight:800; white-space:nowrap; }
.cms-uploading { color:#8993a8; font-size:.8rem; }
.cms-subsection { margin-bottom:.75rem; padding-right:.85rem; border-right:3px solid #d9d2ff; }
.cms-subsection-title { margin-bottom:.5rem; color:#5540c9; font-size:.82rem; font-weight:900; }
@media (max-width:640px) { .cms-row,.cms-row-3 { grid-template-columns:1fr; } .cms-section { padding:1rem; } }
`;
