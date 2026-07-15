import { useState, useEffect, useRef } from 'react';
import type { FontOption } from '../lib/fonts';
import { DEFAULT_FONTS } from '../lib/fonts';
import { useAlertConfirm } from '../context/AlertConfirmContext';

export function useEditorFormat() {
  const { showConfirm, showAlert } = useAlertConfirm();
  // 1. 글꼴 크기 (localStorage 연동)
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('novelflow_editor_fontsize');
    return saved ? parseInt(saved, 10) : 16;
  });

  // 2. 글꼴 패밀리 (localStorage 연동)
  const [editorFontFamily, setEditorFontFamily] = useState<string>(() => {
    return localStorage.getItem('novelflow_editor_fontfamily') || 'Nanum Gothic';
  });

  // 3. 줄간격 (localStorage 연동)
  const [lineHeight, setLineHeight] = useState<string>(() => {
    return localStorage.getItem('novelflow_editor_lineheight') || '1.8';
  });

  // 4. 문단간격 (localStorage 연동)
  const [paragraphSpacing, setParagraphSpacing] = useState<number>(() => {
    const saved = localStorage.getItem('novelflow_editor_paragraphspacing');
    return saved ? parseInt(saved, 10) : 8;
  });

  // 5. 폭 (localStorage 연동)
  const [editorWidth, setEditorWidth] = useState<'narrow' | 'normal' | 'wide'>(() => {
    return (localStorage.getItem('novelflow_editor_width') as any) || 'normal';
  });

  // 6. 첫줄 들여쓰기 (localStorage 연동)
  const [firstLineIndent, setFirstLineIndent] = useState<boolean>(() => {
    return localStorage.getItem('novelflow_editor_firstlineindent') === 'true';
  });

  // 7. 에디터 전용 테마 오버라이드 (localStorage 연동)
  const [editorThemeOverride, setEditorThemeOverride] = useState<'system' | 'light' | 'dark' | 'sepia' | 'gray'>(() => {
    return (localStorage.getItem('novelflow_editor_themeoverride') as any) || 'system';
  });

  // 8. 타이프라이터 모드 (localStorage 연동)
  const [typewriterMode, setTypewriterMode] = useState<boolean>(() => {
    return localStorage.getItem('novelflow_editor_typewritermode') === 'true';
  });

  const [recentFontIds, setRecentFontIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('novelflow_recent_fonts') || '[]');
    } catch {
      return [];
    }
  });

  const [uploadedFonts, setUploadedFonts] = useState<FontOption[]>([]);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bgColorPickerPos, setBgColorPickerPos] = useState<{ top: number; left: number } | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      editorRef.current?.focus();
    }
  };

  const pushHistory = () => {
    if (!editorRef.current) return;
    historyRef.current.past.push(editorRef.current.innerHTML);
    historyRef.current.future = [];
  };

  const undo = (handleContentInput?: () => void) => {
    const { past, future } = historyRef.current;
    if (past.length === 0 || !editorRef.current) return;
    future.push(editorRef.current.innerHTML);
    editorRef.current.innerHTML = past.pop()!;
    if (handleContentInput) handleContentInput();
  };

  const redo = (handleContentInput?: () => void) => {
    const { past, future } = historyRef.current;
    if (future.length === 0 || !editorRef.current) return;
    past.push(editorRef.current.innerHTML);
    editorRef.current.innerHTML = future.pop()!;
    if (handleContentInput) handleContentInput();
  };

  const getSelectionFontState = (): string | 'mixed' | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return null;
    const range = sel.getRangeAt(0);
    
    // 에디터 밖의 선택 영역인 경우 제외
    if (!editorRef.current.contains(range.commonAncestorContainer)) return null;

    if (range.collapsed) {
      const node = range.startContainer;
      const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
      if (parent) {
        return window.getComputedStyle(parent).fontFamily.replace(/['"]/g, '');
      }
      return null;
    }

    const container = range.commonAncestorContainer;
    const walker = document.createTreeWalker(
      container.nodeType === Node.TEXT_NODE ? container.parentNode! : container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
                 range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const fonts = new Set<string>();
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent?.replace(/\u200B/g, '').trim() === '') continue;
      const parent = node.parentElement;
      if (parent) {
        const family = window.getComputedStyle(parent).fontFamily.replace(/['"]/g, '');
        fonts.add(family);
      }
    }

    if (fonts.size === 0) {
      const parent = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
      if (parent) return window.getComputedStyle(parent).fontFamily.replace(/['"]/g, '');
      return null;
    }
    if (fonts.size > 1) return 'mixed';
    return Array.from(fonts)[0];
  };

  const getSelectionSizeState = (): number | 'mixed' | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return null;
    const range = sel.getRangeAt(0);

    // 에디터 밖의 선택 영역인 경우 제외
    if (!editorRef.current.contains(range.commonAncestorContainer)) return null;

    if (range.collapsed) {
      const node = range.startContainer;
      const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
      if (parent) {
        const sizeStr = window.getComputedStyle(parent).fontSize;
        return parseInt(sizeStr, 10);
      }
      return null;
    }

    const container = range.commonAncestorContainer;
    const walker = document.createTreeWalker(
      container.nodeType === Node.TEXT_NODE ? container.parentNode! : container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          return range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
                 range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const sizes = new Set<number>();
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent?.replace(/\u200B/g, '').trim() === '') continue;
      const parent = node.parentElement;
      if (parent) {
        const sizeStr = window.getComputedStyle(parent).fontSize;
        sizes.add(parseInt(sizeStr, 10));
      }
    }

    if (sizes.size === 0) {
      const parent = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
      if (parent) return parseInt(window.getComputedStyle(parent).fontSize, 10);
      return null;
    }
    if (sizes.size > 1) return 'mixed';
    return Array.from(sizes)[0];
  };

  // localStorage 저장을 위한 useEffect들
  useEffect(() => {
    localStorage.setItem('novelflow_editor_fontsize', editorFontSize.toString());
  }, [editorFontSize]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_fontfamily', editorFontFamily);
  }, [editorFontFamily]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_lineheight', lineHeight);
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_paragraphspacing', paragraphSpacing.toString());
  }, [paragraphSpacing]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_width', editorWidth);
  }, [editorWidth]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_firstlineindent', firstLineIndent.toString());
  }, [firstLineIndent]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_themeoverride', editorThemeOverride);
  }, [editorThemeOverride]);

  useEffect(() => {
    localStorage.setItem('novelflow_editor_typewritermode', typewriterMode.toString());
  }, [typewriterMode]);

  useEffect(() => {
    localStorage.setItem('novelflow_recent_fonts', JSON.stringify(recentFontIds));
  }, [recentFontIds]);

  // 커스텀 폰트 로드 (arrayBuffer 기반 복원)
  useEffect(() => {
    const loadUploadedFonts = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('novelflow_uploaded_fonts') || '[]');
        const restored: FontOption[] = [];
        for (const item of saved) {
          try {
            const response = await fetch(item.dataUrl);
            const buffer = await response.arrayBuffer();
            const fontFace = new FontFace(item.family, buffer);
            await fontFace.load();
            (document.fonts as any).add(fontFace);

            restored.push({
              id: item.id,
              label: item.label,
              family: item.family,
              category: 'uploaded',
              source: 'upload',
            });
          } catch (error) {
            console.error('업로드 폰트 복원 실패', error);
          }
        }
        setUploadedFonts(restored);
      } catch (error) {
        console.error('업로드 폰트 로드 실패', error);
      }
    };
    loadUploadedFonts();
  }, []);

  const allFonts = [...DEFAULT_FONTS, ...uploadedFonts];

  const groupedFonts = allFonts.reduce<Record<string, FontOption[]>>((acc, font) => {
    const key = font.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(font);
    return acc;
  }, {});

  const recordRecentFont = (fontId: string) => {
    setRecentFontIds(prev => [fontId, ...prev.filter(id => id !== fontId)].slice(0, 3));
  };

  const handleFontUpload = async (file: File) => {
    const confirmMsg = "업로드하시는 폰트 파일의 라이선스 및 상업적 이용 가능 여부는 사용자 본인의 책임 하에 있습니다. 계속 진행하시겠습니까?";
    if (!(await showConfirm(confirmMsg))) return;

    try {
      const family = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').trim() || `uploaded-font-${Date.now()}`;
      const fontId = `upload-${Date.now()}`;
      const buffer = await file.arrayBuffer();
      const fontFace = new FontFace(family, buffer);
      await fontFace.load();
      (document.fonts as any).add(fontFace);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const saved = JSON.parse(localStorage.getItem('novelflow_uploaded_fonts') || '[]');
      const nextSaved = [...saved, { id: fontId, label: family, family, dataUrl }];
      localStorage.setItem('novelflow_uploaded_fonts', JSON.stringify(nextSaved));

      const newFont: FontOption = {
        id: fontId,
        label: family,
        family,
        category: 'uploaded',
        source: 'upload',
      };

      setUploadedFonts(prev => [...prev, newFont]);
      setEditorFontFamily(family);
      recordRecentFont(fontId);
    } catch (error) {
      console.error(error);
      showAlert('폰트 업로드에 실패했습니다. ttf, otf, woff, woff2 파일인지 확인해 주세요.');
    }
  };

  const applyStyleToSelection = (styleName: 'fontSize' | 'fontFamily', styleValue: string) => {
    pushHistory();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      const span = document.createElement('span');
      if (styleName === 'fontSize') {
        span.style.fontSize = `${styleValue}px`;
      } else {
        span.style.fontFamily = styleValue;
      }
      span.appendChild(document.createTextNode('\u200B'));
      range.insertNode(span);
      
      range.setStartAfter(span.firstChild!);
      range.setEndAfter(span.firstChild!);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      const content = range.extractContents();
      const span = document.createElement('span');
      if (styleName === 'fontSize') {
        span.style.fontSize = `${styleValue}px`;
      } else {
        span.style.fontFamily = styleValue;
      }
      span.appendChild(content);

      span.querySelectorAll('span').forEach(child => {
        if (styleName === 'fontSize') {
          child.style.fontSize = '';
        } else {
          child.style.fontFamily = '';
        }
        if (!child.style.cssText || child.style.cssText.trim() === '') {
          const parent = child.parentNode;
          if (parent) {
            while (child.firstChild) {
              parent.insertBefore(child.firstChild, child);
            }
            parent.removeChild(child);
          }
        }
      });

      range.insertNode(span);

      const newRange = document.createRange();
      newRange.selectNode(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  };

  const clearFormat = (handleContentInput?: () => void) => {
    pushHistory();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    document.execCommand('removeFormat', false, undefined);

    if (handleContentInput) handleContentInput();
    saveSelection();
  };

  const execFormat = (command: string, value: string = '', handleContentInput?: () => void) => {
    restoreSelection();
    if (command === 'fontSize') {
      const sizeNum = parseInt(value);
      if (!isNaN(sizeNum)) {
        applyStyleToSelection('fontSize', sizeNum.toString());
        setEditorFontSize(sizeNum);
      }
    } else if (command === 'fontName') {
      applyStyleToSelection('fontFamily', value);
      setEditorFontFamily(value);
      const matchedFont = allFonts.find(font => font.family === value);
      if (matchedFont) recordRecentFont(matchedFont.id);
    } else if (command === 'undo') {
      undo(handleContentInput);
    } else if (command === 'redo') {
      redo(handleContentInput);
    } else if (command === 'clearFormat') {
      clearFormat(handleContentInput);
    } else {
      pushHistory();
      document.execCommand(command, false, value);
    }
    if (handleContentInput) {
      handleContentInput();
    }
    saveSelection();
  };

  return {
    editorFontSize,
    setEditorFontSize,
    editorFontFamily,
    setEditorFontFamily,
    lineHeight,
    setLineHeight,
    paragraphSpacing,
    setParagraphSpacing,
    editorWidth,
    setEditorWidth,
    firstLineIndent,
    setFirstLineIndent,
    editorThemeOverride,
    setEditorThemeOverride,
    typewriterMode,
    setTypewriterMode,
    recentFontIds,
    setRecentFontIds,
    uploadedFonts,
    setUploadedFonts,
    showFontDropdown,
    setShowFontDropdown,
    showStatsDropdown,
    setShowStatsDropdown,
    showColorPicker,
    setShowColorPicker,
    colorPickerPos,
    setColorPickerPos,
    showBgColorPicker,
    setShowBgColorPicker,
    bgColorPickerPos,
    setBgColorPickerPos,
    editorRef,
    saveSelection,
    restoreSelection,
    execFormat,
    allFonts,
    groupedFonts,
    recordRecentFont,
    handleFontUpload,
    pushHistory,
    undo,
    redo,
    clearFormat,
    getSelectionFontState,
    getSelectionSizeState
  };
}
