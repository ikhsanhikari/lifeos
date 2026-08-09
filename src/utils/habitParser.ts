/**
 * Pure client-safe utility parser to extract habit names from raw multi-line checklist text
 */
export function parseBulkHabitText(rawText: string): string[] {
  const lines = rawText.split('\n');
  const habitNames: string[] = [];

  for (const line of lines) {
    let clean = line.trim();
    if (!clean) continue;

    const hadBulletOrCheckbox = /^[\s*•\-–—\d\.\)\:]|^[⬜✅☑️▫️◽◾◻️◼️⏹️]|^\s*\[[ xX]?\]/.test(clean);

    const stripped = clean
      .replace(/^[\s*•\-–—\d\.\)\:]+/, '')
      .replace(/^[⬜✅☑️▫️◽◾◻️◼️⏹️\s]+/, '')
      .replace(/^\[[ xX]?\]\s*/, '')
      .trim();

    if (hadBulletOrCheckbox && stripped.length > 1) {
      habitNames.push(stripped);
    } else if (
      !hadBulletOrCheckbox &&
      stripped.length > 2 &&
      !clean.startsWith('✅') &&
      !clean.startsWith('🤲') &&
      !clean.startsWith('🎥') &&
      !clean.startsWith('👩') &&
      !clean.startsWith('💪') &&
      !clean.toLowerCase().includes('checklist') &&
      !clean.toLowerCase().includes('rencana')
    ) {
      habitNames.push(stripped);
    }
  }

  return habitNames;
}
