import { format } from 'fast-csv';
import type { Writable } from 'stream';

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  county: string | null;
  businessName: string | null;
  businessStage: string | null;
  isVerified: boolean;
  isMentor: boolean;
  createdAt: Date;
};

type ApplicationRow = {
  id: number;
  status: string;
  appliedAt: Date;
  user: { firstName: string; lastName: string; email: string };
  program: { name: string };
  score?: {
    innovation: number;
    feasibility: number;
    impact: number;
    teamStrength: number;
    marketPotential: number;
    notes: string | null;
  } | null;
  responses?: Record<string, unknown> | null;
};

function streamToString(
  rows: Record<string, unknown>[],
  headers: string[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const csvStream = format({ headers });

    csvStream.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
    csvStream.on('end', () => resolve(chunks.join('')));
    csvStream.on('error', reject);

    for (const row of rows) csvStream.write(row);
    csvStream.end();
  });
}

export async function exportUsers(users: UserRow[]): Promise<string> {
  const rows = users.map((u) => ({
    id:            u.id,
    email:         u.email,
    firstName:     u.firstName,
    lastName:      u.lastName,
    role:          u.role,
    county:        u.county ?? '',
    businessName:  u.businessName ?? '',
    businessStage: u.businessStage ?? '',
    isVerified:    u.isVerified ? 'Yes' : 'No',
    isMentor:      u.isMentor ? 'Yes' : 'No',
    createdAt:     u.createdAt.toISOString(),
  }));

  return streamToString(rows as Record<string, unknown>[], [
    'id', 'email', 'firstName', 'lastName', 'role',
    'county', 'businessName', 'businessStage', 'isVerified', 'isMentor', 'createdAt',
  ]);
}

export async function exportApplications(applications: ApplicationRow[]): Promise<string> {
  const rows = applications.map((a) => {
    const totalScore = a.score
      ? a.score.innovation + a.score.feasibility + a.score.impact + a.score.teamStrength + a.score.marketPotential
      : null;

    const responsesJson = a.responses
      ? JSON.stringify((a.responses as { fields?: Record<string, unknown> }).fields ?? a.responses)
      : '';

    return {
      id:               a.id,
      applicant:        `${a.user.firstName} ${a.user.lastName}`,
      email:            a.user.email,
      program:          a.program.name,
      status:           a.status,
      appliedAt:        a.appliedAt.toISOString(),
      score_total:      totalScore ?? '',
      score_innovation: a.score?.innovation ?? '',
      score_feasibility: a.score?.feasibility ?? '',
      score_impact:     a.score?.impact ?? '',
      score_team:       a.score?.teamStrength ?? '',
      score_market:     a.score?.marketPotential ?? '',
      score_notes:      a.score?.notes ?? '',
      responses:        responsesJson,
    };
  });

  return streamToString(rows as Record<string, unknown>[], [
    'id', 'applicant', 'email', 'program', 'status', 'appliedAt',
    'score_total', 'score_innovation', 'score_feasibility', 'score_impact', 'score_team', 'score_market', 'score_notes',
    'responses',
  ]);
}
