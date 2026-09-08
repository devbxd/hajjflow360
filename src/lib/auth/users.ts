export interface AppUser {
  username: string;
  displayName: string;
  passwordHash: string;
}

// Fixed staff accounts for a single agency. All three see identical data —
// there are no per-role permissions yet. Passwords are bcrypt-hashed below;
// plaintext values were provided by the client and are not stored anywhere.
// TODO: move this list into the database once it's connected, so the
// Settings page can actually persist password changes across deploys.
export const users: AppUser[] = [
  {
    username: 'user1',
    displayName: 'Utilisateur 1',
    passwordHash: '$2b$10$lHmDKxGrKQScPQygy280DOJQ5vxMzLtIgVJKj4bLptFZopaG3D7bm',
  },
  {
    username: 'user2',
    displayName: 'Utilisateur 2',
    passwordHash: '$2b$10$PlImnUG9vaAVboH4obmpMeBa9AVhNi7mMfU/68t0w7yIz6.c87bs6',
  },
  {
    username: 'user3',
    displayName: 'Utilisateur 3',
    passwordHash: '$2b$10$oblSxHwS8PSfFysHw.d9EO5xDkCq0Ba89jAzuEuEeR2AbwAEYvfYm',
  },
];

export function findUser(username: string): AppUser | undefined {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

// Mutates the in-memory record. Survives for the life of this server process
// only — it will NOT persist across a redeploy or a serverless cold start
// until this moves into the real database.
export function updatePasswordHash(username: string, passwordHash: string): boolean {
  const user = findUser(username);
  if (!user) return false;
  user.passwordHash = passwordHash;
  return true;
}
