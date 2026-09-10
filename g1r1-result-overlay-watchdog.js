// ADUGAME G1 result-overlay reliability watchdog v1.1.
// Preserve the canonical BaseRound result timings and UI for G1R1/G1R2, while using a
// one-shot browser timer fallback when the Phaser scene clock stalls after final real input.
// Also disable completed-round world inputs before the modal appears so the result layer is modal.
(() => {
  if (typeof FEEL === 'undefined') return;

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

  const lockWorldInputs = scene => {
    scene?.children?.list?.forEach(obj => {
      if (!obj?.input?.enabled) return;
      if (typeof obj.disableInteractive === 'function') obj.disableInteractive();
      else obj.input.enabled = false;
    });
  };

  const reliableFinish = function(extra = {}) {
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
      // A completed round must not leave actionable world targets behind the modal.
      lockWorldInputs(this);

      const overlay = this.add.rectangle(640, 360, 1280, 720, 0x21304a, .7)
        .setDepth(9997)
        .setInteractive()
        .setName(`${this.scene.key.toLowerCase()}_result_overlay`);
      const card = this.add.graphics().setDepth(9998).setName(`${this.scene.key.toLowerCase()}_result_card`);
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
      this.__g1ResultWatchdogShown = true;
      this.__g1ResultOverlay = overlay;
    });
  };

  const patchedRounds = [];
  if (typeof G1R1 === 'function') {
    G1R1.prototype.finish = reliableFinish;
    patchedRounds.push('G1R1');
  }
  if (typeof G1R2 === 'function') {
    G1R2.prototype.finish = reliableFinish;
    patchedRounds.push('G1R2');
  }

  window.__ADUGAME_G1R1_RESULT_WATCHDOG__ = {
    loaded: patchedRounds.length > 0,
    version: '1.1',
    patchedRounds,
    canonicalTimingPreserved: true,
    browserTimerFallback: true,
    completedWorldInputLock: true,
    generatedVisualAssets: 0
  };
})();
