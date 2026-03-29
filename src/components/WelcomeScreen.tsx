import { useTranslation } from 'react-i18next';
import { Sparkles, Camera, Pencil, PenTool } from 'lucide-react';
import { setLanguage } from '@/i18n';

interface Props {
  onStart: (mode: 'manual' | 'prompt' | 'photo' | 'sketch') => void;
}

export function WelcomeScreen({ onStart }: Props) {
  const { t, i18n } = useTranslation();

  const options = [
    { id: 'manual' as const, icon: <PenTool size={24} />, titleKey: 'welcome.manual', descKey: 'welcome.manualDesc' },
    { id: 'prompt' as const, icon: <Sparkles size={24} />, titleKey: 'welcome.aiPrompt', descKey: 'welcome.aiPromptDesc' },
    { id: 'photo' as const, icon: <Camera size={24} />, titleKey: 'welcome.uploadPhoto', descKey: 'welcome.uploadPhotoDesc' },
    { id: 'sketch' as const, icon: <Pencil size={24} />, titleKey: 'welcome.uploadSketch', descKey: 'welcome.uploadSketchDesc' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
    }}>
      {/* Language toggle */}
      <button
        onClick={() => setLanguage(i18n.language === 'bg' ? 'en' : 'bg')}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'transparent', border: '1px solid #2a2a2a',
          borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
          color: '#888', cursor: 'pointer',
        }}
      >
        {i18n.language.toUpperCase()}
      </button>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#f5f5f5', margin: '0 0 8px' }}>
          Dessy
        </h1>
        <p style={{ fontSize: '14px', color: '#888', margin: 0, maxWidth: '400px' }}>
          {t('welcome.subtitle')}
        </p>
      </div>

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        maxWidth: '520px',
        width: '100%',
      }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onStart(opt.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '24px 16px',
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#f5f5f5',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.background = '#1a1a2e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a';
              e.currentTarget.style.background = '#141414';
            }}
          >
            <div style={{ color: '#6366f1' }}>{opt.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{t(opt.titleKey)}</div>
            <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.4 }}>{t(opt.descKey)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
