export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  projectId: string;
  title: string;
  content: string;
  charCount: number;
  updatedAt: string;
  isFolder?: boolean;
  parentId?: string | null;
  deletedAt?: string;
}

export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

export interface Link {
  from: string;
  to: string;
  label: string;
  color: string;
  dashed: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  content: string;
  isForeshadow: boolean;
  isResolved: boolean;
  resolvedAt: string;
  updatedAt: string;
}

export interface JamoResult {
  name: string;
  similarity: number;
  matchChar: string;
}

export interface Snapshot {
  id: string;
  timestamp: string;
  name: string;
  memo: string;
  content: string;
  charCount: number;
  type: 'manual' | 'auto_words' | 'auto_time';
  createdAt?: string;
  isBookmarked?: boolean;
}

export interface Foreshadowing {
  id: string;
  projectId: string;
  title: string;
  description: string;
  createdChapter: number;
  targetChapter: number;
  isResolved: boolean;
  createdAt: string;
}
