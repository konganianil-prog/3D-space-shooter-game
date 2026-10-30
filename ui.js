/**
 * GALAXY WARRIORS - 3D Space & Aerial Shooter
 * ui.js: Dual-Player HUD, 2-Player Air Dogfight Menus, Radar & Controls
 */

class UIManager {
    constructor() {
        this.game = null;

        // DOM Element Caches
        this.dom = {
            mainMenu: document.getElementById('main-menu'),
            shipSelect: document.getElementById('ship-select-menu'),
            howToPlay: document.getElementById('how-to-play-modal'),
            settingsModal: document.getElementById('settings-modal'),
            creditsModal: document.getElementById('credits-modal'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOverScreen: document.getElementById('game-over-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            hud: document.getElementById('game-hud'),

            // P1 HUD
            p1Container: document.getElementById('p1-hud-panel'),
            healthBarP1: document.getElementById('health-bar-fill-p1'),
            healthTextP1: document.getElementById('health-text-p1'),
            shieldBarP1: document.getElementById('shield-bar-fill-p1'),
            shieldTextP1: document.getElementById('shield-text-p1'),
            boostBarP1: document.getElementById('boost-bar-fill-p1'),
            weaponNameP1: document.getElementById('weapon-name-p1'),
            missilesCountP1: document.getElementById('missiles-count-p1'),
            airBlastCountP1: document.getElementById('air-count-p1'),
            scoreP1: document.getElementById('score-val-p1'),
            livesP1: document.getElementById('lives-icons-p1'),

            // P2 HUD
            p2Container: document.getElementById('p2-hud-panel'),
            healthBarP2: document.getElementById('health-bar-fill-p2'),
            healthTextP2: document.getElementById('health-text-p2'),
            shieldBarP2: document.getElementById('shield-bar-fill-p2'),
            shieldTextP2: document.getElementById('shield-text-p2'),
            boostBarP2: document.getElementById('boost-bar-fill-p2'),
            weaponNameP2: document.getElementById('weapon-name-p2'),
            missilesCountP2: document.getElementById('missiles-count-p2'),
            airBlastCountP2: document.getElementById('air-count-p2'),
            scoreP2: document.getElementById('score-val-p2'),
            livesP2: document.getElementById('lives-icons-p2'),

            // Common HUD
            levelDisplay: document.getElementById('level-val'),
            gameModeBadge: document.getElementById('hud-mode-badge'),
            bossHud: document.getElementById('boss-hud'),
            bossName: document.getElementById('boss-name'),
            bossHealthBar: document.getElementById('boss-bar-fill'),
            radarCanvas: document.getElementById('radar-canvas'),
            touchControls: document.getElementById('mobile-controls')
        };

        this.radarCtx = this.dom.radarCanvas ? this.dom.radarCanvas.getContext('2d') : null;

        this.masterSlider = document.getElementById('slider-master');
        this.sfxSlider = document.getElementById('slider-sfx');
        this.musicSlider = document.getElementById('slider-music');
        this.muteBtn = document.getElementById('btn-mute');

        this.initEventListeners();
        this.initSettingsValues();
    }

    bindGame(game) {
        this.game = game;
    }

    // ==========================================
    // EVENT LISTENERS & BUTTON ACTIONS
    // ==========================================

    initEventListeners() {
        // Mode Selection Buttons in Main Menu
        const btnCoop = document.getElementById('btn-start-coop');
        if (btnCoop) btnCoop.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.startGame('2P_COOP');
        });

        const btnVs = document.getElementById('btn-start-vs');
        if (btnVs) btnVs.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.startGame('2P_VS');
        });

        const btnSingle = document.getElementById('btn-start-single');
        if (btnSingle) btnSingle.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.startGame('1P');
        });

        const btnShipSelect = document.getElementById('btn-open-hangar');
        if (btnShipSelect) btnShipSelect.addEventListener('click', () => {
            window.audio.playUiClick();
            this.showScreen('shipSelect');
        });

        const btnHowToPlay = document.getElementById('btn-how-to-play');
        if (btnHowToPlay) btnHowToPlay.addEventListener('click', () => {
            window.audio.playUiClick();
            this.showModal('howToPlay');
        });

        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) btnSettings.addEventListener('click', () => {
            window.audio.playUiClick();
            this.showModal('settingsModal');
        });

        const btnCredits = document.getElementById('btn-credits');
        if (btnCredits) btnCredits.addEventListener('click', () => {
            window.audio.playUiClick();
            this.showModal('creditsModal');
        });

        // Close Modal buttons
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.audio.playUiClick();
                this.closeModals();
            });
        });

        // Hangar Ship Selection cards
        document.querySelectorAll('.ship-card').forEach(card => {
            card.addEventListener('click', () => {
                const shipId = card.getAttribute('data-ship');
                document.querySelectorAll('.ship-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                window.audio.playUiClick();
                if (this.game && this.game.player1) {
                    this.game.player1.setShipType(shipId);
                }
            });
        });

        const btnHangarConfirm = document.getElementById('btn-hangar-confirm');
        if (btnHangarConfirm) btnHangarConfirm.addEventListener('click', () => {
            window.audio.playUiClick();
            this.showScreen('mainMenu');
        });

        // Pause Menu Buttons
        const btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.togglePause();
        });

        const btnRestartPause = document.getElementById('btn-restart-pause');
        if (btnRestartPause) btnRestartPause.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.restart();
        });

        const btnMenuPause = document.getElementById('btn-menu-pause');
        if (btnMenuPause) btnMenuPause.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.returnToMenu();
        });

        const hudPauseBtn = document.getElementById('btn-hud-pause');
        if (hudPauseBtn) hudPauseBtn.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.togglePause();
        });

        // Game Over Buttons
        const btnGameOverRestart = document.getElementById('btn-gameover-restart');
        if (btnGameOverRestart) btnGameOverRestart.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.restart();
        });

        const btnGameOverMenu = document.getElementById('btn-gameover-menu');
        if (btnGameOverMenu) btnGameOverMenu.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.returnToMenu();
        });

        // Victory Screen Buttons
        const btnNextLevel = document.getElementById('btn-next-level');
        if (btnNextLevel) btnNextLevel.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.nextLevel();
        });

        const btnVictoryMenu = document.getElementById('btn-victory-menu');
        if (btnVictoryMenu) btnVictoryMenu.addEventListener('click', () => {
            window.audio.playUiClick();
            if (this.game) this.game.returnToMenu();
        });

        // Audio Sliders
        if (this.masterSlider) {
            this.masterSlider.addEventListener('input', (e) => {
                window.audio.setMasterVolume(parseFloat(e.target.value));
            });
        }
        if (this.sfxSlider) {
            this.sfxSlider.addEventListener('input', (e) => {
                window.audio.setSfxVolume(parseFloat(e.target.value));
            });
        }
        if (this.musicSlider) {
            this.musicSlider.addEventListener('input', (e) => {
                window.audio.setMusicVolume(parseFloat(e.target.value));
            });
        }
        if (this.muteBtn) {
            this.muteBtn.addEventListener('click', () => {
                const muted = window.audio.toggleMute();
                this.muteBtn.textContent = muted ? "UNMUTE AUDIO" : "MUTE ALL AUDIO";
            });
        }

        this.initTouchControls();
    }

    initSettingsValues() {
        if (this.masterSlider) this.masterSlider.value = window.audio.masterVolume;
        if (this.sfxSlider) this.sfxSlider.value = window.audio.sfxVolume;
        if (this.musicSlider) this.musicSlider.value = window.audio.musicVolume;
        if (this.muteBtn) this.muteBtn.textContent = window.audio.muted ? "UNMUTE AUDIO" : "MUTE ALL AUDIO";
    }

    initTouchControls() {
        const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (isTouch && this.dom.touchControls) {
            this.dom.touchControls.style.display = 'block';
        }

        const btnFire = document.getElementById('touch-fire');
        if (btnFire) {
            btnFire.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.game && this.game.player1) this.game.player1.keys.fire = true;
            });
            btnFire.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.game && this.game.player1) this.game.player1.keys.fire = false;
            });
        }

        const btnBoost = document.getElementById('touch-boost');
        if (btnBoost) {
            btnBoost.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.game && this.game.player1) this.game.player1.keys.boost = true;
            });
            btnBoost.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.game && this.game.player1) this.game.player1.keys.boost = false;
            });
        }

        const btnMissile = document.getElementById('touch-missile');
        if (btnMissile) {
            btnMissile.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.game && this.game.player1) this.game.player1.fireSpecialMissile();
            });
        }

        const btnAir = document.getElementById('touch-air');
        if (btnAir) {
            btnAir.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.game && this.game.player1) this.game.player1.fireAirBlast();
            });
        }
    }

    // ==========================================
    // SCREEN STATE SWITCHING
    // ==========================================

    showScreen(screenName) {
        if (this.dom.mainMenu) this.dom.mainMenu.classList.add('hidden');
        if (this.dom.shipSelect) this.dom.shipSelect.classList.add('hidden');
        if (this.dom.pauseMenu) this.dom.pauseMenu.classList.add('hidden');
        if (this.dom.gameOverScreen) this.dom.gameOverScreen.classList.add('hidden');
        if (this.dom.victoryScreen) this.dom.victoryScreen.classList.add('hidden');
        if (this.dom.hud) this.dom.hud.classList.add('hidden');
        this.closeModals();

        if (screenName === 'mainMenu') {
            if (this.dom.mainMenu) this.dom.mainMenu.classList.remove('hidden');
        } else if (screenName === 'shipSelect') {
            if (this.dom.shipSelect) this.dom.shipSelect.classList.remove('hidden');
        } else if (screenName === 'game') {
            if (this.dom.hud) this.dom.hud.classList.remove('hidden');
        } else if (screenName === 'pause') {
            if (this.dom.hud) this.dom.hud.classList.remove('hidden');
            if (this.dom.pauseMenu) this.dom.pauseMenu.classList.remove('hidden');
        } else if (screenName === 'gameOver') {
            if (this.dom.gameOverScreen) this.dom.gameOverScreen.classList.remove('hidden');
        } else if (screenName === 'victory') {
            if (this.dom.victoryScreen) this.dom.victoryScreen.classList.remove('hidden');
        }
    }

    showModal(modalName) {
        if (this.dom[modalName]) {
            this.dom[modalName].classList.remove('hidden');
        }
    }

    closeModals() {
        if (this.dom.howToPlay) this.dom.howToPlay.classList.add('hidden');
        if (this.dom.settingsModal) this.dom.settingsModal.classList.add('hidden');
        if (this.dom.creditsModal) this.dom.creditsModal.classList.add('hidden');
    }

    // ==========================================
    // DUAL-PLAYER HUD UPDATES
    // ==========================================

    updateDualHUD(p1, p2, mode, currentLevel, boss = null) {
        // Mode Badge
        if (this.dom.gameModeBadge) {
            if (mode === '2P_COOP') this.dom.gameModeBadge.textContent = '2P AIR SQUADRON (CO-OP)';
            else if (mode === '2P_VS') this.dom.gameModeBadge.textContent = '2P SKY DOGFIGHT (VERSUS)';
            else this.dom.gameModeBadge.textContent = 'SOLO CAMPAIGN';
        }

        if (this.dom.levelDisplay) {
            this.dom.levelDisplay.textContent = currentLevel;
        }

        // --- Update Player 1 (Left Side) ---
        if (p1) {
            const hpPct = Math.max(0, (p1.health / p1.maxHealth) * 100);
            const shieldPct = Math.max(0, (p1.shield / p1.maxShield) * 100);
            const boostPct = Math.max(0, (p1.boost / p1.maxBoost) * 100);

            if (this.dom.healthBarP1) this.dom.healthBarP1.style.width = `${hpPct}%`;
            if (this.dom.healthTextP1) this.dom.healthTextP1.textContent = `${Math.ceil(p1.health)}/${p1.maxHealth}`;
            if (this.dom.shieldBarP1) this.dom.shieldBarP1.style.width = `${shieldPct}%`;
            if (this.dom.shieldTextP1) this.dom.shieldTextP1.textContent = `${Math.ceil(p1.shield)}/${p1.maxShield}`;
            if (this.dom.boostBarP1) this.dom.boostBarP1.style.width = `${boostPct}%`;

            if (this.dom.scoreP1) this.dom.scoreP1.textContent = p1.score.toLocaleString();
            const wConfig1 = p1.weapons.weaponTypes[p1.currentWeapon];
            if (this.dom.weaponNameP1 && wConfig1) this.dom.weaponNameP1.textContent = wConfig1.name.toUpperCase();
            if (this.dom.missilesCountP1) this.dom.missilesCountP1.textContent = `${p1.specialMissiles}/${p1.maxSpecialMissiles}`;
            if (this.dom.airBlastCountP1) this.dom.airBlastCountP1.textContent = `${p1.airBlasts}/${p1.maxAirBlasts}`;

            if (this.dom.livesP1) {
                let html = '';
                for (let i = 0; i < p1.lives; i++) html += '<span class="life-icon-cyan">▲</span>';
                this.dom.livesP1.innerHTML = html;
            }
        }

        // --- Update Player 2 (Right Side) ---
        if (mode !== '1P' && p2) {
            if (this.dom.p2Container) this.dom.p2Container.classList.remove('hidden');

            const hpPct2 = Math.max(0, (p2.health / p2.maxHealth) * 100);
            const shieldPct2 = Math.max(0, (p2.shield / p2.maxShield) * 100);
            const boostPct2 = Math.max(0, (p2.boost / p2.maxBoost) * 100);

            if (this.dom.healthBarP2) this.dom.healthBarP2.style.width = `${hpPct2}%`;
            if (this.dom.healthTextP2) this.dom.healthTextP2.textContent = `${Math.ceil(p2.health)}/${p2.maxHealth}`;
            if (this.dom.shieldBarP2) this.dom.shieldBarP2.style.width = `${shieldPct2}%`;
            if (this.dom.shieldTextP2) this.dom.shieldTextP2.textContent = `${Math.ceil(p2.shield)}/${p2.maxShield}`;
            if (this.dom.boostBarP2) this.dom.boostBarP2.style.width = `${boostPct2}%`;

            if (this.dom.scoreP2) this.dom.scoreP2.textContent = p2.score.toLocaleString();
            const wConfig2 = p2.weapons.weaponTypes[p2.currentWeapon];
            if (this.dom.weaponNameP2 && wConfig2) this.dom.weaponNameP2.textContent = wConfig2.name.toUpperCase();
            if (this.dom.missilesCountP2) this.dom.missilesCountP2.textContent = `${p2.specialMissiles}/${p2.maxSpecialMissiles}`;
            if (this.dom.airBlastCountP2) this.dom.airBlastCountP2.textContent = `${p2.airBlasts}/${p2.maxAirBlasts}`;

            if (this.dom.livesP2) {
                let html = '';
                for (let i = 0; i < p2.lives; i++) html += '<span class="life-icon-gold">▲</span>';
                this.dom.livesP2.innerHTML = html;
            }
        } else {
            if (this.dom.p2Container) this.dom.p2Container.classList.add('hidden');
        }

        // --- Boss HUD ---
        if (boss && boss.active && boss.boss && mode !== '2P_VS') {
            if (this.dom.bossHud) this.dom.bossHud.classList.remove('hidden');
            if (this.dom.bossName) this.dom.bossName.textContent = boss.boss.name;
            const bossHpPct = Math.max(0, (boss.boss.hp / boss.boss.maxHp) * 100);
            if (this.dom.bossHealthBar) this.dom.bossHealthBar.style.width = `${bossHpPct}%`;
        } else {
            if (this.dom.bossHud) this.dom.bossHud.classList.add('hidden');
        }

        this.renderRadar(p1, p2, mode, this.game ? this.game.enemies.enemies : [], boss);
    }

    // ==========================================
    // RADAR MINIMAP
    // ==========================================

    renderRadar(p1, p2, mode, enemies, boss) {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const width = 110;
        const height = 110;
        const center = 55;
        const scale = 0.38;

        ctx.clearRect(0, 0, width, height);

        const sweepAngle = (performance.now() * 0.003) % (Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, 48, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(center + Math.cos(sweepAngle) * 48, center + Math.sin(sweepAngle) * 48);
        ctx.stroke();

        // Player 1 marker (Cyan)
        if (p1 && p1.mesh) {
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(center + p1.mesh.position.x * 0.4, center + p1.mesh.position.z * 0.4, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Player 2 marker (Gold/Amber)
        if (mode !== '1P' && p2 && p2.mesh) {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(center + p2.mesh.position.x * 0.4, center + p2.mesh.position.z * 0.4, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enemies
        if (mode !== '2P_VS') {
            for (const e of enemies) {
                const rx = center + e.mesh.position.x * 0.4;
                const ry = center + e.mesh.position.z * 0.4;
                if (rx > 6 && rx < width - 6 && ry > 6 && ry < height - 6) {
                    ctx.fillStyle = '#ff0044';
                    ctx.beginPath();
                    ctx.arc(rx, ry, e.type === 'heavy' ? 3.5 : 2.0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    showGameOver(score, enemiesDestroyed, survivalTime, isNewHighScore, winner = null) {
        this.showScreen('gameOver');
        const scoreElem = document.getElementById('gameover-score');
        const killsElem = document.getElementById('gameover-kills');
        const timeElem = document.getElementById('gameover-time');
        const titleElem = document.getElementById('gameover-title');
        const badgeElem = document.getElementById('gameover-highscore-badge');

        if (winner) {
            if (titleElem) titleElem.textContent = `${winner} WINS!`;
            if (scoreElem) scoreElem.textContent = "DOGFIGHT VICTORY";
        } else {
            if (titleElem) titleElem.textContent = "MISSION FAILED";
            if (scoreElem) scoreElem.textContent = score.toLocaleString();
        }

        if (killsElem) killsElem.textContent = enemiesDestroyed;
        if (timeElem) timeElem.textContent = `${Math.floor(survivalTime)}s`;
        if (badgeElem) badgeElem.style.display = isNewHighScore ? 'inline-block' : 'none';
    }

    showVictory(score, level, stars = 3) {
        this.showScreen('victory');
        const scoreElem = document.getElementById('victory-score');
        const levelElem = document.getElementById('victory-level');
        const starsElem = document.getElementById('victory-stars');

        if (scoreElem) scoreElem.textContent = score.toLocaleString();
        if (levelElem) levelElem.textContent = level;
        if (starsElem) {
            starsElem.innerHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        }
    }
}

window.UIManager = UIManager;
