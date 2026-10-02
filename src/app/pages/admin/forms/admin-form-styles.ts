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

.news-cms-form { gap:1.25rem; }
.news-cms-form .cms-section { padding:1.35rem; border-color:#e2e7f1; border-radius:20px; background:linear-gradient(145deg,#fbfcff,#f7f8fc); box-shadow:0 10px 24px rgba(30,42,70,.045); }
.news-cms-form .cms-section-title { margin-bottom:1.25rem; padding-bottom:.9rem; color:#202b42; font-size:1rem; }
.news-cms-form .cms-section-title::before { display:grid; width:1.85rem; height:1.85rem; place-items:center; border-radius:.65rem; color:#fff; background:linear-gradient(145deg,#6d4aff,#9473ff); font-size:.85rem; }
.news-cms-form .news-page-settings .cms-section-title::before { content:'⚙'; }
.news-cms-form .news-items-section .cms-section-title::before { content:'✦'; }
.news-cms-form .cms-row { align-items:end; gap:1rem; }
.news-cms-form .cms-field { gap:.45rem; }
.news-cms-form .cms-label { color:#59647b; font-size:.76rem; letter-spacing:.01em; }
.news-cms-form .cms-input,.news-cms-form .cms-textarea,.news-cms-form .cms-select { min-height:2.7rem; box-sizing:border-box; border-color:#dce2ed; box-shadow:0 3px 10px rgba(31,42,68,.025); }
.news-cms-form .news-editor-item { position:relative; padding:1.15rem 1.2rem; border-color:#e0e5ef; border-radius:16px; background:#fff; box-shadow:0 6px 16px rgba(30,42,70,.035); }
.news-cms-form .news-editor-item:hover { border-color:#c9c0ff; box-shadow:0 10px 22px rgba(76,57,170,.08); }
.news-cms-form .news-editor-item > div { min-width:0; }
.news-cms-form .cms-array-item__num { display:flex; align-items:center; gap:.45rem; margin-bottom:.8rem; color:#5540c9; font-size:.8rem; }
.news-cms-form .cms-array-item__num::before { content:''; width:.42rem; height:.42rem; border-radius:50%; background:#7b5cff; box-shadow:0 0 0 4px #eeeaff; }
.news-cms-form .news-editor-item > .cms-array-item__del { width:2rem; height:2rem; padding:0; border:1px solid #ffdbe2; border-radius:9px; background:#fff6f7; font-size:1.15rem; }
.news-cms-form .news-editor-item > .cms-array-item__del:hover { color:#fff; background:#d85770; }
.news-cms-form .news-editor-item .cms-field { margin-bottom:1rem; }
.news-cms-form .news-editor-item .cms-field:last-child { margin-bottom:0; }
.news-cms-form .news-editor-item .cms-array-list { padding:.8rem; border:1px dashed #d9d4f7; border-radius:13px; background:#faf9ff; }
.news-cms-form .news-editor-item .cms-array-list .cms-array-item { padding:.75rem; border-color:#e6e8f1; background:#fff; }
.news-cms-form .news-editor-item .cms-array-list .cms-array-item__del { font-size:.95rem; }
.news-cms-form .cms-add-btn { margin-top:.75rem; padding:.8rem 1rem; border-radius:12px; background:#f5f2ff; }
.news-cms-form .cms-add-btn:hover { border-color:#8067ed; background:#ebe7ff; }
.news-cms-form .cms-image-field { padding:.7rem; border:1px dashed #dfe3ed; border-radius:12px; background:#fbfcff; }
.news-cms-form .cms-image-preview { width:104px; height:78px; border-radius:10px; }
.news-cms-form .cms-toggle-wrap { padding:.25rem 0 .4rem; }
@media (max-width:640px) { .news-cms-form .cms-section { padding:1rem; } .news-cms-form .news-editor-item { grid-template-columns:1fr auto; padding:.9rem; } .news-cms-form .news-editor-item > .cms-array-item__del { grid-column:2; grid-row:1; } }
.schools-cms-form { gap:1.25rem; }
.schools-cms-form .cms-section { padding:1.3rem; border-radius:20px; background:linear-gradient(145deg,#fbfcff,#f7f8fc); box-shadow:0 10px 24px rgba(30,42,70,.045); }
.schools-cms-form .cms-section-title { color:#202b42; font-size:1rem; }
.schools-cms-form .schools-help { max-width:760px; padding:.75rem .9rem; border-radius:11px; background:#f1f5ff; color:#64718a; }
.schools-cms-form .cms-button { min-height:42px; padding-inline:1.2rem; box-shadow:0 7px 16px #6d4aff22; }
.schools-table-section { overflow:hidden; }
.schools-table-wrap { overflow:auto; margin:0 -.25rem; border:1px solid #e4e8f1; border-radius:14px; background:#fff; }
.schools-table { width:100%; min-width:980px; border-collapse:collapse; }
.schools-table th,.schools-table td { padding:.7rem .65rem; border-bottom:1px solid #edf0f5; text-align:right; vertical-align:middle; }
.schools-table th { color:#7c879c; background:#f8f9fc; font-size:.72rem; white-space:nowrap; }
.schools-table td { color:#465269; font-size:.78rem; }
.schools-table tr:last-child td { border-bottom:0; }
.schools-table tbody tr:hover { background:#fbfaff; }
.schools-table .cms-input,.schools-table .cms-select { min-height:2.35rem; padding:.5rem .65rem; font-size:.75rem; }
.schools-table__index { width:42px; color:#7965df!important; font-weight:900; text-align:center!important; }
.schools-table .school-card__del { min-width:48px; padding:.5rem .65rem; }
.schools-cms-form .schools-count { padding:.3rem .6rem; border-radius:999px; color:#5540c9; background:#f0edff; }
@media (max-width:640px) { .schools-cms-form .cms-section { padding:1rem; } .schools-table th,.schools-table td { padding:.55rem; } }
`;
