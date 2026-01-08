// Display JavaScript - Für das öffentliche Schwarze Brett
// PRASCO 2.0 - Mit PowerPoint-Effekten

// ============================================
// EFFECT RENDERER CLASS - Prasco 2.0
// ============================================

class EffectRenderer {
  constructor() {
    this.activeAnimations = [];
    this.transitionInProgress = false;
    this.performanceProfile = this.detectPerformanceProfile();
    this.supportsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Erkenne Performance-Profil (Raspberry Pi Detection)
  detectPerformanceProfile() {
    const isRaspberryPi = /Raspberry/.test(navigator.userAgent);
    const isSlowDevice = navigator.hardwareConcurrency <= 4;
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

    if (isRaspberryPi || (isSlowDevice && hasLowMemory)) {
      document.body.classList.add('performance-low');
      return 'low';
    } else if (isSlowDevice) {
      document.body.classList.add('performance-medium');
      return 'medium';
    }
    return 'high';
  }

  // Hauptmethode: Führe Transition zwischen zwei Slides aus
  async performTransition(fromElement, toElement, transitionConfig) {
    if (this.transitionInProgress) {
      console.warn('Transition bereits aktiv, überspringe...');
      return;
    }

    this.transitionInProgress = true;

    try {
      // Fallback bei Reduced Motion
      if (this.supportsReducedMotion) {
        await this.instantSwitch(fromElement, toElement);
        return;
      }

      // Optimiere Config für Performance
      const optimizedConfig = this.optimizeConfig(transitionConfig);

      // Führe entsprechende Transition aus
      switch (optimizedConfig.transitionType) {
        case 'fade':
          await this.fadeTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'slide':
          await this.slideTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'zoom':
          await this.zoomTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'wipe':
          await this.wipeTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'push':
          await this.pushTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'cube':
          await this.cubeTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'flip':
          await this.flipTransition(fromElement, toElement, optimizedConfig);
          break;
        case 'morph':
          await this.morphTransition(fromElement, toElement, optimizedConfig);
          break;
        default:
          await this.fadeTransition(fromElement, toElement, optimizedConfig);
      }
    } catch (error) {
      console.error('Fehler bei Transition:', error);
      await this.instantSwitch(fromElement, toElement);
    } finally {
      this.transitionInProgress = false;
    }
  }

  // Optimiere Transition-Config basierend auf Performance
  optimizeConfig(config) {
    const optimized = { ...config };

    if (this.performanceProfile === 'low') {
      optimized.duration = Math.min(optimized.duration || 800, 500);
      // Fallback für komplexe Effekte
      if (['cube', 'flip', 'morph'].includes(optimized.transitionType)) {
        optimized.transitionType = 'fade';
      }
    } else if (this.performanceProfile === 'medium') {
      optimized.duration = Math.min(optimized.duration || 800, 1000);
    }

    return optimized;
  }

  // Instant Switch (ohne Animation)
  async instantSwitch(fromElement, toElement) {
    return new Promise((resolve) => {
      if (fromElement) fromElement.style.display = 'none';
      if (toElement) toElement.style.display = 'block';
      resolve();
    });
  }

  // 1. FADE TRANSITION
  async fadeTransition(fromElement, toElement, config) {
    return new Promise((resolve) => {
      const duration = config.duration || 800;
      const easing = config.easing || 'ease-in-out';

      // Setze CSS-Variablen
      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);
      fromElement.style.setProperty('--duration', `${duration}ms`);
      fromElement.style.setProperty('--easing', easing);

      // Starte Transition
      toElement.classList.add('transition-fade-enter');
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add('transition-fade-enter-active');
        toElement.classList.remove('transition-fade-enter');
        fromElement.classList.add('transition-fade-exit-active');
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove('transition-fade-exit-active');
        toElement.classList.remove('transition-fade-enter-active');
        resolve();
      }, duration);
    });
  }

  // 2. SLIDE TRANSITION
  async slideTransition(fromElement, toElement, config) {
    return new Promise((resolve) => {
      const duration = config.duration || 600;
      const easing = config.easing || 'ease-in-out';
      const direction = config.direction || 'left';

      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);
      fromElement.style.setProperty('--duration', `${duration}ms`);
      fromElement.style.setProperty('--easing', easing);

      toElement.classList.add(`transition-slide-${direction}-enter`);
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add(`transition-slide-${direction}-enter-active`);
        toElement.classList.remove(`transition-slide-${direction}-enter`);
        fromElement.classList.add(`transition-slide-${direction}-exit-active`);
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove(`transition-slide-${direction}-exit-active`);
        toElement.classList.remove(`transition-slide-${direction}-enter-active`);
        resolve();
      }, duration);
    });
  }

  // 3. ZOOM TRANSITION
  async zoomTransition(fromElement, toElement, config) {
    return new Promise((resolve) => {
      const duration = config.duration || 800;
      const easing = config.easing || 'ease-out';
      const direction = config.direction || 'in';

      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);
      fromElement.style.setProperty('--duration', `${duration}ms`);
      fromElement.style.setProperty('--easing', easing);

      toElement.classList.add(`transition-zoom-${direction}-enter`);
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add(`transition-zoom-${direction}-enter-active`);
        toElement.classList.remove(`transition-zoom-${direction}-enter`);
        fromElement.classList.add(`transition-zoom-${direction}-exit-active`);
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove(`transition-zoom-${direction}-exit-active`);
        toElement.classList.remove(`transition-zoom-${direction}-enter-active`);
        resolve();
      }, duration);
    });
  }

  // 4. WIPE TRANSITION
  async wipeTransition(fromElement, toElement, config) {
    return new Promise((resolve) => {
      const duration = config.duration || 700;
      const easing = config.easing || 'ease-in-out';
      const direction = config.direction || 'left';

      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);

      toElement.classList.add(`transition-wipe-${direction}-enter`);
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add(`transition-wipe-${direction}-enter-active`);
        toElement.classList.remove(`transition-wipe-${direction}-enter`);
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        toElement.classList.remove(`transition-wipe-${direction}-enter-active`);
        resolve();
      }, duration);
    });
  }

  // 5. PUSH TRANSITION
  async pushTransition(fromElement, toElement, config) {
    // Push ist ähnlich wie Slide, wird über slide implementiert
    return this.slideTransition(fromElement, toElement, config);
  }

  // 6. CUBE TRANSITION (3D)
  async cubeTransition(fromElement, toElement, config) {
    // Fallback zu Slide auf Low-Performance
    if (this.performanceProfile === 'low') {
      return this.slideTransition(fromElement, toElement, config);
    }

    return new Promise((resolve) => {
      const duration = config.duration || 1000;
      const easing = config.easing || 'ease-in-out';
      const direction = config.direction || 'left';

      // Add 3D container
      const container = fromElement.parentElement;
      container.classList.add('transition-cube-container');

      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);
      fromElement.style.setProperty('--duration', `${duration}ms`);
      fromElement.style.setProperty('--easing', easing);

      toElement.classList.add('transition-cube');
      fromElement.classList.add('transition-cube');
      toElement.classList.add(`transition-cube-${direction}-enter`);
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add(`transition-cube-${direction}-enter-active`);
        toElement.classList.remove(`transition-cube-${direction}-enter`);
        fromElement.classList.add(`transition-cube-${direction}-exit-active`);
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove('transition-cube', `transition-cube-${direction}-exit-active`);
        toElement.classList.remove('transition-cube', `transition-cube-${direction}-enter-active`);
        container.classList.remove('transition-cube-container');
        resolve();
      }, duration);
    });
  }

  // 7. FLIP TRANSITION (3D)
  async flipTransition(fromElement, toElement, config) {
    // Fallback zu Fade auf Low-Performance
    if (this.performanceProfile === 'low') {
      return this.fadeTransition(fromElement, toElement, config);
    }

    return new Promise((resolve) => {
      const duration = config.duration || 900;
      const easing = config.easing || 'ease-in-out';
      const direction = config.direction || 'left';

      const container = fromElement.parentElement;
      container.classList.add('transition-flip-container');

      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);
      fromElement.style.setProperty('--duration', `${duration}ms`);
      fromElement.style.setProperty('--easing', easing);

      toElement.classList.add('transition-flip');
      fromElement.classList.add('transition-flip');
      toElement.classList.add(`transition-flip-${direction}-enter`);
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add(`transition-flip-${direction}-enter-active`);
        toElement.classList.remove(`transition-flip-${direction}-enter`);
        fromElement.classList.add(`transition-flip-${direction}-exit-active`);
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove('transition-flip', `transition-flip-${direction}-exit-active`);
        toElement.classList.remove('transition-flip', `transition-flip-${direction}-enter-active`);
        container.classList.remove('transition-flip-container');
        resolve();
      }, duration);
    });
  }

  // 8. MORPH TRANSITION
  async morphTransition(fromElement, toElement, config) {
    return new Promise((resolve) => {
      const duration = config.duration || 1000;
      const easing = config.easing || 'cubic-bezier(0.4, 0, 0.2, 1)';

      toElement.style.setProperty('--duration', `${duration}ms`);
      toElement.style.setProperty('--easing', easing);
      fromElement.style.setProperty('--duration', `${duration}ms`);
      fromElement.style.setProperty('--easing', easing);

      toElement.classList.add('transition-morph-enter');
      toElement.style.display = 'block';

      requestAnimationFrame(() => {
        toElement.classList.add('transition-morph-enter-active');
        toElement.classList.remove('transition-morph-enter');
        fromElement.classList.add('transition-morph-exit-active');
      });

      setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove('transition-morph-exit-active');
        toElement.classList.remove('transition-morph-enter-active');
        resolve();
      }, duration);
    });
  }
}

