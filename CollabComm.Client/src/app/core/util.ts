export function isNullOrUndefined(v: any) {
  return v === undefined || v === null;
}

export function isNullOrEmpty(str: string | any | undefined): boolean {
  return str === undefined || str === null || str === '';
}


export class Group<T, U> {
  key: U;
  members: T[] = [];

  constructor(key: U) {
    this.key = key;
  }
}

export class GroupString<T> extends Group<T, string>{
}

export function shuffle<T>(array1: T[]): T[] {
  const array = JSON.parse(JSON.stringify(array1));
  let currentIndex = array.length;
  let randomIndex: number;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function replaceAll(str: string | undefined, find: string, replace: string) {
  if (!str) {
    return '';
  }
  const escapedFind = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  return str.replace(new RegExp(escapedFind, 'g'), replace);
}

export function groupBy<T>(list: T[], func: (x: T) => string): GroupString<T>[] {
  return groupByString(list, func);
}

export function groupByString<T, U>(list: T[], func: (x: T) => U): Group<T, U>[] {
  const res: Group<T, U>[] = [];
  list.forEach((item) => {
    const groupName = func(item);
    let group = res.find(s => s.key === groupName)
    if (!group || groupName !== group.key) {
      group = new Group<T, U>(groupName);
      res.push(group);
    }
    group.members.push(item);
  });
  return res;
}
