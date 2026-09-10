// ADUGAME G1R1 result-overlay reliability watchdog v1.0.
// Preserve the canonical BaseRound result timings and UI, but use a one-shot browser timer
// as a fallback when the Phaser scene clock stalls after the final real faucet input.
(() => {
  if (typeof G1R1 !== 'function' || typeof FEEL === 'undefined') return;

  const dualDelay = (scene, delay, callback) => {
    let fired = false;
    let browserTimer = null;
    const once = () => {
      if (fired) return;
      fired = true;
      if (browserTimer !== null) window.clearTimeout(browserTimer);
      if (!scene?.sys?.isActive?.()) return;
      callback();
    };
    scene.time?.delayedCall?.(delay, once);
    browserTimer = window.setTimeout(once, Math.max(0, Number(delay) || 0) + 160);
  };

  G1R1.prototype.finish = function(extra = {}) {
    if (this.roundComplete) return;
    this.roundComplete = true;
    this.interactionLocked = true;
    const finalScore = extra.score ?? this.score;
    telemetry('round_complete', {
      round: this.scene.key,
      score: finalScore,
      errors: this.errors,
      hints: this.hints
    });

    dualDelay(this, FEEL.feedback.roundClearHold, () => {
      const overlay = this.add.rectangle(640, 360, 1280, 720, 0x21304a, .7)
        .setDepth(9997)
        .setInteractive()
        .setName('g1r1_result_overlay');
      const card = this.add.graphics().setDepth(9998).setName('g1r1_result_card');
      card.fillStyle(0xffffff, 1).fillRoundedRect(410, 220, 460, 280, 30);
      this.add.text(640, 270, 'ROUND COMPLETE', {
        fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#24314a'
      }).setOrigin(.5).setDepth(9999);
      const stars = finalScore >= 90 ? '★★★' : finalScore >= 75 ? '★★☆' : '★☆☆';
      this.add.text(640, 335, stars, {fontSize: '52px', color: '#ffb703'})
        .setOrigin(.5).setDepth(9999);
      this.add.text(640, 395, String(Math.round(finalScore)), {
        fontFamily: 'Arial', fontSize: '34px', fontStyle: 'bold', color: '#24314a'
      }).setOrigin(.5).setDepth(9999);
      const next = this.add.text(640, 455, '계속하기  ›', {
        fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffffff',
        backgroundColor: '#5aa9e6', padding: {left: 24, right: 24, top: 12, bottom: 12}
      }).setOrigin(.5).setDepth(9999);
      dualDelay(this, FEEL.feedback.resultMinHold, () => {
        next.setInteractive({useHandCursor: true}).on('pointerup', () => this.doneCb({score: finalScore}));
      });
      this.__g1r1ResultWatchdogShown = true;
      this.__g1r1ResultOverlay = overlay;
    });
  };

  window.__ADUGAME_G1R1_RESULT_WATCHDOG__ = {
    loaded: true,
    version: '1.0',
    canonicalTimingPreserved: true,
    browserTimerFallback: true,
    generatedVisualAssets: 0
  };
})();
