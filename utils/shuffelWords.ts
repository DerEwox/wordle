import { words } from '../src/lib/words.ts'
function shuffleAllLevels(arr: string[][][]): string[][][] {
  for(let i = 0; i < arr.length; i++) {
    for(let j = 0; j < arr[i].length; j++) {
      for(let k = 0; k < arr[i][j].length; k++) {
        if(arr[i][j][k] === '') continue;
        let randomIndexes = getRandomIndexes(arr);
        while(arr[randomIndexes[0]][randomIndexes[1]][randomIndexes[2]] === '') {
          randomIndexes = getRandomIndexes(arr);
        }
        swap(arr, i, j, k, randomIndexes[0], randomIndexes[1], randomIndexes[2]);
      }
    }
  }

  return arr
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function swap(arr: string[][][], i1: number, j1: number, k1: number, i2: number, j2: number, k2: number) {
  const temp = arr[i1][j1][k1];
  arr[i1][j1][k1] = arr[i2][j2][k2];
  arr[i2][j2][k2] = temp;
}

function getRandomIndexes(arr: string[][][]): [number, number, number] {
  const i = randomInt(arr.length);
  const j = randomInt(arr[i].length);
  const k = randomInt(arr[i][j].length);
  return [i, j, k];
}


const shuffledWords = shuffleAllLevels(words);
console.log(shuffledWords);
console.log("Copy these Words into your words.ts")