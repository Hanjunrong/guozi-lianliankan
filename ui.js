var ROWS = window.ROWS;
var COLS = window.COLS;
var board = [];
var selected = null;
var pairs = 0;
var score = 0;
var tempLine = null;
var lastMouseRow = -1;
var lastMouseCol = -1;
var timerValue = 5;
var timerInterval = null;
var hintLine = null;
var cachedMetrics = null;
var reshuffleConfirmShown = false;
var isEliminating = false;

function handleToggleSfx() {
  if (!window.toggleSfx || !window.isSfxEnabled) {
    return;
  }
  window.toggleSfx();
  if (window.isSfxEnabled() && window.unlockAudio) {
    window.unlockAudio();
  }
  refreshSfxButton();
}

function refreshSfxButton() {
  if (!window.isSfxEnabled) {
    return;
  }
  document.getElementById('sfxToggleBtn').textContent = window.isSfxEnabled() ? '🔊' : '🔇';
}

function setupGameUI() {
  // 先获取可用图片列表，再初始化游戏
  if (typeof window.fetchAvailableImages === 'function') {
    window.fetchAvailableImages(function() {
      doSetupGame();
    });
  } else {
    doSetupGame();
  }
}

function doSetupGame() {
  window.initGame();
  board = window.getBoard();
  pairs = window.getPairs();
  score = 0;
  selected = null;
  renderAxisLabels();
  document.getElementById('message').style.display = 'none';
  document.getElementById('finalScore').textContent = '得分: ' + score;

  var gameBoard = document.getElementById('gameBoard');
  gameBoard.innerHTML = '';

  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.innerHTML = '<img src="' + board[i][j] + '" alt="guo">';
      cell.addEventListener('click', onCellClick(i, j));
      cell.addEventListener('mouseenter', onCellEnter(i, j));
      cell.addEventListener('mouseleave', onCellLeave);
      gameBoard.appendChild(cell);
    }
  }

  window.updateInfo();
}

function renderAxisLabels() {
  var xAxis = document.getElementById('xAxis');
  var yAxis = document.getElementById('yAxis');
  xAxis.innerHTML = '';
  yAxis.innerHTML = '';

  for (var x = 1; x <= COLS; x++) {
    var xLabel = document.createElement('div');
    xLabel.className = 'axis-label';
    xLabel.textContent = x;
    xAxis.appendChild(xLabel);
  }

  for (var y = 1; y <= ROWS; y++) {
    var yLabel = document.createElement('div');
    yLabel.className = 'axis-label';
    yLabel.textContent = y;
    yAxis.appendChild(yLabel);
  }
}

function onCellClick(row, col) {
  return function() {
    handleClick(row, col);
  };
}

function onCellEnter(row, col) {
  return function() {
    handleMouseEnter(row, col);
  };
}

function onCellLeave() {
  handleMouseLeave();
}

function handleClick(row, col) {
  consumeHintOnAction();
  if (!board[row][col] || board[row][col] === '') return;

  removeTempLine();
  var cell = getCell(row, col);

  if (selected) {
    var sr = selected[0];
    var sc = selected[1];

    if (sr === row && sc === col) {
      cell.classList.remove('selected');
      selected = null;
      return;
    }

    var path = window.findPath(sr, sc, row, col);
    if (path) {
      if (board[sr][sc] === board[row][col]) {
        if (window.playSuccessSfx) {
          window.playSuccessSfx();
        }
        drawLine(path);
        setTimeout(function() {
          removeLine();
          board[sr][sc] = '';
          board[row][col] = '';
          getCell(sr, sc).innerHTML = '';
          getCell(sr, sc).className = 'cell empty';
          getCell(row, col).innerHTML = '';
          getCell(row, col).className = 'cell empty';
          window.setBoard(board);
          pairs--;
          score += 10;
          window.setPairs(pairs);
          window.setScore(score);
          window.updateInfo();
          resetTimer();

          if (pairs === 0) {
            if (isBoardCleared()) {
              showGameOver();
            } else {
              checkAndReshuffleIfNeeded();
            }
          } else {
            checkAndReshuffleIfNeeded();
          }
        }, 300);
      } else {
        if (window.playFailSfx) {
          window.playFailSfx();
        }
        drawLine(path, false, true);
        setTimeout(function() {
          removeLine();
        }, 300);
        resetTimer();
      }
    } else {
      if (window.playFailSfx) {
        window.playFailSfx();
      }
    }

    var prevCell = getCell(sr, sc);
    prevCell.classList.remove('selected');
    cell.classList.remove('selected');
    selected = null;
  } else {
    selected = [row, col];
    cell.classList.add('selected');
  }
}

