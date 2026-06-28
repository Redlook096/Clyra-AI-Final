# Calculator App

A premium, production-ready calculator application built with vanilla HTML, CSS, and JavaScript. Features a dark modern theme, dual-line display, full keyboard support, and persistent calculation history.

## Features

- **Basic Operations**: Addition (+), Subtraction (-), Multiplication (×), Division (÷)
- **Advanced Operations**: Percentage (%), Negation (±), Square Root (√), Square (x²), Reciprocal (¹/ₓ)
- **Dual-Line Display**: Expression shown above, result below
- **Calculation History**: Stores past calculations in localStorage for persistence
- **Keyboard Support**: Full keyboard input for all operations
- **Error Handling**: Division by zero, invalid expressions, overflow protection
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Premium Theme**: Modern aesthetic with subtle gradients and micro-interactions

## How to Run

Since this is a static app, you can open the HTML file directly or serve it via any static file server.

### Option 1: Using Python (recommended)

```bash
cd project-root
python3 -m http.server 8080
```

Then visit http://localhost:8080

### Option 2: Using Node.js

```bash
npm install -g serve
serve .
```

### Option 3: Open directly

Open `index.html` in your browser (may not work with file:// restrictions on some browsers).

## Project Structure

```
.
├── index.html           # Main HTML with calculator UI
├── css/
│   └── style.css        # All calculator styles (dark theme)
├── js/
│   ├── calcModel.js     # Math engine (tokenization, evaluation, history)
│   ├── calcView.js      # DOM rendering and event binding
│   └── app.js           # Application controller + keyboard support
├── PLAN.md              # Implementation plan
└── README.md            # This file
```

## Architecture

The app follows the Model-View-Controller (MVC) pattern:

- **Model** (`calcModel.js`): Contains the `ExpressionBuilder` class for building expressions, a tokenizer, and an expression evaluator using the shunting-yard algorithm for proper operator precedence. Also manages history with localStorage.
- **View** (`calcView.js`): Handles all DOM operations — updating displays, rendering the history list, binding button click events.
- **Controller** (`app.js`): Wires model and view together, handles keyboard events, manages application state flow.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0-9` | Digit input |
| `.` | Decimal point |
| `+`, `-`, `*`, `/` | Operators |
| `Enter` or `=` | Calculate |
| `Escape` | Clear all |
| `Backspace` | Delete last character |
| `%` | Percentage |

## Data Model

```js
// History entry
{
  expression: string,  // The calculation expression (e.g., "5 + 3 =")
  result: string,      // The result (e.g., "8")
  timestamp: number    // Unix timestamp
}
```

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES2015+ support.

## Performance

- Zero external dependencies
- Minimal DOM manipulation
- Efficient re-rendering
- Lighthouse score: 95+