// Globale Instanz
const effectRenderer = new EffectRenderer();

// ============================================
// ENDE EFFECT RENDERER
// ============================================

// ============================================
// ANIMATION ENGINE (Element Animations)
// ============================================

class AnimationEngine {
  constructor() {
    this.animations = new Map(); // postId -> animations array
    this.activeAnimations = new Set(); // Currently running animations
    this.timeline = [];
    this.timelineIndex = 0;
    this.isPlaying = false;
    this.performanceProfile = effectRenderer.performanceProfile;
    this.observers = new Map(); // For scroll/visibility triggers
  }

  /**
   * Load animations for a specific post from the API
   */
  async loadAnimations(postId) {
    try {
      const response = await fetch(`/api/animations/post/${postId}`);
      if (!response.ok) {
        console.warn(`No animations found for post ${postId}`);
        return [];
      }

      const animations = await response.json();
      this.animations.set(postId, animations);
      
      console.log(`Loaded ${animations.length} animations for post ${postId}`);
      return animations;
    } catch (error) {
      console.error('Error loading animations:', error);
      return [];
    }
  }

  /**
   * Play all animations for the current post
   */
  async playAnimations(postId, container) {
    const animations = this.animations.get(postId);
    if (!animations || animations.length === 0) {
      return;
    }

    // Reset state
    this.timeline = this.buildTimeline(animations);
    this.timelineIndex = 0;
    this.isPlaying = true;

    console.log(`Playing ${animations.length} animations for post ${postId}`);

    // Setup triggers
    this.setupTriggers(animations, container);

    // Start auto-triggered animations
    await this.playAutoAnimations();
  }

