import { describe, it, expect, vi } from 'vitest';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' })
    }))
  }
}));

import { sendHazardAlert } from '../src/services/email.js';

describe('sendHazardAlert', () => {
  it('resolves without throwing', async () => {
    await expect(
      sendHazardAlert({
        description: 'Test hazard',
        severity: 'High',
        supervisorEmail: 'a@b.com',
        supervisorName: 'Test Supervisor',
        imageUrl: 'http://localhost/uploads/test.jpg'
      })
    ).resolves.not.toThrow();
  });
});
