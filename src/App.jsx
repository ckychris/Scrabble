import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import dictionaryData from './data/cantoneseDictionary.json';
import { Board, getBoardMultiplier } from './components/Board';
import { Rack } from './components/Rack';
import { Tile } from './components/Tile';
import sound from './components/SoundSynth';

// Dynamic Tile Bag Generator
function createTileBag(dictionary) {
    const charFrequency = {};
    const charJyutping = {};

    // Calculate frequencies and store Jyutping mapping
    dictionary.forEach(entry => {
        const word = entry.variant;
        // Break down pronunciation by character
        const jyutpingList = entry.jyutping.split(/\s+/);
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            charFrequency[char] = (charFrequency[char] || 0) + 1;
            if (jyutpingList[i]) {
                charJyutping[char] = jyutpingList[i];
            } else {
                charJyutping[char] = charJyutping[char] || '';
            }
        }
    });

    const bag = [];
    let tileIdCounter = 0;

    Object.keys(charFrequency).forEach(char => {
        const freq = charFrequency[char];
        const jyutping = charJyutping[char] || '';
        
        // Dynamic Point Calculations:
        // Frequent characters = 1 pt. Medium = 2-3 pts. Rare = 4-5 pts.
        let points = 1;
        if (freq === 1) points = 5;
        else if (freq === 2) points = 4;
        else if (freq <= 5) points = 3;
        else if (freq <= 10) points = 2;
        else points = 1;

        // Repeat characters in the bag to make a robust set of ~100 tiles
        // High frequency characters get duplicated more so players can form words easily
        const duplicates = Math.max(1, Math.min(6, freq));

        for (let i = 0; i < duplicates; i++) {
            bag.push({
                id: `tile-${tileIdCounter++}`,
                char,
                jyutping,
                points
            });
        }
    });

    // Shuffle the bag (Fisher-Yates)
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    return bag;
}

const BOARD_SIZE = 11;