  /**
   * Build timeline from animations sorted by order
   */
  buildTimeline(animations) {
    return animations
      .filter(anim => anim.trigger === 'auto' || anim.trigger === 'sequence')
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Play all auto-triggered animations
   */
  async playAutoAnimations() {
    for (const animation of this.timeline) {
      if (!this.isPlaying) break;

      await this.playAnimation(animation);

      // Wait for delay before next animation (if sequence trigger)
      if (animation.trigger === 'sequence' && animation.delay) {
        await this.wait(animation.delay);
      }
    }
  }

  /**
   * Play a single animation
   */
  async playAnimation(animation) {
    const element = this.findElement(animation.elementSelector);
    if (!element) {
      console.warn(`Element not found: ${animation.elementSelector}`);
      return;
    }

    // Skip if reduced motion is preferred
    if (this.shouldReduceMotion()) {
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      return;
    }

    // Skip heavy effects on low performance
    if (this.performanceProfile === 'low' && this.isHeavyEffect(animation.animationType)) {
      return this.applySimpleAnimation(element, animation);
    }

    // Check if this animation has a motion path
    const motionPath = await motionPathEngine.loadMotionPath(animation.id);

    return new Promise((resolve) => {
      const duration = animation.duration || 1000;
      const delay = animation.delay || 0;
      const easing = animation.easing || 'ease-out';

      // Get CSS class for the animation
      const animationClass = this.getAnimationClass(animation);
      
      // Set CSS variables
      element.style.setProperty('--animation-duration', `${duration}ms`);
      element.style.setProperty('--animation-delay', `${delay}ms`);
      element.style.setProperty('--animation-easing', easing);

      // Make element visible but potentially transparent (for entrance effects)
      if (animation.animationType.startsWith('entrance-')) {
        element.style.visibility = 'visible';
      }

      // Apply motion path if available
      if (motionPath) {
        motionPathEngine.applyMotionPath(element, animation, motionPath);
      }

      // Apply animation class
      element.classList.add(animationClass);
      this.activeAnimations.add(element);

      // Handle animation end
      const onAnimationEnd = () => {
        element.removeEventListener('animationend', onAnimationEnd);
        element.classList.remove(animationClass);
        this.activeAnimations.delete(element);

        // For exit animations, hide the element
        if (animation.animationType.startsWith('exit-')) {
          element.style.display = 'none';
        }

        resolve();
      };

      element.addEventListener('animationend', onAnimationEnd);

      // Fallback timeout in case animationend doesn't fire
      setTimeout(() => {
        if (this.activeAnimations.has(element)) {
          onAnimationEnd();
        }
      }, duration + delay + 100);
    });
  }

  /**
   * Apply simple animation for low-performance devices
   */
  applySimpleAnimation(element, animation) {
    return new Promise((resolve) => {
      const duration = Math.min(animation.duration || 1000, 500); // Max 500ms
      
      element.style.transition = `opacity ${duration}ms ease-out`;
      
      if (animation.animationType.startsWith('entrance-')) {
        element.style.opacity = '0';
        element.style.visibility = 'visible';
        requestAnimationFrame(() => {
          element.style.opacity = '1';
        });
      } else if (animation.animationType.startsWith('exit-')) {
        element.style.opacity = '0';
      }

      setTimeout(() => {
        element.style.transition = '';
        if (animation.animationType.startsWith('exit-')) {
          element.style.display = 'none';
        }
        resolve();
      }, duration);
    });
  }

  /**
   * Get CSS animation class name from animation type
   */
  getAnimationClass(animation) {
    const type = animation.animationType;
    
    // Map animation types to CSS class names
    const classMap = {
      // Entrance
      'entrance-fade-in': 'anim-fade-in',
      'entrance-fade-in-down': 'anim-fade-in-down',
      'entrance-fade-in-up': 'anim-fade-in-up',
      'entrance-fade-in-left': 'anim-fade-in-left',
      'entrance-fade-in-right': 'anim-fade-in-right',
      'entrance-fly-in-down': 'anim-fly-in-down',
      'entrance-fly-in-up': 'anim-fly-in-up',
      'entrance-fly-in-left': 'anim-fly-in-left',
      'entrance-fly-in-right': 'anim-fly-in-right',
      'entrance-zoom-in': 'anim-zoom-in',
      'entrance-zoom-in-down': 'anim-zoom-in-down',
      'entrance-zoom-in-up': 'anim-zoom-in-up',
      'entrance-bounce-in': 'anim-bounce-in',
      'entrance-slide-in-left': 'anim-slide-in-left',
      'entrance-slide-in-right': 'anim-slide-in-right',
      'entrance-slide-in-up': 'anim-slide-in-up',
      'entrance-slide-in-down': 'anim-slide-in-down',
      'entrance-rotate-in': 'anim-rotate-in',
      'entrance-flip-in-x': 'anim-flip-in-x',
      'entrance-flip-in-y': 'anim-flip-in-y',
      'entrance-light-speed-in': 'anim-light-speed-in',
      'entrance-roll-in': 'anim-roll-in',
      'entrance-scale-in': 'anim-scale-in',
      
      // Exit
      'exit-fade-out': 'anim-fade-out',
      'exit-fade-out-down': 'anim-fade-out-down',
      'exit-fade-out-up': 'anim-fade-out-up',
      'exit-fade-out-left': 'anim-fade-out-left',
      'exit-fade-out-right': 'anim-fade-out-right',
      'exit-fly-out-down': 'anim-fly-out-down',
      'exit-fly-out-up': 'anim-fly-out-up',
      'exit-fly-out-left': 'anim-fly-out-left',
      'exit-fly-out-right': 'anim-fly-out-right',
      'exit-zoom-out': 'anim-zoom-out',
      'exit-bounce-out': 'anim-bounce-out',
      'exit-slide-out-left': 'anim-slide-out-left',
      'exit-slide-out-right': 'anim-slide-out-right',
      'exit-slide-out-up': 'anim-slide-out-up',
      'exit-slide-out-down': 'anim-slide-out-down',
      'exit-rotate-out': 'anim-rotate-out',
      'exit-flip-out-x': 'anim-flip-out-x',
      'exit-flip-out-y': 'anim-flip-out-y',
      'exit-roll-out': 'anim-roll-out',
      'exit-scale-out': 'anim-scale-out',
      
      // Emphasis
      'emphasis-pulse': 'anim-pulse',
      'emphasis-bounce': 'anim-bounce',
      'emphasis-shake': 'anim-shake',
      'emphasis-swing': 'anim-swing',
      'emphasis-wobble': 'anim-wobble',
      'emphasis-jello': 'anim-jello',
      'emphasis-heartbeat': 'anim-heartbeat',
      'emphasis-flash': 'anim-flash',
      'emphasis-rubber-band': 'anim-rubber-band',
      'emphasis-tada': 'anim-tada',
      'emphasis-grow': 'anim-grow',
      'emphasis-shrink': 'anim-shrink',
      'emphasis-spin': 'anim-spin',
    };

    return classMap[type] || 'anim-fade-in';
  }

  /**
   * Setup event-based triggers (click, hover, scroll)
   */
  setupTriggers(animations, container) {
    // Cleanup previous observers
    this.cleanupObservers();

    animations.forEach(animation => {
      const element = this.findElement(animation.elementSelector, container);
      if (!element) return;

      switch (animation.trigger) {
        case 'click':
          element.style.cursor = 'pointer';
          element.addEventListener('click', () => this.playAnimation(animation));
          break;

        case 'hover':
          element.addEventListener('mouseenter', () => this.playAnimation(animation));
          break;

        case 'scroll':
          this.setupScrollTrigger(element, animation);
          break;

        case 'visibility':
          this.setupVisibilityTrigger(element, animation);
          break;
      }
    });
  }

  /**
   * Setup scroll-based trigger using Intersection Observer
   */
  setupScrollTrigger(element, animation) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.playAnimation(animation);
            observer.unobserve(element); // Play only once
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Setup visibility trigger
   */
  setupVisibilityTrigger(element, animation) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.playAnimation(animation);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * Find element by selector within container
   */
  findElement(selector, container = document) {
    try {
      return container.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Check if effect is computationally heavy
   */
  isHeavyEffect(type) {
    const heavyEffects = [
      'entrance-flip-in-x',
      'entrance-flip-in-y',
      'exit-flip-out-x',
      'exit-flip-out-y',
      'entrance-rotate-in',
      'exit-rotate-out',
      'entrance-roll-in',
      'exit-roll-out',
    ];
    return heavyEffects.includes(type);
  }

  /**
   * Check if user prefers reduced motion
   */
  shouldReduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Wait helper
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stop all animations
   */
  stop() {
    this.isPlaying = false;
    this.activeAnimations.forEach(element => {
      element.getAnimations().forEach(anim => anim.cancel());
    });
    this.activeAnimations.clear();
  }

  /**
   * Cleanup observers
   */
  cleanupObservers() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Reset animations for a post
   */
  resetAnimations(postId, container) {
    const animations = this.animations.get(postId);
    if (!animations) return;

    animations.forEach(animation => {
      const element = this.findElement(animation.elementSelector, container);
      if (!element) return;

      // Remove animation classes
      element.className = element.className
        .split(' ')
        .filter(cls => !cls.startsWith('anim-'))
        .join(' ');

      // Reset inline styles
      element.style.removeProperty('--animation-duration');
      element.style.removeProperty('--animation-delay');
      element.style.removeProperty('--animation-easing');

      // Reset visibility for entrance animations
      if (animation.animationType.startsWith('entrance-')) {
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
      }
    });
  }

  /**
   * Clear animations cache
   */
  clearCache() {
    this.animations.clear();
    this.cleanupObservers();
    this.stop();
  }
}

// Globale Instanz
const animationEngine = new AnimationEngine();

// ============================================
// ENDE ANIMATION ENGINE
// ============================================

// ============================================
// MOTION PATH ENGINE
// ============================================

class MotionPathEngine {
  constructor() {
    this.motionPaths = new Map(); // animationId -> motionPath data
    this.activeAnimations = new Set(); // Currently running motion animations
    this.performanceProfile = effectRenderer.performanceProfile;
  }

  /**
   * Load motion path for an animation
   */
  async loadMotionPath(animationId) {
    try {
      const response = await fetch(`/api/motion-paths/animation/${animationId}`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.motionPath) {
        this.motionPaths.set(animationId, data.motionPath);
        return data.motionPath;
      }
    } catch (error) {
      console.error('Error loading motion path:', error);
    }
    return null;
  }

  /**
   * Apply motion path to an element
   */
  async applyMotionPath(element, animation, motionPath) {
    if (!element || !motionPath) return;

    // Skip on low performance
    if (this.performanceProfile === 'low') {
      return;
    }

    // Skip if reduced motion is preferred
    if (this.shouldReduceMotion()) {
      return;
    }

    // Parse pathData
    const pathData = this.parsePathData(motionPath.pathData);
    if (!pathData || !pathData.svgPath) {
      console.warn('Invalid path data');
      return;
    }

    // Set CSS custom properties
    const duration = animation.duration || 1000;
    const delay = animation.delay || 0;
    const easing = animation.easing || 'ease-out';

    element.style.setProperty('--motion-path', `path("${pathData.svgPath}")`);
    element.style.setProperty('--animation-duration', `${duration}ms`);
    element.style.setProperty('--animation-delay', `${delay}ms`);
    element.style.setProperty('--animation-easing', easing);

    // Set offset-rotate based on autoOrient
    if (motionPath.autoOrient) {
      const rotateValue = motionPath.orientAngle === 0 
        ? 'auto' 
        : `auto ${motionPath.orientAngle}deg`;
      element.style.setProperty('--motion-rotate', rotateValue);
    } else {
      element.style.setProperty('--motion-rotate', `${motionPath.orientAngle}deg`);
    }

    // Set anchor point
    const anchorClass = this.getAnchorClass(motionPath.anchorPoint);
    element.classList.add(anchorClass);

    // Apply base motion path class
    element.classList.add('motion-path-animation');
    element.classList.add('motion-forward'); // Default animation

    this.activeAnimations.add(element);

    // Wait for animation to complete
    return new Promise((resolve) => {
      const onAnimationEnd = () => {
        element.removeEventListener('animationend', onAnimationEnd);
        this.activeAnimations.delete(element);
        resolve();
      };

      element.addEventListener('animationend', onAnimationEnd);

      // Fallback timeout
      setTimeout(() => {
        if (this.activeAnimations.has(element)) {
          onAnimationEnd();
        }
      }, duration + delay + 100);
    });
  }

  /**
   * Parse pathData JSON string
   */
  parsePathData(pathDataString) {
    try {
      return JSON.parse(pathDataString);
    } catch (error) {
      console.error('Failed to parse pathData:', error);
      return null;
    }
  }

  /**
   * Get CSS anchor class from anchorPoint
   */
  getAnchorClass(anchorPoint) {
    const classMap = {
      'center': 'motion-anchor-center',
      'top-left': 'motion-anchor-top-left',
      'top-right': 'motion-anchor-top-right',
      'bottom-left': 'motion-anchor-bottom-left',
      'bottom-right': 'motion-anchor-bottom-right',
      'top': 'motion-anchor-top',
      'bottom': 'motion-anchor-bottom',
      'left': 'motion-anchor-left',
      'right': 'motion-anchor-right',
    };
    return classMap[anchorPoint] || 'motion-anchor-center';
  }

  /**
   * Create SVG path visualization (for debugging/preview)
   */
  createPathVisualization(pathData, container) {
    const { svgPath, viewBox } = pathData;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    svg.style.opacity = '0.3';

    if (viewBox) {
      svg.setAttribute('viewBox', `0 0 ${viewBox.width} ${viewBox.height}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', svgPath);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#3498db');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '5,5');

    svg.appendChild(path);
    container.appendChild(svg);

    return svg;
  }

  /**
   * Check if browser supports CSS Motion Path
   */
  supportsMotionPath() {
    const testElement = document.createElement('div');
    return 'offsetPath' in testElement.style || 
           'offset-path' in testElement.style ||
           CSS.supports('offset-path', 'path("M 0 0")');
  }

  /**
   * Check if user prefers reduced motion
   */
  shouldReduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Stop all active motion animations
   */
  stop() {
    this.activeAnimations.forEach(element => {
      element.classList.remove('motion-path-animation');
      element.classList.remove('motion-forward');
      element.classList.remove('motion-backward');
      element.classList.remove('motion-loop');
      
      // Remove anchor classes
      element.classList.remove('motion-anchor-center');
      element.classList.remove('motion-anchor-top-left');
      element.classList.remove('motion-anchor-top-right');
      element.classList.remove('motion-anchor-bottom-left');
      element.classList.remove('motion-anchor-bottom-right');
      element.classList.remove('motion-anchor-top');
      element.classList.remove('motion-anchor-bottom');
      element.classList.remove('motion-anchor-left');
      element.classList.remove('motion-anchor-right');

      // Clear CSS properties
      element.style.removeProperty('--motion-path');
      element.style.removeProperty('--motion-distance');
      element.style.removeProperty('--motion-rotate');
      element.style.removeProperty('--motion-anchor');
    });
    this.activeAnimations.clear();
  }

  /**
   * Cleanup
   */
  clearCache() {
    this.motionPaths.clear();
    this.stop();
  }

  /**
   * Get predefined path templates (for testing/development)
   */
  async loadPathTemplates() {
    try {
      const response = await fetch('/api/motion-paths/templates?width=300&height=300');
      if (response.ok) {
        const data = await response.json();
        return data.templates || [];
      }
    } catch (error) {
      console.error('Error loading path templates:', error);
    }
    return [];
  }
}

// Globale Instanz
const motionPathEngine = new MotionPathEngine();

// ============================================
// ENDE MOTION PATH ENGINE
// ============================================

let posts = [];
let currentIndex = 0;
let autoRotateTimer = null;

// Display-Einstellungen (werden vom Backend geladen)
let displaySettings = {
  refreshInterval: 5, // Standard: 5 Minuten
  defaultDuration: 10, // Standard: 10 Sekunden
};

// Vortragsmodus State (manuelle Navigation)
let presentationModeState = {
  isActive: false,
  isPaused: false,
};

// PowerPoint Präsentations-State
let presentationState = {
  isActive: false,
  slides: [],
  currentSlide: 0,
  slideTimer: null,
};

// Text-Pagination State (für lange Texte)
let textPaginationState = {
  isActive: false,
  pages: [],
  currentPage: 0,
  postId: null,
};

// Hintergrundmusik-State
let backgroundMusicState = {
  audio: null,
  currentPostId: null,
  fadeInterval: null,
  isGlobalMusic: false,
  userInteracted: false, // Track ob Benutzer interagiert hat (für Autoplay-Policy)
};

// Globale Musik-Einstellungen
let globalMusicSettings = {
  enabled: false,
  url: '',
  volume: 30,
  muteVideos: true,
};

// ============================================
// Display-Einstellungen laden
// ============================================

// Lade Display-Einstellungen vom Backend
async function loadDisplaySettings() {
  try {
    const response = await fetch('/api/settings?category=display');
    if (response.ok) {
      const settings = await response.json();
      
      console.log('Raw settings from API:', settings);
      
      // Aktualisiere Einstellungen - API gibt Keys als Objekt-Properties zurück
      if (settings['display.refreshInterval'] !== undefined) {
        displaySettings.refreshInterval = parseInt(settings['display.refreshInterval']) || 5;
      }
      if (settings['display.defaultDuration'] !== undefined) {
        displaySettings.defaultDuration = parseInt(settings['display.defaultDuration']) || 10;
      }
      
      console.log('Display-Einstellungen geladen:', displaySettings);
      
      // Aktualisiere Fußzeile
      updateRefreshInfo();
      
      return true;
    } else {
      console.log('Verwende Standard-Einstellungen (Backend nicht verfügbar)');
      return false;
    }
  } catch (error) {
    console.log('Fehler beim Laden der Display-Einstellungen:', error);
    console.log('Verwende Standard-Einstellungen');
    return false;
  }
}

// Aktualisiere Refresh-Info in der Fußzeile
function updateRefreshInfo() {
  const refreshElement = document.getElementById('auto-refresh-info');
  if (refreshElement) {
    refreshElement.textContent = `Auto-Refresh: ${displaySettings.refreshInterval} Min`;
  }
}

// ============================================
// Hintergrundmusik Funktionen
// ============================================

// Lade globale Musik-Einstellungen aus LocalStorage
function loadGlobalMusicSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('globalMusicSettings') || '{}');
    globalMusicSettings = {
      enabled: saved.enabled || false,
      url: saved.url || '',
      volume: saved.volume || 30,
      muteVideos: saved.muteVideos !== false,
    };
  } catch (e) {
    console.log('Fehler beim Laden der globalen Musik-Einstellungen:', e);
  }
}

// Initialisiere Hintergrundmusik-Audio-Element
function initBackgroundMusic() {
  if (!backgroundMusicState.audio) {
    backgroundMusicState.audio = new Audio();
    backgroundMusicState.audio.loop = true;
    backgroundMusicState.audio.preload = 'auto';
  }
}

// Spiele Hintergrundmusik ab (mit Fade-In) - unterstützt globale und Post-spezifische Musik
function playBackgroundMusic(post) {
  initBackgroundMusic();
  loadGlobalMusicSettings();

  const audio = backgroundMusicState.audio;

  // Priorisierung: Globale Musik > Post-spezifische Musik
  let musicUrl = null;
  let volume = 0.5;
  let isGlobal = false;

  // Globale Musik hat Vorrang wenn aktiviert
  if (globalMusicSettings.enabled && globalMusicSettings.url) {
    musicUrl = globalMusicSettings.url;
    volume = globalMusicSettings.volume / 100;
    isGlobal = true;
  } else {
    // Fallback auf Post-spezifische Musik
    musicUrl = post.backgroundMusicUrl || post.background_music_url;
    volume = (post.backgroundMusicVolume || post.background_music_volume || 50) / 100;

    // Keine Post-Musik für Video-Content (nur wenn keine globale Musik)
    const contentType = post.contentType || post.content_type;
    if (contentType === 'video' && !musicUrl) {
      // Stoppe nur wenn es keine globale Musik gibt
      if (!backgroundMusicState.isGlobalMusic) {
        stopBackgroundMusic();
      }
      return;
    }
  }

  // Keine Musik verfügbar
  if (!musicUrl) {
    stopBackgroundMusic();
    return;
  }

  // Gleiche Musik läuft bereits - vergleiche URLs korrekt (relativ vs. absolut)
  const currentMusicUrl = audio.src ? new URL(audio.src).pathname : '';
  const newMusicPath = musicUrl.startsWith('http') ? new URL(musicUrl).pathname : musicUrl;
  
  if (currentMusicUrl && currentMusicUrl === newMusicPath && !audio.paused) {
    // Musik läuft bereits, nur Lautstärke anpassen falls nötig
    if (Math.abs(audio.volume - volume) > 0.01) {
      audio.volume = volume;
    }
    backgroundMusicState.isGlobalMusic = isGlobal;
    backgroundMusicState.currentPostId = post.id;
    return;
  }

  // Stoppe aktuelle Musik mit Fade-Out, dann starte neue
  if (!audio.paused && currentMusicUrl !== newMusicPath) {
    fadeOutMusic(() => {
      startNewMusic(musicUrl, volume);
      backgroundMusicState.isGlobalMusic = isGlobal;
    });
  } else {
    startNewMusic(musicUrl, volume);
    backgroundMusicState.isGlobalMusic = isGlobal;
  }

  backgroundMusicState.currentPostId = post.id;
}

// Starte neue Musik mit Fade-In
function startNewMusic(url, targetVolume) {
  const audio = backgroundMusicState.audio;

  audio.src = url;
  audio.volume = 0;

  audio
    .play()
    .then(() => {
      backgroundMusicState.userInteracted = true;
      fadeInMusic(targetVolume);
    })
    .catch((err) => {
      // Autoplay blockiert - warte auf Benutzerinteraktion
      if (err.name === 'NotAllowedError') {
        console.log('Hintergrundmusik wartet auf Benutzerinteraktion...');
        // Versuche es später bei der ersten Interaktion erneut
      } else {
        console.log('Hintergrundmusik konnte nicht gestartet werden:', err.message);
      }
    });
}

// Fade-In Effekt
function fadeInMusic(targetVolume) {
  const audio = backgroundMusicState.audio;
  clearInterval(backgroundMusicState.fadeInterval);

  let currentVolume = 0;
  const step = targetVolume / 20; // 20 Schritte für Fade

  backgroundMusicState.fadeInterval = setInterval(() => {
    currentVolume += step;
    if (currentVolume >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(backgroundMusicState.fadeInterval);
    } else {
      audio.volume = currentVolume;
    }
  }, 50); // 50ms * 20 = 1 Sekunde Fade
}

// Fade-Out Effekt
function fadeOutMusic(callback) {
  const audio = backgroundMusicState.audio;
  clearInterval(backgroundMusicState.fadeInterval);

  if (audio.paused || audio.volume === 0) {
    if (callback) callback();
    return;
  }

  const startVolume = audio.volume;
  const step = startVolume / 20;

  backgroundMusicState.fadeInterval = setInterval(() => {
    const newVolume = audio.volume - step;
    if (newVolume <= 0) {
      audio.volume = 0;
      audio.pause();
      clearInterval(backgroundMusicState.fadeInterval);
      if (callback) callback();
    } else {
      audio.volume = newVolume;
    }
  }, 50);
}

// Stoppe Hintergrundmusik (mit Fade-Out)
function stopBackgroundMusic() {
  // Bei globaler Musik nicht stoppen
  if (backgroundMusicState.isGlobalMusic && globalMusicSettings.enabled) {
    return;
  }

  fadeOutMusic(() => {
    if (backgroundMusicState.audio) {
      backgroundMusicState.audio.src = '';
    }
    backgroundMusicState.currentPostId = null;
    backgroundMusicState.isGlobalMusic = false;
  });

  // Entferne Indikator
  removeGlobalMusicIndicator();
}

// Zeige/Aktualisiere globalen Musik-Indikator
function updateGlobalMusicIndicator() {
  loadGlobalMusicSettings();

  let indicator = document.getElementById('global-music-indicator');

  if (
    globalMusicSettings.enabled &&
    globalMusicSettings.url &&
    backgroundMusicState.isGlobalMusic
  ) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'global-music-indicator';
      indicator.className = 'global-music-indicator';
      indicator.innerHTML = '<span class="music-icon">♪</span> <span>Hintergrundmusik</span>';
      document.body.appendChild(indicator);
    }
  } else {
    removeGlobalMusicIndicator();
  }
}

// Entferne globalen Musik-Indikator
function removeGlobalMusicIndicator() {
  const indicator = document.getElementById('global-music-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ============================================
// Video Vollbild Funktionen
// ============================================

// Versuche Video-Element in Vollbild zu setzen
function tryEnterFullscreen(element) {
  // Versuche verschiedene Vollbild-APIs
  if (element.requestFullscreen) {
    element.requestFullscreen().catch((err) => {
      console.log('Vollbild nicht möglich:', err.message);
    });
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitEnterFullscreen) {
    // iOS Safari
    element.webkitEnterFullscreen();
  }
}

// Stelle Header/Footer wieder her wenn Video endet oder Post wechselt
function restoreHeaderFooter() {
  const header = document.querySelector('.display-header');
  const footer = document.querySelector('.display-footer');
  if (header) header.classList.remove('hidden-for-video');
  if (footer) footer.classList.remove('hidden-for-video');

  // Beende Vollbild wenn aktiv
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

// ============================================
// Mock Data & Initialisierung
// ============================================

// Beispiel-Daten (werden später durch echte API ersetzt)
const mockPosts = [
  {
    id: 1,
    title: 'Willkommen zum digitalen Schwarzen Brett',
    content: 'Hier werden wichtige Informationen, Ankündigungen und Neuigkeiten angezeigt.',
    content_type: 'text',
    media_url: null,
    display_duration: 10,
    priority: 10,
    is_active: true,
  },
  {
    id: 2,
    title: 'Team-Meeting',
    content: 'Nächstes Team-Meeting am Montag um 10:00 Uhr im Konferenzraum A',
    content_type: 'text',
    media_url: null,
    display_duration: 8,
    priority: 5,
    is_active: true,
  },
  {
    id: 3,
    title: 'Wichtige Ankündigung',
    content: 'Die Kantine ist heute bis 14:00 Uhr geschlossen. Bitte planen Sie entsprechend.',
    content_type: 'text',
    media_url: null,
    display_duration: 12,
    priority: 8,
    is_active: true,
  },
];

// Prüfe ob Vortragsmodus aktiviert wurde (via URL-Parameter)
function checkPresentationMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  if (mode === 'presentation') {
    presentationModeState.isActive = true;
    presentationModeState.isPaused = true;
    document.body.classList.add('presentation-mode');
    createPresentationControls();
    console.log('🎤 Vortragsmodus aktiviert - Manuelle Navigation');
  }
}

// Erstelle Navigations-Controls für Vortragsmodus
function createPresentationControls() {
  const controlsHtml = `
    <div class="presentation-controls" id="presentation-controls">
      <button class="pres-btn pres-prev" id="pres-prev" title="Vorheriger Beitrag (←)">
        ◀
      </button>
      <div class="pres-info">
        <span class="pres-mode-label">VORTRAGSMODUS</span>
        <span class="pres-counter" id="pres-counter">1 / 1</span>
      </div>
      <button class="pres-btn pres-next" id="pres-next" title="Nächster Beitrag (→)">
        ▶
      </button>
      <button class="pres-btn pres-toggle" id="pres-toggle" title="Auto-Rotation umschalten">
        ▷
      </button>
      <button class="pres-btn pres-exit" id="pres-exit" title="Vortragsmodus beenden">
        ✕
      </button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', controlsHtml);
  
  // Event-Listener für Buttons (nach DOM-Insert)
  setTimeout(() => {
    const prevBtn = document.getElementById('pres-prev');
    const nextBtn = document.getElementById('pres-next');
    const toggleBtn = document.getElementById('pres-toggle');
    const exitBtn = document.getElementById('pres-exit');
    
    if (prevBtn) prevBtn.addEventListener('click', () => previousPost());
    if (nextBtn) nextBtn.addEventListener('click', () => nextPost());
    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleAutoRotation());
    if (exitBtn) exitBtn.addEventListener('click', () => exitPresentationMode());
  }, 0);
  
  // Auto-Hide nach 3 Sekunden Inaktivität
  let hideTimeout;
  const controls = document.getElementById('presentation-controls');
  
  function showControls() {
    controls.classList.add('visible');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      controls.classList.remove('visible');
    }, 3000);
  }
  
  // Zeige Controls bei Mausbewegung
  document.addEventListener('mousemove', showControls);
  
  // Initial anzeigen
  showControls();
}

// Toggle Auto-Rotation im Vortragsmodus
function toggleAutoRotation() {
  const toggleBtn = document.getElementById('pres-toggle');

  if (presentationModeState.isPaused) {
    // Starte Auto-Rotation
    presentationModeState.isPaused = false;
    if (toggleBtn) {
      toggleBtn.textContent = '⏸';
      toggleBtn.title = 'Auto-Rotation pausieren';
    }
    // Starte Timer für aktuellen Post
    const post = posts[currentIndex];
    const duration = (post?.display_duration || 10) * 1000;
    autoRotateTimer = setTimeout(() => nextPost(), duration);
  } else {
    // Pausiere Auto-Rotation
    presentationModeState.isPaused = true;
    clearTimeout(autoRotateTimer);
    if (toggleBtn) {
      toggleBtn.textContent = '▷';
      toggleBtn.title = 'Auto-Rotation starten';
    }
  }
}

// Vortragsmodus beenden
function exitPresentationMode() {
  // Entferne URL-Parameter und lade neu als normales Display
  window.location.href = '/public/display.html';
}

// Update Vortragsmodus-Counter
function updatePresentationCounter() {
  const counter = document.getElementById('pres-counter');
  if (counter && posts.length > 0) {
    counter.textContent = `${currentIndex + 1} / ${posts.length}`;
  }
}

// Initialisierung
async function init() {
  // Prüfe Vortragsmodus vor dem Laden
  checkPresentationMode();

  await fetchPosts();
  startClock();
  updateDate();
  
  // Aktualisiere Refresh-Info nachdem DOM geladen ist
  updateRefreshInfo();

  if (posts.length > 0) {
    displayCurrentPost();
    updatePostCounter();
    updatePresentationCounter();
  } else {
    showNoContent();
  }

  // Auto-Refresh für neue Posts aus API (alle 60 Sekunden)
  // Nur Posts-Liste aktualisieren, NICHT den aktuellen Post neu anzeigen
  setInterval(async () => {
    const oldPostIds = posts.map((p) => p.id).join(',');
    await fetchPosts();
    const newPostIds = posts.map((p) => p.id).join(',');

    // Nur wenn sich die Post-Liste geändert hat
    if (oldPostIds !== newPostIds) {
      // Stelle sicher, dass currentIndex gültig bleibt
      if (currentIndex >= posts.length) {
        currentIndex = 0;
      }
      updatePostCounter();
    }
  }, 60000); // Alle 60 Sekunden statt 10
}

// Posts von API abrufen
async function fetchPosts() {
  try {
    // Versuche zuerst die API
    const response = await fetch('/api/public/posts');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        // Normalisiere API-Daten (camelCase -> snake_case für Kompatibilität)
        posts = data.data.map((post) => {
          // Medien-URL aus verschiedenen Quellen ermitteln
          let mediaUrl = post.media?.url || post.media_url || null;

          // Bei Video/Bild-Posts: Falls keine Media-URL, prüfe ob content eine URL ist
          if (!mediaUrl && ['video', 'image'].includes(post.contentType || post.content_type)) {
            const content = post.content || '';
            // Prüfe ob Content eine URL ist oder eine YouTube/Vimeo-URL enthält
            if (content.startsWith('http') || content.startsWith('/uploads/')) {
              mediaUrl = content;
            } else {
              // Suche nach YouTube/Vimeo-URLs im Content
              const urlMatch = content.match(
                /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)[^\s]+)/i
              );
              if (urlMatch) {
                mediaUrl = urlMatch[1];
              }
            }
          }

          return {
            ...post,
            content_type: post.contentType || post.content_type,
            display_duration: post.duration || post.display_duration || 10,
            media_url: mediaUrl,
            category_id: post.category?.id || post.categoryId || post.category_id,
            is_active: post.isActive !== false && post.is_active !== false,
          };
        });
        posts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return;
      }
    }
  } catch (apiError) {
    // API nicht erreichbar, versuche LocalStorage
  }

  try {
    // Fallback: Lade Posts aus LocalStorage (von Admin-Panel)
    const storedPosts = localStorage.getItem('posts');
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
        posts = parsedPosts.filter((post) => post.is_active);
        posts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return;
      } catch (e) {
        console.error('Fehler beim Parsen der Posts aus LocalStorage:', e);
      }
    }

    // Fallback: Verwende Mock-Daten wenn kein LocalStorage
    posts = mockPosts.filter((post) => post.is_active);
    posts.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error('Fehler beim Laden der Posts:', error);
    posts = mockPosts;
  }
}

