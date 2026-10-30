/**
 * GALAXY WARRIORS - 3D Space Shooter
 * audio.js: Web Audio API Procedural Sound Engine & Synthesizer
 * Provides zero-dependency, rich procedural sound effects and dynamic sci-fi music.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.8;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.muted = false;

        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;

        // Music sequencer state
        this.musicPlaying = false;
        this.musicTimer = null;
        this.currentStep = 0;
        this.musicBpm = 126;
        this.musicMode = 'ambient'; // 'ambient', 'combat', 'boss'

        // Continuous engine hum
        this.engineOsc = null;
        this.engineGain = null;
        this.isEngineRunning = false;

        // Noise buffer cache
        this.noiseBuffer = null;

        // Load saved audio settings
        this.loadSettings();
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn("Web Audio API not supported in this browser.");
            return;
        }

        this.ctx = new AudioContext();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Music bus
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // Precompute 2 seconds of white noise for explosions
        this.createNoiseBuffer();

        // Unlock on mobile / touch / audio resume
        if (this.ctx.state === 'suspended') {
            const resumeAudio = () => {
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
                window.removeEventListener('click', resumeAudio);
                window.removeEventListener('keydown', resumeAudio);
                window.removeEventListener('touchstart', resumeAudio);
            };
            window.addEventListener('click', resumeAudio);
            window.addEventListener('keydown', resumeAudio);
            window.addEventListener('touchstart', resumeAudio);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('gw_audio_settings');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.masterVolume !== undefined) this.masterVolume = data.masterVolume;
                if (data.sfxVolume !== undefined) this.sfxVolume = data.sfxVolume;
                if (data.musicVolume !== undefined) this.musicVolume = data.musicVolume;
                if (data.muted !== undefined) this.muted = data.muted;
            }
        } catch (e) {
            console.warn("Could not load audio settings:", e);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('gw_audio_settings', JSON.stringify({
                masterVolume: this.masterVolume,
                sfxVolume: this.sfxVolume,
                musicVolume: this.musicVolume,
                muted: this.muted
            }));
        } catch (e) {
            console.warn("Could not save audio settings:", e);
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
        this.saveSettings();
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
        this.saveSettings();
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
        this.saveSettings();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
        this.saveSettings();
        return this.muted;
    }

    playAirBlast() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Low subsonic concussive thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(18, t + 0.45);
        oscGain.gain.setValueAtTime(0.7, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);

        // High velocity air rushing noise
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            const noiseGain = this.ctx.createGain();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2400, t);
            filter.frequency.exponentialRampToValueAtTime(120, t + 0.5);

            noiseGain.gain.setValueAtTime(0.65, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start(t);
            noise.stop(t + 0.5);
        }
    }

    playSonicBoom() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.6);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    // ==========================================
    // PROCEDURAL SOUND EFFECTS
    // ==========================================

    playLaser(type = 'default') {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        if (type === 'default' || type === 'blue') {
            // High-tech twin-pulse laser
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(4000, t);
            filter.frequency.exponentialRampToValueAtTime(800, t + 0.12);

            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.12);
        } else if (type === 'plasma') {
            // Heavy plasma cannon
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc1.type = 'square';
            osc1.frequency.setValueAtTime(450, t);
            osc1.frequency.exponentialRampToValueAtTime(60, t + 0.22);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(220, t);
            osc2.frequency.exponentialRampToValueAtTime(40, t + 0.25);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, t);
            filter.Q.setValueAtTime(6, t);

            gain.gain.setValueAtTime(0.45, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + 0.25);
            osc2.stop(t + 0.25);
        } else if (type === 'rapid') {
            // Rapid-fire Gatling
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.07);

            gain.gain.setValueAtTime(0.28, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.07);
        } else if (type === 'beam') {
            // Continuous / piercing railgun pulse
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, t);
            osc.frequency.linearRampToValueAtTime(1400, t + 0.1);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.35);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1800, t);
            filter.Q.setValueAtTime(8, t);

            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.35);
        } else if (type === 'enemy') {
            // Alien laser
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(650, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    playMissileLaunch() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Sub blast
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.4);
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.4);

        // Rocket whoosh noise
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            const noiseGain = this.ctx.createGain();

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(400, t);
            filter.frequency.exponentialRampToValueAtTime(2200, t + 0.35);
            filter.Q.setValueAtTime(3, t);

            noiseGain.gain.setValueAtTime(0.35, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start(t);
            noise.stop(t + 0.45);
        }
    }

    playExplosion(size = 'medium') {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        let duration = 0.5;
        let baseFreq = 120;
        let volume = 0.5;

        if (size === 'small') {
            duration = 0.35;
            baseFreq = 160;
            volume = 0.35;
        } else if (size === 'large') {
            duration = 0.9;
            baseFreq = 85;
            volume = 0.75;
        } else if (size === 'boss') {
            duration = 1.8;
            baseFreq = 65;
            volume = 0.95;
        }

        // Sub rumble
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + duration);
        oscGain.gain.setValueAtTime(volume, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + duration);

        // Noise body
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            const noiseGain = this.ctx.createGain();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, t);
            filter.frequency.exponentialRampToValueAtTime(80, t + duration * 0.9);

            noiseGain.gain.setValueAtTime(volume * 0.8, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start(t);
            noise.stop(t + duration);
        }
    }

    playShieldHit() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.18);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.Q.setValueAtTime(12, t);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.18);
    }

    playPlayerHit() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.25);
    }

    playPowerupPickup() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Shiny rising arpeggio: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = t + idx * 0.05;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.18);
        });
    }

    playWarning() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        for (let i = 0; i < 2; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = t + i * 0.22;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, start);
            osc.frequency.setValueAtTime(660, start + 0.1);

            gain.gain.setValueAtTime(0.28, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(start);
            osc.stop(start + 0.2);
        }
    }

    playUiClick() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.04);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.04);
    }

    playVictory() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const chords = [
            [440, 554.37, 659.25], // A major
            [493.88, 622.25, 739.99], // B major
            [554.37, 698.46, 830.61], // C# major
            [659.25, 830.61, 987.77]  // E major
        ];

        chords.forEach((chord, step) => {
            const chordTime = t + step * 0.28;
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, chordTime);

                gain.gain.setValueAtTime(0.18, chordTime);
                gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.4);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(chordTime);
                osc.stop(chordTime + 0.4);
            });
        });
    }

    playGameOver() {
        if (!this.ctx || this.muted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = [440, 415.3, 392, 349.23];

        notes.forEach((freq, idx) => {
            const noteTime = t + idx * 0.35;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0.25, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(noteTime);
            osc.stop(noteTime + 0.45);
        });
    }

    // ==========================================
    // PROCEDURAL ENGINE HUM
    // ==========================================

    startEngineHum() {
        if (!this.ctx || this.isEngineRunning) return;
        const t = this.ctx.currentTime;

        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(65, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, t);

        this.engineGain.gain.setValueAtTime(0.01, t);
        this.engineGain.gain.linearRampToValueAtTime(0.12, t + 0.5);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        this.engineOsc.start(t);
        this.isEngineRunning = true;
    }

    updateEngineHum(speedRatio, isBoosting) {
        if (!this.ctx || !this.isEngineRunning || !this.engineOsc) return;
        const t = this.ctx.currentTime;

        const baseFreq = 55 + speedRatio * 45 + (isBoosting ? 65 : 0);
        this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.1);

        const targetVol = isBoosting ? 0.22 : 0.08 + speedRatio * 0.08;
        this.engineGain.gain.setTargetAtTime(targetVol, t, 0.1);
    }

    stopEngineHum() {
        if (!this.isEngineRunning || !this.engineOsc) return;
        const t = this.ctx.currentTime;
        try {
            this.engineGain.gain.linearRampToValueAtTime(0.001, t + 0.2);
            this.engineOsc.stop(t + 0.2);
        } catch (e) {}
        this.isEngineRunning = false;
        this.engineOsc = null;
        this.engineGain = null;
    }

    // ==========================================
    // PROCEDURAL DYNAMIC SCI-FI MUSIC ENGINE
    // ==========================================

    startMusic(mode = 'combat') {
        this.musicMode = mode;
        if (this.musicPlaying) return;
        this.init();
        this.resume();
        this.musicPlaying = true;
        this.currentStep = 0;
        this.musicBpm = mode === 'boss' ? 138 : 124;

        this.scheduleMusicStep();
    }

    setMusicMode(mode) {
        this.musicMode = mode;
        this.musicBpm = mode === 'boss' ? 138 : (mode === 'combat' ? 124 : 110);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    scheduleMusicStep() {
        if (!this.musicPlaying || !this.ctx) return;

        const stepDuration = 60 / this.musicBpm / 4; // 16th notes
        const t = this.ctx.currentTime;

        // Root chords progression (D minor, Bb major, F major, C major)
        const roots = [146.83, 116.54, 174.61, 130.81]; // D3, Bb2, F3, C3
        const barIndex = Math.floor(this.currentStep / 16) % roots.length;
        const stepInBar = this.currentStep % 16;
        const rootFreq = roots[barIndex];

        // 1. Synth Bassline (every 4 steps + offbeats)
        if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6 || stepInBar === 8 || stepInBar === 11 || stepInBar === 14) {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            const bassFilter = this.ctx.createBiquadFilter();

            bassOsc.type = this.musicMode === 'boss' ? 'sawtooth' : 'triangle';
            let noteFreq = rootFreq / 2;
            if (stepInBar === 6 || stepInBar === 14) noteFreq *= 1.5; // fifth

            bassOsc.frequency.setValueAtTime(noteFreq, t);

            bassFilter.type = 'lowpass';
            bassFilter.frequency.setValueAtTime(this.musicMode === 'boss' ? 800 : 450, t);
            bassFilter.frequency.exponentialRampToValueAtTime(120, t + 0.18);

            bassGain.gain.setValueAtTime(0.28, t);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            bassOsc.connect(bassFilter);
            bassFilter.connect(bassGain);
            bassGain.connect(this.musicGain);

            bassOsc.start(t);
            bassOsc.stop(t + 0.2);
        }

        // 2. Cyber Arpeggio (driving 16th notes)
        const arpIntervals = [1, 1.2, 1.5, 1.8, 2, 2.4, 2.5, 3];
        const arpFreq = rootFreq * (arpIntervals[stepInBar % arpIntervals.length] || 1);

        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        const arpFilter = this.ctx.createBiquadFilter();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpFreq, t);

        arpFilter.type = 'bandpass';
        arpFilter.frequency.setValueAtTime(1200 + Math.sin(this.currentStep * 0.2) * 600, t);
        arpFilter.Q.setValueAtTime(4, t);

        const arpVol = (stepInBar % 2 === 0) ? 0.1 : 0.06;
        arpGain.gain.setValueAtTime(arpVol, t);
        arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.9);

        arpOsc.connect(arpFilter);
        arpFilter.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(t);
        arpOsc.stop(t + stepDuration * 0.9);

        // 3. Electronic Percussion (Hi-hat / Noise snare on beats 4 & 12)
        if (this.noiseBuffer && (this.musicMode === 'combat' || this.musicMode === 'boss')) {
            // Hi-hat on every offbeat
            if (stepInBar % 2 === 1) {
                const hat = this.ctx.createBufferSource();
                hat.buffer = this.noiseBuffer;
                const hatFilter = this.ctx.createBiquadFilter();
                const hatGain = this.ctx.createGain();

                hatFilter.type = 'highpass';
                hatFilter.frequency.setValueAtTime(7000, t);

                hatGain.gain.setValueAtTime(0.05, t);
                hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

                hat.connect(hatFilter);
                hatFilter.connect(hatGain);
                hatGain.connect(this.musicGain);

                hat.start(t);
                hat.stop(t + 0.05);
            }

            // Snare / Clack on steps 4 and 12
            if (stepInBar === 4 || stepInBar === 12) {
                const snare = this.ctx.createBufferSource();
                snare.buffer = this.noiseBuffer;
                const snareFilter = this.ctx.createBiquadFilter();
                const snareGain = this.ctx.createGain();

                snareFilter.type = 'bandpass';
                snareFilter.frequency.setValueAtTime(2200, t);
                snareFilter.Q.setValueAtTime(1.5, t);

                snareGain.gain.setValueAtTime(0.12, t);
                snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

                snare.connect(snareFilter);
                snareFilter.connect(snareGain);
                snareGain.connect(this.musicGain);

                snare.start(t);
                snare.stop(t + 0.12);
            }
        }

        this.currentStep++;
        this.musicTimer = setTimeout(() => {
            this.scheduleMusicStep();
        }, stepDuration * 1000);
    }
}

// Global Sound Instance
window.SoundEngine = SoundEngine;
window.audio = new SoundEngine();
