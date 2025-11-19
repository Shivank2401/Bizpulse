import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Sparkles, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [particles, setParticles] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [cursorTrail, setCursorTrail] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [loginProgress, setLoginProgress] = useState(0);
  const [rippleEffect, setRippleEffect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputRipples, setInputRipples] = useState({ email: null, password: null });
  const [cardGlow, setCardGlow] = useState({ x: 0, y: 0 });
  const [typingEffect, setTypingEffect] = useState({ email: false, password: false });
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [errorAnimation, setErrorAnimation] = useState(false);
  const [magneticFields, setMagneticFields] = useState([]);
  const [backgroundWaves, setBackgroundWaves] = useState([]);
  const [morphingShapes, setMorphingShapes] = useState([]);
  const [floatingLabels, setFloatingLabels] = useState({ email: false, password: false });
  const [pageLoaded, setPageLoaded] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [advancedParticles, setAdvancedParticles] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [gestureState, setGestureState] = useState({ scale: 1, rotation: 0 });
  const [responsiveBreakpoint, setResponsiveBreakpoint] = useState('desktop');
  const [interactiveElements, setInteractiveElements] = useState([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Page load animation
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setKeyboardFocus(true);
      }
    };
    const handleMouseDown = () => {
      setKeyboardFocus(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      parallaxSpeed: Math.random() * 0.5 + 0.2,
    }));
    setParticles(newParticles);

    const fields = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      strength: Math.random() * 0.3 + 0.1,
    }));
    setMagneticFields(fields);

    const waves = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      delay: i * 2,
      amplitude: Math.random() * 20 + 10,
    }));
    setBackgroundWaves(waves);

    const shapes = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 150 + 100,
      rotation: Math.random() * 360,
      delay: i * 1.5,
    }));
    setMorphingShapes(shapes);

    // Initialize advanced particle system
    const advParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 2 + 0.5,
      direction: Math.random() * 360,
      color: ['rgba(255,255,255,0.4)', 'rgba(147,51,234,0.3)', 'rgba(236,72,153,0.3)'][Math.floor(Math.random() * 3)],
      life: Math.random() * 100 + 50,
    }));
    setAdvancedParticles(advParticles);

    // Initialize interactive elements
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
      size: Math.random() * 40 + 20,
    }));
    setInteractiveElements(elements);

    // Detect responsive breakpoint
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setResponsiveBreakpoint('mobile');
      else if (width < 1024) setResponsiveBreakpoint('tablet');
      else setResponsiveBreakpoint('desktop');
    };
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // Cursor trail effect
  useEffect(() => {
    let lastTime = 0;
    const throttleDelay = 50;

    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      if (currentTime - lastTime < throttleDelay) return;
      lastTime = currentTime;

      setMousePos({ x: e.clientX, y: e.clientY });
      
      setCursorTrail((prev) => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
        return newTrail.slice(-8);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(scrollY);
      setScrollProgress(maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Advanced particle system animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAdvancedParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + Math.cos(particle.direction * Math.PI / 180) * particle.speed) % 100,
        y: (particle.y + Math.sin(particle.direction * Math.PI / 180) * particle.speed) % 100,
        life: particle.life - 1,
        size: particle.life > 0 ? particle.size : Math.random() * 6 + 3,
      })).filter(p => p.life > 0).concat(
        Array.from({ length: 5 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 6 + 3,
          speed: Math.random() * 2 + 0.5,
          direction: Math.random() * 360,
          color: ['rgba(255,255,255,0.4)', 'rgba(147,51,234,0.3)', 'rgba(236,72,153,0.3)'][Math.floor(Math.random() * 3)],
          life: Math.random() * 100 + 50,
        }))
      ));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Gesture detection (touch/pinch for mobile)
  useEffect(() => {
    let initialDistance = 0;
    let initialScale = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialScale = gestureState.scale;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = Math.max(0.8, Math.min(1.2, (currentDistance / initialDistance) * initialScale));
        setGestureState(prev => ({ ...prev, scale }));
      }
    };

    const handleTouchEnd = () => {
      setTimeout(() => setGestureState({ scale: 1, rotation: 0 }), 300);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gestureState.scale]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(email.length > 0 && emailRegex.test(email));
    if (email.length > 0) {
      setTypingEffect(prev => ({ ...prev, email: true }));
      setTimeout(() => setTypingEffect(prev => ({ ...prev, email: false })), 500);
    }
    setFloatingLabels(prev => ({ ...prev, email: email.length > 0 || emailFocused }));
  }, [email, emailFocused]);

  useEffect(() => {
    setPasswordValid(password.length >= 6);
    if (password.length > 0) {
      setTypingEffect(prev => ({ ...prev, password: true }));
      setTimeout(() => setTypingEffect(prev => ({ ...prev, password: false })), 500);
    }
    setFloatingLabels(prev => ({ ...prev, password: password.length > 0 || passwordFocused }));
  }, [password, passwordFocused]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
    setCardGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleCardMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setCardGlow({ x: 50, y: 50 });
  };

  const handleButtonMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 10,
    });
  };

  const handleLoginWithProgress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginProgress(0);
    setErrorAnimation(false);
    setSuccessAnimation(false);

    const progressInterval = setInterval(() => {
      setLoginProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      setLoginProgress(100);
      setSuccessAnimation(true);
      setTimeout(() => {
        login(response.data.token, response.data.email);
        toast.success('Login successful!');
        navigate('/');
      }, 800);
    } catch (error) {
      clearInterval(progressInterval);
      setLoginProgress(0);
      setErrorAnimation(true);
      const errorMsg = error.response?.data?.detail || 'Login failed';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      setTimeout(() => {
        setErrorAnimation(false);
        setErrorMessage(null);
      }, 3000);
    }
  };

  const handleButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRippleEffect({ x, y, id: Date.now() });
    setTimeout(() => setRippleEffect(null), 600);
  };

  const handleInputFocus = (field) => {
    if (field === 'email') {
      setEmailFocused(true);
      setInputRipples(prev => ({ ...prev, email: Date.now() }));
    } else {
      setPasswordFocused(true);
      setInputRipples(prev => ({ ...prev, password: Date.now() }));
    }
  };

  const handleInputBlur = (field) => {
    if (field === 'email') {
      setEmailFocused(false);
    } else {
      setPasswordFocused(false);
    }
  };

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden animate-gradient-shift ${
        pageLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        backgroundSize: '200% 200%',
        transition: 'opacity 0.8s ease-in-out',
      }}
    >
      {/* Cursor Trail Effect */}
      {cursorTrail.map((point, index) => {
        const size = (cursorTrail.length - index) * 4;
        const opacity = (cursorTrail.length - index) / cursorTrail.length * 0.3;
        return (
          <div
            key={point.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              opacity: opacity,
              background: `radial-gradient(circle, rgba(255,255,255,${opacity * 2}) 0%, transparent 70%)`,
              filter: 'blur(3px)',
              transition: 'all 0.15s ease-out',
              willChange: 'transform, opacity',
            }}
          />
        );
      })}

      {/* Animated Particles with Parallax */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y + (scrollY * particle.parallaxSpeed * 0.1)}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              transform: `translate(${(mousePos.x - window.innerWidth / 2) * particle.parallaxSpeed * 0.01}px, ${(mousePos.y - window.innerHeight / 2) * particle.parallaxSpeed * 0.01}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          />
        ))}
      </div>

      {/* Advanced Particle System */}
      <div className="absolute inset-0 pointer-events-none">
        {advancedParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              transform: `translate(-50%, -50%) scale(${particle.life / 100})`,
              opacity: particle.life / 150,
              filter: 'blur(1px)',
              transition: 'all 0.1s linear',
            }}
          />
        ))}
      </div>

      {/* Scroll Progress Indicator */}
      {scrollProgress > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-30 z-50" style={{ width: `${scrollProgress}%` }}></div>
      )}

      {/* Interactive Elements that respond to scroll */}
      {interactiveElements.map((element) => {
        const scrollOffset = scrollY * 0.1;
        const mouseOffset = (mousePos.x - window.innerWidth / 2) * 0.02;
        return (
          <div
            key={element.id}
            className="absolute pointer-events-none opacity-10"
            style={{
              left: `${element.x}%`,
              top: `${element.y + scrollOffset}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              borderRadius: element.type === 'circle' ? '50%' : element.type === 'square' ? '0%' : '20%',
              transform: `translate(-50%, -50%) rotate(${scrollY * 0.5 + mouseOffset}deg) scale(${1 + Math.sin(scrollY * 0.01) * 0.2})`,
              filter: 'blur(15px)',
              transition: 'transform 0.3s ease-out',
            }}
          />
        );
      })}

      {/* Interactive gradient orb */}
      <div
        className="absolute rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-300"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(147,51,234,0.2) 50%, transparent 70%)',
          left: `${mousePos.x - 200}px`,
          top: `${mousePos.y - 200}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-float-orb"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/10 rounded-full blur-2xl animate-float-orb-delayed"></div>

      {/* Background waves */}
      {backgroundWaves.map((wave) => (
        <div
          key={wave.id}
          className="absolute inset-0 opacity-10 animate-wave-motion"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
            animationDuration: `${8 + wave.id * 2}s`,
            animationDelay: `${wave.delay}s`,
          }}
        />
      ))}

      {/* Magnetic fields */}
      {magneticFields.map((field) => (
        <div
          key={field.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${field.x}%`,
            top: `${field.y}%`,
            width: `${100 * field.strength}px`,
            height: `${100 * field.strength}px`,
            background: `radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(20px)',
            animation: `magnetic-pulse ${5 + field.id}s ease-in-out infinite`,
            animationDelay: `${field.id * 0.5}s`,
          }}
        />
      ))}

      {/* Morphing shapes */}
      {morphingShapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute pointer-events-none opacity-5"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            background: `linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)`,
            borderRadius: `${30 + shape.id * 10}% ${70 - shape.id * 10}% ${50 + shape.id * 5}% ${50 - shape.id * 5}%`,
            transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
            filter: 'blur(30px)',
            animation: `morph-shape ${8 + shape.id * 2}s ease-in-out infinite`,
            animationDelay: `${shape.delay}s`,
          }}
        />
      ))}

      <div 
        className={`w-full max-w-md relative z-10 ${
          pageLoaded ? 'animate-page-slide-in' : ''
        } ${
          responsiveBreakpoint === 'mobile' ? 'px-4' : ''
        }`}
        style={{
          transform: `scale(${gestureState.scale}) rotate(${gestureState.rotation}deg)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-6 bg-white/20 backdrop-blur-xl border-4 border-white/40 shadow-2xl transform hover:rotate-12 transition-transform duration-500 relative animate-logo-entrance group">
            <Sparkles className="w-14 h-14 text-white animate-sparkle group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 animate-sparkle-rotate">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-y-1/2 translate-x-1/2 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-75"></div>
          </div>
          {/* Text reveal */}
          <h1 className="text-5xl font-bold mb-3 text-white drop-shadow-2xl animate-text-reveal">
            <span className="inline-block" style={{ animationDelay: '0.1s' }}>B</span>
            <span className="inline-block" style={{ animationDelay: '0.15s' }}>e</span>
            <span className="inline-block" style={{ animationDelay: '0.2s' }}>a</span>
            <span className="inline-block" style={{ animationDelay: '0.25s' }}>c</span>
            <span className="inline-block" style={{ animationDelay: '0.3s' }}>o</span>
            <span className="inline-block" style={{ animationDelay: '0.35s' }}>n</span>
            <span className="inline-block" style={{ animationDelay: '0.4s' }}>I</span>
            <span className="inline-block" style={{ animationDelay: '0.45s' }}>Q</span>
          </h1>
          <p className="text-xl text-white/90 font-medium animate-subtitle-reveal">by Vector Studio</p>
        </div>

        <div
          className={`bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 transition-all duration-300 animate-pulse-glow relative overflow-hidden ${
            successAnimation ? 'animate-success-bounce' : ''
          } ${
            errorAnimation ? 'animate-error-shake' : ''
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Success confetti */}
          {successAnimation && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 8 + 4}px`,
                    height: `${Math.random() * 8 + 4}px`,
                    background: ['#9333ea', '#ec4899', '#3b82f6', '#10b981'][Math.floor(Math.random() * 4)],
                    animation: `confetti-fall ${Math.random() * 1 + 0.5}s ease-out forwards`,
                    animationDelay: `${Math.random() * 0.3}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Error pulse */}
          {errorAnimation && (
            <div className="absolute inset-0 rounded-3xl border-2 border-red-400/50 animate-error-pulse pointer-events-none"></div>
          )}
          
          {/* Dynamic glow */}
          <div
            className="absolute pointer-events-none transition-all duration-300"
            style={{
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, transparent 70%)',
              left: `${cardGlow.x}%`,
              top: `${cardGlow.y}%`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(40px)',
              opacity: cardGlow.x !== 50 || cardGlow.y !== 50 ? 0.6 : 0,
            }}
          />
          
          <form onSubmit={handleLoginWithProgress} className="space-y-6 animate-form-entrance">
            <div className="space-y-2">
              <div className="relative">
                <Label 
                  htmlFor="email" 
                  className={`absolute left-3 transition-all duration-300 pointer-events-none z-20 ${
                    floatingLabels.email
                      ? 'top-2 text-xs text-purple-600 font-semibold'
                      : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
                  } ${
                    emailFocused ? 'text-purple-600' : ''
                  }`}
                >
                  Email Address
                  {emailValid && email.length > 0 && (
                    <span className="ml-2 text-green-500 animate-checkmark">✓</span>
                  )}
                </Label>
                {inputRipples.email && (
                  <div
                    className="absolute inset-0 rounded-lg bg-purple-200/30 animate-input-ripple pointer-events-none"
                    key={inputRipples.email}
                  />
                )}
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={() => handleInputBlur('email')}
                  placeholder=""
                  required
                  data-testid="login-email-input"
                  className={`h-14 border-2 transition-all duration-300 relative z-10 px-3 ${
                    floatingLabels.email ? 'pt-6 pb-2' : 'py-0'
                  } ${
                    emailFocused
                      ? 'border-purple-500 focus:ring-4 focus:ring-purple-200 shadow-lg shadow-purple-200/50 animate-input-focus-glow'
                      : 'border-gray-200'
                  } ${
                    keyboardFocus && emailFocused ? 'ring-4 ring-purple-300 ring-offset-2' : ''
                  } ${
                    email.length > 0 && !emailValid
                      ? 'border-red-400 animate-shake'
                      : emailValid
                      ? 'border-green-400'
                      : ''
                  } ${
                    typingEffect.email ? 'scale-[1.02]' : ''
                  }`}
                />
                {emailFocused && (
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 animate-input-glow z-20"></div>
                )}
                {typingEffect.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full animate-ping z-20"></div>
                )}
                {errorMessage && emailFocused && (
                  <div className="absolute -bottom-6 left-0 text-xs text-red-500 animate-error-slide-in">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Label 
                  htmlFor="password" 
                  className={`absolute left-3 transition-all duration-300 pointer-events-none z-20 ${
                    floatingLabels.password
                      ? 'top-2 text-xs text-purple-600 font-semibold'
                      : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
                  } ${
                    passwordFocused ? 'text-purple-600' : ''
                  }`}
                >
                  Password
                  {passwordValid && password.length > 0 && (
                    <span className="ml-2 text-green-500 animate-checkmark">✓</span>
                  )}
                </Label>
                {inputRipples.password && (
                  <div
                    className="absolute inset-0 rounded-lg bg-purple-200/30 animate-input-ripple pointer-events-none"
                    key={inputRipples.password}
                  />
                )}
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleInputFocus('password')}
                  onBlur={() => handleInputBlur('password')}
                  placeholder=""
                  required
                  data-testid="login-password-input"
                  className={`h-14 border-2 transition-all duration-300 relative z-10 px-3 ${
                    floatingLabels.password ? 'pt-6 pb-2' : 'py-0'
                  } ${
                    passwordFocused
                      ? 'border-purple-500 focus:ring-4 focus:ring-purple-200 shadow-lg shadow-purple-200/50 animate-input-focus-glow'
                      : 'border-gray-200'
                  } ${
                    keyboardFocus && passwordFocused ? 'ring-4 ring-purple-300 ring-offset-2' : ''
                  } ${
                    password.length > 0 && !passwordValid
                      ? 'border-red-400 animate-shake'
                      : passwordValid
                      ? 'border-green-400'
                      : ''
                  } ${
                    typingEffect.password ? 'scale-[1.02]' : ''
                  } pr-10`}
                />
                {passwordFocused && (
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 animate-input-glow z-20"></div>
                )}
                {typingEffect.password && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full animate-ping z-20"></div>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110 z-20"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errorMessage && passwordFocused && (
                  <div className="absolute -bottom-6 left-0 text-xs text-red-500 animate-error-slide-in">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              onClick={handleButtonClick}
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => {
                setButtonHover(false);
                setButtonPosition({ x: 0, y: 0 });
              }}
              onMouseMove={handleButtonMouseMove}
              data-testid="login-submit-button"
              className={`w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl transition-all duration-300 relative overflow-hidden group ${
                successAnimation ? 'animate-success-glow' : ''
              } ${
                errorAnimation ? 'animate-error-glow' : ''
              } ${
                keyboardFocus ? 'focus-visible:ring-4 focus-visible:ring-purple-300 focus-visible:ring-offset-2' : ''
              }`}
              style={{
                transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px) scale(${buttonHover ? 1.05 : 1})`,
              }}
            >
              {loading && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-300 ease-out"
                  style={{ width: `${loginProgress}%` }}
                />
              )}
              {rippleEffect && (
                <span
                  className="absolute rounded-full bg-white/40 animate-ripple"
                  style={{
                    left: `${rippleEffect.x}px`,
                    top: `${rippleEffect.y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '0px',
                    height: '0px',
                  }}
                />
              )}
              <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-r-white/50 rounded-full animate-spin-reverse mr-2"></div>
                    </div>
                    <span className="animate-pulse">Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    Sign In
                  </>
                )}
              </span>
              {buttonHover && !loading && (
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
              )}
              {loading && (
                <span className="absolute inset-0 rounded-lg bg-white/20 animate-pulse-glow-button"></span>
              )}
            </Button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(5px); }
        }
        @keyframes text-reveal {
          0% { opacity: 0; transform: translateY(20px) rotateX(90deg); }
          100% { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes subtitle-reveal {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes logo-entrance {
          0% { opacity: 0; transform: scale(0.5) rotate(-180deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes sparkle-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes form-entrance {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes input-glow {
          0% { width: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { width: 100%; opacity: 0.8; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes checkmark {
          0% { opacity: 0; transform: scale(0) rotate(-45deg); }
          50% { transform: scale(1.2) rotate(-45deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(147, 51, 234, 0.2); }
          50% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.5), 0 0 60px rgba(147, 51, 234, 0.3); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ripple {
          0% { width: 0px; height: 0px; opacity: 1; }
          100% { width: 300px; height: 300px; opacity: 0; }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow-button {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        @keyframes input-focus-glow {
          0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(147, 51, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
        }
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(30px, -30px) scale(1.1); opacity: 0.4; }
          66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.35; }
        }
        @keyframes float-orb-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          33% { transform: translate(-40px, 40px) scale(1.15); opacity: 0.3; }
          66% { transform: translate(25px, -25px) scale(0.85); opacity: 0.25; }
        }
        @keyframes input-ripple {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes wave-motion {
          0% { transform: translateX(-100%) translateY(0) scaleY(1); opacity: 0.05; }
          50% { transform: translateX(0%) translateY(20px) scaleY(1.2); opacity: 0.1; }
          100% { transform: translateX(100%) translateY(0) scaleY(1); opacity: 0.05; }
        }
        @keyframes magnetic-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.5; }
        }
        @keyframes success-bounce {
          0%, 100% { transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1); }
          25% { transform: perspective(1000px) rotateY(5deg) rotateX(-5deg) scale(1.02); }
          50% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) scale(1.02); }
          75% { transform: perspective(1000px) rotateY(3deg) rotateX(-3deg) scale(1.01); }
        }
        @keyframes error-shake {
          0%, 100% { transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateX(-10px); }
          20%, 40%, 60%, 80% { transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateX(10px); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
        }
        @keyframes error-pulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        @keyframes success-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.4); }
        }
        @keyframes error-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4); }
        }
        @keyframes morph-shape {
          0%, 100% { border-radius: 30% 70% 50% 50%; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          25% { border-radius: 60% 40% 30% 70%; transform: translate(-50%, -50%) rotate(90deg) scale(1.1); }
          50% { border-radius: 50% 50% 60% 40%; transform: translate(-50%, -50%) rotate(180deg) scale(0.9); }
          75% { border-radius: 40% 60% 70% 30%; transform: translate(-50%, -50%) rotate(270deg) scale(1.05); }
        }
        @keyframes page-slide-in {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes error-slide-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        .animate-logo-entrance {
          animation: logo-entrance 1s ease-out;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-sparkle-rotate {
          animation: sparkle-rotate 8s linear infinite;
        }
        .animate-text-reveal {
          animation: text-reveal 0.6s ease-out;
        }
        .animate-subtitle-reveal {
          animation: subtitle-reveal 0.8s ease-out 0.3s both;
        }
        .animate-form-entrance {
          animation: form-entrance 0.8s ease-out 0.4s both;
        }
        .animate-input-glow {
          animation: input-glow 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-checkmark {
          animation: checkmark 0.5s ease-out;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
        .animate-pulse-glow-button {
          animation: pulse-glow-button 1.5s ease-in-out infinite;
        }
        .animate-input-focus-glow {
          animation: input-focus-glow 1.5s ease-in-out infinite;
        }
        .animate-float-orb {
          animation: float-orb 8s ease-in-out infinite;
        }
        .animate-float-orb-delayed {
          animation: float-orb-delayed 10s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-input-ripple {
          animation: input-ripple 0.6s ease-out;
        }
        .animate-success-bounce {
          animation: success-bounce 0.8s ease-in-out;
        }
        .animate-error-shake {
          animation: error-shake 0.5s ease-in-out;
        }
        .animate-success-glow {
          animation: success-glow 1s ease-in-out infinite;
        }
        .animate-error-glow {
          animation: error-glow 1s ease-in-out infinite;
        }
        .animate-error-pulse {
          animation: error-pulse 0.5s ease-in-out;
        }
        .animate-wave-motion {
          animation: wave-motion 10s ease-in-out infinite;
        }
        .animate-page-slide-in {
          animation: page-slide-in 0.8s ease-out;
        }
        .animate-error-slide-in {
          animation: error-slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