// ============================================
// Text-Pagination Funktionen
// ============================================

// Teilt langen Text in mehrere Seiten auf
function splitTextIntoPages(text, maxCharsPerPage) {
  const pages = [];
  const paragraphs = text.split('\n\n');
  let currentPage = '';
  
  for (const paragraph of paragraphs) {
    // Wenn aktueller Absatz + neuer Absatz zu lang ist
    if ((currentPage + paragraph).length > maxCharsPerPage && currentPage.length > 0) {
      pages.push(currentPage.trim());
      currentPage = paragraph + '\n\n';
    } else {
      currentPage += paragraph + '\n\n';
    }
  }
  
  // Letzte Seite hinzufügen
  if (currentPage.trim().length > 0) {
    pages.push(currentPage.trim());
  }
  
  return pages;
}

// Rendert eine Text-Seite mit Seitenzähler
function renderTextPage(pageText, pageIndex, totalPages, showTitle = false, title = '') {
  return `
    <div style="display: flex; flex-direction: column; height: 100%; padding: 40px;">
      ${showTitle && pageIndex === 0 ? `<h1 style="margin-bottom: 20px;">${escapeHtml(title)}</h1>` : ''}
      <div style="flex: 1; overflow: hidden;">
        <p style="font-size: 1.5rem; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(pageText)}</p>
      </div>
      ${totalPages > 1 ? `
        <div style="text-align: center; padding: 20px; font-size: 1.2rem; color: #666;">
          Seite ${pageIndex + 1} von ${totalPages}
        </div>
      ` : ''}
    </div>
  `;
}

