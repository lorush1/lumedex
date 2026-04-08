export type MoveCategory = 'physical' | 'special' | 'status' | string;
export type LearnMethod = 'level-up' | 'tm' | 'machine' | string;

export type Move = {
  name: string;
  type: string;
  category: MoveCategory;
  power?: number | null;
  learnMethod: LearnMethod;
};

export const isLevelUpMove = (move: Move): boolean => move.learnMethod.toLowerCase() === 'level-up';

export const isTmMove = (move: Move): boolean => {
  const method = move.learnMethod.toLowerCase();
  return method === 'tm' || method === 'machine';
};

export const normalizeMoveQuery = (value: string): string => value.trim().toLowerCase();

export const formatMoveCell = (value: string): string =>
  value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : '-';

export const matchesMoveQuery = (move: Move, query: string): boolean =>
  move.name.toLowerCase().includes(query);

export const filterMoves = (moves: Move[], query: string): Move[] =>
  query ? moves.filter((move) => matchesMoveQuery(move, query)) : moves;
