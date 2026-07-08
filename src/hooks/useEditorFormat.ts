import { useState, useEffect, useRef } from 'react';
import type { FontOption } from '../lib/fonts';
import { DEFAULT_FONTS } from '../lib/fonts';

export function useEditorFormat() {
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
    if (!confirm(confirmMsg)) return;

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
      alert('폰트 업로드에 실패했습니다. ttf, otf, woff, woff2 파일인지 확인해 주세요.');
    }
  };

  const execFormat = (command: string, value: string = '', handleContentInput?: () => void) => {
    restoreSelection();
    if (command === 'fontSize') {
      const sizeNum = parseInt(value);
      const sel = window.getSelection();
      
      if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
        document.execCommand('fontSize', false, '7');
        const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
        fontElements?.forEach(font => {
          const span = document.createElement('span');
          span.style.fontSize = `${sizeNum}px`;
          span.innerHTML = font.innerHTML;
          font.parentNode?.replaceChild(span, font);
        });
      } else if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = `${sizeNum}px`;
        span.appendChild(document.createTextNode('\u200B'));
        
        range.insertNode(span);
        range.setStartAfter(span.firstChild!);
        range.setEndAfter(span.firstChild!);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setEditorFontSize(sizeNum);
    } else if (command === 'fontName') {
      document.execCommand('fontName', false, value);
      const fontElements = editorRef.current?.querySelectorAll(`font[face="${value}"]`);
      fontElements?.forEach(font => {
        const span = document.createElement('span');
        span.style.fontFamily = value;
        span.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(span, font);
      });
      setEditorFontFamily(value);
      const matchedFont = allFonts.find(font => font.family === value);
      if (matchedFont) recordRecentFont(matchedFont.id);
    } else {
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
    handleFontUpload
  };
}