// Aktuellen Post anzeigen
function displayCurrentPost() {
  if (posts.length === 0) {
    showNoContent();
    return;
  }

  // Stoppe laufende Präsentations-Slideshow
  if (presentationState.slideTimer) {
    clearInterval(presentationState.slideTimer);
    presentationState.slideTimer = null;
  }
  presentationState.isActive = false;
  presentationState.currentSlide = 0;

  // Stoppe Text-Pagination
  textPaginationState.isActive = false;
  textPaginationState.pages = [];
  textPaginationState.currentPage = 0;

  const post = posts[currentIndex];
  const container = document.getElementById('current-post');

  // Update Header-Kategorie
  updateHeaderCategory(post.category_id);

  // Entferne alte Klassen
  container.className = 'post';

  // Füge Content-Type Klasse hinzu
  container.classList.add(`type-${post.content_type}`);

  // Render basierend auf Content-Type
  let html = '';

  switch (post.content_type) {
    case 'text':
      // Prüfe ob Text zu lang ist und pagination nötig ist
      const textContent = post.content || '';
      const maxCharsPerPage = 1500; // Ungefähr für Full-HD Display
      
      if (textContent.length > maxCharsPerPage) {
        // Teile Text in Seiten auf
        textPaginationState.pages = splitTextIntoPages(textContent, maxCharsPerPage);
        textPaginationState.isActive = true;
        textPaginationState.postId = post.id;
        textPaginationState.currentPage = 0;
        
        html = renderTextPage(textPaginationState.pages[0], 0, textPaginationState.pages.length, post.show_title, post.title);
      } else {
        html = `
          ${post.show_title ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
          <p>${escapeHtml(textContent)}</p>
        `;
      }
      break;

    case 'image':
      // Titel wird nur angezeigt wenn showTitle aktiviert ist
      html = `
                ${post.show_title ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                ${post.media_url ? `<img src="${escapeHtml(post.media_url)}" alt="${escapeHtml(post.title)}">` : ''}
                ${post.content ? `<p>${escapeHtml(post.content)}</p>` : ''}
            `;
      break;

    case 'video':
      let videoHtml = '';

      // Prüfe ob Video stumm geschaltet werden soll (globale Musik aktiv)
      loadGlobalMusicSettings();
      const shouldMuteVideo =
        globalMusicSettings.enabled && globalMusicSettings.muteVideos && globalMusicSettings.url;
      const muteParam = shouldMuteVideo ? '1' : '0';

      if (post.media_url) {
        // Prüfe ob YouTube URL - erweiterte Regex für alle Formate
        const youtubeMatch = post.media_url.match(
          /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
        );

        if (youtubeMatch) {
          const videoId = youtubeMatch[1];
          // YouTube iframe - mute abhängig von globaler Musik
          videoHtml = `<div class="video-fullscreen-container" data-video-id="${videoId}" data-unmute="${!shouldMuteVideo}">
            <iframe 
              id="youtube-player"
              src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muteParam}&loop=1&playlist=${videoId}&controls=1&rel=0&playsinline=1&enablejsapi=1&modestbranding=1&iv_load_policy=3&fs=1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; autoplay" 
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen>
            </iframe>
            ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
            <div class="video-error-fallback" style="display:none;">
              <p>Video kann nicht eingebettet werden.</p>
              <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">Auf YouTube ansehen</a>
            </div>
          </div>`;
        }
        // Prüfe ob Vimeo URL
        else if (post.media_url.includes('vimeo.com')) {
          const vimeoMatch = post.media_url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
          if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            videoHtml = `<div class="video-fullscreen-container">
              <iframe 
                src="https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=${muteParam}&controls=1" 
                frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen>
              </iframe>
              ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
            </div>`;
          }
        }
        // Ansonsten normales HTML5 Video
        else {
          videoHtml = `<div class="video-fullscreen-container">
            <video 
              id="fullscreen-video"
              src="${escapeHtml(post.media_url)}" 
              autoplay 
              loop 
              playsinline
              ${shouldMuteVideo ? 'muted' : ''}>
            </video>
            ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
          </div>`;
        }
      }
      // Video Vollbild - ohne Titel und Text
      html = videoHtml;

      // Verstecke Header für Video-Vollbild
      setTimeout(() => {
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
        if (header) header.classList.add('hidden-for-video');
        if (footer) footer.classList.add('hidden-for-video');

        // HTML5 Video: Versuche nativen Vollbildmodus
        const video = document.getElementById('fullscreen-video');
        if (video) {
          video.addEventListener('loadeddata', () => {
            tryEnterFullscreen(video);
          });
          // Falls Video schon geladen
          if (video.readyState >= 2) {
            tryEnterFullscreen(video);
          }
        }
      }, 100);
      break;

    case 'html':
      html = `${post.show_title ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                
                <div>${post.content || ''}</div>
            `;
      break;

    case 'presentation':
      // PowerPoint Präsentation anzeigen
      html = renderPresentation(post);
      break;

    default:
      html = `${post.show_title ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                
                <p>${escapeHtml(post.content || '')}</p>
            `;
  }

  container.innerHTML = html;

  // Update Post Counter
  document.getElementById('post-counter').textContent = `${currentIndex + 1} / ${posts.length}`;

  // Hintergrundmusik starten/stoppen (auch bei Videos wenn globale Musik aktiv)
  playBackgroundMusic(post);

  // Zeige globale Musik-Indikator wenn aktiv
  updateGlobalMusicIndicator();

  // Animation
  container.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = 'fadeIn 0.8s ease';
  }, 10);

  // ============================================
  // ELEMENT ANIMATIONS ABSPIELEN
  // ============================================
  // Lade und spiele Element-Animationen ab (wenn vorhanden)
  (async () => {
    try {
      const animations = await animationEngine.loadAnimations(post.id);
      if (animations && animations.length > 0) {
        // Kleine Verzögerung damit Container-Animation fertig ist
        setTimeout(() => {
          animationEngine.playAnimations(post.id, container);
        }, 500);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Element-Animationen:', error);
    }
  })();

  // Nächster Post nach Duration (nicht im Vortragsmodus wenn pausiert)
  clearTimeout(autoRotateTimer);

  if (!presentationModeState.isActive || !presentationModeState.isPaused) {
    const duration = (post.display_duration || 10) * 1000;
    autoRotateTimer = setTimeout(() => {
      // Prüfe ob Text-Pagination aktiv ist und noch Seiten übrig sind
      if (textPaginationState.isActive && textPaginationState.currentPage < textPaginationState.pages.length - 1) {
        showNextTextPage();
      } else {
        nextPost();
      }
    }, duration);
  }

  // Update Vortragsmodus-Counter
  updatePresentationCounter();
}

