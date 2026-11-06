import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  X,
  Edit3,
  Trash2,
  Save,
  User,
  Shield,
  MapPin,
  Zap,
  Package,
  SlidersHorizontal,
  FolderOpen,
  Filter,
  Check,
  ChevronDown,
  Scale,
  AlertTriangle
} from 'lucide-react';
import type { ArchiveItem, ArchiveCategory, ArchiveAttribute, Node } from './types';
import { useAlertConfirm } from '../../context/AlertConfirmContext';
import { calculateSimilarity } from './utils';
import JamoSimilarityReportModal from './archive/JamoSimilarityReportModal';

interface ArchiveManagerProps {
  isDark: boolean;
  archiveItems: ArchiveItem[];
  setArchiveItems: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  projectId: string;
  relationNodes?: Node[];
  setRelationNodes?: React.Dispatch<React.SetStateAction<Node[]>>;
}

const CATEGORY_MAP: Record<ArchiveCategory, { label: string; icon: typeof User; color: string; bgColor: string }> = {
  character: { label: '캐릭터', icon: User, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/20' },
  equipment: { label: '장비/아이템', icon: Shield, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  location: { label: '장소/세계', icon: MapPin, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  skill: { label: '기술/마법', icon: Zap, color: 'text-sky-400', bgColor: 'bg-sky-500/10 border-sky-500/20' },
  etc: { label: '기타', icon: Package, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
};

export default function ArchiveManager({
  isDark,
  archiveItems,
  setArchiveItems,
  projectId,
  setRelationNodes,
}: ArchiveManagerProps) {
  const { showConfirm, showAlert } = useAlertConfirm();

  // 검색 및 카테고리/태그 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 모달 오픈 상태 (태그 필터 모달 vs 태그 관리 모달 vs 자모 유사도 분석 모달)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isJamoModalOpen, setIsJamoModalOpen] = useState(false);

  // 태그 생성 상태
  const [newTagInput, setNewTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);

  // 프로젝트별 커스텀 태그 로드 및 자동 저장
  useEffect(() => {
    if (!projectId) return;
    const tagKey = `novelflow_custom_tags_${projectId}`;
    const saved = localStorage.getItem(tagKey);
    if (saved) {
      try {
        setCustomTags(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const tagKey = `novelflow_custom_tags_${projectId}`;
    localStorage.setItem(tagKey, JSON.stringify(customTags));
  }, [customTags, projectId]);

  // 의도된 유사성 무시 쌍 (로컬스토리지 동기화)
  const [ignoredSimilarityPairs, setIgnoredSimilarityPairs] = useState<string[]>(() => {
    if (!projectId) return [];
    try {
      return JSON.parse(localStorage.getItem(`novelflow_ignored_similarity_${projectId}`) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!projectId) return;
    try {
      const saved = localStorage.getItem(`novelflow_ignored_similarity_${projectId}`);
      setIgnoredSimilarityPairs(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error(e);
    }
  }, [projectId]);

  const handleToggleIgnorePair = (pairKey: string) => {
    setIgnoredSimilarityPairs(prev => {
      const updated = prev.includes(pairKey) ? prev.filter(k => k !== pairKey) : [...prev, pairKey];
      if (projectId) {
        localStorage.setItem(`novelflow_ignored_similarity_${projectId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // O(1) 조회를 위한 아카이브 항목별 최고 유사도 매핑 및 경고 쌍 건수 연산
  const { itemSimilarityMap, warningPairCount } = useMemo(() => {
    const map = new Map<string, { targetName: string; targetId: string; similarity: number; pairKey: string }>();
    let pairCount = 0;

    for (let i = 0; i < archiveItems.length; i++) {
      for (let j = i + 1; j < archiveItems.length; j++) {
        const itemA = archiveItems[i];
        const itemB = archiveItems[j];
        const nameA = itemA.name.trim();
        const nameB = itemB.name.trim();
        if (!nameA || !nameB) continue;

        const pairKey = [itemA.id, itemB.id].sort().join('__');
        const isIgnored = ignoredSimilarityPairs.includes(pairKey);

        const sim = calculateSimilarity(nameA, nameB);
        if (sim >= 75) {
          if (!isIgnored) {
            pairCount++;
            const existingA = map.get(itemA.id);
            if (!existingA || sim > existingA.similarity) {
              map.set(itemA.id, { targetName: itemB.name, targetId: itemB.id, similarity: sim, pairKey });
            }
            const existingB = map.get(itemB.id);
            if (!existingB || sim > existingB.similarity) {
              map.set(itemB.id, { targetName: itemA.name, targetId: itemA.id, similarity: sim, pairKey });
            }
          }
        }
      }
    }

    return { itemSimilarityMap: map, warningPairCount: pairCount };
  }, [archiveItems, ignoredSimilarityPairs]);

  // 상세 뷰 및 수정/생성 상태
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 편집 폼 상태
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ArchiveCategory>('character');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAttributes, setEditAttributes] = useState<ArchiveAttribute[]>([]);
  const [tagInputInDetail, setTagInputInDetail] = useState('');

  // 속성 입력 폼 임시 상태
  const [attrKeyInput, setAttrKeyInput] = useState('');
  const [attrValInput, setAttrValInput] = useState('');

  // 전체 등록된 태그 집합 (아이템들의 태그 + 커스텀 등록 태그)
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    archiveItems.forEach(item => {
      item.tags?.forEach(t => tagSet.add(t));
    });
    customTags.forEach(t => tagSet.add(t));
    return Array.from(tagSet);
  }, [archiveItems, customTags]);

  // 필터링된 아카이브 목록
  const filteredItems = useMemo(() => {
    return archiveItems.filter(item => {
      // 1. 이름 검색 필터 (대소문자 미구분)
      if (searchTerm.trim() && !item.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      // 2. 카테고리 필터
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // 3. 태그 필터 (선택된 태그가 하나라도 일치하면 포함)
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(t => item.tags?.includes(t));
        if (!hasTag) return false;
      }
      return true;
    });
  }, [archiveItems, searchTerm, selectedCategory, selectedTags]);

  // 선택된 상세 아이템
  const selectedItem = useMemo(() => {
    return archiveItems.find(item => item.id === selectedItemId) || null;
  }, [archiveItems, selectedItemId]);

  // 태그 필터 토글
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 신규 태그 생성 (태그 관리 모달 내부)
  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (customTags.includes(trimmed) || allAvailableTags.includes(trimmed)) {
      showAlert('이미 존재하는 태그입니다.');
      return;
    }
    setCustomTags(prev => [...prev, trimmed]);
    setNewTagInput('');
  };

  // 태그 삭제 (태그 관리 모달 내부)
  const handleDeleteTag = async (tagToDelete: string) => {
    if (!(await showConfirm(`'${tagToDelete}' 태그를 아카이브 및 목록에서 삭제하시겠습니까?`))) return;

    setCustomTags(prev => prev.filter(t => t !== tagToDelete));
    setSelectedTags(prev => prev.filter(t => t !== tagToDelete));

    // 아카이브 항목에서도 해당 태그 제거
    setArchiveItems(prev =>
      prev.map(item => ({
        ...item,
        tags: item.tags?.filter(t => t !== tagToDelete) || [],
      }))
    );
  };

  // 카드 클릭 -> 상세 보기 이동
  const handleOpenDetail = (item: ArchiveItem) => {
    setSelectedItemId(item.id);
    setIsCreating(false);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditSummary(item.summary);
    setEditDescription(item.description || '');
    setEditTags(item.tags || []);
    setEditAttributes(item.attributes ? [...item.attributes] : []);
  };

  // 신규 항목 생성 폼 열기
  const handleOpenCreateForm = () => {
    setSelectedItemId(null);
    setIsCreating(true);
    setEditName('');
    setEditCategory('character');
    setEditSummary('');
    setEditDescription('');
    setEditTags([]);
    setEditAttributes([]);
  };

  // 상세 뷰 닫기 (뒤로가기 화살표 버튼)
  const handleBackToList = () => {
    setSelectedItemId(null);
    setIsCreating(false);
  };

  // 항목 저장 (생성 or 수정)
  const handleSaveItem = () => {
    if (!editName.trim()) {
      showAlert('이름을 입력해주세요.');
      return;
    }

    const now = new Date().toISOString();

    // 상세에서 사용된 모든 태그를 프로젝트 커스텀 태그 목록에도 병합 등록
    if (editTags.length > 0) {
      setCustomTags(prev => Array.from(new Set([...prev, ...editTags])));
    }

    if (isCreating) {
      // 신규 생성
      const newItem: ArchiveItem = {
        id: crypto.randomUUID(),
        projectId,
        name: editName.trim(),
        category: editCategory,
        summary: editSummary.trim(),
        description: editDescription.trim(),
        tags: editTags,
        attributes: editAttributes,
        createdAt: now,
        updatedAt: now,
      };
      setArchiveItems(prev => [newItem, ...prev]);
      showAlert('신규 항목이 저장되었습니다.');
      setSelectedItemId(null);
      setIsCreating(false);
    } else if (selectedItem) {
      // 기존 수정
      setArchiveItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? {
                ...item,
                name: editName.trim(),
                category: editCategory,
                summary: editSummary.trim(),
                description: editDescription.trim(),
                tags: editTags,
                attributes: editAttributes,
                updatedAt: now,
              }
            : item
        )
      );

      // 인물 관계도 노드 자동 동기화
      if (setRelationNodes && selectedItem) {
        const oldName = selectedItem.name;
        const newName = editName.trim();
        setRelationNodes(prev =>
          prev.map(n => {
            if (n.archiveItemId === selectedItem.id || n.name === oldName) {
              return {
                ...n,
                name: newName,
                summary: editSummary.trim(),
                description: editDescription.trim()
              };
            }
            return n;
          })
        );
      }

      showAlert('항목이 수정되었습니다.');
    }
  };

  // 항목 삭제
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (!(await showConfirm(`'${selectedItem.name}' 항목을 삭제하시겠습니까?`))) return;

    setArchiveItems(prev => prev.filter(item => item.id !== selectedItem.id));

    // 인물 관계도 노드 자동 동기화
    if (setRelationNodes && selectedItem) {
      setRelationNodes(prev => prev.filter(n => n.archiveItemId !== selectedItem.id && n.name !== selectedItem.name));
    }

    handleBackToList();
    showAlert('삭제되었습니다.');
  };

  // 상세 뷰 태그 입력 추가 (자동으로 태그 관리 모달 목록에도 등록)
  const handleAddTagInDetail = () => {
    const trimmed = tagInputInDetail.trim();
    if (!trimmed) return;
    if (!editTags.includes(trimmed)) {
      setEditTags(prev => [...prev, trimmed]);
    }
    if (!customTags.includes(trimmed)) {
      setCustomTags(prev => [...prev, trimmed]);
    }
    setTagInputInDetail('');
  };

  // 상세 뷰 태그 클릭 토글 (기존 태그 목록에서 선택)
  const handleToggleEditTag = (tag: string) => {
    setEditTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 상세 뷰 속성 추가
  const handleAddAttribute = () => {
    if (!attrKeyInput.trim() || !attrValInput.trim()) {
      showAlert('속성 이름과 내용을 모두 입력해주세요.');
      return;
    }
    setEditAttributes(prev => [...prev, { key: attrKeyInput.trim(), value: attrValInput.trim() }]);
    setAttrKeyInput('');
    setAttrValInput('');
  };

  // 상세 뷰 속성 삭제
  const handleRemoveAttribute = (index: number) => {
    setEditAttributes(prev => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // Render Detail View (상세 화면 모드)
  // ==========================================
  if (selectedItemId || isCreating) {
    const catConfig = CATEGORY_MAP[editCategory] || CATEGORY_MAP.etc;
    const CategoryIcon = catConfig.icon;

    return (
      <div className={`w-full h-full flex flex-col items-center overflow-y-auto p-6 transition-colors ${
        isDark ? 'bg-[#0A0B0E] text-[#EDEDEF]' : 'bg-[#F8F9FA] text-[#121316]'
      }`}>
        {/* 완벽한 중앙 정렬 컨테이너 (max-w-5xl) */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12">
          {/* 상단 툴바: 뒤로가기 화살표 + 제목 + 저장/삭제 버튼 */}
          <div className="flex items-center justify-between pb-4 border-b border-inherit shrink-0 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* 좌측 상단 뒤로가기 (화살표) 버튼 */}
              <button
                onClick={handleBackToList}
                title="목록으로 돌아가기"
                className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'border-white/[0.08] bg-white/[0.03] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-white'
                    : 'border-black/[0.08] bg-black/[0.02] text-[#55555A] hover:bg-black/[0.06] hover:text-black'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${catConfig.bgColor} ${catConfig.color}`}>
                    <CategoryIcon className="w-3.5 h-3.5" />
                    <span>{catConfig.label}</span>
                  </span>
                  <span className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                    {isCreating ? '신규 등록' : '상세 정보 수정'}
                  </span>
                </div>
                <h2 className={`text-xl font-bold mt-1 truncate ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  {editName || '새 아카이브 항목'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isCreating && (
                <button
                  onClick={handleDeleteItem}
                  title="삭제"
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    isDark
                      ? 'border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-950/50'
                      : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              )}
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white flex items-center gap-1.5 shadow-md shadow-[#5E6AD2]/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>저장하기</span>
              </button>
            </div>
          </div>

          {/* 기본 정보 구역 */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#111216] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 이름 */}
              <div className="md:col-span-2">
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                  항목 이름 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="예: 카엘루스 (주인공), 엑스칼리버, 그림자 숲"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-medium transition-all ${
                    isDark
                      ? 'bg-black/30 border-white/[0.08] text-white focus:border-[#5E6AD2]'
                      : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              {/* 카테고리 (Lucide SVG 아이콘 포함 커스텀 드롭다운) */}
              <div className="relative">
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                  카테고리
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none font-medium flex items-center justify-between transition-all ${
                    isDark
                      ? 'bg-[#18191E] border-white/[0.08] text-white hover:border-[#5E6AD2]/50'
                      : 'bg-gray-50 border-black/[0.08] text-gray-900 hover:border-[#5E6AD2]/50'
                  }`}
                >
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${catConfig.bgColor} ${catConfig.color}`}>
                    <CategoryIcon className="w-3.5 h-3.5" />
                    <span>{catConfig.label}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60 ml-2" />
                </button>

                {/* 커스텀 드롭다운 옵션 목록 */}
                {isCategoryDropdownOpen && (
                  <div className={`absolute left-0 right-0 mt-1.5 rounded-xl border p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                    isDark
                      ? 'bg-[#18191E] border-white/[0.1] text-white backdrop-blur-md shadow-black/80'
                      : 'bg-white border-black/[0.1] text-gray-900 backdrop-blur-md shadow-black/10'
                  }`}>
                    {(Object.keys(CATEGORY_MAP) as ArchiveCategory[]).map(catKey => {
                      const itemCatConfig = CATEGORY_MAP[catKey];
                      const ItemCatIcon = itemCatConfig.icon;
                      const isSelected = editCategory === catKey;

                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            setEditCategory(catKey);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors duration-150 ${
                            isSelected
                              ? isDark ? 'bg-[#5E6AD2]/20 text-[#7480E2]' : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                              : isDark ? 'hover:bg-white/[0.06] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black'
                          }`}
                        >
                          <span className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${itemCatConfig.bgColor} ${itemCatConfig.color}`}>
                            <ItemCatIcon className="w-3.5 h-3.5" />
                            <span>{itemCatConfig.label}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#5E6AD2]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 한 줄 설명 */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                한 줄 설명 (카드 노출용 요약)
              </label>
              <input
                type="text"
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                placeholder="목록 카드에서 한눈에 볼 수 있는 짧은 소개를 적어주세요."
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-medium transition-all ${
                  isDark
                    ? 'bg-black/30 border-white/[0.08] text-white focus:border-[#5E6AD2]'
                    : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                }`}
              />
            </div>
          </div>

          {/* 태그 설정 구역 (선택된 태그 + 직접 입력 + 기존 태그 빠른 선택) */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#111216] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'
          }`}>
            <label className={`block text-xs font-bold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              태그 설정
            </label>

            {/* 적용된 태그 목록 */}
            <div className="flex flex-wrap gap-2 items-center">
              {editTags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                    isDark ? 'bg-[#5E6AD2]/15 border-[#5E6AD2]/30 text-[#7480E2]' : 'bg-[#5E6AD2]/10 border-[#5E6AD2]/20 text-[#5E6AD2]'
                  }`}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}
                    className="hover:opacity-75"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* 신규 태그 수동 입력 */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tagInputInDetail}
                  onChange={e => setTagInputInDetail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTagInDetail())}
                  placeholder="새 태그 입력 후 엔터"
                  className={`px-3 py-1 rounded-lg text-xs border outline-none transition-all w-36 ${
                    isDark
                      ? 'bg-black/30 border-white/[0.08] text-white focus:border-[#5E6AD2]'
                      : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddTagInDetail}
                  className="p-1.5 rounded-lg bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 기존 등록된 태그 빠른 클릭 추가 기능 (요구사항 3) */}
            {allAvailableTags.length > 0 && (
              <div className={`pt-3 border-t flex flex-col gap-2 ${
                isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
              }`}>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                  등록된 기존 태그에서 클릭하여 빠른 추가:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allAvailableTags.map(tag => {
                    const isAdded = editTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleEditTag(tag)}
                        className={`px-2.5 py-0.5 rounded-md text-xs border font-medium transition-all flex items-center gap-1 ${
                          isAdded
                            ? isDark
                              ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white font-bold'
                              : 'bg-[#5E6AD2] border-[#5E6AD2] text-white font-bold'
                            : isDark
                            ? 'bg-white/[0.03] border-white/[0.06] text-[#A1A1AA] hover:bg-white/[0.08]'
                            : 'bg-black/[0.03] border-black/[0.06] text-[#55555A] hover:bg-black/[0.06]'
                        }`}
                      >
                        <span>#{tag}</span>
                        {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-2.5 h-2.5 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 커스텀 속성 구역 (키-값 리스트) */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#111216] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'
          }`}>
            <label className={`block text-xs font-bold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              커스텀 속성 정보 (소유자, 등급, 세력, 원소 등)
            </label>

            {/* 속성 추가 입력 바 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={attrKeyInput}
                onChange={e => setAttrKeyInput(e.target.value)}
                placeholder="항목 (예: 소유자, 등급)"
                className={`w-1/3 px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-black/30 border-white/[0.08] text-white' : 'bg-gray-50 border-black/[0.08] text-gray-900'
                }`}
              />
              <input
                type="text"
                value={attrValInput}
                onChange={e => setAttrValInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAttribute())}
                placeholder="내용 (예: 유진, 전설급)"
                className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-black/30 border-white/[0.08] text-white' : 'bg-gray-50 border-black/[0.08] text-gray-900'
                }`}
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#5E6AD2] text-white hover:bg-[#4E5AC2] shrink-0"
              >
                속성 추가
              </button>
            </div>

            {/* 기존 등록된 속성 목록 */}
            {editAttributes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {editAttributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                      isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50 border-black/[0.06]'
                    }`}
                  >
                    <span className="font-semibold opacity-70">{attr.key}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{attr.value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(idx)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 상세 설명 본문 (Description) */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${
            isDark ? 'bg-[#111216] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'
          }`}>
            <label className={`block text-xs font-bold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              상세 설명 및 서사 설정
            </label>
            <textarea
              rows={8}
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="캐릭터의 메인 배경 스토리, 외형 특징, 장비의 히스토리나 제약 사항 등을 자세히 기록해 두세요."
              className={`w-full p-3.5 rounded-xl text-sm border outline-none resize-y leading-relaxed font-sans ${
                isDark
                  ? 'bg-black/30 border-white/[0.08] text-white focus:border-[#5E6AD2]'
                  : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render List View (카드 목록 모드)
  // ==========================================
  return (
    <div className={`w-full h-full flex flex-col overflow-hidden transition-colors relative ${
      isDark ? 'bg-[#0A0B0E] text-[#EDEDEF]' : 'bg-[#F8F9FA] text-[#121316]'
    }`}>
      {/* 1. 상단 타이틀 및 신규 항목 추가 버튼 (요구사항 1: "+ 항목 추가") */}
      <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
      }`}>
        <div>
          <h1 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
            <span>아카이브</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isDark ? 'bg-white/[0.06] text-[#A1A1AA]' : 'bg-black/[0.05] text-[#71717A]'
            }`}>
              {filteredItems.length}개
            </span>
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
            캐릭터, 장비, 지명, 마법 등 소설의 핵심 요소 카드 관리
          </p>
        </div>

        {/* 헤더 우측 버튼 그룹: "유사도 필터링" + "+ 항목 추가" */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsJamoModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              warningPairCount > 0
                ? isDark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : 'border-amber-500/30 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : isDark
                  ? 'border-white/[0.1] bg-white/[0.04] text-[#EDEDEF] hover:bg-white/[0.08]'
                  : 'border-black/[0.1] bg-black/[0.03] text-[#121316] hover:bg-black/[0.06]'
            }`}
          >
            <Scale className={`w-4 h-4 ${warningPairCount > 0 ? 'text-amber-500' : 'text-[#5E6AD2]'}`} />
            <span>유사도 필터링</span>
            {warningPairCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-black dark:text-gray-900 leading-normal ml-0.5" title={`${warningPairCount}쌍의 발음 유사 경고 감지`}>
                {warningPairCount}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenCreateForm}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white flex items-center gap-1.5 shadow-md shadow-[#5E6AD2]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>항목 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 상단 이름 검색 창 */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <div className={`relative flex items-center rounded-xl border transition-all ${
          isDark ? 'bg-[#111216] border-white/[0.08] focus-within:border-[#5E6AD2]' : 'bg-white border-black/[0.08] focus-within:border-[#5E6AD2]'
        }`}>
          <Search className={`w-4 h-4 ml-3.5 shrink-0 ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="아카이브 이름으로 검색..."
            className="w-full py-2.5 px-3 bg-transparent text-sm outline-none font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`p-1 mr-2 rounded-lg hover:bg-black/10 ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 검색창 하단: 태그 필터 버튼 & 태그 관리 버튼 분리 (요구사항 4) */}
      <div className="px-6 py-2 flex flex-col gap-2 shrink-0 border-b border-inherit pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* 요구사항 4-1: 태그 필터 버튼 (모달 오픈) */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                selectedTags.length > 0
                  ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white shadow-sm'
                  : isDark
                  ? 'border-white/[0.08] bg-white/[0.03] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-white'
                  : 'border-black/[0.08] bg-black/[0.02] text-[#55555A] hover:bg-black/[0.06] hover:text-black'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>태그 필터</span>
              {selectedTags.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-bold">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {/* 선택된 필터 태그 칩 바로 삭제 간편보기 */}
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                      isDark ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 text-[#7480E2]' : 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2]'
                    }`}
                  >
                    #{tag}
                    <button onClick={() => toggleTagFilter(tag)} className="hover:opacity-75">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-[#5E6AD2] hover:underline font-semibold ml-1"
                >
                  초기화
                </button>
              </div>
            )}
          </div>

          {/* 요구사항 4-2: 태그 관리 버튼 (모달 오픈) */}
          <button
            onClick={() => setIsManageModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isDark
                ? 'border-white/[0.08] bg-white/[0.03] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-white'
                : 'border-black/[0.08] bg-black/[0.02] text-[#55555A] hover:bg-black/[0.06] hover:text-black'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>태그 관리</span>
          </button>
        </div>

        {/* 카테고리 빠른 필터 탭 (Lucide SVG 아이콘 단일화) */}
        <div className="flex items-center gap-1.5 pt-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#5E6AD2]/20 text-[#7480E2] border border-[#5E6AD2]/40 font-bold'
                : isDark
                ? 'text-[#A1A1AA] hover:bg-white/[0.04]'
                : 'text-[#55555A] hover:bg-black/[0.04]'
            }`}
          >
            전체 보기
          </button>
          {(Object.keys(CATEGORY_MAP) as ArchiveCategory[]).map(catKey => {
            const cat = CATEGORY_MAP[catKey];
            const Icon = cat.icon;
            const isSel = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                  isSel
                    ? `${cat.bgColor} ${cat.color} border font-bold`
                    : isDark
                    ? 'text-[#A1A1AA] hover:bg-white/[0.04]'
                    : 'text-[#55555A] hover:bg-black/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 카드 목록 그리드 (프로젝트 목록처럼 이름, 한 줄 설명만 노출) */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-60">
            <FolderOpen className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm font-semibold">아카이브 항목이 없습니다.</p>
            <p className="text-xs mt-1">상단의 [+ 항목 추가] 버튼을 눌러 첫 항목을 등록해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const catConfig = CATEGORY_MAP[item.category] || CATEGORY_MAP.etc;
              const CategoryIcon = catConfig.icon;
              const simInfo = itemSimilarityMap.get(item.id);
              const hasSimilarityWarning = !!simInfo;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:shadow-lg ${
                    hasSimilarityWarning
                      ? isDark
                        ? 'bg-[#111216] border-amber-500/40 hover:border-amber-500/80 hover:shadow-amber-500/10 hover:bg-[#15171D]'
                        : 'bg-white border-amber-500/40 hover:border-amber-500/80 hover:shadow-amber-500/10 hover:bg-amber-50/20 shadow-sm'
                      : isDark
                        ? 'bg-[#111216] border-white/[0.06] hover:border-[#5E6AD2]/50 hover:bg-[#15171D]'
                        : 'bg-white border-black/[0.06] hover:border-[#5E6AD2]/50 hover:bg-gray-50/80 shadow-sm'
                  }`}
                >
                  <div>
                    {/* 카드 상단 카테고리 배지 & 유사도 주의 뱃지 & 수정 아이콘 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catConfig.bgColor} ${catConfig.color}`}>
                        <CategoryIcon className="w-3 h-3" />
                        <span>{catConfig.label}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {hasSimilarityWarning && simInfo && (
                          <div className="relative group/sim">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsJamoModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-all shadow-xs"
                              title="유사도 분석 리포트 열기"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>유사 {simInfo.similarity}%</span>
                            </button>

                            {/* 스마트 툴팁 */}
                            <div className="absolute right-0 top-full mt-1.5 hidden group-hover/sim:flex flex-col z-30 w-52 p-2.5 rounded-xl border shadow-xl text-left backdrop-blur-md bg-white/95 dark:bg-[#1E1F22]/95 border-amber-500/30 text-gray-800 dark:text-gray-200 text-[11px] pointer-events-auto">
                              <p className="font-semibold text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>발음 유사성 경고</span>
                              </p>
                              <p className="mt-1 text-gray-600 dark:text-gray-300 leading-snug">
                                ‘<strong className="text-gray-900 dark:text-white">{simInfo.targetName}</strong>’ 항목과 발음이 <strong className="text-amber-500">{simInfo.similarity}%</strong> 유사합니다.
                              </p>
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsJamoModalOpen(true);
                                  }}
                                  className="text-[10px] text-[#5E6AD2] hover:underline cursor-pointer font-semibold"
                                >
                                  리포트 보기 →
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleIgnorePair(simInfo.pairKey);
                                  }}
                                  className="text-[10px] text-gray-400 hover:text-gray-200 underline"
                                >
                                  알림 끄기
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity text-[#5E6AD2]" />
                      </div>
                    </div>

                    {/* 이름 (프로젝트 목록 스타일) */}
                    <h3 className={`text-base font-bold truncate mb-1 ${
                      isDark ? 'text-white group-hover:text-[#7480E2]' : 'text-[#121316] group-hover:text-[#5E6AD2]'
                    }`}>
                      {item.name}
                    </h3>

                    {/* 한 줄 설명 */}
                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'
                    }`}>
                      {item.summary || '설명 없음'}
                    </p>
                  </div>

                  {/* 카드 하단: 태그 목록 */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-inherit">
                      {item.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isDark ? 'bg-white/[0.04] text-[#A1A1AA]' : 'bg-black/[0.04] text-[#55555A]'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isDark ? 'bg-white/[0.04] text-[#A1A1AA]' : 'bg-black/[0.04] text-[#55555A]'
                        }`}>
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          모달 4-1: 태그 필터 모달 (Tag Filter Modal)
         ========================================== */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl flex flex-col gap-4 ${
            isDark ? 'bg-[#111216] border-white/[0.1] text-[#EDEDEF]' : 'bg-white border-black/[0.1] text-[#121316]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#5E6AD2]" />
                <span>태그 필터 선택</span>
              </h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className={`p-1 rounded-lg hover:bg-black/10 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
              원하는 태그를 선택하면 해당 태그가 포함된 항목만 필터링하여 노출합니다.
            </p>

            {/* 태그 칩 다중 선택 목록 */}
            <div className="max-h-60 overflow-y-auto flex flex-wrap gap-2 p-2">
              {allAvailableTags.length === 0 ? (
                <p className="text-xs opacity-60">등록된 태그가 없습니다.</p>
              ) : (
                allAvailableTags.map(tag => {
                  const isSel = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white shadow-sm font-bold'
                          : isDark
                          ? 'bg-white/[0.03] border-white/[0.08] text-[#A1A1AA] hover:bg-white/[0.08]'
                          : 'bg-black/[0.03] border-black/[0.08] text-[#55555A] hover:bg-black/[0.06]'
                      }`}
                    >
                      <span>#{tag}</span>
                      {isSel && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex items-center justify-between pt-3 border-t border-inherit mt-2">
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs font-semibold text-[#5E6AD2] hover:underline"
              >
                필터 선택 해제
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white"
              >
                적용 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          모달 4-2: 태그 관리 모달 (Tag Management Modal)
         ========================================== */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl flex flex-col gap-4 ${
            isDark ? 'bg-[#111216] border-white/[0.1] text-[#EDEDEF]' : 'bg-white border-black/[0.1] text-[#121316]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>태그 생성 및 관리</span>
              </h3>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className={`p-1 rounded-lg hover:bg-black/10 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 신규 태그 생성 폼 */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                신규 태그 추가
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                  placeholder="새 태그 이름 입력 (예: 주인공, 전설)"
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs border outline-none font-medium ${
                    isDark
                      ? 'bg-black/30 border-white/[0.08] text-white focus:border-[#5E6AD2]'
                      : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                  }`}
                />
                <button
                  onClick={handleAddCustomTag}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white shrink-0"
                >
                  생성
                </button>
              </div>
            </div>

            {/* 등록된 태그 삭제/관리 목록 */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className={`text-xs font-bold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                등록된 태그 목록 (X 클릭 시 삭제)
              </label>
              <div className="max-h-56 overflow-y-auto flex flex-wrap gap-2 p-2 border rounded-xl border-inherit">
                {allAvailableTags.length === 0 ? (
                  <p className="text-xs opacity-60">등록된 태그가 없습니다.</p>
                ) : (
                  allAvailableTags.map(tag => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                        isDark ? 'bg-white/[0.04] border-white/[0.08] text-[#EDEDEF]' : 'bg-black/[0.03] border-black/[0.08] text-[#121316]'
                      }`}
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="hover:text-red-400 p-0.5 text-[#A1A1AA]"
                        title="태그 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* 닫기 버튼 */}
            <div className="flex justify-end pt-2 border-t border-inherit">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5E6AD2] hover:bg-[#4E5AC2] text-white"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자모 유사도 분석 모달 */}
      {isJamoModalOpen && (
        <JamoSimilarityReportModal
          isDark={isDark}
          archiveItems={archiveItems}
          onClose={() => setIsJamoModalOpen(false)}
          onSelectItem={(item) => handleOpenDetail(item)}
          ignoredPairs={ignoredSimilarityPairs}
          onToggleIgnorePair={handleToggleIgnorePair}
        />
      )}
    </div>
  );
}
