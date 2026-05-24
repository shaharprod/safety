import { describe, it, expect } from 'vitest';
import { generateHazardsPDF } from '../src/services/pdf.js';

describe('generateHazardsPDF', () => {
  it('returns a non-empty Buffer for a list of hazards', async () => {
    const hazards = [
      {
        id: 1,
        description: 'Broken scaffolding on floor 3',
        severity: 'High',
        supervisor_name: 'Dan Cohen',
        status: 'Open',
        created_at: new Date()
      }
    ];
    const buf = await generateHazardsPDF(hazards);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('returns a non-empty Buffer for empty hazard list', async () => {
    const buf = await generateHazardsPDF([]);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });
});
