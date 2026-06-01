import { useEffect, useMemo, useRef, useState } from 'react';
import sourceDictData from '../data/sourceDictionary.json';
import sound from '../components/SoundSynth';
import { getBoardMultiplier } from '../components/Board';
import {
  BOARD_SIZE,
  DEFAULT_WORD_INFO_MAP,
  DEFAULT_WORD_SET,
  RACK_SIZE,
  buildWordInfoMap,
  buildWordSet,
  createEmptyBoard,
  createTileBag,
  validateTurnSubmission,
} from '../utils/gameLogic';

export function useGameState() {
  const [tileBag, setTileBag] = useState([]);
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [racks, setRacks] = useState({ 1: [], 2: [] });
  const [customDictionary, setCustomDictionary] = useState(null);

  const scoresRef = useRef({ 1: 0, 2: 0 });
  const racksRef = useRef({ 1: [], 2: [] });

  const [selectedTileId, setSelectedTileId] = useState(null);
  const [placementsThisTurn, setPlacementsThisTurn] = useState([]);
  const [isRackHidden, setIsRackHidden] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeDragId, setActiveDragId] = useState(null);
  const [isExchangeMode, setIsExchangeMode] = useState(false);
  const [exchangeSelected, setExchangeSelected] = useState(new Set());
  const [alertMessage, setAlertMessage] = useState(null);
  const [wordModal, setWordModal] = useState({
    isOpen: false,
    word: '',
    jyutping: '',
    eng: '',
    score: 0,
    isBingo: false,
  });
  const [history, setHistory] = useState([]);
  const [gameWinner, setGameWinner] = useState(null);
  const [endScores, setEndScores] = useState(null);
  const [consecutivePasses, setConsecutivePasses] = useState(0);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    racksRef.current = racks;
  }, [racks]);

  const validationWordSet = useMemo(
    () => (customDictionary ? buildWordSet(customDictionary) : DEFAULT_WORD_SET),
    [customDictionary]
  );

  const validationWordInfoMap = useMemo(
    () => (customDictionary ? buildWordInfoMap(customDictionary) : DEFAULT_WORD_INFO_MAP),
    [customDictionary]
  );

  const triggerAlert = (msg) => {
    setAlertMessage(msg);
    if (soundEnabled) sound.playIncorrect();
    setTimeout(() => setAlertMessage(null), 3000);
  };

  useEffect(() => {
    const bag = createTileBag(sourceDictData);
    const rack1 = bag.splice(0, RACK_SIZE);
    const rack2 = bag.splice(0, RACK_SIZE);
    setTileBag(bag);
    setRacks({ 1: rack1, 2: rack2 });
  }, []);

  const returnTileToRack = (tileId) => {
    let tileObject = null;

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (next[r][c]?.id === tileId) {
            tileObject = {
              id: next[r][c].id,
              char: next[r][c].char,
              jyutping: next[r][c].jyutping,
              points: next[r][c].points,
            };
            next[r][c] = null;
          }
        }
      }
      return next;
    });

    if (tileObject) {
      if (soundEnabled) sound.playRecall();
      setRacks((prev) => ({
        ...prev,
        [currentPlayer]: [...prev[currentPlayer], tileObject],
      }));
      setPlacementsThisTurn((prev) => prev.filter((p) => p.id !== tileId));
    }
  };

  const placeTileOnBoard = (tileData, row, col) => {
    const tileId = tileData.id;

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);

      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (next[r][c]?.id === tileId) {
            next[r][c] = null;
          }
        }
      }

      next[row][col] = {
        id: tileData.id,
        char: tileData.char,
        jyutping: tileData.jyutping,
        points: tileData.points,
        isNew: true,
      };
      return next;
    });

    setPlacementsThisTurn((prev) => {
      const filtered = prev.filter((p) => p.id !== tileId);
      return [
        ...filtered,
        {
          id: tileData.id,
          char: tileData.char,
          jyutping: tileData.jyutping,
          points: tileData.points,
          row,
          col,
        },
      ];
    });

    if (tileData.isRackTile) {
      setRacks((prev) => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer].filter((t) => t.id !== tileId),
      }));
      setSelectedTileId(null);
    }
  };

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

    if (overId === 'rack-droppable' || over.data.current?.isRack) {
      if (!activeTileData.isRackTile) {
        returnTileToRack(activeTileData.id);
      }
      return;
    }

    if (overId.startsWith('board-')) {
      const [, rowStr, colStr] = overId.split('-');
      const row = parseInt(rowStr, 10);
      const col = parseInt(colStr, 10);

      if (board[row][col] !== null) {
        triggerAlert('Square is already occupied! 該位置已有字牌');
        return;
      }

      if (soundEnabled) sound.playPlace();
      placeTileOnBoard(activeTileData, row, col);
    }
  };

  const handleTileClick = (tile, isRackTile) => {
    if (soundEnabled) sound.playTick();
    if (isExchangeMode && isRackTile) {
      handleToggleExchangeTile(tile.id);
      return;
    }
    if (isRackTile) {
      setSelectedTileId(tile.id === selectedTileId ? null : tile.id);
    } else {
      returnTileToRack(tile.id);
    }
  };

  const handleSquareClick = (row, col) => {
    if (!selectedTileId) return;

    const activeRack = racks[currentPlayer];
    const tileToPlace = activeRack.find((t) => t.id === selectedTileId);
    if (!tileToPlace) return;

    if (board[row][col] !== null) {
      triggerAlert('Square is already occupied! 該位置已有字牌');
      return;
    }

    if (soundEnabled) sound.playPlace();
    placeTileOnBoard({ ...tileToPlace, isRackTile: true }, row, col);
  };

  const handleRecall = () => {
    if (placementsThisTurn.length === 0) return;
    if (soundEnabled) sound.playRecall();

    const tilesToReturn = placementsThisTurn.map((p) => ({
      id: p.id,
      char: p.char,
      jyutping: p.jyutping,
      points: p.points,
    }));

    setRacks((prev) => ({
      ...prev,
      [currentPlayer]: [...prev[currentPlayer], ...tilesToReturn],
    }));

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      placementsThisTurn.forEach((p) => {
        next[p.row][p.col] = null;
      });
      return next;
    });

    setPlacementsThisTurn([]);
    setSelectedTileId(null);
  };

  const transitionTurn = () => {
    setIsRackHidden(true);
    setShowInterstitial(true);
  };

  const startNextTurn = () => {
    if (soundEnabled) sound.playTick();
    setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    setShowInterstitial(false);
    setIsRackHidden(false);
  };

  const endGame = () => {
    const latestScores = scoresRef.current;
    const latestRacks = racksRef.current;

    const rack1Val = latestRacks[1].reduce((sum, t) => sum + t.points, 0);
    const rack2Val = latestRacks[2].reduce((sum, t) => sum + t.points, 0);

    const final1 = Math.max(0, latestScores[1] - rack1Val);
    const final2 = Math.max(0, latestScores[2] - rack2Val);
    const finalScores = { 1: final1, 2: final2 };

    setEndScores(finalScores);

    let winner;
    if (final1 > final2) winner = 1;
    else if (final2 > final1) winner = 2;
    else winner = 'TIE';

    setGameWinner(winner);
    if (soundEnabled) sound.playVictory();
  };

  const handlePass = () => {
    if (soundEnabled) sound.playTick();
    handleRecall();

    const nextPassCount = consecutivePasses + 1;
    setConsecutivePasses(nextPassCount);

    if (nextPassCount >= 2) endGame();
    else transitionTurn();
  };

  const handleSubmit = () => {
    const submission = validateTurnSubmission({
      board,
      placements: placementsThisTurn,
      boardSize: BOARD_SIZE,
      wordSet: validationWordSet,
      wordInfoMap: validationWordInfoMap,
      getBoardMultiplier,
    });

    if (!submission.ok) {
      triggerAlert(submission.error);
      return;
    }

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      placementsThisTurn.forEach((p) => {
        if (next[p.row][p.col]) {
          next[p.row][p.col].isNew = false;
        }
      });
      return next;
    });

    setScores((prev) => ({
      ...prev,
      [currentPlayer]: prev[currentPlayer] + submission.score,
    }));

    const rackAfterPlay = racks[currentPlayer].filter(
      (t) => !placementsThisTurn.find((p) => p.id === t.id)
    );
    const rackRefillCount = Math.max(0, RACK_SIZE - rackAfterPlay.length);
    const newBag = [...tileBag];
    const newRackTiles = newBag.splice(0, rackRefillCount);

    setTileBag(newBag);
    setRacks((prev) => ({
      ...prev,
      [currentPlayer]: [...prev[currentPlayer], ...newRackTiles],
    }));

    if (soundEnabled) {
      submission.isBingo ? sound.playVictory() : sound.playCorrect();
    }

    const loggedWords = submission.validatedWords.map((w) => `${w.word} (${w.jyutping})`);
    setHistory((prev) => [
      {
        player: currentPlayer,
        words: loggedWords.join(', '),
        score: submission.score,
        bingo: submission.isBingo,
      },
      ...prev,
    ]);

    const primaryWord = submission.validatedWords[0];
    setWordModal({
      isOpen: true,
      word: primaryWord.word,
      jyutping: primaryWord.jyutping,
      eng: primaryWord.eng,
      score: submission.score,
      isBingo: submission.isBingo,
    });

    setPlacementsThisTurn([]);
    setConsecutivePasses(0);
    setSelectedTileId(null);
  };

  const handleRestart = (dictionaryOverride = customDictionary) => {
    if (soundEnabled) sound.playTick();

    const sourceDictionary = dictionaryOverride ?? sourceDictData;
    const bag = createTileBag(sourceDictionary);
    const rack1 = bag.splice(0, RACK_SIZE);
    const rack2 = bag.splice(0, RACK_SIZE);

    setCustomDictionary(dictionaryOverride ?? null);
    setTileBag(bag);
    setRacks({ 1: rack1, 2: rack2 });
    setBoard(createEmptyBoard());
    setScores({ 1: 0, 2: 0 });
    setEndScores(null);
    setCurrentPlayer(1);
    setPlacementsThisTurn([]);
    setConsecutivePasses(0);
    setHistory([]);
    setGameWinner(null);
    setWordModal({
      isOpen: false,
      word: '',
      jyutping: '',
      eng: '',
      score: 0,
      isBingo: false,
    });
    setSelectedTileId(null);
    setIsRackHidden(false);
    setShowInterstitial(false);
    setIsExchangeMode(false);
    setExchangeSelected(new Set());
  };

  const handleStartExchange = () => {
    if (placementsThisTurn.length > 0) {
      triggerAlert('Recall your tiles before exchanging! 請先收回字牌');
      return;
    }
    setIsExchangeMode(true);
    setExchangeSelected(new Set());
  };

  const handleToggleExchangeTile = (tileId) => {
    setExchangeSelected((prev) => {
      const next = new Set(prev);
      next.has(tileId) ? next.delete(tileId) : next.add(tileId);
      return next;
    });
  };

  const handleConfirmExchange = () => {
    if (exchangeSelected.size === 0) {
      triggerAlert('Select at least one tile to exchange! 請選擇字牌');
      return;
    }
    if (exchangeSelected.size > tileBag.length) {
      triggerAlert('Not enough tiles in the bag! 字袋字牌不足');
      return;
    }

    const newBag = [...tileBag];
    const drawn = newBag.splice(0, exchangeSelected.size);
    const discarded = racks[currentPlayer].filter((t) => exchangeSelected.has(t.id));
    newBag.push(...discarded);

    for (let i = newBag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }

    const newRack = [
      ...racks[currentPlayer].filter((t) => !exchangeSelected.has(t.id)),
      ...drawn,
    ];

    setTileBag(newBag);
    setRacks((prev) => ({ ...prev, [currentPlayer]: newRack }));
    setIsExchangeMode(false);
    setExchangeSelected(new Set());

    const nextPassCount = consecutivePasses + 1;
    setConsecutivePasses(nextPassCount);

    if (nextPassCount >= 2) endGame();
    else transitionTurn();
  };

  const handleCancelExchange = () => {
    setIsExchangeMode(false);
    setExchangeSelected(new Set());
  };

  const handleDictionaryUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const firstEntry = Array.isArray(data) ? data[0] : null;
        const hasWord = firstEntry && (firstEntry.variant || firstEntry.v || firstEntry.word);
        const hasPronunciation = firstEntry && (firstEntry.jyutping || firstEntry.j);
        if (Array.isArray(data) && data.length > 0 && hasWord && hasPronunciation) {
          setCustomDictionary(data);
          triggerAlert(`Loaded custom dictionary! (${data.length} entries)`);
          handleRestart(data);
        } else {
          triggerAlert('Invalid JSON dictionary format! 格式錯誤');
        }
      } catch (err) {
        triggerAlert('Error parsing file! 無法解析檔案');
      }
    };
    reader.readAsText(file);
  };

  return {
    // state
    tileBag,
    board,
    currentPlayer,
    scores,
    racks,
    selectedTileId,
    isRackHidden,
    showInterstitial,
    soundEnabled,
    activeDragId,
    isExchangeMode,
    exchangeSelected,
    alertMessage,
    wordModal,
    history,
    gameWinner,
    endScores,

    // actions
    setSoundEnabled,
    setIsRackHidden,
    setWordModal,
    handleDragStart,
    handleDragEnd,
    handleTileClick,
    handleSquareClick,
    handleRecall,
    handlePass,
    transitionTurn,
    startNextTurn,
    handleSubmit,
    handleRestart,
    handleStartExchange,
    handleToggleExchangeTile,
    handleConfirmExchange,
    handleCancelExchange,
    handleDictionaryUpload,
  };
}
