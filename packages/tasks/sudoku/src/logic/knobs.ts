import { z } from 'zod'

/**
 * One section of «судоку и магические квадраты». One cell is asked; `blanks`
 * cells are empty in all, the asked one among them:
 *
 * - `sudoku` — 4×4 with the digits 1–4, each once in every row, column and
 *   2×2 box; two blanks lie side by side in one row, three anywhere;
 * - `magic` — the 3×3 magic square of the numbers 1–9, every row, column and
 *   diagonal adding up to 15.
 *
 * However many cells are empty, the puzzle has exactly one solution.
 */
export const sudokuKnobs = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('sudoku'),
    blanks: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),
  z.strictObject({
    kind: z.literal('magic'),
    blanks: z.union([z.literal(1), z.literal(2)]),
  }),
])

export type SudokuKnobs = z.infer<typeof sudokuKnobs>
export type Kind = SudokuKnobs['kind']
