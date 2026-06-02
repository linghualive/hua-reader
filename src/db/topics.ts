import { getDatabase } from './database';

export interface Topic {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  is_builtin: number;
}

export async function getAllTopics(): Promise<Topic[]> {
  const db = getDatabase();
  return db.getAllAsync<Topic>('SELECT * FROM topics ORDER BY sort_order ASC, id ASC');
}

export async function insertTopic(
  name: string,
  icon: string,
  isBuiltin: boolean = false,
): Promise<number> {
  const db = getDatabase();
  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM topics',
  );
  const sortOrder = (maxOrder?.max_order ?? -1) + 1;
  const result = await db.runAsync(
    'INSERT INTO topics (name, icon, sort_order, is_builtin) VALUES (?, ?, ?, ?)',
    [name, icon, sortOrder, isBuiltin ? 1 : 0],
  );
  return result.lastInsertRowId;
}

export async function deleteTopic(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM topics WHERE id = ?', [id]);
}
