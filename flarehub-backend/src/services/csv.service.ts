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
  const rows = applications.map((a) => ({
    id:          a.id,
    applicant:   `${a.user.firstName} ${a.user.lastName}`,
    email:       a.user.email,
    program:     a.program.name,
    status:      a.status,
    appliedAt:   a.appliedAt.toISOString(),
  }));

  return streamToString(rows as Record<string, unknown>[], [
    'id', 'applicant', 'email', 'program', 'status', 'appliedAt',
  ]);
}