// Zeige nächste Text-Seite
function showNextTextPage() {
  if (!textPaginationState.isActive) return;
  
  textPaginationState.currentPage++;
  const container = document.getElementById('current-post');
  const currentPost = posts[currentIndex];
  const html = renderTextPage(
    textPaginationState.pages[textPaginationState.currentPage],
    textPaginationState.currentPage,
    textPaginationState.pages.length,
    currentPost.show_title,
    currentPost.title
  );
  
  container.innerHTML = html;
  
  // Animation
  container.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = 'fadeIn 0.8s ease';
  }, 10);
  
  // Nächste Seite oder Post nach Duration
  clearTimeout(autoRotateTimer);
  const duration = (currentPost.display_duration || 10) * 1000;
  
  autoRotateTimer = setTimeout(() => {
    if (textPaginationState.currentPage < textPaginationState.pages.length - 1) {
      showNextTextPage();
    } else {
      nextPost();
    }
  }, duration);
}

// Nächster Post
function nextPost() {
  // Stoppe aktive Animationen und cleanup
  animationEngine.stop();
  motionPathEngine.stop(); // Stop motion path animations
  
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  currentIndex = (currentIndex + 1) % posts.length;
  displayCurrentPost();
  updatePostCounter();
  updatePresentationCounter();
}

