// ADUGAME result-overlay reliability watchdog v1.7.
// Preserve the canonical BaseRound result timings and UI for G1/G2/G3 rounds, while using a
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

  const walkObjectTree = (obj, visit) => {
    if (!obj) return;
    visit(obj);
    if (Array.isArray(obj.list)) obj.list.forEach(child => walkObjectTree(child, visit));
  };

  const lockWorldInputs = scene => {
    scene?.children?.list?.forEach(obj => walkObjectTree(obj, node => {
      if (!node?.input?.enabled) return;
      if (typeof node.disableInteractive === 'function') node.disableInteractive();
      else node.input.enabled = false;
    }));
  };

  const isolateResultPresentation = scene => {
    const key = String(scene?.scene?.key || '');
    if (!key.startsWith('G3R')) return;
    // The authored G3 DOM layer intentionally sits above the Phaser canvas during play.
    // Once the real round is complete, get it out of the way so the canonical result
    // modal is actually visible to the player rather than hidden behind the shop art.
    const root = typeof document !== 'undefined' ? document.getElementById('g3-commercial-art-v1') : null;
    if (root) {
      root.style.visibility = 'hidden';
      root.style.pointerEvents = 'none';
      root.dataset.resultModalVisible = '1';
    }
    scene.orderBubble?.setVisible?.(false);
    scene.clarityOrderBadges?.setVisible?.(false);
    scene.orderIcons?.setVisible?.(false);
    scene.orderLabel?.setVisible?.(false);
    // Result mode is a true modal: once the round is complete, existing world text
    // must not remain readable underneath the score card. Keep the illustrated world
    // as the dimmed backdrop, but hide all pre-existing gameplay text recursively.
    scene.children?.list?.forEach(obj => walkObjectTree(obj, node => {
      const name = String(node?.name || '');
      if (name === 'clarity_order_badges' || name.startsWith('order_badge_')) node.setVisible?.(false);
      const type = String(node?.type || node?.constructor?.name || '');
      if (type === 'Text' && (Number(node?.depth)||0) < 9997) {
        node.setVisible?.(false);
        if (node?.input?.enabled) {
          if (typeof node.disableInteractive === 'function') node.disableInteractive();
          else node.input.enabled = false;
        }
      }
    }));
    scene.status?.setVisible?.(false);
    scene.serveButton?.setVisible?.(false);
  };

  const reliableFinish = function(extra = {}) {
    if (this.roundComplete) return;
    this.roundComplete = true;
    this.interactionLocked = true;
    const finalScore = extra.score ?? this.score;
    isolateResultPresentation(this);
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
  if (typeof G1R3 === 'function') {
    G1R3.prototype.finish = reliableFinish;
    patchedRounds.push('G1R3');
  }
  if (typeof G2R1 === 'function') {
    G2R1.prototype.finish = reliableFinish;
    patchedRounds.push('G2R1');
  }
  if (typeof G2R2 === 'function') {
    G2R2.prototype.finish = reliableFinish;
    patchedRounds.push('G2R2');
  }
  if (typeof G2R3 === 'function') {
    G2R3.prototype.finish = reliableFinish;
    patchedRounds.push('G2R3');
  }
  if (typeof CraftRound === 'function') {
    CraftRound.prototype.finish = reliableFinish;
    patchedRounds.push('G3R*');
  }

  window.__ADUGAME_G1R1_RESULT_WATCHDOG__ = {
    loaded: patchedRounds.length > 0,
    version: '1.7',
    patchedRounds,
    canonicalTimingPreserved: true,
    browserTimerFallback: true,
    completedWorldInputLock: true,
    generatedVisualAssets: 0
  };
})();