function handleMouseEnter(row, col) {
  if (!selected || !board[row][col]) return;
  var sr = selected[0];
  var sc = selected[1];
  if (sr === row && sc === col) return;

  lastMouseRow = row;
  lastMouseCol = col;

  var tempPath = window.findPath(sr, sc, row, col);
  if (tempPath) {
    drawLine(tempPath, true);
    tempLine = tempPath;
  }
}

function handleMouseLeave() {
  lastMouseRow = -1;
  lastMouseCol = -1;
  removeTempLine();
}

function removeTempLine() {
  document.querySelectorAll('.line:not(.hint)').forEach(function(el) { el.remove(); });
  tempLine = null;
}

function getCell(row, col) {
  return document.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
}

function getBoardMetrics() {
  if (cachedMetrics) {
    return cachedMetrics;
  }
  var boardRect = document.getElementById('gameBoard').getBoundingClientRect();
  var firstCell = getCell(0, 0);
  if (!firstCell) {
    return { originX: 20, originY: 20, stepX: 42, stepY: 42 };
  }
  var cellRect = firstCell.getBoundingClientRect();
  var style = window.getComputedStyle(document.getElementById('gameBoard'));
  var colGap = parseFloat(style.columnGap) || 0;
  var rowGap = parseFloat(style.rowGap) || 0;
  cachedMetrics = {
    originX: cellRect.left - boardRect.left + cellRect.width / 2,
    originY: cellRect.top - boardRect.top + cellRect.height / 2,
    stepX: cellRect.width + colGap,
    stepY: cellRect.height + rowGap
  };
  return cachedMetrics;
}

function getCellPos(row, col) {
  var metrics = getBoardMetrics();
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
    return {
      x: metrics.originX + col * metrics.stepX,
      y: metrics.originY + row * metrics.stepY
    };
  }
  var x, y;
  if (col < 0) {
    x = metrics.originX - metrics.stepX;
  } else if (col >= COLS) {
    x = metrics.originX + COLS * metrics.stepX;
  } else {
    x = metrics.originX + col * metrics.stepX;
  }
  if (row < 0) {
    y = metrics.originY - metrics.stepY;
  } else if (row >= ROWS) {
    y = metrics.originY + ROWS * metrics.stepY;
  } else {
    y = metrics.originY + row * metrics.stepY;
  }
  return { x: x, y: y };
}

function drawLine(path, isTemp, isError, isHint) {
  var gameBoard = document.getElementById('gameBoard');
  var color;
  var lineClass = 'line';
  if (isError) {
    color = '#ff0000';
  } else if (isHint) {
    color = '#ffff00';
    lineClass = 'line hint';
  } else {
    color = '#2196f3';
  }

  for (var i = 0; i < path.length - 1; i++) {
    var pr = path[i][0];
    var pc = path[i][1];
    var nr = path[i+1][0];
    var nc = path[i+1][1];
    var pos1 = getCellPos(pr, pc);
    var pos2 = getCellPos(nr, nc);
    createLineSegment(gameBoard, pos1.x, pos1.y, pos2.x, pos2.y, color, lineClass);
  }
}

function createLineSegment(gameBoard, x1, y1, x2, y2, color, lineClass) {
  var line = document.createElement('div');
  line.className = lineClass;
  line.style.background = color;
  var length = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
  var angle = Math.atan2(y2-y1, x2-x1);
  line.style.position = 'absolute';
  line.style.left = (x1 - 2) + 'px';
  line.style.top = (y1 - 2) + 'px';
  line.style.width = length + 'px';
  line.style.height = '4px';
  line.style.transformOrigin = '0 2px';
  line.style.transform = 'rotate(' + angle + 'rad)';
  gameBoard.appendChild(line);
}

function removeLine() {
  removeTempLine();
}

