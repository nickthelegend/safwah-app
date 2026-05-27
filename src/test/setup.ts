import '@testing-library/jest-dom';

// Since we are using Jest-style testing functions (jest.mock, etc.) in vitest,
// we can alias `jest` to `vi` from vitest.
import { vi } from 'vitest';

(globalThis as any).jest = vi;
