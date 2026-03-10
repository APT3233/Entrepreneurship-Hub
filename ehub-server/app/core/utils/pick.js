/**
 * Pick specified keys from object
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) → { a: 1, c: 3 }
 */
export const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj?.[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

export const omit = (obj, keys) => {
  const set = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !set.has(k)));
};
