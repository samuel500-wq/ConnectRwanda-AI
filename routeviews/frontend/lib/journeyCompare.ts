export interface JourneyOption {
  id: string | number;
  durationMinutes: number;
  fareRwf: number;
  transfers: number;
  walkingMeters: number;
  accessible: boolean;
  frequencyMinutes?: number;
  reliabilityScore?: number;
}

export interface ComparePrefs {
  requireAccessible?: boolean;
  weights?: Partial<{ time: number; fare: number; transfers: number; walking: number; accessibility: number }>;
}

export type RankedJourney<T extends JourneyOption> = T & {
  comparison: {
    rank: number;
    score: number;
    reasons: string[];
    rejected: boolean;
    rejectionReason?: string;
  };
};

const DEFAULT_WEIGHTS = { time: 0.35, fare: 0.30, transfers: 0.20, walking: 0.10, accessibility: 0.05 };

export function compareJourneys<T extends JourneyOption>(options: T[], prefs: ComparePrefs = {}): RankedJourney<T>[] {
  if (!options?.length) return [];
  const weights = { ...DEFAULT_WEIGHTS, ...(prefs.weights || {}) };

  const minTime = Math.min(...options.map((o) => o.durationMinutes));
  const maxTime = Math.max(...options.map((o) => o.durationMinutes));
  const minFare = Math.min(...options.map((o) => o.fareRwf));
  const maxFare = Math.max(...options.map((o) => o.fareRwf));
  const minWalk = Math.min(...options.map((o) => o.walkingMeters));
  const maxWalk = Math.max(...options.map((o) => o.walkingMeters));
  const maxTrans = Math.max(...options.map((o) => o.transfers), 1);

  const norm = (val: number, min: number, max: number, invert = false) => {
    if (max === min) return 1;
    const ratio = (val - min) / (max - min);
    return invert ? 1 - ratio : ratio;
  };

  const ranked: RankedJourney<T>[] = options.map((opt) => {
    const reasons: string[] = [];

    if (prefs.requireAccessible && !opt.accessible) {
      return {
        ...opt,
        comparison: { rank: 999, score: 0, reasons: ['Not wheelchair accessible'], rejected: true, rejectionReason: 'inaccessible' }
      };
    }

    const timeScore = norm(opt.durationMinutes, minTime, maxTime, true);
    const fareScore = norm(opt.fareRwf, minFare, maxFare, true);
    const walkScore = norm(opt.walkingMeters, minWalk, maxWalk, true);
    const transScore = 1 - (opt.transfers / maxTrans);
    const accessScore = opt.accessible ? 1 : 0.5;

    const totalScore =
      timeScore * weights.time +
      fareScore * weights.fare +
      transScore * weights.transfers +
      walkScore * weights.walking +
      accessScore * weights.accessibility;

    if (opt.durationMinutes === minTime) reasons.push('Fastest option');
    if (opt.fareRwf === minFare) reasons.push('Cheapest fare');
    if (opt.transfers === 0) reasons.push('Direct (no transfers)');
    if (opt.accessible) reasons.push('Step-free accessible');

    return {
      ...opt,
      comparison: { rank: 0, score: Math.round(totalScore * 100), reasons, rejected: false }
    };
  });

  const valid = ranked.filter((r) => !r.comparison.rejected).sort((a, b) => b.comparison.score - a.comparison.score);
  const rejected = ranked.filter((r) => r.comparison.rejected);

  valid.forEach((item, idx) => { item.comparison.rank = idx + 1; });

  return [...valid, ...rejected];
}
