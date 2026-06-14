import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useContext } from 'react';
import { ArrowRight, Zap, Shield, Clock, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// ─── Custom Cursor ────────────────────────────────────────────────────────────
const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  useEffect(() => {
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', move);

    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`;
        ringRef.current.style.top = `${ring.current.y}px`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    const addHover = () => {
      document.querySelectorAll('.home-page-container a, .home-page-container button, .home-page-container [data-hover]').forEach(el => {
        el.addEventListener('mouseenter', () => {
          ringRef.current?.classList.add('cursor-hover');
          dotRef.current?.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
          ringRef.current?.classList.remove('cursor-hover');
          dotRef.current?.classList.remove('cursor-hover');
        });
      });
    };
    addHover();

    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
};

// ─── Floating Particle ────────────────────────────────────────────────────────
const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 8}s`,
    size: `${2 + Math.random() * 4}px`,
    opacity: 0.15 + Math.random() * 0.35,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            opacity: p.opacity,
            animation: `particleFloat ${p.duration} ${p.delay} ease-in-out infinite`,
            boxShadow: `0 0 6px var(--accent-primary)`,
          }}
        />
      ))}
    </div>
  );
};

// ─── Stat Counter ─────────────────────────────────────────────────────────────
const StatItem = ({ value, label, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const end = value;
        const duration = 1800;
        const step = Math.ceil(end / (duration / 16));
        const timer = setInterval(() => {
          start = Math.min(start + step, end);
          setCount(start);
          if (start >= end) clearInterval(timer);
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        marginBottom: '0.5rem',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{label}</div>
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const { user } = useContext(AuthContext);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: <Zap size={28} />, title: 'Instant Booking', desc: 'Reserve your perfect pitch in under 30 seconds. No phone calls, no waiting.' },
    { icon: <Shield size={28} />, title: 'Verified Pitches', desc: 'Every pitch is quality-checked and managed by certified venue owners.' },
    { icon: <Clock size={28} />, title: 'Flexible Timing', desc: 'Book by the hour, any time of day. Morning sessions to midnight kick-offs.' },
    { icon: <Star size={28} />, title: 'Real Reviews', desc: 'Genuine ratings from real players help you pick the best venue every time.' },
  ];

  return (
    <div className="home-page-container">
      <CustomCursor />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background image with parallax */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1800&q=85&auto=format')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.35}px) scale(1.1)`,
          transition: 'transform 0.05s linear',
          willChange: 'transform',
        }} />

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(10,10,20,0.88) 0%, rgba(10,10,20,0.60) 50%, rgba(0,30,20,0.75) 100%)',
        }} />

        {/* Animated glow orb */}
        <div style={{
          position: 'absolute', top: '15%', right: '8%', zIndex: 1,
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,204,0.12) 0%, transparent 70%)',
          animation: 'pulseGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%', zIndex: 1,
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,179,255,0.10) 0%, transparent 70%)',
          animation: 'pulseGlow 6s ease-in-out 2s infinite',
          pointerEvents: 'none',
        }} />

        <Particles />

        {/* Hero Content */}
        <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: '80px' }}>
          <div style={{ maxWidth: '680px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0.4rem 1rem', borderRadius: '50px', marginBottom: '2rem',
              background: 'rgba(0,255,204,0.08)',
              border: '1px solid rgba(0,255,204,0.25)',
              color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600,
              animation: 'fadeInUp 0.6s ease both',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'inline-block', animation: 'pulseGlow 1.5s ease infinite' }} />
              Pitches available now — book instantly
            </div>

            <h1 style={{
              fontSize: 'clamp(2.8rem, 6vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: '1.5rem',
              animation: 'fadeInUp 0.7s 0.1s ease both',
            }}>
              Find & Book Your{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Perfect Pitch
              </span>{' '}
              Today
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'rgba(255,255,255,0.75)',
              marginBottom: '2.5rem',
              lineHeight: 1.7,
              animation: 'fadeInUp 0.7s 0.2s ease both',
            }}>
              The fastest way to book premium football and futsal pitches in your city.
              Real-time availability, instant confirmation — no hassle, just play.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', animation: 'fadeInUp 0.7s 0.3s ease both' }}>
              <Link to="/dashboard" className="btn btn-primary" style={{
                fontSize: '1.1rem', padding: '0.9rem 2.25rem',
                boxShadow: '0 0 30px rgba(0,255,204,0.4), 0 8px 24px rgba(0,0,0,0.4)',
              }}>
                Book a Pitch <ArrowRight size={20} />
              </Link>
              {!user && (
                <Link to="/auth" className="btn btn-secondary" style={{
                  fontSize: '1.1rem', padding: '0.9rem 2.25rem',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}>
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem',
          animation: 'bounceY 2s ease-in-out infinite',
        }}>
          <span>scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(0,255,204,0.6), transparent)' }} />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(0,255,204,0.06) 0%, rgba(0,179,255,0.06) 100%)',
        borderTop: '1px solid rgba(0,255,204,0.1)',
        borderBottom: '1px solid rgba(0,179,255,0.1)',
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0' }}>
            <StatItem value={120} suffix="+" label="Active Pitches" />
            <StatItem value={4800} suffix="+" label="Bookings Made" />
            <StatItem value={3200} suffix="+" label="Happy Players" />
            <StatItem value={98} suffix="%" label="Satisfaction Rate" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative gradient blob */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '800px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,255,204,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-block', padding: '0.3rem 1rem', borderRadius: '50px',
              background: 'rgba(0,179,255,0.08)', border: '1px solid rgba(0,179,255,0.2)',
              color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 600,
              marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Simple Process
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '1rem' }}>
              From Search to{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Kickoff</span>{' '}
              in Minutes
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              We built the simplest possible experience so you can focus on the game, not the admin.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {[
              { num: '01', icon: '🔍', title: 'Search', desc: 'Browse pitches by location, price, and availability. Filters update in real time.' },
              { num: '02', icon: '📅', title: 'Pick a Slot', desc: 'See live availability. Choose your date and time — no double bookings, ever.' },
              { num: '03', icon: '⚡', title: 'Book Instantly', desc: 'Confirm your reservation in one tap. Get an immediate confirmation.' },
              { num: '04', icon: '⚽', title: 'Play', desc: 'Show up, kick off, and enjoy. Your pitch is guaranteed and waiting for you.' },
            ].map((step, i) => (
              <div
                key={step.num}
                data-hover
                style={{
                  position: 'relative',
                  padding: '2rem',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.35s ease',
                  cursor: 'default',
                  animationDelay: `${i * 0.1}s`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,255,204,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0,255,204,0.2)';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(0,255,204,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Step number */}
                <div style={{
                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: 'rgba(0,255,204,0.4)', marginBottom: '1.25rem',
                }}>
                  STEP {step.num}
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1 }}>{step.icon}</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>

                {/* Connecting line (not on last) */}
                {i < 3 && (
                  <div style={{
                    position: 'absolute', top: '3rem', right: '-1.05rem',
                    width: '2.1rem', height: '1px',
                    background: 'linear-gradient(to right, rgba(0,255,204,0.3), transparent)',
                    display: 'none', // hidden on mobile; shown via a media query isn't practical inline
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(0,179,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '1rem' }}>
              Built for{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Players</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {features.map(({ icon, title, desc }, i) => (
              <div
                key={title}
                style={{
                  padding: '2rem',
                  borderRadius: '20px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  animationDelay: `${i * 0.08}s`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(0,255,204,0.15), rgba(0,179,255,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem', color: 'var(--accent-primary)',
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '7rem 0',
        background: 'linear-gradient(135deg, rgba(0,255,204,0.06) 0%, rgba(0,0,0,0) 60%, rgba(0,179,255,0.06) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,255,204,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: '1.25rem', fontWeight: 900 }}>
            Ready to{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Play?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '460px', margin: '0 auto 2.5rem' }}>
            Join thousands of players who book smarter. Your next game starts here.
          </p>
          <Link to={user ? '/dashboard' : '/auth'} className="btn btn-primary" style={{
            fontSize: '1.15rem', padding: '1rem 3rem',
            boxShadow: '0 0 40px rgba(0,255,204,0.35), 0 12px 32px rgba(0,0,0,0.4)',
          }}>
            {user ? 'Browse Pitches' : 'Get Started — It\'s Free'} <ArrowRight size={22} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '2.5rem 0',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--glass-border)',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{
            fontSize: '1.3rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
          }}>
            Pitch Perfect
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            © {new Date().getFullYear()} Pitch Perfect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
