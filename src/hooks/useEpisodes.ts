import { useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Project, Episode } from '../components/workspace/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getRecursiveDescendants } from '../components/workspace/utils';

export function useEpisodes(
  selectedProject: Project,
  episodes: Episode[],
  setEpisodes: Dispatch<SetStateAction<Episode[]>>,
  selectedEpisodeId: string | null,
  setSelectedEpisodeId: (id: string | null) => void
) {
  const { user } = useAuth();
  const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');

  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [trashEpisodes, setTrashEpisodes] = useState<Episode[]>([]);
  const [showTrashModal, setShowTrashModal] = useState(false);

  // 1. 휴지통 로드
  useEffect(() => {
    const loadTrash = async () => {
      const trashKey = `novelflow_trash_${selectedProject.id}`;
      
      if (isGuest) {
        const savedTrash = localStorage.getItem(trashKey);
        if (savedTrash) {
          try {
            setTrashEpisodes(JSON.parse(savedTrash));
          } catch (e) {
            console.error(e);
          }
        } else {
          setTrashEpisodes([]);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('trash_episodes')
          .select('*')
          .eq('project_id', selectedProject.id)
          .order('deleted_at', { ascending: false });
        
        if (error) throw error;

        if (data) {
          const dbTrash: Episode[] = data.map(d => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            content: d.content,
            charCount: d.char_count,
            isFolder: d.is_folder,
            parentId: d.parent_id,
            deletedAt: d.deleted_at,
            updatedAt: d.updated_at || d.deleted_at || new Date().toISOString()
          }));
          setTrashEpisodes(dbTrash);
          localStorage.setItem(trashKey, JSON.stringify(dbTrash));
        }
      } catch (err) {
        console.error('Failed to fetch trash from Supabase, loading fallback:', err);
        const savedTrash = localStorage.getItem(trashKey);
        if (savedTrash) {
          try {
            setTrashEpisodes(JSON.parse(savedTrash));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    loadTrash();
  }, [selectedProject.id, isGuest]);

  // 2. 휴지통 로컬스토리지 싱크
  useEffect(() => {
    const trashKey = `novelflow_trash_${selectedProject.id}`;
    localStorage.setItem(trashKey, JSON.stringify(trashEpisodes));
  }, [trashEpisodes, selectedProject.id]);

  // 3. 에피소드 추가 (작업 3: 순번 자동 넘버링 추가)
  const handleAddNewItem = useCallback((parentId: string | null = null, isFolder: boolean = false) => {
    let title = '';
    if (isFolder) {
      const existingFolders = episodes.filter(ep => ep.isFolder && ep.title.startsWith('새 폴더'));
      if (existingFolders.length === 0) {
        title = '새 폴더';
      } else {
        let maxNum = 1;
        existingFolders.forEach(f => {
          const match = f.title.match(/새 폴더\s*(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
        title = `새 폴더 ${maxNum + 1}`;
      }
    } else {
      let maxEpisodeNum = 0;
      episodes.forEach(ep => {
        if (!ep.isFolder) {
          const match = ep.title.match(/(?:제\s*)?(\d+)\s*화/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxEpisodeNum) {
              maxEpisodeNum = num;
            }
          }
        }
      });
      title = `제 ${maxEpisodeNum + 1}화: 제목 없음`;
    }

    const newItem: Episode = {
      id: crypto.randomUUID(),
      projectId: selectedProject.id,
      title,
      content: '',
      charCount: 0,
      updatedAt: new Date().toISOString(),
      isFolder,
      parentId,
    };

    setEpisodes(prev => [...prev, newItem]);
    if (!isFolder) {
      setSelectedEpisodeId(newItem.id);
    }
    if (parentId) {
      setExpandedFolderIds(prev => prev.includes(parentId) ? prev : [...prev, parentId]);
    }
  }, [selectedProject.id, episodes, setEpisodes, setSelectedEpisodeId]);

  // 4. 에피소드 제목 수정
  const handleTitleChange = useCallback((newTitle: string) => {
    if (!selectedEpisodeId) return;
    setEpisodes(prev =>
      prev.map(ep =>
        ep.id === selectedEpisodeId
          ? { ...ep, title: newTitle, updatedAt: new Date().toISOString() }
          : ep
      )
    );
  }, [selectedEpisodeId, setEpisodes]);

  // 5. 에피소드 휴지통 이동
  const handleMoveToTrash = useCallback(async (epId: string) => {
    const toDelete = episodes.find(ep => ep.id === epId);
    if (!toDelete) return;

    const itemsToDelete = toDelete.isFolder
      ? [toDelete, ...getRecursiveDescendants(toDelete.id, episodes)]
      : [toDelete];

    if (!confirm(`${toDelete.isFolder ? '폴더와 폴더 안의 모든 항목' : '이 문서'}를 휴지통으로 이동하시겠습니까?`)) return;

    const nowStr = new Date().toISOString();
    const deletedItems = itemsToDelete.map(item => ({
      ...item,
      deletedAt: nowStr
    }));

    // Local state 업데이트
    setTrashEpisodes(prev => [...prev, ...deletedItems]);
    const deleteIds = itemsToDelete.map(i => i.id);
    setEpisodes(prev => prev.filter(ep => !deleteIds.includes(ep.id)));

    // Supabase DB 싱크
    if (!isGuest) {
      try {
        const trashData = deletedItems.map(item => ({
          id: item.id,
          project_id: selectedProject.id,
          title: item.title,
          content: item.content,
          char_count: item.charCount || 0,
          is_folder: item.isFolder || false,
          parent_id: item.parentId || null,
          deleted_at: item.deletedAt
        }));

        // trash_episodes 테이블에 추가
        const { error: insertError } = await supabase
          .from('trash_episodes')
          .insert(trashData);
        if (insertError) throw insertError;

        // episodes 테이블에서 삭제
        const { error: deleteError } = await supabase
          .from('episodes')
          .delete()
          .in('id', deleteIds);
        if (deleteError) throw deleteError;
      } catch (err) {
        console.error('Failed to sync trash deletion to Supabase:', err);
      }
    }

    if (selectedEpisodeId && deleteIds.includes(selectedEpisodeId)) {
      const remaining = episodes.filter(ep => !deleteIds.includes(ep.id) && !ep.isFolder);
      if (remaining.length > 0) {
        setSelectedEpisodeId(remaining[0].id);
      } else {
        setSelectedEpisodeId(null);
      }
    }
  }, [episodes, selectedEpisodeId, setSelectedEpisodeId, isGuest, selectedProject.id, setEpisodes]);

  // 6. 휴지통 복구
  const handleSidebarRestoreEpisode = useCallback(async (epId: string) => {
    const toRestore = trashEpisodes.find(ep => ep.id === epId);
    if (!toRestore) return;

    const itemsToRestore = toRestore.isFolder
      ? [toRestore, ...getRecursiveDescendants(toRestore.id, trashEpisodes)]
      : [toRestore];

    const restoreIds = itemsToRestore.map(i => i.id);

    const restoredItems = itemsToRestore.map(item => {
      const copy = { ...item };
      delete copy.deletedAt;
      return copy;
    });

    // Local state 업데이트
    setEpisodes(prev => [...prev, ...restoredItems]);
    setTrashEpisodes(prev => prev.filter(ep => !restoreIds.includes(ep.id)));

    // Supabase DB 싱크
    if (!isGuest) {
      try {
        const episodeData = restoredItems.map(item => ({
          id: item.id,
          project_id: selectedProject.id,
          title: item.title,
          content: item.content,
          char_count: item.charCount || 0,
          is_folder: item.isFolder || false,
          parent_id: item.parentId || null,
          updated_at: new Date().toISOString()
        }));

        // episodes 테이블에 추가
        const { error: insertError } = await supabase
          .from('episodes')
          .insert(episodeData);
        if (insertError) throw insertError;

        // trash_episodes 테이블에서 삭제
        const { error: deleteError } = await supabase
          .from('trash_episodes')
          .delete()
          .in('id', restoreIds);
        if (deleteError) throw deleteError;
      } catch (err) {
        console.error('Failed to sync restore to Supabase:', err);
      }
    }

    if (!toRestore.isFolder) {
      setSelectedEpisodeId(toRestore.id);
    }
  }, [trashEpisodes, setSelectedEpisodeId, isGuest, selectedProject.id, setEpisodes]);

  // 7. 휴지통 영구 삭제
  const handleSidebarPermanentlyDeleteEpisode = useCallback(async (epId: string) => {
    const toDelete = trashEpisodes.find(ep => ep.id === epId);
    if (!toDelete) return;
    if (!confirm(`${toDelete.isFolder ? '폴더와 폴더 내 모든 항목' : '이 문서'}를 영구적으로 삭제하시겠습니까? 복구할 수 없습니다.`)) return;

    const itemsToDelete = toDelete.isFolder
      ? [toDelete, ...getRecursiveDescendants(toDelete.id, trashEpisodes)]
      : [toDelete];

    const deleteIds = itemsToDelete.map(i => i.id);

    // Local state 업데이트
    setTrashEpisodes(prev => prev.filter(ep => !deleteIds.includes(ep.id)));

    // Supabase DB 싱크
    if (!isGuest) {
      try {
        const { error } = await supabase
          .from('trash_episodes')
          .delete()
          .in('id', deleteIds);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync permanent delete to Supabase:', err);
      }
    }
  }, [trashEpisodes, isGuest]);

  // 8. 휴지통 비우기
  const handleSidebarEmptyTrash = useCallback(async () => {
    if (trashEpisodes.length === 0) return;
    if (!confirm('휴지통을 완전히 비우시겠습니까? 모든 삭제된 문서와 폴더가 영구 삭제됩니다.')) return;

    // Local state 업데이트
    setTrashEpisodes([]);

    // Supabase DB 싱크
    if (!isGuest) {
      try {
        const { error } = await supabase
          .from('trash_episodes')
          .delete()
          .eq('project_id', selectedProject.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to empty trash in Supabase:', err);
      }
    }
  }, [trashEpisodes, isGuest, selectedProject.id]);

  return {
    expandedFolderIds,
    setExpandedFolderIds,
    contextMenuId,
    setContextMenuId,
    renamingId,
    setRenamingId,
    renamingValue,
    setRenamingValue,
    trashEpisodes,
    setTrashEpisodes,
    showTrashModal,
    setShowTrashModal,
    handleAddNewItem,
    handleTitleChange,
    handleMoveToTrash,
    handleSidebarRestoreEpisode,
    handleSidebarPermanentlyDeleteEpisode,
    handleSidebarEmptyTrash
  };
}
