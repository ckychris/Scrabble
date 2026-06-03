// Public surface for the game-logic layer.

export { BOARD_SIZE, RACK_SIZE } from "../config/constants";
export { createEmptyBoard, createTileBag } from "./tileBag";
export { validateTurnSubmission } from "./validation";
export { DEFAULT_WORD_SET, DEFAULT_WORD_INFO_MAP } from "./words";
