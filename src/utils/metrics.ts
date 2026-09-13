import client from 'prom-client';

// Collect default process metrics
client.collectDefaultMetrics({ prefix: 'amrutam_' });

export const httpRequestCounter = new client.Counter({
  name: 'amrutam_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: 'amrutam_http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

export const bookingCounter = new client.Counter({
  name: 'amrutam_booking_attempts_total',
  help: 'Total booking attempts with status outcome',
  labelNames: ['status'], // success, double_booking_prevented, failed
});

export const metricsRegistry = client.register;
