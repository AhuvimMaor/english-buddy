const HEBREW_CHAR_RANGE = /[\u0590-\u05FF]/;
const HEBREW_WORD_PATTERN = /[\u0590-\u05FF]+/g;

export function containsHebrew(text: string): boolean {
  return HEBREW_CHAR_RANGE.test(text);
}

export function extractHebrewWords(text: string): string[] {
  const matches = text.match(HEBREW_WORD_PATTERN);
  return matches ?? [];
}

export function splitByLanguage(
  text: string
): Array<{ text: string; isHebrew: boolean }> {
  const segments: Array<{ text: string; isHebrew: boolean }> = [];
  const words = text.split(/(\s+)/);

  let currentSegment = '';
  let currentIsHebrew: boolean | null = null;

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      currentSegment += word;
      continue;
    }

    const isHebrew = HEBREW_CHAR_RANGE.test(word);

    if (currentIsHebrew === null) {
      currentIsHebrew = isHebrew;
      currentSegment = word;
    } else if (isHebrew === currentIsHebrew) {
      currentSegment += word;
    } else {
      segments.push({ text: currentSegment.trim(), isHebrew: currentIsHebrew });
      currentIsHebrew = isHebrew;
      currentSegment = word;
    }
  }

  if (currentSegment.trim() && currentIsHebrew !== null) {
    segments.push({ text: currentSegment.trim(), isHebrew: currentIsHebrew });
  }

  return segments;
}
