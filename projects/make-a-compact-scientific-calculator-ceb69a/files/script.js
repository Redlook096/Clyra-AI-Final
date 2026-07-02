/* ============================================
   Compact Scientific Calculator - JavaScript Engine
   ============================================ */

(function () {
  'use strict';

  // =============================================
  // State
  // =============================================
  const state = {
    expression: '',
    result: '0',
    memory: null,
    angleMode: 'DEG',
    lastAnswer: null,
    hasResult: false,
    error: false,
    history: '',
  };

  // =============================================
  // DOM references
  // =============================================
  const resultEl = document.getElementById('result');
  const expressionEl = document.getElementById('expression');
  const memIndicator = document.getElementById('memIndicator');
  const angleIndicator = document.getElementById('angleIndicator');
  const angleToggleBtn = document.querySelector('[data-action="angle-toggle"]');

  // =============================================
  // UI update helpers
  // =============================================
  function updateDisplay() {
    resultEl.textContent = state.result;
    resultEl.classList.remove('small', 'xsmall', 'error');

    if (state.error) {
      resultEl.classList.add('error');
    }

    const len = state.result.length;
    if (len > 12) resultEl.classList.add('xsmall');
    else if (len > 8) resultEl.classList.add('small');

    expressionEl.textContent = state.history;

    if (state.memory !== null && state.memory !== 0) {
      memIndicator.classList.add('active');
    } else {
      memIndicator.classList.remove('active');
    }

    angleIndicator.textContent = state.angleMode;
    angleToggleBtn.textContent = state.angleMode;

    document.querySelectorAll('.btn-op.active-op').forEach(el => el.classList.remove('active-op'));
  }



  // =============================================
  // Expression builder
  // =============================================
  function buildEvalExpr(displayExpr) {
    let expr = displayExpr;

    // Replace display symbols
    expr = expr.replace(/×/g, '*');
    expr = expr.replace(/÷/g, '/');
    expr = expr.replace(/−/g, '-');
    expr = expr.replace(/π/g, '(' + Math.PI + ')');

    // Handle exponents
    expr = expr.replace(/²/g, '**2');
    expr = expr.replace(/³/g, '**3');
    expr = expr.replace(/ⁿ/g, '**');

    // sqrt
    expr = expr.replace(/√\(/g, 'Math.sqrt(');

    // Trig - apply angle conversions
    if (state.angleMode === 'DEG') {
      expr = expr.replace(/sin\(/g, 'Math.sin((x)=>x*Math.PI/180)(');
      expr = expr.replace(/cos\(/g, 'Math.cos((x)=>x*Math.PI/180)(');
      expr = expr.replace(/tan\(/g, 'Math.tan((x)=>x*Math.PI/180)(');
    } else if (state.angleMode === 'GRAD') {
      expr = expr.replace(/sin\(/g, 'Math.sin((x)=>x*Math.PI/200)(');
      expr = expr.replace(/cos\(/g, 'Math.cos((x)=>x*Math.PI/200)(');
      expr = expr.replace(/tan\(/g, 'Math.tan((x)=>x*Math.PI/200)(');
    } else {
      expr = expr.replace(/sin\(/g, 'Math.sin(');
      expr = expr.replace(/cos\(/g, 'Math.cos(');
      expr = expr.replace(/tan\(/g, 'Math.tan(');
    }

    // Other functions
    expr = expr.replace(/log\(/g, 'Math.log10(');
    expr = expr.replace(/ln\(/g, 'Math.log(');
    expr = expr.replace(/asin\(/g, 'Math.asin(');
    expr = expr.replace(/acos\(/g, 'Math.acos(');
    expr = expr.replace(/atan\(/g, 'Math.atan(');
    expr = expr.replace(/sinh\(/g, 'Math.sinh(');
    expr = expr.replace(/cosh\(/g, 'Math.cosh(');
    expr = expr.replace(/tanh\(/g, 'Math.tanh(');

    // Implicit multiplication
    expr = expr.replace(/(\d)\(/g, '$1*(');
    expr = expr.replace(/\)\(/g, ')*(');
    expr = expr.replace(/(\d)(?=[a-zA-Z\(])/g, '$1*');

    return expr;
  }


  // =============================================
  // Core evaluate
  // =============================================
  function evaluate() {
    if (state.error) return;

    let expr = state.expression.replace(/Ans/g, state.lastAnswer !== null ? state.lastAnswer.toString() : '0');
    if (!expr) return;

    try {
      const evalExpr = buildEvalExpr(expr);
      const result = new Function('"use strict"; return (' + evalExpr + ')')();
      const numResult = Number(result);

      if (!isFinite(numResult)) {
        state.result = numResult > 0 ? 'Infinity' : '-Infinity';
        state.error = true;
      } else if (isNaN(numResult)) {
        state.result = 'Error';
        state.error = true;
      } else {
        if (Number.isInteger(numResult) && Math.abs(numResult) < 1e15) {
          state.result = numResult.toString();
        } else {
          state.result = parseFloat(numResult.toPrecision(10)).toString();
        }
        state.lastAnswer = numResult;
        state.error = false;
      }

      state.history = expr + ' =';
      state.hasResult = true;
    } catch (e) {
      state.result = 'Error';
      state.error = true;
      state.history = expr + ' =';
    }

    updateDisplay();
  }


  // =============================================
  // Input handling
  // =============================================
  function handleInput(action) {
    if (state.error && action !== 'clear' && action !== 'backspace') {
      handleInput('clear');
    }

    if (state.hasResult && /^[0-9]$/.test(action)) {
      state.expression = '';
      state.history = '';
      state.hasResult = false;
    }

    switch (action) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9': {
        state.expression += action;
        state.result = state.expression || '0';
        state.hasResult = false;
        break;
      }

      case 'decimal': {
        const lastNum = state.expression.split(/[\+\-\*\/\(\)]/).pop() || '';
        if (lastNum.includes('.')) break;
        state.expression += '.';
        state.result = state.expression || '0';
        state.hasResult = false;
        break;
      }

      case 'add':    appendOp('+'); break;
      case 'subtract': appendOp('−'); break;
      case 'multiply': appendOp('×'); break;
      case 'divide': appendOp('÷'); break;
      case 'power':  appendOp('ⁿ'); break;

      case 'lparen': {
        state.expression += '(';
        state.result = state.expression || '0';
        state.hasResult = false;
        break;
      }
      case 'rparen': {
        const open = (state.expression.match(/\(/g) || []).length;
        const close = (state.expression.match(/\)/g) || []).length;
        if (close < open) {
          state.expression += ')';
          state.result = state.expression || '0';
          state.hasResult = false;
        }
        break;
      }

      case 'sin':   appendFunc('sin('); break;
      case 'cos':   appendFunc('cos('); break;
      case 'tan':   appendFunc('tan('); break;
      case 'log':   appendFunc('log('); break;
      case 'ln':    appendFunc('ln('); break;
      case 'sqrt':  appendFunc('√('); break;
      case 'square': state.expression += '²'; state.result = state.expression || '0'; state.hasResult = false; break;
      case 'pi':    state.expression += 'π'; state.result = state.expression || '0'; state.hasResult = false; break;

      case 'negate': {
        const last = state.expression.slice(-1);
        if (state.expression === '' || state.expression === '0' || /[\+−×÷\(]/.test(last)) {
          state.expression += '−';
        } else {
          state.expression += '−(';
        }
        state.result = state.expression || '0';
        state.hasResult = false;
        break;
      }

      case 'exp': {
        state.expression += 'e';
        state.result = state.expression || '0';
        state.hasResult = false;
        break;
      }

      case 'clear': {
        state.expression = '';
        state.history = '';
        state.result = '0';
        state.error = false;
        state.hasResult = false;
        break;
      }

      case 'backspace': {
        if (state.hasResult && !state.error) {
          state.expression = '';
          state.history = '';
          state.result = '0';
          state.hasResult = false;
        } else {
          state.expression = state.expression.slice(0, -1);
          state.result = state.expression || '0';
        }
        break;
      }

      case 'equals': {
        evaluate();
        break;
      }

      case 'ans': {
        if (state.lastAnswer !== null) {
          state.expression += 'Ans';
          state.result = state.expression || '0';
          state.hasResult = false;
        }
        break;
      }

      case 'mc':   state.memory = null; updateDisplay(); break;
      case 'mr': {
        if (state.memory !== null) {
          if (state.hasResult) {
            state.expression = state.memory.toString();
          } else {
            state.expression += state.memory.toString();
          }
          state.result = state.expression || '0';
          state.hasResult = false;
          updateDisplay();
        }
        break;
      }
      case 'ms': {
        const val = state.hasResult ? parseFloat(state.result) : parseFloat(state.expression) || 0;
        state.memory = val;
        updateDisplay();
        break;
      }
      case 'm-plus': {
        const cur = state.hasResult ? parseFloat(state.result) : parseFloat(state.expression) || 0;
        state.memory = (state.memory || 0) + cur;
        updateDisplay();
        break;
      }
      case 'm-minus': {
        const cur2 = state.hasResult ? parseFloat(state.result) : parseFloat(state.expression) || 0;
        state.memory = (state.memory || 0) - cur2;
        updateDisplay();
        break;
      }

      case 'angle-toggle': {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const idx = modes.indexOf(state.angleMode);
        state.angleMode = modes[(idx + 1) % modes.length];
        updateDisplay();
        break;
      }
    }

    updateDisplay();
  }