function App() {
    const [dictionary, setDictionary] = useState(dictionaryData);
    const [tileBag, setTileBag] = useState([]);
    const [board, setBoard] = useState(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    
    // Players States
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [scores, setScores] = useState({ 1: 0, 2: 0 });
    const [racks, setRacks] = useState({ 1: [], 2: [] });
    
    // UI/Interaction States
    const [selectedTileId, setSelectedTileId] = useState(null);
    const [placementsThisTurn, setPlacementsThisTurn] = useState([]);
    const [isRackHidden, setIsRackHidden] = useState(false);
    const [showInterstitial, setShowInterstitial] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [activeDragId, setActiveDragId] = useState(null);
    
    // Feedback Modals / Alerts
    const [alertMessage, setAlertMessage] = useState(null);
    const [wordModal, setWordModal] = useState({ isOpen: false, word: '', jyutping: '', eng: '', score: 0, isBingo: false });
    const [history, setHistory] = useState([]);
    const [gameWinner, setGameWinner] = useState(null);
    const [consecutivePasses, setConsecutivePasses] = useState(0);

    // Initial setup on mount
    useEffect(() => {
        const bag = createTileBag(dictionary);
        
        // Deal 7 tiles to each player
        const rack1 = bag.splice(0, 7);
        const rack2 = bag.splice(0, 7);

        setTileBag(bag);
        setRacks({ 1: rack1, 2: rack2 });
    }, [dictionary]);

    // Triggers self-clearing alerts
    const triggerAlert = (msg) => {
        setAlertMessage(msg);
        if (soundEnabled) sound.playIncorrect();
        setTimeout(() => setAlertMessage(null), 3000);
    };

    // DRAG AND DROP HANDLERS
    const handleDragStart = (event) => {
        if (soundEnabled) sound.playTick();
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = (event) => {
        setActiveDragId(null);
        const { active, over } = event;
        if (!over) return;

        const activeTileData = active.data.current;
        const overId = over.id;

        // Dropped back onto the rack
        if (overId === 'rack-droppable' || over.data.current?.isRack) {
            // If it was already on the board, return it to the rack
            if (!activeTileData.isRackTile) {
                returnTileToRack(activeTileData.id);
            }
            return;
        }

        // Dropped on a board square
        if (overId.startsWith('board-')) {
            const [, rowStr, colStr] = overId.split('-');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);

            // Make sure square is empty
            if (board[row][col] !== null) {
                triggerAlert("Square is already occupied! 該位置已有字牌");
                return;
            }

            if (soundEnabled) sound.playPlace();
            placeTileOnBoard(activeTileData, row, col);
        }
    };

    // Helper: Move tile from rack or other board cell onto board cell (row, col)
    const placeTileOnBoard = (tileData, row, col) => {
        const tileId = tileData.id;

        setBoard(prev => {
            const next = prev.map(r => [...r]);
            
            // Clear original position if it was already placed on the board
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (next[r][c]?.id === tileId) {
                        next[r][c] = null;
                    }
                }
            }

            // Put in new position
            next[row][col] = {
                id: tileData.id,
                char: tileData.char,
                jyutping: tileData.jyutping,
                points: tileData.points,
                isNew: true
            };
            return next;
        });

        // Update placements log
        setPlacementsThisTurn(prev => {
            // Remove previous placement for this tile ID if any
            const filtered = prev.filter(p => p.id !== tileId);
            return [...filtered, {
                id: tileData.id,
                char: tileData.char,
                jyutping: tileData.jyutping,
                points: tileData.points,
                row,
                col
            }];
        });

        // If it came from the active player's rack, remove it from the rack
        if (tileData.isRackTile) {
            setRacks(prev => ({
                ...prev,
                [currentPlayer]: prev[currentPlayer].filter(t => t.id !== tileId)
            }));
            setSelectedTileId(null);
        }
    };

    // Helper: Return a new placement from board back to active rack
    const returnTileToRack = (tileId) => {
        let tileObject = null;

        // Find the tile on the board
        setBoard(prev => {
            const next = prev.map(r => [...r]);
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (next[r][c]?.id === tileId) {
                        tileObject = {
                            id: next[r][c].id,
                            char: next[r][c].char,
                            jyutping: next[r][c].jyutping,
                            points: next[r][c].points
                        };
                        next[r][c] = null;
                    }
                }
            }
            return next;
        });

        if (tileObject) {
            if (soundEnabled) sound.playRecall();
            // Return to rack
            setRacks(prev => ({
                ...prev,
                [currentPlayer]: [...prev[currentPlayer], tileObject]
            }));

            // Remove from placements log
            setPlacementsThisTurn(prev => prev.filter(p => p.id !== tileId));
        }
    };

    // CLICK-TO-PLACE INTERACTION (Alternative / Mobile Fallback)
    const handleTileClick = (tile, isRackTile) => {
        if (soundEnabled) sound.playTick();
        if (isRackTile) {
            setSelectedTileId(tile.id === selectedTileId ? null : tile.id);
        } else {
            // Clicking a placed tile returns it to the rack
            returnTileToRack(tile.id);
        }
    };

    const handleSquareClick = (row, col) => {
        if (selectedTileId) {
            const activeRack = racks[currentPlayer];
            const tileToPlace = activeRack.find(t => t.id === selectedTileId);
            
            if (tileToPlace) {
                if (board[row][col] !== null) {
                    triggerAlert("Square is already occupied! 該位置已有字牌");
                    return;
                }
                if (soundEnabled) sound.playPlace();
                placeTileOnBoard({ ...tileToPlace, isRackTile: true }, row, col);
            }
        }
    };

    // RECALL ALL TILES
    const handleRecall = () => {
        if (placementsThisTurn.length === 0) return;
        if (soundEnabled) sound.playRecall();

        // Put all new tiles back on the rack
        const tilesToReturn = placementsThisTurn.map(p => ({
            id: p.id,
            char: p.char,
            jyutping: p.jyutping,
            points: p.points
        }));

        setRacks(prev => ({
            ...prev,
            [currentPlayer]: [...prev[currentPlayer], ...tilesToReturn]
        }));

        // Clear board cells
        setBoard(prev => {
            const next = prev.map(r => [...r]);
            placementsThisTurn.forEach(p => {
                next[p.row][p.col] = null;
            });
            return next;
        });

        setPlacementsThisTurn([]);
        setSelectedTileId(null);
    };

    // PASS TURN
    const handlePass = () => {
        if (soundEnabled) sound.playTick();
        // Return any placed tiles first
        handleRecall();

        const nextPassCount = consecutivePasses + 1;
        setConsecutivePasses(nextPassCount);

        // If both pass consecutively, check game over
        if (nextPassCount >= 2) {
            endGame();
        } else {
            transitionTurn();
        }
    };

    // TURN TRANSITION CONTROL
    const transitionTurn = () => {
        setIsRackHidden(true);
        setShowInterstitial(true);
    };

    const startNextTurn = () => {
        if (soundEnabled) sound.playTick();
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        setShowInterstitial(false);
        setIsRackHidden(false);
    };

    // WORD SUBMISSION AND VALIDATION
    const handleSubmit = () => {
        if (placementsThisTurn.length === 0) {
            triggerAlert("You haven't placed any tiles yet! 您尚未放置字牌");
            return;
        }

        // 1. STRAIGHT LINE CHECK
        const rows = placementsThisTurn.map(p => p.row);
        const cols = placementsThisTurn.map(p => p.col);
        const uniqueRows = [...new Set(rows)];
        const uniqueCols = [...new Set(cols)];

        const isHorizontal = uniqueRows.length === 1;
        const isVertical = uniqueCols.length === 1;

        if (!isHorizontal && !isVertical) {
            triggerAlert("Placed tiles must be in a single straight line! 放置的字牌必須在一直線上");
            return;
        }

        // Determine orientation
        const commonRow = isHorizontal ? uniqueRows[0] : null;
        const commonCol = isVertical ? uniqueCols[0] : null;

        // 2. CONNECTIVITY & FIRST TURN CHECK
        let isFirstTurn = true;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] !== null && !board[r][c].isNew) {
                    isFirstTurn = false;
                    break;
                }
            }
        }

        if (isFirstTurn) {
            // First word must cover the center star (5, 5)
            const coversCenter = placementsThisTurn.some(p => p.row === 5 && p.col === 5);
            if (!coversCenter) {
                triggerAlert("The first word must touch the Center Star (5,5)! 首詞必須觸及中心星位");
                return;
            }
        } else {
            // Must touch at least one pre-existing tile
            let touchesExisting = false;
            placementsThisTurn.forEach(p => {
                const adjacents = [
                    [p.row - 1, p.col],
                    [p.row + 1, p.col],
                    [p.row, p.col - 1],
                    [p.row, p.col + 1]
                ];
                adjacents.forEach(([r, c]) => {
                    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                        const tile = board[r][c];
                        if (tile !== null && !tile.isNew) {
                            touchesExisting = true;
                        }
                    }
                });
            });

            if (!touchesExisting) {
                triggerAlert("Your tiles must connect to an existing word! 字牌必須連接到已提交的詞語");
                return;
            }
        }

        // 3. CONTIGUITY / GAP CHECK
        // Validate that there are no empty gaps in the placed sequence
        if (isHorizontal) {
            const minCol = Math.min(...cols);
            const maxCol = Math.max(...cols);
            for (let c = minCol; c <= maxCol; c++) {
                if (board[commonRow][c] === null) {
                    triggerAlert("Word cannot contain gaps! 詞語之間不能有空隙");
                    return;
                }
            }
        } else {
            const minRow = Math.min(...rows);
            const maxRow = Math.max(...rows);
            for (let r = minRow; r <= maxRow; r++) {
                if (board[r][commonCol] === null) {
                    triggerAlert("Word cannot contain gaps! 詞語之間不能有空隙");
                    return;
                }
            }
        }

        // 4. SCAN FOR ALL FORMED WORDS
        const uniqueFormedWords = [];

        // Full grid word scanner helper
        const scanWordAt = (r, c, direction) => {
            let wordChars = [];
            let wordCoords = [];

            if (direction === 'horizontal') {
                // Find start column
                let startCol = c;
                while (startCol > 0 && board[r][startCol - 1] !== null) {
                    startCol--;
                }
                // Find end column
                let endCol = c;
                while (endCol < BOARD_SIZE - 1 && board[r][endCol + 1] !== null) {
                    endCol++;
                }

                if (endCol - startCol >= 1) { // Length >= 2
                    for (let col = startCol; col <= endCol; col++) {
                        const tile = board[r][col];
                        wordChars.push(tile.char);
                        wordCoords.push({ row: r, col, tile });
                    }
                }
            } else {
                // Find start row
                let startRow = r;
                while (startRow > 0 && board[startRow - 1][c] !== null) {
                    startRow--;
                }
                // Find end row
                let endRow = r;
                while (endRow < BOARD_SIZE - 1 && board[endRow + 1][c] !== null) {
                    endRow++;
                }

                if (endRow - startRow >= 1) { // Length >= 2
                    for (let row = startRow; row <= endRow; row++) {
                        const tile = board[row][c];
                        wordChars.push(tile.char);
                        wordCoords.push({ row, col: c, tile });
                    }
                }
            }

            if (wordChars.length >= 2) {
                const wordString = wordChars.join('');
                const coordKey = direction === 'horizontal' 
                    ? `h-${r}-${wordCoords[0].col}` 
                    : `v-${wordCoords[0].row}-${c}`;
                
                return {
                    word: wordString,
                    coords: wordCoords,
                    key: coordKey
                };
            }
            return null;
        };

        // Scan both horizontally and vertically for each placement
        const foundWordMap = {};
        placementsThisTurn.forEach(p => {
            const hWord = scanWordAt(p.row, p.col, 'horizontal');
            const vWord = scanWordAt(p.row, p.col, 'vertical');

            if (hWord) foundWordMap[hWord.key] = hWord;
            if (vWord) foundWordMap[vWord.key] = vWord;
        });

        const formedWords = Object.values(foundWordMap);

        if (formedWords.length === 0) {
            triggerAlert("Placed tiles must form a word! 放置的字牌必須組合成詞");
            return;
        }

        // 5. DICTIONARY COMPARISON MATCH
        const validatedWords = [];
        for (const formed of formedWords) {
            const match = dictionary.find(d => d.variant === formed.word);
            if (!match) {
                triggerAlert(`"${formed.word}" is not a valid Cantonese word! "${formed.word}" 不是合法的粵語詞彙`);
                return;
            }
            validatedWords.push({
                ...formed,
                jyutping: match.jyutping,
                eng: match.eng
            });
        }

        // 6. SCORING METHOD MATH
        let turnScore = 0;

        validatedWords.forEach(wordObj => {
            let wordMultiplier = 1;
            let wordPoints = 0;

            wordObj.coords.forEach(coord => {
                const tile = coord.tile;
                let charScore = tile.points;

                // Modifiers are ONLY applied on newly placed tiles
                if (tile.isNew) {
                    const mult = getBoardMultiplier(coord.row, coord.col);
                    if (mult === 'DL') charScore *= 2;
                    else if (mult === 'TL') charScore *= 3;
                    else if (mult === 'DW') wordMultiplier *= 2;
                    else if (mult === 'TW') wordMultiplier *= 3;
                }

                wordPoints += charScore;
            });

            turnScore += wordPoints * wordMultiplier;
        });

        // BINGO BONUS: Place all 7 tiles = +50 points
        const isBingo = placementsThisTurn.length === 7;
        if (isBingo) {
            turnScore += 50;
        }

        // 7. STATE SUCCESS SUBMISSION WRITING
        // Lock tiles as permanent on the board
        setBoard(prev => {
            const next = prev.map(r => [...r]);
            placementsThisTurn.forEach(p => {
                if (next[p.row][p.col]) {
                    next[p.row][p.col].isNew = false;
                }
            });
            return next;
        });

        // Add Score to Active Player
        setScores(prev => ({
            ...prev,
            [currentPlayer]: prev[currentPlayer] + turnScore
        }));

        // Refill player rack
        const rackRefillCount = 7 - racks[currentPlayer].length;
        const newBag = [...tileBag];
        const newRackTiles = newBag.splice(0, rackRefillCount);

        setTileBag(newBag);
        setRacks(prev => ({
            ...prev,
            [currentPlayer]: [...prev[currentPlayer], ...newRackTiles]
        }));

        // Play correct indicator sound
        if (soundEnabled) {
            isBingo ? sound.playVictory() : sound.playCorrect();
        }

        // Log to history logs
        const loggedWords = validatedWords.map(w => `${w.word} (${w.jyutping})`);
        setHistory(prev => [
            {
                player: currentPlayer,
                words: loggedWords.join(', '),
                score: turnScore,
                bingo: isBingo
            },
            ...prev
        ]);

        // Open Modal celebratory pop-up showing first validated word
        const primaryWord = validatedWords[0];
        setWordModal({
            isOpen: true,
            word: primaryWord.word,
            jyutping: primaryWord.jyutping,
            eng: primaryWord.eng,
            score: turnScore,
            isBingo
        });

        // Clear placements log
        setPlacementsThisTurn([]);
        setConsecutivePasses(0);
        setSelectedTileId(null);
    };

    // GAME END TRIGGERS
    const endGame = () => {
        let finalScores = { ...scores };
        
        // Subtract remaining tiles in racks from scores
        const rack1Val = racks[1].reduce((sum, t) => sum + t.points, 0);
        const rack2Val = racks[2].reduce((sum, t) => sum + t.points, 0);
        
        finalScores[1] = Math.max(0, finalScores[1] - rack1Val);
        finalScores[2] = Math.max(0, finalScores[2] - rack2Val);

        setScores(finalScores);

        let winner = 0;
        if (finalScores[1] > finalScores[2]) winner = 1;
        else if (finalScores[2] > finalScores[1]) winner = 2;
        else winner = 'TIE';

        setGameWinner(winner);
        if (soundEnabled) sound.playVictory();
    };

    const handleRestart = () => {
        if (soundEnabled) sound.playTick();
        const bag = createTileBag(dictionary);
        const rack1 = bag.splice(0, 7);
        const rack2 = bag.splice(0, 7);

        setTileBag(bag);
        setRacks({ 1: rack1, 2: rack2 });
        setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
        setScores({ 1: 0, 2: 0 });
        setCurrentPlayer(1);
        setPlacementsThisTurn([]);
        setConsecutivePasses(0);
        setHistory([]);
        setGameWinner(null);
        setWordModal({ isOpen: false, word: '', jyutping: '', eng: '', score: 0, isBingo: false });
        setSelectedTileId(null);
    };

    // Custom Vocabulary Loading helper
    const handleDictionaryUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data) && data.length > 0 && data[0].variant && data[0].jyutping) {
                    setDictionary(data);
                    triggerAlert(`Loaded custom dictionary! (${data.length} entries)`);
                    handleRestart();
                } else {
                    triggerAlert("Invalid JSON dictionary format! 格式錯誤");
                }
            } catch (err) {
                triggerAlert("Error parsing file! 無法解析檔案");
            }
        };
        reader.readAsText(file);
    };

    // Renders draggable/click-place tile
    const renderTile = (tile, isRackTile, isSelected) => {
        return (
            <Tile
                key={tile.id}
                id={tile.id}
                char={tile.char}
                jyutping={tile.jyutping}
                points={tile.points}
                isRackTile={isRackTile}
                isSelected={isSelected}
                onClick={() => handleTileClick(tile, isRackTile)}
            />
        );
    };

    const activeTileData = activeDragId 
        ? [...racks[1], ...racks[2], ...board.flat().filter(Boolean)].find(t => t.id === activeDragId)
        : null;

    return (
        <DndContext 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="scrabble-app-container">
                {/* Visual Glow Blobs */}
                <div className="glow-blob glow-left"></div>
                <div className="glow-blob glow-right"></div>

                <div className="game-wrapper-grid">
                    
                    {/* LEFT PANEL: BOARD & CONTROLS */}
                    <div className="left-game-panel">
                        {/* Title & Stats */}
                        <header className="game-main-header">
                            <div className="title-wrapper">
                                <h1>粵拼拼字</h1>
                                <span className="subtitle">Cantonese Scrabble</span>
                            </div>

                            {/* Sound Synth toggle */}
                            <button 
                                className={`btn-text btn-sound ${soundEnabled ? 'active' : ''}`}
                                onClick={() => setSoundEnabled(!soundEnabled)}
                            >
                                {soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off"}
                            </button>
                        </header>

                        {/* Interactive Alerts */}
                        {alertMessage && (
                            <div className="game-alert-banner shake">
                                <span>⚠️ {alertMessage}</span>
                            </div>
                        )}

                        {/* Main Board */}
                        <Board 
                            boardState={board}
                            onSquareClick={handleSquareClick}
                            renderTile={renderTile}
                        />

                        {/* Rack Panel */}
                        <Rack
                            tiles={racks[currentPlayer]}
                            selectedTileId={selectedTileId}
                            renderTile={renderTile}
                            isHidden={isRackHidden}
                            onToggleHide={() => setIsRackHidden(!isRackHidden)}
                        />

                        {/* Actions Panel */}
                        <div className="action-buttons-wrapper">
                            <button className="btn-game btn-recall" onClick={handleRecall}>
                                🔄 Recall All Tiles • 重收
                            </button>
                            <button className="btn-game btn-pass" onClick={handlePass}>
                                ⏭️ Pass • 跳過
                            </button>
                            <button className="btn-game btn-submit-game" onClick={handleSubmit}>
                                ⚡ Submit Word • 提交詞語
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: SCOREBOARD & DICTIONARY LOOKUP */}
                    <div className="right-game-panel">
                        {/* Score Card */}
                        <div className="score-card-panel">
                            <h3>Scoreboard • 計分板</h3>
                            <div className="player-scores-flex">
                                <div className={`score-box player-1 ${currentPlayer === 1 ? 'active-turn' : ''}`}>
                                    <span className="player-title">Player 1 {currentPlayer === 1 ? "⚡" : ""}</span>
                                    <div className="player-points">{scores[1]}</div>
                                    <span className="rack-count-sub">{racks[1].length} tiles left</span>
                                </div>
                                <div className={`score-box player-2 ${currentPlayer === 2 ? 'active-turn' : ''}`}>
                                    <span className="player-title">Player 2 {currentPlayer === 2 ? "⚡" : ""}</span>
                                    <div className="player-points">{scores[2]}</div>
                                    <span className="rack-count-sub">{racks[2].length} tiles left</span>
                                </div>
                            </div>

                            <div className="bag-tile-stats">
                                <span>🎒 Remaining Bag Tiles: <strong>{tileBag.length}</strong></span>
                            </div>
                        </div>

                        {/* Word History logs */}
                        <div className="score-card-panel log-history-panel">
                            <h3>Play Log • 拼字記錄</h3>
                            <div className="logs-scroller">
                                {history.length === 0 ? (
                                    <div className="empty-logs">No words submitted yet.</div>
                                ) : (
                                    history.map((h, i) => (
                                        <div key={i} className="log-row">
                                            <span className={`log-player p-${h.player}`}>P{h.player}</span>
                                            <span className="log-words">{h.words}</span>
                                            <span className="log-score">+{h.score} pts {h.bingo && "🔥 Bingo!"}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Dictionary Custom Panel */}
                        <div className="score-card-panel settings-panel-box">
                            <h3>Game Options • 設定</h3>
                            
                            <div className="custom-file-upload">
                                <label className="file-label">
                                    📁 Load Custom Dictionary JSON
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        onChange={handleDictionaryUpload} 
                                    />
                                </label>
                                <p className="file-help">Upload a custom dictionary JSON in the words-hk inspired schema format.</p>
                            </div>
                            
                            <button className="btn-game btn-restart" onClick={handleRestart}>
                                ⚠️ Reset Game • 重開新局
                            </button>
                        </div>
                    </div>

                </div>

                {/* TRANSITION OVERLAY: PASS AND PLAY */}
                {showInterstitial && (
                    <div className="turn-overlay-interstitial">
                        <div className="interstitial-card">
                            <h2>Player {currentPlayer === 1 ? "1" : "2"}'s Turn is Complete!</h2>
                            <p>Please pass the device to **Player {currentPlayer === 1 ? "2" : "1"}`**.</p>
                            
                            <div className="security-notice-blur">
                                <span>🔒 Opponent tiles are currently secured</span>
                            </div>

                            <button className="btn-primary-interstitial" onClick={startNextTurn}>
                                Start Player {currentPlayer === 1 ? "2" : "1"}'s Turn ⚡
                            </button>
                        </div>
                    </div>
                )}

                {/* WORD CELEBRATION MODAL */}
                {wordModal.isOpen && (
                    <div className="celebration-modal-overlay">
                        <div className="celebration-card animate-zoom">
                            {wordModal.isBingo && <div className="bingo-badge">🔥 BINGO (+50)</div>}
                            <span className="celebration-sparkles">✨ 合法詞語 ✨</span>
                            <h2 className="celebration-word">{wordModal.word}</h2>
                            <p className="celebration-jyutping">{wordModal.jyutping}</p>
                            <p className="celebration-eng">{wordModal.eng}</p>

                            <div className="celebration-score-box">
                                <span className="score-label">Turn Score</span>
                                <span className="score-num">+{wordModal.score} PTS</span>
                            </div>

                            <button 
                                className="btn-celebration-close" 
                                onClick={() => {
                                    if (soundEnabled) sound.playTick();
                                    setWordModal(prev => ({ ...prev, isOpen: false }));
                                    transitionTurn();
                                }}
                            >
                                Continue Turn ⏭️
                            </button>
                        </div>
                    </div>
                )}

                {/* GAME OVER WINNER MODAL */}
                {gameWinner && (
                    <div className="celebration-modal-overlay game-over-overlay">
                        <div className="celebration-card game-over-card">
                            <span className="celebration-sparkles">🏁 遊戲結束 🏁</span>
                            <h2>Game Over!</h2>
                            
                            {gameWinner === 'TIE' ? (
                                <h3 className="winner-declaration">It's a Tie! 平局 🤝</h3>
                            ) : (
                                <h3 className="winner-declaration">Player {gameWinner} Wins! 獲勝 🏆</h3>
                            )}

                            <div className="final-scoreboard-summary">
                                <div className="final-row">
                                    <span>Player 1 Score:</span>
                                    <strong>{scores[1]}</strong>
                                </div>
                                <div className="final-row">
                                    <span>Player 2 Score:</span>
                                    <strong>{scores[2]}</strong>
                                </div>
                            </div>

                            <button className="btn-celebration-close btn-final-restart" onClick={handleRestart}>
                                Play New Game ⚡
                            </button>
                        </div>
                    </div>
                )}

                {/* DRAG OVERLAY PORTAL */}
                <DragOverlay>
                    {activeDragId && activeTileData ? (
                        <div className="game-tile dragging-overlay">
                            <div className="tile-wood-texture"></div>
                            <span className="tile-jyutping">{activeTileData.jyutping}</span>
                            <span className="tile-char">{activeTileData.char}</span>
                            <span className="tile-points">{activeTileData.points}</span>
                        </div>
                    ) : null}
                </DragOverlay>

            </div>
        </DndContext>
    );
}

export default App;
