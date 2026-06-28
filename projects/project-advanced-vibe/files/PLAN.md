# Calculator App - Implementation Plan

## Overview
Replace the existing Todo App with a fully featured, production-ready calculator application built with vanilla HTML, CSS, and JavaScript.

## Architecture Pattern
Following Model-View-Controller pattern:
- **Model** (calcModel.js): Math engine with tokenization, evaluation, history management
- **View** (calcView.js): DOM rendering, display, button event binding
- **Controller** (app.js): Wires model + view, handles keyboard input

## File Structure
.
├── PLAN.md              # This file
├── index.html           # Main HTML with calculator UI
├── css/
│   └── style.css        # All calculator styles (dark theme)
├── js/
│   ├── calcModel.js     # Math engine
│   ├── calcView.js      # DOM rendering and event binding
│   └── app.js           # Application controller
├── README.md            # Project documentation

## File Execution Queue
1. PLAN.md - This file
2. index.html - Complete HTML with calculator grid layout, display, history panel
3. css/style.css - Dark premium calculator theme
4. js/calcModel.js - Math engine with parsing, evaluation, history
5. js/calcView.js - View layer for DOM rendering and events
6. js/app.js - Controller wiring model + view
7. README.md - Updated documentation

## Calculator Features
- Basic: +, -, ×, ÷, ., =
- Advanced: %, ±, √, x², ¹/ₓ
- Dual-line display: expression + result
- History panel with localStorage persistence
- Full keyboard support
- Error handling: division by zero, invalid expressions

## UI Layout
[   Expression Display   ]
[     Result Display      ]
[ Hist ] [ ] [ ] [ ] [ ÷ ]
[   7   ] [8] [9] [ ] [ × ]
[   4   ] [5] [6] [ ] [ - ]
[   1   ] [2] [3] [ ] [ + ]
[   ±   ] [0] [.] [ ] [ = ]

## Completion Criteria
- [ ] All 7 files created/modified
- [ ] Calculator grid renders correctly
- [ ] All basic operations work
- [ ] Advanced operations work
- [ ] Dual-line display functional
- [ ] Keyboard input fully functional
- [ ] History panel works
- [ ] Error handling
- [ ] Responsive design
- [ ] Dark premium aesthetic
- [ ] Live preview confirmed
