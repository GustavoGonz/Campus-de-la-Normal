import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo-normal.png';

/**
 * InstitutionalLogo Component
 * Identidad Visual Oficial de Campus: La Normal
 * Escuela Normal Dr. Pedro Ignacio de Castro Barros
 * Lema: "Aprender mejor, juntos."
 *
 * Colores Institucionales Oficiales del Escudo:
 * - Azul Escudo: #0C13A8
 * - Naranja Escudo: #FF7B15
 * - Oro / Amarillo: #E3CB15
 * - Blanco Puro: #FFFFFF
 */
export const InstitutionalLogo = ({
  variant = 'horizontal', // 'horizontal' | 'vertical' | 'hero' | 'symbol' | 'badge'
  size = 'md',            // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  theme = 'auto',         // 'light' | 'dark' | 'auto'
  showSlogan = true,
  showSubtitle = false,
  to,
  className = '',
  style = {},
}) => {
  // Dimensiones del escudo según tamaño
  const sizeMap = {
    xs: { width: 24, height: 28, titleSize: '0.9rem', sloganSize: '0.65rem' },
    sm: { width: 32, height: 37, titleSize: '1rem', sloganSize: '0.68rem' },
    md: { width: 42, height: 48, titleSize: '1.18rem', sloganSize: '0.74rem' },
    lg: { width: 60, height: 69, titleSize: '1.45rem', sloganSize: '0.85rem' },
    xl: { width: 88, height: 101, titleSize: '1.85rem', sloganSize: '0.95rem' },
    hero: { width: 120, height: 138, titleSize: '2.2rem', sloganSize: '1.05rem' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Filtro de visibilidad según tema para garantizar contraste del escudo
  // En fondos oscuros se aplica un halo de realce sutil para que el azul (#0C13A8) y el borde destaquen.
  const getFilter = () => {
    if (theme === 'dark') {
      return 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 3px 10px rgba(0, 0, 0, 0.5))';
    }
    if (theme === 'light') {
      return 'drop-shadow(0 2px 6px rgba(12, 19, 168, 0.22))';
    }
    // auto / adaptive
    return 'drop-shadow(0 2px 5px rgba(12, 19, 168, 0.18))';
  };

  const imageElement = (
    <img
      src={logoImg}
      alt="Escuela Normal Dr. Pedro Ignacio de Castro Barros - Campus: La Normal"
      width={currentSize.width}
      height={currentSize.height}
      style={{
        width: `${currentSize.width}px`,
        height: `${currentSize.height}px`,
        objectFit: 'contain',
        filter: getFilter(),
        transition: 'transform var(--trans-fast), filter var(--trans-fast)',
        flexShrink: 0,
        display: 'block',
      }}
      loading="eager"
    />
  );

  // Variante: Solo el símbolo / escudo
  if (variant === 'symbol' || variant === 'shield') {
    if (to) {
      return (
        <Link to={to} className={`institutional-logo-symbol ${className}`} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', ...style }} aria-label="Campus: La Normal">
          {imageElement}
        </Link>
      );
    }
    return (
      <div className={`institutional-logo-symbol ${className}`} style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
        {imageElement}
      </div>
    );
  }

  // Variante: Badge compacto
  if (variant === 'badge') {
    const badgeContent = (
      <div
        className={`institutional-logo-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.3rem 0.75rem 0.3rem 0.45rem',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'var(--brand-blue-light, #eef2ff)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'var(--primary-100, #e0e7ff)'}`,
          backdropFilter: 'blur(4px)',
          ...style,
        }}
      >
        <img
          src={logoImg}
          alt="Escudo"
          style={{
            width: '22px',
            height: '25px',
            objectFit: 'contain',
            filter: getFilter(),
          }}
        />
        <div style={{ lineHeight: 1.15 }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: theme === 'dark' ? '#ffffff' : 'var(--primary-900)',
          }}>
            Campus: <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>La Normal</span>
          </div>
          {showSubtitle && (
            <div style={{
              fontSize: '0.62rem',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-muted)',
              fontWeight: 500,
            }}>
              Dr. Pedro Ignacio de Castro Barros
            </div>
          )}
        </div>
      </div>
    );

    if (to) {
      return (
        <Link to={to} style={{ textDecoration: 'none', display: 'inline-block' }}>
          {badgeContent}
        </Link>
      );
    }
    return badgeContent;
  }

  // Variante: Vertical / Hero (centrado, gran impacto visual)
  if (variant === 'vertical' || variant === 'hero') {
    const heroContent = (
      <div
        className={`institutional-logo-vertical ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: variant === 'hero' ? '1rem' : '0.65rem',
          ...style,
        }}
      >
        <div style={{
          position: 'relative',
          padding: variant === 'hero' ? '0.75rem' : '0.35rem',
          borderRadius: 'var(--radius-xl)',
          background: theme === 'dark'
            ? 'radial-gradient(circle, rgba(255,123,21,0.15) 0%, rgba(12,19,168,0.2) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(255,123,21,0.08) 0%, rgba(12,19,168,0.06) 65%, transparent 100%)',
        }}>
          {imageElement}
        </div>

        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: currentSize.titleSize,
              color: theme === 'dark' ? '#ffffff' : 'var(--primary-900)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Campus: <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>La Normal</span>
          </div>

          {showSlogan && (
            <div
              style={{
                fontSize: currentSize.sloganSize,
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'var(--primary-700, #1720cc)',
                fontWeight: 600,
                marginTop: '0.2rem',
                letterSpacing: '0.01em',
              }}
            >
              Aprender mejor, juntos.
            </div>
          )}

          {showSubtitle && (
            <div
              style={{
                fontSize: '0.75rem',
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'var(--text-muted)',
                fontWeight: 500,
                marginTop: '0.25rem',
              }}
            >
              Escuela Normal Dr. Pedro Ignacio de Castro Barros
            </div>
          )}
        </div>
      </div>
    );

    if (to) {
      return (
        <Link to={to} style={{ textDecoration: 'none', display: 'inline-block' }}>
          {heroContent}
        </Link>
      );
    }
    return heroContent;
  }

  // Variante por defecto: Horizontal (Navbar, encabezados)
  const horizontalContent = (
    <div
      className={`institutional-logo-horizontal ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        ...style,
      }}
    >
      {imageElement}

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: currentSize.titleSize,
            color: theme === 'dark' ? '#ffffff' : 'var(--primary-900)',
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.35rem',
            whiteSpace: 'nowrap',
          }}
        >
          <span>Campus:</span>
          <span style={{ color: 'var(--brand-orange, #ff7b15)' }}>La Normal</span>
        </div>

        {showSlogan && (
          <div
            className="institutional-slogan"
            style={{
              fontSize: currentSize.sloganSize,
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)',
              fontWeight: 600,
              letterSpacing: '0.01em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            Aprender mejor, juntos.
          </div>
        )}

        {showSubtitle && (
          <div
            className="institutional-subtitle"
            style={{
              fontSize: '0.68rem',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-secondary)',
              fontWeight: 500,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            Escuela Normal Dr. Pedro Ignacio de Castro Barros
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
        }}
        aria-label="Campus: La Normal - Aprender mejor, juntos."
      >
        {horizontalContent}
      </Link>
    );
  }

  return horizontalContent;
};

export default InstitutionalLogo;

