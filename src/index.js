import { eq } from 'drizzle-orm';
// The 'pool' export will only exist for WebSocket and node-postgres drivers
import { db, pool } from './db/db.js';
import { matches, commentary } from './db/schema.js';

async function main() {
  try {
    console.log('Performing CRUD operations on sports data...');

    // CREATE: Insert a new match
    const [newMatch] = await db
      .insert(matches)
      .values({
        sport: 'Football',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        status: 'scheduled',
        startTime: new Date('2026-02-02T15:00:00Z')
      })
      .returning();

    if (!newMatch) {
      throw new Error('Failed to create match');
    }

    console.log('✅ CREATE: New match created:', newMatch);

    // CREATE: Add commentary to the match
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        minute: 0,
        sequence: 1,
        period: 'pre-match',
        eventType: 'kickoff',
        actor: 'Referee',
        team: null,
        message: 'Match is about to start',
        metadata: { weather: 'sunny' },
        tags: 'start'
      })
      .returning();

    console.log('✅ CREATE: New commentary added:', newCommentary);

    // READ: Select the match with commentary
    const matchWithCommentary = await db
      .select()
      .from(matches)
      .leftJoin(commentary, eq(matches.id, commentary.matchId))
      .where(eq(matches.id, newMatch.id));

    console.log('✅ READ: Match with commentary:', matchWithCommentary);

    // UPDATE: Change the match status to live and add a goal
    const [updatedMatch] = await db
      .update(matches)
      .set({ status: 'live', homeScore: 1 })
      .where(eq(matches.id, newMatch.id))
      .returning();

    console.log('✅ UPDATE: Match updated:', updatedMatch);

    // UPDATE: Add goal commentary
    await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        minute: 15,
        sequence: 2,
        period: 'first_half',
        eventType: 'goal',
        actor: 'Player 1',
        team: 'home',
        message: 'Goal scored by Player 1!',
        metadata: { scorer: 'Player 1', assist: 'Player 2' },
        tags: 'goal,home'
      });

    console.log('✅ UPDATE: Goal commentary added');

    // DELETE: Remove the commentary
    await db.delete(commentary).where(eq(commentary.matchId, newMatch.id));
    console.log('✅ DELETE: Commentary deleted.');

    // DELETE: Remove the match
    await db.delete(matches).where(eq(matches.id, newMatch.id));
    console.log('✅ DELETE: Match deleted.');

    console.log('\nCRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
    process.exit(1);
  } finally {
    // If the pool exists, end it to close the connection
    if (pool) {
      await pool.end();
      console.log('Database pool closed.');
    }
  }
}

main();