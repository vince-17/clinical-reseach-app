// Jest setup for CRA
import '@testing-library/jest-dom';

beforeAll(() => {
  global.fetch = jest.fn(async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const ok = true;
    const jsonFor = () => {
      if (url.includes('/api/health')) return { status: 'ok' };
      if (url.includes('/api/dashboard')) return { patients: 0, upcomingAppointments: 0, lowStockLots: 0, expiringSoonLots: 0 };
      if (url.includes('/api/patients')) return [];
      if (url.includes('/api/appointments')) return [];
      if (url.includes('/api/inventory/items')) return [];
      if (url.includes('/api/visit-types')) return [];
      if (url.includes('/api/resources')) return [];
      if (url.includes('/api/audit-logs')) return [];
      return {};
    };
    return {
      ok,
      status: 200,
      headers: { get: (k) => (k === 'Content-Type' ? 'application/json' : null) },
      json: async () => jsonFor(),
      text: async () => JSON.stringify(jsonFor()),
    };
  });
});

afterAll(() => {
  global.fetch && (global.fetch.mockClear?.());
});

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Basic smoke test helper
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
