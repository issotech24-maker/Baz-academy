export interface GeneratedContent {
  original: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  nextReview?: string;
  streak?: number;
  imageUrl?: string;
}

export async function generateLanguageContent(
  type: 'word' | 'verb' | 'phrase',
  language: string = 'German',
  recentOriginals: string[] = [],
): Promise<GeneratedContent> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, language, recentOriginals }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate content from server');
  }

  return response.json();
}

export async function completeCardDetails(original: string, language: string = 'German'): Promise<GeneratedContent> {
  const response = await fetch('/api/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to complete content from server');
  }

  return response.json();
}

export async function generateImageForContent(_content: string): Promise<string | null> {
  return null;
}

