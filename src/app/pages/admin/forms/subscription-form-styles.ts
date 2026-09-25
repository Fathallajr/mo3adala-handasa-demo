export const subscriptionFormStyles = `
.cms-form { gap:1.15rem; padding:0 0 2.5rem; }
.cms-section { position:relative; overflow:hidden; padding:1.35rem; border:1px solid #e5e9f3; border-radius:20px; background:linear-gradient(145deg,#fff 0%,#fbfcff 100%); box-shadow:0 10px 26px rgba(36,47,85,.055); }
.cms-section::before { content:''; position:absolute; inset:0 0 auto; height:3px; background:linear-gradient(90deg,#6d4aff,#a96cff); opacity:.9; }
.cms-section-title { margin-bottom:1.2rem; padding:0 0 .85rem; border-bottom:1px solid #edf0f6; color:#172033; font-size:1rem; letter-spacing:-.15px; }
.cms-section-title::before { content:''; width:9px; height:9px; flex:0 0 9px; border-radius:50%; background:#6d4aff; box-shadow:0 0 0 5px #6d4aff16; }
.cms-subsection { padding:1rem; border:1px solid #e8ebf3; border-radius:15px; background:#f8f9fd; }
.cms-subsection-title { margin:0 0 .8rem; color:#5540c9; font-size:.86rem; font-weight:900; }
.cms-help { color:#748097; line-height:1.8; }
.cms-field { gap:.45rem; }
.cms-label { color:#54617a; font-size:.76rem; font-weight:900; }
.cms-input,.cms-textarea,.cms-select { min-height:44px; box-sizing:border-box; border-color:#dfe4ee; border-radius:11px; background:#fff; transition:border-color .2s,box-shadow .2s,transform .2s; }
.cms-input:hover,.cms-textarea:hover,.cms-select:hover { border-color:#c9c1ff; }
.cms-input:focus,.cms-textarea:focus,.cms-select:focus { border-color:#7555ff; box-shadow:0 0 0 4px #6d4aff14; transform:translateY(-1px); }
.cms-toggle-wrap { min-height:48px; padding:.55rem .8rem; border:1px solid #e3e7f0; border-radius:13px; background:#fff; }
.cms-toggle-label { color:#2e3a53; font-size:.86rem; font-weight:900; }
.cms-button,.cms-button--secondary,.cms-add-btn { min-height:44px; border-radius:11px; transition:transform .2s,box-shadow .2s,background .2s; }
.cms-button:hover,.cms-button--secondary:hover,.cms-add-btn:hover { transform:translateY(-2px); box-shadow:0 8px 18px rgba(85,64,201,.12); }
.cms-button { background:linear-gradient(135deg,#6545ed,#8a5dff); }
.cms-button--secondary { color:#5540c9; background:#fff; border-color:#dcd8ff; }
.cms-array-list { gap:.75rem; }
.cms-array-item { padding:1rem; border-color:#e5e9f2; border-radius:14px; box-shadow:0 4px 14px rgba(36,47,85,.035); }
.cms-array-item__num { color:#6d4aff; }
.cms-add-btn { margin-top:.75rem; background:#f4f1ff; }
.cms-image-field { padding:.7rem; border:1px dashed #d4cef9; border-radius:12px; background:#faf9ff; }
@media(max-width:700px){.cms-section{padding:1rem;border-radius:16px}.cms-row,.cms-row-3{grid-template-columns:1fr}.cms-subsection{padding:.8rem}}
`;
