'use client';

import { useReportWebVitals } from 'next/web-vitals';

type MetricLike = {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly rating?: string;
};

/** Dev-only console logging; production hook point for analytics (Sentry, internal API, etc.). */
export function WebVitalsReporter() {
  useReportWebVitals((metric: MetricLike) => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    console.info(
      `[vitals] ${metric.name}`,
      `${Math.round(metric.value)}`,
      metric.rating ?? '',
      metric.id,
    );
  });

  return null;
}