function handleTestEliminateClick() {
  if (isEliminating) return;
  consumeHintOnAction();
  var allPairs = window.findAllPairs();
  if (allPairs.length === 0) {
    return;
  }
  var p = allPairs[0];
  var path = window.findPath(p.r1, p.c1, p.r2, p.c2);
  if (path) {
    if (window.playSuccessSfx) {
      window.playSuccessSfx();
    }
    drawLine(path);
    isEliminating = true;
    var r1 = p.r1, c1 = p.c1, r2 = p.r2, c2 = p.c2;
    setTimeout(function() {
      removeLine();
      board[r1][c1] = '';
      board[r2][c2] = '';
      getCell(r1, c1).innerHTML = '';
      getCell(r1, c1).className = 'cell empty';
      getCell(r2, c2).innerHTML = '';
      getCell(r2, c2).className = 'cell empty';
      window.setBoard(board);
      pairs--;
      score += 10;
      window.setPairs(pairs);
      window.setScore(score);
      window.updateInfo();
      resetTimer();

      if (pairs === 0) {
        if (isBoardCleared()) {
          showGameOver();
        } else {
          checkAndReshuffleIfNeeded();
        }
      } else {
        checkAndReshuffleIfNeeded();
      }
      isEliminating = false;
    }, 300);
  }
}

function handleEliminateAllClick() {
  consumeHintOnAction();
  var beforePairs = window.getPairs();
  window.eliminateAll();
  board = window.getBoard();
  pairs = window.getPairs();
  score = window.getScore();
  var eliminatedCount = beforePairs - pairs;

  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      var cell = getCell(i, j);
      if (board[i][j] === '') {
        cell.innerHTML = '';
        cell.className = 'cell empty';
      }
    }
  }

  if (pairs === 0) {
    if (isBoardCleared()) {
      showGameOver();
    } else {
      checkAndReshuffleIfNeeded();
    }
  } else {
    checkAndReshuffleIfNeeded();
  }

  if (eliminatedCount > 1) {
    resetTimer();
  }
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerValue = 5;
  document.getElementById('timer').textContent = '\u23f0 ' + timerValue;
  timerInterval = setInterval(function() {
    timerValue--;
    document.getElementById('timer').textContent = '\u23f0 ' + timerValue;
    if (timerValue <= 0) {
      clearInterval(timerInterval);
      showHint();
      timerValue = 5;
      document.getElementById('timer').textContent = '\u23f0 ' + timerValue;
    }
  }, 1000);
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerValue = 5;
  document.getElementById('timer').textContent = '\u23f0 ' + timerValue;
  startTimer();
}

function showHint() {
  var pairsList = window.findAllPairs();
  if (pairsList.length > 0) {
    var idx = Math.floor(Math.random() * pairsList.length);
    var hint = pairsList[idx];
    drawLine(hint.path, false, false, true);
    hintLine = hint.path;
  }
}

function removeHint() {
  document.querySelectorAll('.hint').forEach(function(el) {
    el.remove();
  });
  hintLine = null;
}

function consumeHintOnAction() {
  if (hintLine) {
    removeHint();
    resetTimer();
  }
}

function onBoardClick() {
  if (selected) {
    var sr = selected[0];
    var sc = selected[1];
    selected = null;
    var prevCell = getCell(sr, sc);
    if (prevCell) {
      prevCell.classList.remove('selected');
    }
  }
  resetTimer();
}

function showGameOver() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('finalScore').textContent = '得分: ' + score;
  document.getElementById('message').style.display = 'block';
}

function isBoardCleared() {
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      if (board[i][j] && board[i][j] !== '') {
        return false;
      }
    }
  }
  return true;
}

function restartGame() {
  removeHint();
  setupGameUI();
  resetTimer();
}

function checkAndReshuffleIfNeeded() {
  if (reshuffleConfirmShown) return;
  if (!isBoardCleared() && !window.hasAvailablePairs()) {
    reshuffleConfirmShown = true;
    var confirmMsg = document.getElementById('reshuffleConfirm');
    if (!confirmMsg) {
      confirmMsg = document.createElement('div');
      confirmMsg.id = 'reshuffleConfirm';
      confirmMsg.innerHTML = '<div>无可消除的对，是否重排?</div><button id="reshuffleConfirmBtn">确认</button>';
      document.body.appendChild(confirmMsg);
    }
    document.getElementById('reshuffleConfirmBtn').onclick = function() {
      window.reshuffleRemaining();
      board = window.getBoard();
      renderBoard();
      window.setBoard(board);
      reshuffleConfirmShown = false;
      document.getElementById('reshuffleConfirm').style.display = 'none';
      resetTimer();
    };
    confirmMsg.style.display = 'block';
  }
}

function renderBoard() {
  var gameBoard = document.getElementById('gameBoard');
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      var cell = getCell(i, j);
      if (board[i][j] && board[i][j] !== '') {
        cell.innerHTML = '<img src="' + board[i][j] + '" alt="guo">';
        cell.className = 'cell';
      } else {
        cell.innerHTML = '';
        cell.className = 'cell empty';
      }
    }
  }
}

setupGameUI();
refreshSfxButton();
startTimer();
