import Link from 'next/link';

const flowSteps = [
  { label: 'Създай', bg: 'var(--lf-purple-bg)', color: 'var(--lf-purple-text)' },
  { label: 'Редактирай', bg: 'var(--lf-blue-bg)', color: 'var(--lf-blue-text)' },
  { label: 'Курирай', bg: 'var(--lf-coral-bg)', color: 'var(--lf-coral-text)' },
  { label: 'Одобри', bg: 'var(--lf-teal-bg)', color: 'var(--lf-teal-text)' },
  { label: 'Публикувай', bg: 'var(--lf-green-bg)', color: 'var(--lf-green-text)' },
  { label: 'Сподели', bg: 'var(--lf-amber-bg)', color: 'var(--lf-amber-text)' },
];

export default function LandingPage() {
  return (
    <div className="lf-page">
      <style>{`
        .lf-page {
          --lf-text:#1a1a1a;
          --lf-text-secondary:#6b6b6b;
          --lf-text-hint:#999;
          --lf-bg:#ffffff;
          --lf-bg-secondary:#f5f5f3;
          --lf-border:#e2e2de;
          --lf-border-light:#ececea;
          --lf-radius:8px;
          --lf-radius-lg:12px;
          --lf-purple:#534AB7;--lf-purple-bg:#EEEDFE;--lf-purple-text:#534AB7;
          --lf-blue:#185FA5;--lf-blue-bg:#E6F1FB;--lf-blue-text:#185FA5;
          --lf-coral:#993C1D;--lf-coral-bg:#FAECE7;--lf-coral-text:#993C1D;
          --lf-teal:#0F6E56;--lf-teal-bg:#E1F5EE;--lf-teal-text:#0F6E56;
          --lf-green:#3B6D11;--lf-green-bg:#EAF3DE;--lf-green-text:#3B6D11;
          --lf-amber:#854F0B;--lf-amber-bg:#FAEEDA;--lf-amber-text:#854F0B;
          background:var(--lf-bg);color:var(--lf-text);
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          min-height:100vh;
        }
        .lf-wrap{max-width:680px;margin:0 auto;padding:20px 0}
        .lf-hero{text-align:center;padding:2.5rem 1rem 2rem}
        .lf-hero-eyebrow{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--lf-text-hint);margin-bottom:12px}
        .lf-hero-title{font-size:22px;font-weight:500;line-height:1.4;max-width:480px;margin:0 auto 8px}
        .lf-hero-sub{font-size:14px;color:var(--lf-text-secondary);max-width:400px;margin:0 auto}
        .lf-flow{display:flex;align-items:center;justify-content:center;gap:6px;margin:0 0 20px;flex-wrap:wrap;padding:0 1rem}
        .lf-flow-node{padding:6px 12px;border-radius:var(--lf-radius);font-size:11px;font-weight:500;white-space:nowrap}
        .lf-flow-arrow{color:var(--lf-text-hint);font-size:14px}
        .lf-timeline{position:relative;padding:0 1rem 1.5rem}
        .lf-timeline-line{position:absolute;left:28px;top:0;bottom:0;width:2px;background:var(--lf-border-light)}
        .lf-step{position:relative;padding-left:56px}
        .lf-dot{position:absolute;left:19px;top:6px;width:20px;height:20px;border-radius:50%;border:2px solid var(--lf-purple);background:var(--lf-purple-bg);z-index:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--lf-purple)}
        .lf-step-content{padding:0 0 24px}
        .lf-step-label{font-size:14px;font-weight:500;margin-bottom:6px}
        .lf-step-desc{font-size:12px;color:var(--lf-text-secondary);line-height:1.5;margin-bottom:6px}
        .lf-badge{display:inline-block;padding:2px 8px;border-radius:var(--lf-radius);font-size:11px;font-weight:500;margin-left:6px}
        .lf-divider{display:flex;align-items:center;gap:12px;margin:4px 0 20px;padding-left:56px}
        .lf-divider-line{flex:1;height:0.5px;background:var(--lf-border)}
        .lf-divider-text{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--lf-text-hint)}
        .lf-opt-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
        .lf-opt-card{padding:12px;border-radius:var(--lf-radius);border:0.5px solid var(--lf-border-light);background:var(--lf-bg);transition:border-color .25s}
        .lf-opt-card:hover{border-color:var(--lf-border)}
        .lf-opt-card-title{font-size:13px;font-weight:500;margin-bottom:4px;display:flex;align-items:center;gap:6px}
        .lf-opt-card-desc{font-size:11px;color:var(--lf-text-secondary);line-height:1.4}
        .lf-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
        .lf-tag{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--lf-radius);font-size:12px;color:var(--lf-text-secondary);background:var(--lf-bg-secondary);border:0.5px solid var(--lf-border-light)}
        .lf-tag-ico{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
        .lf-cta{display:inline-block;margin-top:10px;padding:8px 18px;border-radius:var(--lf-radius);font-size:12px;font-weight:500;text-decoration:none;border:0.5px solid var(--lf-border);color:var(--lf-text);background:transparent;transition:background .2s}
        .lf-cta:hover{background:var(--lf-bg-secondary)}
        .lf-banner{text-align:center;padding:1.5rem 1rem;margin:0 1rem 1rem;border-radius:var(--lf-radius-lg);border:0.5px solid var(--lf-border-light);background:var(--lf-bg-secondary)}
        .lf-banner-title{font-size:16px;font-weight:500}
        .lf-banner p{font-size:13px;color:var(--lf-text-secondary);margin-top:6px}
        .lf-banner .lf-cta{margin-top:14px;background:var(--lf-purple);color:#fff;border-color:var(--lf-purple)}
        .lf-banner .lf-cta:hover{opacity:.9;background:var(--lf-purple)}
        @media(max-width:480px){.lf-opt-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="lf-wrap">
        <div className="lf-hero">
          <div className="lf-hero-eyebrow">Ами ако ви кажем...</div>
          <div className="lf-hero-title">...че можете да създадете професионална листовка за минути, без дизайнерски опит?</div>
          <div className="lf-hero-sub">Нашата платформа комбинира вашата идея с професионален дизайн. Ето как работи:</div>
        </div>

        <div className="lf-flow">
          {flowSteps.map((step, i) => (
            <span key={step.label}>
              {i > 0 && <span className="lf-flow-arrow">&rarr; </span>}
              <span className="lf-flow-node" style={{ background: step.bg, color: step.color }}>{step.label}</span>
            </span>
          ))}
        </div>

        <div className="lf-timeline">
          <div className="lf-timeline-line" />

          {/* Step 1 */}
          <div className="lf-step">
            <div className="lf-dot">1</div>
            <div className="lf-step-content">
              <div className="lf-step-label">Създаване на листовка <span className="lf-badge" style={{ background: 'var(--lf-purple-bg)', color: 'var(--lf-purple-text)' }}>Старт</span></div>
              <div className="lf-step-desc">Изберете един от четирите начина да започнете:</div>
              <div className="lf-opt-grid">
                <div className="lf-opt-card"><div className="lf-opt-card-title">&#9998; Ръчно</div><div className="lf-opt-card-desc">Създайте от нулата с нашия редактор — пълен контрол</div></div>
                <div className="lf-opt-card"><div className="lf-opt-card-title">&#10024; AI промпт</div><div className="lf-opt-card-desc">Опишете какво искате и AI генерира чернова</div></div>
                <div className="lf-opt-card"><div className="lf-opt-card-title">&#8634; Качи листовка</div><div className="lf-opt-card-desc">Качете съществуваща листовка като основа</div></div>
                <div className="lf-opt-card"><div className="lf-opt-card-title">&#9999; Качи скица</div><div className="lf-opt-card-desc">Нарисувайте скица и я превърнете в дизайн</div></div>
              </div>
            </div>
          </div>

          <div className="lf-divider"><span className="lf-divider-line" /><span className="lf-divider-text">Потребител</span><span className="lf-divider-line" /></div>

          {/* Step 2 */}
          <div className="lf-step">
            <div className="lf-dot" style={{ borderColor: 'var(--lf-blue)', background: 'var(--lf-blue-bg)', color: 'var(--lf-blue)' }}>2</div>
            <div className="lf-step-content">
              <div className="lf-step-label">Редакция и изпращане <span className="lf-badge" style={{ background: 'var(--lf-blue-bg)', color: 'var(--lf-blue-text)' }}>Уеб платформа</span></div>
              <div className="lf-step-desc">Редактирайте текст, изображения, цветове и оформление. Когато сте доволни — натиснете &bdquo;Изпрати за преглед&ldquo;.</div>
              <div className="lf-tags">
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-blue-bg)', color: 'var(--lf-blue)' }}>T</div>Текст</div>
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-blue-bg)', color: 'var(--lf-blue)' }}>&#9638;</div>Изображения</div>
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-blue-bg)', color: 'var(--lf-blue)' }}>&#9673;</div>Цветове</div>
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-blue-bg)', color: 'var(--lf-blue)' }}>&#9638;</div>Оформление</div>
              </div>
            </div>
          </div>

          <div className="lf-divider"><span className="lf-divider-line" /><span className="lf-divider-text">Бекенд</span><span className="lf-divider-line" /></div>

          {/* Step 3 */}
          <div className="lf-step">
            <div className="lf-dot" style={{ borderColor: 'var(--lf-coral)', background: 'var(--lf-coral-bg)', color: 'var(--lf-coral)' }}>3</div>
            <div className="lf-step-content">
              <div className="lf-step-label">Професионална курация <span className="lf-badge" style={{ background: 'var(--lf-coral-bg)', color: 'var(--lf-coral-text)' }}>Дизайнер</span></div>
              <div className="lf-step-desc">Графичен дизайнер преглежда вашата листовка. Коригира типография, подравняване, цветова хармония и печатна готовност.</div>
              <div className="lf-tags">
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-coral-bg)', color: 'var(--lf-coral)' }}>&#10003;</div>Типография</div>
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-coral-bg)', color: 'var(--lf-coral)' }}>&#10003;</div>Подравняване</div>
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-coral-bg)', color: 'var(--lf-coral)' }}>&#10003;</div>Цветове</div>
                <div className="lf-tag"><div className="lf-tag-ico" style={{ background: 'var(--lf-coral-bg)', color: 'var(--lf-coral)' }}>&#10003;</div>Печатна готовност</div>
              </div>
            </div>
          </div>

          <div className="lf-divider"><span className="lf-divider-line" /><span className="lf-divider-text">Потребител</span><span className="lf-divider-line" /></div>

          {/* Step 4 */}
          <div className="lf-step">
            <div className="lf-dot" style={{ borderColor: 'var(--lf-teal)', background: 'var(--lf-teal-bg)', color: 'var(--lf-teal)' }}>4</div>
            <div className="lf-step-content">
              <div className="lf-step-label">Преглед и одобрение <span className="lf-badge" style={{ background: 'var(--lf-teal-bg)', color: 'var(--lf-teal-text)' }}>Решение</span></div>
              <div className="lf-step-desc">Получавате известие, че дизайнът е готов. Разглеждате курираната версия — ако сте доволни, натискате &bdquo;Публикувай&ldquo;.</div>
            </div>
          </div>

          <div className="lf-divider"><span className="lf-divider-line" /><span className="lf-divider-text">Публично</span><span className="lf-divider-line" /></div>

          {/* Step 5 */}
          <div className="lf-step">
            <div className="lf-dot" style={{ borderColor: 'var(--lf-green)', background: 'var(--lf-green-bg)', color: 'var(--lf-green)' }}>5</div>
            <div className="lf-step-content">
              <div className="lf-step-label">Публикуване <span className="lf-badge" style={{ background: 'var(--lf-green-bg)', color: 'var(--lf-green-text)' }}>На живо</span></div>
              <div className="lf-step-desc">Листовката става видима за всички. Споделете линк, вградете в сайт или изтеглете за печат.</div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="lf-step">
            <div className="lf-dot" style={{ borderColor: 'var(--lf-amber)', background: 'var(--lf-amber-bg)', color: 'var(--lf-amber)' }}>6</div>
            <div className="lf-step-content">
              <div className="lf-step-label">Агрегатор на листовки <span className="lf-badge" style={{ background: 'var(--lf-amber-bg)', color: 'var(--lf-amber-text)' }}>По желание</span></div>
              <div className="lf-step-desc">Публикувайте листовката и в агрегатор за по-широка аудитория.</div>
            </div>
          </div>
        </div>

        <div className="lf-banner">
          <div className="lf-banner-title">От идея до публикация — бързо и лесно.</div>
          <p>Вие давате идеята. Ние я превръщаме в професионален дизайн.</p>
          <Link href="/editor" className="lf-cta">Към редактора &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
