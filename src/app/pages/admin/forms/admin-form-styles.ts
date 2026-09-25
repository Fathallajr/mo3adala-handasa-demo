export const adminFormStyles = `
.cms-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.cms-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
}

.cms-section-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #334155;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cms-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.cms-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.cms-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.cms-field:last-child {
  margin-bottom: 0;
}

.cms-label {
  font-size: 0.83rem;
  font-weight: 700;
  color: #475569;
}

.cms-input,
.cms-textarea,
.cms-select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: 'TheYearofHandicrafts', sans-serif;
  font-size: 0.9rem;
  background: #fff;
  outline: none;
  color: #0f172a;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.cms-input:focus,
.cms-textarea:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.09);
}

.cms-textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.7;
}

/* Toggle */
.cms-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cms-toggle-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.cms-switch {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.cms-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.cms-slider {
  position: absolute;
  inset: 0;
  background: #cbd5e1;
  border-radius: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.cms-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
}

.cms-switch input:checked + .cms-slider {
  background: #7c3aed;
}

.cms-switch input:checked + .cms-slider::before {
  transform: translateX(22px);
}

/* Arrays */
.cms-array-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cms-array-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: start;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem;
}

.cms-array-item__num {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.cms-array-item__del {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  align-self: flex-start;
  flex-shrink: 0;
  transition: background 0.18s;
}

.cms-array-item__del:hover {
  background: #fecaca;
}

.cms-add-btn {
  width: 100%;
  background: #ede9fe;
  color: #6d28d9;
  border: 1.5px dashed #a78bfa;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.88rem;
  font-family: 'TheYearofHandicrafts', sans-serif;
  margin-top: 0.5rem;
  transition: background 0.18s;
}

.cms-add-btn:hover {
  background: #ddd6fe;
}

/* Image field */
.cms-image-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cms-image-preview {
  width: 88px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
}

.cms-image-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.cms-upload-btn {
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'TheYearofHandicrafts', sans-serif;
  white-space: nowrap;
  transition: background 0.18s;
}

.cms-upload-btn:hover {
  background: #e0e7ff;
}

.cms-uploading {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Sub-section divider */
.cms-subsection {
  border-right: 3px solid #e0e7ff;
  padding-right: 0.85rem;
  margin-bottom: 0.75rem;
}

.cms-subsection-title {
  font-size: 0.82rem;
  font-weight: 800;
  color: #6d28d9;
  margin-bottom: 0.5rem;
}

@media (max-width: 640px) {
  .cms-row, .cms-row-3 {
    grid-template-columns: 1fr;
  }
}
`;
