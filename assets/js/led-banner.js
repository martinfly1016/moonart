import { detectOs, isInAppBrowser, trackToolEvent } from './oshi-settings.js';
import { createDisplaySession } from './led-display.js';

const root = document.querySelector('[data-led-banner]');
if (root) {
  const stage = root.querySelector('[data-stage]');
  const board = root.querySelector('[data-board]');
  const enterButton = root.querySelector('[data-enter]');
  const exitButton = root.querySelector('[data-exit]');
  const tip = root.querySelector('[data-lock-tip]');
  const inapp = root.querySelector('[data-inapp]');

  if (isInAppBrowser()) inapp.hidden = false;

  function showWakeTip(status) {
    tip.hidden = status === 'ok';
  }

  const session = createDisplaySession({
    stage,
    board,
    exitButton,
    enterButton,
    onEnter({ method, wake }) {
      trackToolEvent('fullscreen_result', {
        method,
        os: detectOs(),
        tool_slug: 'led-banner'
      });
      trackToolEvent('wakelock_result', {
        status: wake.status,
        os: detectOs(),
        tool_slug: 'led-banner'
      });
      showWakeTip(wake.status);
    },
    onWakeRenew(wake) {
      showWakeTip(wake.status);
    }
  });

  enterButton.addEventListener('click', () => {
    session.enter();
  });
  exitButton.addEventListener('click', () => {
    session.exit();
  });
}
