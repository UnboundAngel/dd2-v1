export const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'item';

export const formatValue = (val: any) => {
  if (val === null || val === undefined || val === '') return '-';
  let str = String(val);
  str = str
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"');
  str = str.replace(/[^\x20-\x7E]/g, '');
  str = str.trim();
  return str || '-';
};

export const fuzzyScore = (query: string, target: string) => {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q || !t) return null;
  if (t.includes(q)) {
    const idx = t.indexOf(q);
    return 200 - idx - Math.max(0, t.length - q.length);
  }
  let score = 0;
  let tIndex = 0;
  let consecutive = 0;
  for (let i = 0; i < q.length; i += 1) {
    const ch = q[i];
    const found = t.indexOf(ch, tIndex);
    if (found === -1) return null;
    if (found === tIndex) {
      consecutive += 1;
      score += 15 + consecutive * 2;
    } else {
      consecutive = 0;
      score += Math.max(1, 10 - (found - tIndex));
    }
    tIndex = found + 1;
  }
  return score;
};
