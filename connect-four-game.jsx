import React, { useState, useEffect } from 'react';

const ConnectFour = () => {
  const ROWS = 6;
  const COLS = 7;
  const EMPTY = 0;
  const PLAYER = 1;
  const AI = 2;

  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [winningCells, setWinningCells] = useState([]);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    if (gameStarted && currentPlayer === AI && !gameOver) {
      setIsAIThinking(true);
      const timer = setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver && winner === PLAYER) {
      // Generate confetti
      const pieces = [];
      for (let i = 0; i < 100; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          color: ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fde047'][Math.floor(Math.random() * 5)]
        });
      }
      setConfettiPieces(pieces);
      setShowConfetti(true);
      
      // Hide confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
    }
  }, [gameOver, winner]);

  const checkWinner = (board, row, col, player) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    for (let [dx, dy] of directions) {
      const cells = [[row, col]];
      
      // Check forward
      for (let i = 1; i < 4; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
          cells.push([newRow, newCol]);
        } else {
          break;
        }
      }
      
      // Check backward
      for (let i = 1; i < 4; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
          cells.unshift([newRow, newCol]);
        } else {
          break;
        }
      }
      
      if (cells.length >= 4) {
        return cells.slice(0, 4);
      }
    }
    return null;
  };

  const dropPiece = (col, player, testBoard = null, animate = false) => {
    const boardToUse = testBoard || board;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (boardToUse[row][col] === EMPTY) {
        const newBoard = boardToUse.map(r => [...r]);
        newBoard[row][col] = player;
        return { newBoard, row };
      }
    }
    return null;
  };

  const handleColumnClick = async (col) => {
    if (gameOver || currentPlayer === AI || !gameStarted || isAIThinking) return;

    const result = dropPiece(col, PLAYER);
    if (!result) return;

    const { newBoard, row } = result;
    
    setBoard(newBoard);

    const winCells = checkWinner(newBoard, row, col, PLAYER);
    if (winCells) {
      setWinningCells(winCells);
      setWinner(PLAYER);
      setGameOver(true);
      setPlayerScore(prev => prev + 1);
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true);
      return;
    }

    setCurrentPlayer(AI);
  };

  const isBoardFull = (board) => {
    return board[0].every(cell => cell !== EMPTY);
  };

  const getValidColumns = (board) => {
    return Array.from({ length: COLS }, (_, i) => i).filter(col => board[0][col] === EMPTY);
  };

  const evaluateWindow = (window, player) => {
    let score = 0;
    const opponent = player === PLAYER ? AI : PLAYER;
    
    const playerCount = window.filter(cell => cell === player).length;
    const opponentCount = window.filter(cell => cell === opponent).length;
    const emptyCount = window.filter(cell => cell === EMPTY).length;

    if (playerCount === 4) score += 100;
    else if (playerCount === 3 && emptyCount === 1) score += 5;
    else if (playerCount === 2 && emptyCount === 2) score += 2;

    if (opponentCount === 3 && emptyCount === 1) score -= 4;

    return score;
  };

  const scorePosition = (board, player) => {
    let score = 0;

    // Center column preference
    const centerArray = board.map(row => row[Math.floor(COLS / 2)]);
    const centerCount = centerArray.filter(cell => cell === player).length;
    score += centerCount * 3;

    // Horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]];
        score += evaluateWindow(window, player);
      }
    }

    // Vertical
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS - 3; row++) {
        const window = [board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]];
        score += evaluateWindow(window, player);
      }
    }

    // Diagonal (positive slope)
    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]];
        score += evaluateWindow(window, player);
      }
    }

    // Diagonal (negative slope)
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]];
        score += evaluateWindow(window, player);
      }
    }

    return score;
  };

  const minimax = (board, depth, alpha, beta, maximizingPlayer) => {
    const validCols = getValidColumns(board);
    const isTerminal = validCols.length === 0;

    if (depth === 0 || isTerminal) {
      if (isTerminal) {
        if (isBoardFull(board)) return [null, 0];
        return [null, 0];
      } else {
        return [null, scorePosition(board, AI)];
      }
    }

    if (maximizingPlayer) {
      let value = -Infinity;
      let column = validCols[Math.floor(Math.random() * validCols.length)];
      
      for (let col of validCols) {
        const result = dropPiece(col, AI, board);
        if (!result) continue;
        
        const { newBoard, row } = result;
        const winCells = checkWinner(newBoard, row, col, AI);
        
        if (winCells) {
          return [col, 100000];
        }
        
        const newScore = minimax(newBoard, depth - 1, alpha, beta, false)[1];
        if (newScore > value) {
          value = newScore;
          column = col;
        }
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return [column, value];
    } else {
      let value = Infinity;
      let column = validCols[Math.floor(Math.random() * validCols.length)];
      
      for (let col of validCols) {
        const result = dropPiece(col, PLAYER, board);
        if (!result) continue;
        
        const { newBoard, row } = result;
        const winCells = checkWinner(newBoard, row, col, PLAYER);
        
        if (winCells) {
          return [col, -100000];
        }
        
        const newScore = minimax(newBoard, depth - 1, alpha, beta, true)[1];
        if (newScore < value) {
          value = newScore;
          column = col;
        }
        beta = Math.min(beta, value);
        if (alpha >= beta) break;
      }
      return [column, value];
    }
  };

  const makeAIMove = async () => {
    const validCols = getValidColumns(board);
    if (validCols.length === 0) return;

    let col;

    if (difficulty === 'easy') {
      // Random move
      col = validCols[Math.floor(Math.random() * validCols.length)];
    } else if (difficulty === 'medium') {
      // Check for winning move, then blocking move, else random
      let foundMove = false;
      
      // Check for winning move
      for (let testCol of validCols) {
        const result = dropPiece(testCol, AI, board);
        if (result) {
          const { newBoard, row } = result;
          if (checkWinner(newBoard, row, testCol, AI)) {
            col = testCol;
            foundMove = true;
            break;
          }
        }
      }
      
      // Check for blocking move
      if (!foundMove) {
        for (let testCol of validCols) {
          const result = dropPiece(testCol, PLAYER, board);
          if (result) {
            const { newBoard, row } = result;
            if (checkWinner(newBoard, row, testCol, PLAYER)) {
              col = testCol;
              foundMove = true;
              break;
            }
          }
        }
      }
      
      if (!foundMove) {
        col = validCols[Math.floor(Math.random() * validCols.length)];
      }
    } else {
      // Hard: Use minimax algorithm
      [col] = minimax(board, 5, -Infinity, Infinity, true);
    }

    const result = dropPiece(col, AI);
    if (!result) return;

    const { newBoard, row } = result;
    
    setBoard(newBoard);

    const winCells = checkWinner(newBoard, row, col, AI);
    if (winCells) {
      setWinningCells(winCells);
      setWinner(AI);
      setGameOver(true);
      setAiScore(prev => prev + 1);
      return;
    }

    if (isBoardFull(newBoard)) {
      setGameOver(true);
      return;
    }

    setCurrentPlayer(PLAYER);
  };

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER);
    setGameOver(false);
    setWinner(null);
    setWinningCells([]);
    setHoveredCol(null);
    setIsAIThinking(false);
    setShowConfetti(false);
    setConfettiPieces([]);
  };

  const startNewGame = (level) => {
    setDifficulty(level);
    setGameStarted(true);
    resetGame();
  };

  const isWinningCell = (row, col) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  const canDropInColumn = (col) => {
    return board[0][col] === EMPTY;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-3 drop-shadow-lg">CONNECT 4</h1>
          <p className="text-gray-700 text-lg mb-8">Choose your difficulty level</p>
          
          <div className="space-y-3">
            <button
              onClick={() => startNewGame('easy')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              🟢 Easy
              <div className="text-xs mt-1 opacity-80">Random moves</div>
            </button>
            
            <button
              onClick={() => startNewGame('medium')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              🟡 Medium
              <div className="text-xs mt-1 opacity-80">Blocks and attacks</div>
            </button>
            
            <button
              onClick={() => startNewGame('hard')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              🔴 Hard
              <div className="text-xs mt-1 opacity-80">Advanced AI strategy</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center p-4 overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${piece.left}%`,
                top: '-20px',
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30px); }
          60% { transform: translateY(-15px); }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .animate-bounce-win {
          animation: bounce 1s infinite;
        }
      `}</style>

      <div className="max-w-3xl w-full relative pt-12">
        {/* Exit button */}
        <button
          onClick={() => {
            setGameStarted(false);
            setPlayerScore(0);
            setAiScore(0);
            resetGame();
          }}
          className="absolute top-0 left-0 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2 z-50"
        >
          ← Exit
        </button>

        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 drop-shadow-lg">CONNECT 4</h1>
          <div className="flex items-center justify-center gap-3 text-gray-800 text-sm mb-3">
            <span className="bg-yellow-500 px-3 py-1 rounded-lg font-semibold">
              You: {playerScore}
            </span>
            <span className="text-gray-600">vs</span>
            <span className="bg-red-600 px-3 py-1 rounded-lg font-semibold text-white">
              AI ({difficulty}): {aiScore}
            </span>
          </div>

          {/* Game Status - Always visible at top */}
          <div className="min-h-[180px] flex items-center justify-center">
            {isAIThinking && !gameOver && (
              <div className="text-gray-800 text-xl animate-pulse">
                🤖 AI is thinking...
              </div>
            )}
            
            {!gameOver && !isAIThinking && (
              <div className="text-gray-800 text-2xl font-bold">
                {currentPlayer === PLAYER ? '🟡 Your turn' : '🔴 AI\'s turn'}
              </div>
            )}

            {gameOver && (
              <div className="space-y-4">
                <div className={`text-3xl font-bold ${
                  winner === PLAYER ? 'text-yellow-500 animate-bounce-win' : winner === AI ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {winner === PLAYER ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-6xl">🎉</div>
                      <div className="text-4xl">You Won!</div>
                      <div className="text-6xl">🏆</div>
                    </div>
                  ) : winner === AI ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-6xl">😢</div>
                      <div className="text-4xl">You Lost!</div>
                      <div className="text-xl text-red-500">Better luck next time</div>
                    </div>
                  ) : (
                    <div className="text-3xl">It's a Draw!</div>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetGame}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => {
                      setGameStarted(false);
                      setPlayerScore(0);
                      setAiScore(0);
                      resetGame();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    Change Difficulty
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`bg-blue-600 rounded-3xl p-8 shadow-2xl border-8 border-blue-700 mx-auto transition-all ${
          gameOver && winner === AI ? 'animate-shake' : ''
        }`} style={{ maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.2)' }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: COLS }).map((_, col) => (
              <div key={col} className="flex flex-col gap-4">
                <button
                  onClick={() => handleColumnClick(col)}
                  onMouseEnter={() => setHoveredCol(col)}
                  onMouseLeave={() => setHoveredCol(null)}
                  disabled={gameOver || currentPlayer === AI || isAIThinking || !canDropInColumn(col)}
                  className={`h-10 rounded-lg transition-all font-bold text-white ${
                    hoveredCol === col && currentPlayer === PLAYER && !gameOver && !isAIThinking && canDropInColumn(col)
                      ? 'bg-yellow-400 scale-110 shadow-lg'
                      : gameOver || currentPlayer === AI || isAIThinking || !canDropInColumn(col)
                      ? 'bg-blue-500 opacity-40 cursor-not-allowed'
                      : 'bg-blue-500 opacity-70 hover:bg-yellow-300 hover:scale-105 cursor-pointer'
                  }`}
                >
                  ↓
                </button>
                {Array.from({ length: ROWS }).map((_, row) => (
                  <div
                    key={`${row}-${col}`}
                    className={`w-14 h-14 rounded-full transition-all duration-200 ${
                      board[row][col] === EMPTY
                        ? 'bg-white shadow-inner'
                        : board[row][col] === PLAYER
                        ? 'bg-yellow-400 shadow-lg'
                        : 'bg-red-500 shadow-lg'
                    } ${
                      isWinningCell(row, col)
                        ? 'ring-4 ring-green-400 animate-pulse'
                        : ''
                    }`}
                    style={
                      board[row][col] !== EMPTY
                        ? { boxShadow: 'inset -2px -3px 5px rgba(0,0,0,0.3), inset 2px 3px 5px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.3)' }
                        : { boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)' }
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center text-gray-700 text-xs">
          <p>Click on a column to drop your piece</p>
          <p className="mt-1">Connect 4 in a row to win!</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectFour;
