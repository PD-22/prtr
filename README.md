```
git clone https://github.com/PD-22/prtr.git
npm i
npm run start
```

### Global shortcuts:
- **F1**: Toggle shortcuts reminder
- **Tab**: Switch between canvas and terminal
- **Escape**: Cancel loading actions

### Canvas shortcuts:
- **Escape**: Reset canvas selection
- **Enter**: Read text from the displayed image and paste it to the terminal
- **P**: Paste image from clipboard
- **I**: Import image from files
- **E**: Export image to a file
- **C**: Crop image from selection
- **RightMouse, Arrows**: Move the screen on the canvas
    - Press right mouse button and drag
    - Alternatively use arrow keys (Shift - fast, Ctrl - slow)
- **MouseWheel, +/-**: Zoom in and out of the canvas
- **0**: Reset zoom to 100%
- **LeftMouse**: Select rectangle
    - press left mouse button and drag to select a rectangle
    - alternatively press space to toggle selection using arrow keys

### Terminal shortcuts:
- **Escape**: Deselect terminal text or cancel all loading lines
- **Enter**: Search player in-game times
    - cleans all the lines by removing clan tag
    - displays loading three dots "..." for each line
    - searches for each players in-game time
    - to cancel individual line try to edit that line
    - to cancel all lines press "Escape"
    - when search is complete the dots are replaced with the result
- **Ctrl+Delete**: Clean all lines, parsing player names
- **Ctrl+Z**: Undo history
- **Ctrl+Y, Ctrl+Shift+Z**: Redo history
- **Ctrl+ArrowDown**: Sort data ascending
- **Ctrl+ArrowUp**: Sort data descending
- **Alt+ArrowUp**: Move line up
- **Alt+ArrowDown**: Move line down