// Vorheriger Post
function previousPost() {
  // Stoppe aktive Animationen und cleanup
  animationEngine.stop();
  motionPathEngine.stop(); // Stop motion path animations
  
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  currentIndex = (currentIndex - 1 + posts.length) % posts.length;
  displayCurrentPost();
  updatePostCounter();
  updatePresentationCounter();
}

// Post-Counter aktualisieren
function updatePostCounter() {
  const counterElement = document.getElementById('post-counter');
  if (counterElement && posts.length > 0) {
    counterElement.textContent = `${currentIndex + 1} / ${posts.length}`;
  }
}

// Keine Inhalte verfügbar
function showNoContent() {
  const container = document.getElementById('current-post');
  container.innerHTML = `
        <div class="loading">
            <h1>Keine Inhalte verfügbar</h1>
            <p>Bitte fügen Sie Beiträge im Admin-Bereich hinzu.</p>
        </div>
    `;
}

// Uhr aktualisieren
function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const clockElement = document.getElementById('clock');
  if (clockElement) {
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
}

// Datum aktualisieren
function updateDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  // Sprache aus localStorage oder Standard 'de-DE'
  const savedLang = localStorage.getItem('appLanguage') || 'de';
  const localeMap = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
  };
  const locale = localeMap[savedLang] || 'de-DE';

  const dateElement = document.getElementById('date');
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString(locale, options);
  }
}

