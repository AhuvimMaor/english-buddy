const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

interface TranslationResult {
  english: string;
  transliteration: string;
}

export async function translateHebrewToEnglish(
  hebrewWord: string,
  context?: string
): Promise<TranslationResult> {
  if (!OPENAI_API_KEY) {
    // Fallback: return placeholder when no API key is configured
    return {
      english: `[translation of "${hebrewWord}"]`,
      transliteration: hebrewWord,
    };
  }

  const contextPrompt = context
    ? `The word was spoken in this context: "${context}".`
    : '';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a Hebrew-English translator. Given a Hebrew word, return a JSON object with "english" (the English translation) and "transliteration" (how to pronounce the Hebrew word using English letters). Return ONLY the JSON object, no other text.',
        },
        {
          role: 'user',
          content: `Translate this Hebrew word to English: "${hebrewWord}". ${contextPrompt}`,
        },
      ],
      temperature: 0,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content ?? '';

  try {
    const parsed = JSON.parse(content);
    return {
      english: parsed.english ?? hebrewWord,
      transliteration: parsed.transliteration ?? hebrewWord,
    };
  } catch {
    return {
      english: content.trim() || hebrewWord,
      transliteration: hebrewWord,
    };
  }
}

// Batch translate multiple words
export async function translateHebrewWords(
  words: string[],
  context?: string
): Promise<Map<string, TranslationResult>> {
  const results = new Map<string, TranslationResult>();

  // Translate in parallel with a concurrency limit
  const promises = words.map(async (word) => {
    const result = await translateHebrewToEnglish(word, context);
    results.set(word, result);
  });

  await Promise.all(promises);
  return results;
}
