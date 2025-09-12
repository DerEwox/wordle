import { words } from '../src/lib/words.ts'

const upperWords: string[][][] = words.map(block =>
  block.map(list =>
    list.map(word => word.toUpperCase())
  )
);

console.log(upperWords);