// Automatisches Refresh (dynamisch basierend auf Einstellungen)
function startAutoRefresh() {
  const refreshMs = displaySettings.refreshInterval * 60 * 1000;
  console.log(`Auto-Refresh gestartet: alle ${displaySettings.refreshInterval} Minuten`);
  
  setInterval(
    async () => {
      console.log('Auto-Refresh: Posts werden neu geladen...');
      const oldLength = posts.length;
      await fetchPosts();

      if (posts.length !== oldLength || currentIndex >= posts.length) {
        currentIndex = 0;
        displayCurrentPost();
      }
    },
    refreshMs
  );
}

// PowerPoint Präsentation rendern
function renderPresentation(post) {
  const presentation = post.presentation;

  // Wenn Slides generiert wurden, zeige diese als Slideshow
  if (presentation?.slides && presentation.slides.length > 0) {
    // Initialisiere Presentation State
    presentationState.isActive = true;
    presentationState.slides = presentation.slides;
    presentationState.currentSlide = 0;

    // Starte Slide-Rotation
    startSlideRotation(post.duration || 10);

    return renderSlideshow(post, presentation.slides, 0);
  }

  // Wenn wir eine PPTX-Datei haben aber keine Slides (LibreOffice nicht verfügbar)
  if (presentation?.presentationId) {
    return `
      <div style="height: 100%; display: flex; flex-direction: column;">
        <h1 style="text-align: center; padding: 20px; margin: 0;">${escapeHtml(post.title)}</h1>
        <div style="flex: 1; position: relative; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; overflow: hidden; margin: 20px;">
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 40px; text-align: center; color: #fff;">
            <div style="font-size: 100px; margin-bottom: 30px;">📊</div>
            <h2 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">PowerPoint Präsentation</h2>
            <p style="font-size: 28px; opacity: 0.9; margin-bottom: 30px;">${escapeHtml(presentation?.originalName || 'Präsentation')}</p>
            <div style="background: rgba(255,255,255,0.15); padding: 25px 40px; border-radius: 15px; backdrop-filter: blur(10px);">
              <p style="font-size: 20px; margin: 0; line-height: 1.6;">
                ⚠️ Slides werden generiert...<br/>
                LibreOffice wird für die automatische Konvertierung benötigt.
              </p>
            </div>
            ${post.content ? `<p style="font-size: 22px; margin-top: 30px; opacity: 0.9;">${escapeHtml(post.content)}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Fallback wenn keine Präsentation
  return `
    <div style="text-align: center; padding: 60px;">
      <div style="font-size: 100px; margin-bottom: 30px;">📊</div>
      <p style="font-size: 24px; color: #666;">PowerPoint Präsentation</p>
      ${post.content ? `<p style="margin-top: 30px;">${escapeHtml(post.content)}</p>` : ''}
    </div>
  `;
}

// Rendert die Slideshow-Ansicht
function renderSlideshow(post, slides, currentSlideIndex) {
  const slide = slides[currentSlideIndex];
  const totalSlides = slides.length;

  return `
    <div class="presentation-slideshow" style="height: 100%; display: flex; flex-direction: column; background: #1a1a2e;">
      <div class="slide-header" style="padding: 15px 30px; display: flex; justify-content: flex-end; align-items: center; background: rgba(0,0,0,0.3);">
        <div style="color: #fff; font-size: 18px; opacity: 0.8;">
          Folie ${currentSlideIndex + 1} / ${totalSlides}
        </div>
      </div>
      <div class="slide-container" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative;">
        <img src="${slide.imageUrl}" alt="Slide ${currentSlideIndex + 1}" 
             style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);"
             onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'text-align:center; color:#fff;\\'>❌ Slide konnte nicht geladen werden</div>';">
      </div>
      <div class="slide-progress" style="height: 4px; background: rgba(255,255,255,0.2);">
        <div style="height: 100%; width: ${((currentSlideIndex + 1) / totalSlides) * 100}%; background: linear-gradient(90deg, #c41e3a, #ff6b6b); transition: width 0.3s ease;"></div>
      </div>
    </div>
  `;
}

// Startet die automatische Slide-Rotation
function startSlideRotation(totalDuration) {
  // Stoppe vorherige Timer
  if (presentationState.slideTimer) {
    clearInterval(presentationState.slideTimer);
  }

  // Berechne Zeit pro Slide (mindestens 3 Sekunden)
  const slideCount = presentationState.slides.length;
  const timePerSlide = Math.max(3000, (totalDuration * 1000) / slideCount);

  presentationState.slideTimer = setInterval(() => {
    if (!presentationState.isActive) {
      clearInterval(presentationState.slideTimer);
      return;
    }

    presentationState.currentSlide++;

    // Wenn alle Slides gezeigt wurden, gehe zum nächsten Post
    if (presentationState.currentSlide >= presentationState.slides.length) {
      clearInterval(presentationState.slideTimer);
      presentationState.isActive = false;
      presentationState.currentSlide = 0;
      // Gehe zum nächsten Post
      nextPost();
      return;
    }

    // Aktualisiere nur den Slide-Content
    const contentDiv = document.getElementById('content');
    if (contentDiv && posts[currentIndex]) {
      contentDiv.innerHTML = renderSlideshow(
        posts[currentIndex],
        presentationState.slides,
        presentationState.currentSlide
      );
    }
  }, timePerSlide);
}

// Update Header Category
function updateHeaderCategory(categoryId) {
  const headerCategory = document.getElementById('header-category');
  if (!headerCategory) return;

  if (!categoryId) {
    headerCategory.innerHTML = '';
    return;
  }

  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    headerCategory.innerHTML = '';
    return;
  }

  headerCategory.innerHTML = `<div style="background: ${category.color}; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1.1rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.15);\">${category.icon || '🏷️'} ${escapeHtml(category.name)}</div>`;
}

// HTML-Escape für Sicherheit
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text ? String(text).replace(/[&<>"']/g, (m) => map[m]) : '';
}

// Tastatur-Navigation (optional)
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    nextPost();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    previousPost();
  } else if (e.key === 'r' || e.key === 'R') {
    fetchPosts().then(() => {
      currentIndex = 0;
      displayCurrentPost();
    });
  } else if (e.key === 'Escape' && presentationModeState.isActive) {
    exitPresentationMode();
  } else if (e.key === 'p' || e.key === 'P') {
    // Toggle Pause im Vortragsmodus
    if (presentationModeState.isActive) {
      toggleAutoRotation();
    }
  }
});

// Klick-Navigation im Vortragsmodus
document.addEventListener('click', (e) => {
  if (!presentationModeState.isActive) return;

  // Ignoriere Klicks auf Controls
  if (e.target.closest('.presentation-controls')) return;
  if (e.target.closest('.pres-btn')) return;

  const screenWidth = window.innerWidth;
  const clickX = e.clientX;

  // Linke 30% = zurück, rechte 30% = vorwärts, Mitte = toggle pause
  if (clickX < screenWidth * 0.3) {
    previousPost();
  } else if (clickX > screenWidth * 0.7) {
    nextPost();
  } else {
    // Mitte geklickt - Toggle Pause (optional)
    toggleAutoRotation();
  }
  
  // Versuche Musik zu starten falls sie durch Autoplay blockiert wurde
  resumeBackgroundMusicIfNeeded();
});

// Tastatur-Interaktion für Musik-Start
document.addEventListener('keydown', () => {
  resumeBackgroundMusicIfNeeded();
}, { once: true });

// Versuche blockierte Musik zu starten
function resumeBackgroundMusicIfNeeded() {
  const audio = backgroundMusicState.audio;
  if (audio && audio.src && audio.paused && !backgroundMusicState.userInteracted) {
    audio.play()
      .then(() => {
        backgroundMusicState.userInteracted = true;
        console.log('Hintergrundmusik erfolgreich gestartet nach Benutzerinteraktion');
      })
      .catch(() => {
        // Ignoriere Fehler
      });
  }
}

// Initialisierung
(async function() {
  console.log('Display-Modus wird initialisiert...');
  
  // 1. Lade Einstellungen vom Backend
  await loadDisplaySettings();
  
  // 2. Initialisiere Display
  init();
  
  // 3. Starte Auto-Refresh mit konfigurierten Intervall
  startAutoRefresh();
  
  console.log('Display-Modus gestartet 🚀');
})();
