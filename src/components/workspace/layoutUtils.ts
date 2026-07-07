export type PanelNode = {
  type: 'panel';
  id: string;
  activeFeature: string;
  selectedEpisodeId: string | null;
};

export type SplitNode = {
  type: 'split';
  id: string;
  direction: 'row' | 'col';
  ratio: number; // 0 ~ 100
  children: [LayoutNode, LayoutNode];
};

export type LayoutNode = PanelNode | SplitNode;

/**
 * 트리에 존재하는 모든 패널 노드의 ID 목록을 반환합니다.
 */
export function getAllPanelIds(node: LayoutNode): string[] {
  if (node.type === 'panel') {
    return [node.id];
  }
  return [
    ...getAllPanelIds(node.children[0]),
    ...getAllPanelIds(node.children[1]),
  ];
}

/**
 * 트리 내에서 특정 ID를 가진 패널 노드를 찾아 반환합니다.
 */
export function findPanel(node: LayoutNode, id: string): PanelNode | null {
  if (node.type === 'panel') {
    return node.id === id ? node : null;
  }
  return findPanel(node.children[0], id) || findPanel(node.children[1], id);
}

/**
 * 트리에서 가장 첫 번째(왼쪽/위쪽) 패널 노드의 ID를 반환합니다.
 */
export function findFirstPanelId(node: LayoutNode): string {
  if (node.type === 'panel') {
    return node.id;
  }
  return findFirstPanelId(node.children[0]);
}

/**
 * 특정 패널의 상태를 업데이트한 새로운 레이아웃 트리를 반환합니다. (불변성 유지)
 */
export function updatePanelState(
  node: LayoutNode,
  id: string,
  updates: Partial<Omit<PanelNode, 'type' | 'id'>>
): LayoutNode {
  if (node.type === 'panel') {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    return node;
  }
  return {
    ...node,
    children: [
      updatePanelState(node.children[0], id, updates),
      updatePanelState(node.children[1], id, updates),
    ],
  };
}

/**
 * 특정 분할 노드(Split Node)의 ratio를 업데이트한 새로운 레이아웃 트리를 반환합니다.
 */
export function updateSplitRatio(
  node: LayoutNode,
  splitId: string,
  ratio: number
): LayoutNode {
  if (node.type === 'panel') {
    return node;
  }
  if (node.id === splitId) {
    return { ...node, ratio };
  }
  return {
    ...node,
    children: [
      updateSplitRatio(node.children[0], splitId, ratio),
      updateSplitRatio(node.children[1], splitId, ratio),
    ],
  };
}

/**
 * targetId를 가진 패널을 분할 방향(direction: row/col) 및 위치(position: first/second)에 맞추어
 * 기존 패널의 복제본과 함께 분할(Split)한 새로운 트리를 반환합니다.
 */
export function splitPanel(
  node: LayoutNode,
  targetId: string,
  direction: 'row' | 'col',
  position: 'first' | 'second',
  newPanelId: string
): LayoutNode {
  if (node.type === 'panel') {
    if (node.id === targetId) {
      const originalCopy: PanelNode = {
        type: 'panel',
        id: node.id,
        activeFeature: node.activeFeature,
        selectedEpisodeId: node.selectedEpisodeId,
      };
      const newPanel: PanelNode = {
        type: 'panel',
        id: newPanelId,
        activeFeature: node.activeFeature,
        selectedEpisodeId: node.selectedEpisodeId,
      };

      const children: [LayoutNode, LayoutNode] =
        position === 'first' ? [newPanel, originalCopy] : [originalCopy, newPanel];

      const splitNode: SplitNode = {
        type: 'split',
        id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        direction,
        ratio: 50,
        children,
      };
      return splitNode;
    }
    return node;
  }

  return {
    ...node,
    children: [
      splitPanel(node.children[0], targetId, direction, position, newPanelId),
      splitPanel(node.children[1], targetId, direction, position, newPanelId),
    ],
  };
}

/**
 * targetId를 가진 패널을 트리에서 제거하고, 부모 분할 노드를 남아있는 형제 노드로 접은 새로운 트리를 반환합니다.
 * 또한 지워진 패널 대신 새롭게 포커스를 주어야 할 패널의 ID(형제 패널 혹은 첫 패널 등)도 함께 반환합니다.
 */
export function closePanel(
  node: LayoutNode,
  targetId: string
): { root: LayoutNode; nextFocusId: string | null } {
  // 만약 루트 노드가 패널이고 그 아이디가 삭제 대상이면 삭제가 불가능하므로 그대로 반환
  if (node.type === 'panel') {
    return { root: node, nextFocusId: node.id };
  }

  // 1. 자식 중 하나가 패널이고 삭제 대상인지 직접 검사
  const [left, right] = node.children;

  if (left.type === 'panel' && left.id === targetId) {
    // 왼쪽 자식이 제거 대상이면, 오른쪽 자식이 부모의 위치를 대체함
    const nextFocus = findFirstPanelId(right);
    return { root: right, nextFocusId: nextFocus };
  }

  if (right.type === 'panel' && right.id === targetId) {
    // 오른쪽 자식이 제거 대상이면, 왼쪽 자식이 부모의 위치를 대체함
    const nextFocus = findFirstPanelId(left);
    return { root: left, nextFocusId: nextFocus };
  }

  // 2. 더 깊은 단계에서 재귀적으로 지우기
  // 왼쪽 자식 하위에서 제거를 시도해 봄
  const leftResult = closePanel(left, targetId);
  if (leftResult.root !== left) {
    // 왼쪽 자식 트리 내에서 제거가 일어남
    return {
      root: {
        ...node,
        children: [leftResult.root, right],
      },
      nextFocusId: leftResult.nextFocusId,
    };
  }

  // 오른쪽 자식 트리 내에서 제거를 시도해 봄
  const rightResult = closePanel(right, targetId);
  if (rightResult.root !== right) {
    // 오른쪽 자식 트리 내에서 제거가 일어남
    return {
      root: {
        ...node,
        children: [left, rightResult.root],
      },
      nextFocusId: rightResult.nextFocusId,
    };
  }

  return { root: node, nextFocusId: null };
}
