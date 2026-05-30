/* ─────────────────────────────────────────
   calculator.js  —  Calculator logic
   Variables, functions, DOM manipulation,
   event listeners, and form validation
───────────────────────────────────────── */

/* ── State variables ── */
var cur      = '0';   // Current number being entered/displayed
var prev     = '';    // Previous number (left operand)
var op       = null;  // Active operator: +  −  ×  ÷
var fresh    = false; // True = next digit starts a new number
var hasError = false; // True = division-by-zero or invalid result

/* ── DOM references ── */
var valEl  = document.getElementById('val');
var exprEl = document.getElementById('expr');

/* ════════════════════════════════════════
   HELPER FUNCTIONS
════════════════════════════════════════ */

/**
 * fmt(n) — Format a number for display.
 * Trims floating-point noise and switches to
 * exponential notation for very long results.
 * Returns 'Error' for NaN / Infinity.
 */
function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return 'Error';
  var s = parseFloat(n.toPrecision(12)).toString();
  if (s.length > 14) s = parseFloat(n).toExponential(4);
  return s;
}

/**
 * resize() — Shrink the display font when the
 * number string is too long to fit at full size.
 */
function resize() {
  var len = cur.length;
  valEl.style.fontSize =
    len > 13 ? '26px' :
    len > 10 ? '34px' :
    len > 7  ? '42px' :
               '56px';
}

/**
 * render() — Push current state to the DOM.
 * Updates the value display and toggles the
 * error class for red colouring.
 */
function render() {
  valEl.textContent = cur;
  valEl.classList.toggle('error', hasError);
  resize();
}

/**
 * clearOpHighlight() — Remove the 'active'
 * highlight from all operator buttons.
 */
function clearOpHighlight() {
  document.querySelectorAll('.btn.op').forEach(function (b) {
    b.classList.remove('active');
  });
}

/**
 * highlightOp(o) — Add 'active' highlight to
 * the operator button matching symbol o.
 */
function highlightOp(o) {
  clearOpHighlight();
  var btn = document.querySelector('.btn.op[data-op="' + o + '"]');
  if (btn) btn.classList.add('active');
}

/* ════════════════════════════════════════
   CORE CALCULATION FUNCTION
════════════════════════════════════════ */

/**
 * compute(a, b, o) — Perform the arithmetic
 * operation o on operands a and b.
 * Handles division-by-zero by setting hasError.
 *
 * @param {string|number} a  Left operand
 * @param {string|number} b  Right operand
 * @param {string}        o  Operator symbol
 * @returns {number|string}  Result or 'Error'
 */
function compute(a, b, o) {
  a = parseFloat(a);
  b = parseFloat(b);

  if (o === '+') return a + b;
  if (o === '−') return a - b;
  if (o === '×') return a * b;
  if (o === '÷') {
    if (b === 0) {
      hasError = true;   // Form validation: catch divide by zero
      return 'Error';
    }
    return a / b;
  }
  return b;
}

/* ════════════════════════════════════════
   MAIN ACTION HANDLER
════════════════════════════════════════ */

/**
 * handle(action, data) — Central dispatcher.
 * Called by every button click and keyboard event.
 * Uses conditions to decide what to do.
 *
 * Actions: clear | digit | dot | negate |
 *          percent | backspace | op | equals
 */
function handle(action, data) {

  // Form validation: block all input after an error except AC
  if (hasError && action !== 'clear') return;

  /* ── AC: reset everything ── */
  if (action === 'clear') {
    cur = '0'; prev = ''; op = null; fresh = false; hasError = false;
    exprEl.textContent = '';
    clearOpHighlight();
    render();
    return;
  }

  /* ── Digit 0–9 ── */
  if (action === 'digit') {
    if (fresh) {
      cur = data.d;   // Start fresh number
      fresh = false;
    } else {
      // Append digit; cap at 15 characters
      cur = (cur === '0') ? data.d : (cur.length < 15 ? cur + data.d : cur);
    }
    render();
    return;
  }

  /* ── Decimal point ── */
  if (action === 'dot') {
    if (fresh) { cur = '0.'; fresh = false; }
    else if (cur.indexOf('.') === -1) cur += '.';
    render();
    return;
  }

  /* ── Toggle positive / negative ── */
  if (action === 'negate') {
    if (cur !== '0') {
      cur = cur.charAt(0) === '-' ? cur.slice(1) : '-' + cur;
    }
    render();
    return;
  }

  /* ── Percentage ── */
  if (action === 'percent') {
    cur = fmt(parseFloat(cur) / 100);
    render();
    return;
  }

  /* ── Backspace / delete last character ── */
  if (action === 'backspace') {
    if (!fresh) {
      cur = cur.length > 1 ? cur.slice(0, -1) : '0';
      render();
    }
    return;
  }

  /* ── Operator (+  −  ×  ÷) ── */
  if (action === 'op') {
    // Chain calculation: compute pending op before storing new one
    if (op && !fresh) {
      var r = compute(prev, cur, op);
      cur  = fmt(r);
      prev = cur;
    } else {
      prev = cur;
    }
    op    = data.op;
    fresh = true;
    exprEl.textContent = prev + ' ' + op;
    highlightOp(op);
    render();
    return;
  }

  /* ── Equals ── */
  if (action === 'equals') {
    if (!op) return;  // Nothing to compute yet
    var b2     = cur;
    var result = compute(prev, b2, op);
    exprEl.textContent = prev + ' ' + op + ' ' + b2 + ' =';
    cur   = fmt(result);
    prev  = '';
    op    = null;
    fresh = true;
    clearOpHighlight();
    render();
    return;
  }
}

/* ════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════ */

/* Button grid — single delegated click listener */
document.getElementById('grid').addEventListener('click', function (e) {
  var btn = e.target.closest('.btn');
  if (!btn) return;
  handle(btn.dataset.action, { op: btn.dataset.op, d: btn.dataset.d });
});

/* Backspace control button */
document.getElementById('backBtn').addEventListener('click', function () {
  handle('backspace', {});
});

/* Keyboard support */
document.addEventListener('keydown', function (e) {
  if (e.key >= '0' && e.key <= '9') { handle('digit',   { d: e.key });      return; }
  if (e.key === '.')                 { handle('dot',     {});                return; }
  if (e.key === '+')                 { handle('op',      { op: '+' });       return; }
  if (e.key === '-')                 { handle('op',      { op: '−' });       return; }
  if (e.key === '*')                 { handle('op',      { op: '×' });       return; }
  if (e.key === '/')  { e.preventDefault(); handle('op', { op: '÷' });       return; }
  if (e.key === '%')                 { handle('percent', {});                return; }
  if (e.key === 'Enter' || e.key === '=') { handle('equals', {});            return; }
  if (e.key === 'Backspace')         { handle('backspace', {});              return; }
  if (e.key === 'Escape')            { handle('clear',   {});                return; }
});

/* ── Initial render on page load ── */
render();