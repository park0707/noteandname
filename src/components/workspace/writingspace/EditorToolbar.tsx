import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ChevronDown,
  ChevronUp,
  Search,
  Minimize2,
  Maximize2,
  BookOpen,
  Grid,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  Indent,
  Outdent,
  Eraser
} from 'lucide-react';
import { FONT_CATEGORY_LABELS } from '../../../lib/fonts';
import type { FontOption } from '../../../lib/fonts';

interface EditorToolbarProps {
  isDark: boolean;
  isFocusMode: boolean;
  setIsFocusMode: (v: boolean) => void;
  execFormat: (command: string, value?: string) => void;
  editorFontSize: number;
  setEditorFontSize: Dispatch<SetStateAction<number>>;
  editorFontFamily: string;
  currentFontFamily: string | 'mixed';
  currentFontSize: number | 'mixed';
  recentFontIds: string[];
  allFonts: FontOption[];
  groupedFonts: Record<string, FontOption[]>;
  handleFontUpload: (file: File) => Promise<void>;
  showFontDropdown: boolean;
  setShowFontDropdown: (show: boolean) => void;
  showStatsDropdown: boolean;
  setShowStatsDropdown: (show: boolean) => void;
  typewriterMode: boolean;
  setTypewriterMode: (v: boolean) => void;
  lineHeight: string;
  setLineHeight: (lh: string) => void;
  paragraphSpacing: number;
  setParagraphSpacing: (ps: number) => void;
  showFindReplace: boolean;
  setShowFindReplace: (show: boolean) => void;
  handleCreateSnapshot: () => void;
  setShowHistoryModal: (show: boolean) => void;
  historySnapshotsCount: number;
  editorSaveStatus: 'saved' | 'saving';
  charCountWithSpaces: number;
  charCountWithoutSpaces: number;
  manuscriptPages: number;
  targetWordCount: number;
  progressPercent: number;
  themeStyles: any;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  colorPickerPos: { top: number; left: number } | null;
  setColorPickerPos: (pos: { top: number; left: number } | null) => void;
  showBgColorPicker: boolean;
  setShowBgColorPicker: (show: boolean) => void;
  bgColorPickerPos: { top: number; left: number } | null;
  setBgColorPickerPos: (pos: { top: number; left: number } | null) => void;
  saveSelection: () => void;
  restoreSelection: () => void;
  firstLineIndent: boolean;
  setFirstLineIndent: (v: boolean) => void;
}

export default function EditorToolbar(props: EditorToolbarProps) {
  const {
    isDark,
    isFocusMode,
    setIsFocusMode,
    execFormat,
    editorFontSize,
    currentFontFamily,
    currentFontSize,
    recentFontIds,
    allFonts,
    groupedFonts,
    handleFontUpload,
    showFontDropdown,
    setShowFontDropdown,
    showStatsDropdown,
    setShowStatsDropdown,
    typewriterMode,
    setTypewriterMode,
    lineHeight,
    setLineHeight,
    paragraphSpacing,
    setParagraphSpacing,
    showFindReplace,
    setShowFindReplace,
    handleCreateSnapshot,
    setShowHistoryModal,
    historySnapshotsCount,
    editorSaveStatus,
    charCountWithSpaces,
    charCountWithoutSpaces,
    manuscriptPages,
    targetWordCount,
    progressPercent,
    themeStyles,
    showColorPicker,
    setShowColorPicker,
    colorPickerPos,
    setColorPickerPos,
    showBgColorPicker,
    setShowBgColorPicker,
    bgColorPickerPos,
    setBgColorPickerPos,
    saveSelection,
    restoreSelection,
    firstLineIndent,
    setFirstLineIndent,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const statsDropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [showDividerDropdown, setShowDividerDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [fontSizeInput, setFontSizeInput] = useState(
    currentFontSize === 'mixed' ? '' : currentFontSize.toString()
  );

  useEffect(() => {
    setFontSizeInput(currentFontSize === 'mixed' ? '' : currentFontSize.toString());
  }, [currentFontSize]);

  // 내보내기 드롭다운 외부 클릭 감지 → 닫기
  useEffect(() => {
    if (!showExportDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  // 상세 자수 드롭다운 외부 클릭 감지 → 닫기
  useEffect(() => {
    if (!showStatsDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statsDropdownRef.current && !statsDropdownRef.current.contains(e.target as Node)) {
        setShowStatsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatsDropdown, setShowStatsDropdown]);

  // 폰트 드롭다운 외부 클릭 감지 → 닫기
  useEffect(() => {
    if (!showFontDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setShowFontDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFontDropdown, setShowFontDropdown]);

  const [showCreateDividerModal, setShowCreateDividerModal] = useState(false);

  // 모달 입력 필드 상태
  const [newDividerName, setNewDividerName] = useState('');
  const [newDividerType, setNewDividerType] = useState<'line' | 'text'>('line');
  const [newDividerStyle, setNewDividerStyle] = useState('dashed'); // solid, dashed, double
  const [newDividerSymbol, setNewDividerSymbol] = useState('◆ ◆ ◆');
  const [newDividerSize, setNewDividerSize] = useState('16'); // font-size or thickness

  // 통합 구분선 설정 모달 상태
  const [activeDividerConfig, setActiveDividerConfig] = useState<any | null>(null);
  const [dividerAlign, setDividerAlign] = useState<'left' | 'center' | 'right'>('center');
  const [dividerWidth, setDividerWidth] = useState('100'); // 100, 80, 50, 30
  const [dividerSize, setDividerSize] = useState('2'); // default 2px (or 16px for text)

  const [recentDividers, setRecentDividers] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('novelflow_recent_dividers') || '[]');
    } catch {
      return [];
    }
  });

  const [customDividers, setCustomDividers] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('novelflow_custom_dividers') || '[]');
    } catch {
      return [];
    }
  });

  // 표 삽입 모달 상태
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableWidth, setTableWidth] = useState(100);
  const [tableHasHeader, setTableHasHeader] = useState(true);

  // 링크 삽입 모달 상태
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const openTableInsertModal = () => {
    saveSelection();
    setTableRows(3);
    setTableCols(3);
    setTableWidth(100);
    setTableHasHeader(true);
    setShowTableModal(true);
  };

  const openLinkInsertModal = () => {
    saveSelection();
    const selectedText = window.getSelection()?.toString() || '';
    setLinkText(selectedText);
    setLinkUrl('');
    setLinkNewTab(true);
    setShowLinkModal(true);
  };

  const executeInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    restoreSelection();
    
    const rows = Number(tableRows);
    const cols = Number(tableCols);
    if (isNaN(rows) || rows < 1 || rows > 20 || isNaN(cols) || cols < 1 || cols > 20) {
      alert('행과 열 개수는 1에서 20 사이의 숫자여야 합니다.');
      return;
    }
    
    let tableHtml = `<table style="border-collapse: collapse; width: ${tableWidth}%; margin: 16px 0; display: table;">`;
    
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        if (r === 0 && tableHasHeader) {
          tableHtml += `<th style="border: 1px solid rgba(128,128,128,0.3); padding: 8px; min-width: 50px; font-weight: bold; background-color: rgba(94,106,210,0.1);">&nbsp;</th>`;
        } else {
          tableHtml += `<td style="border: 1px solid rgba(128,128,128,0.2); padding: 8px; min-width: 50px;">&nbsp;</td>`;
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table>';
    
    execFormat('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  const executeInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    restoreSelection();

    const rawUrl = linkUrl.trim();
    if (!rawUrl) {
      alert('URL을 입력해 주세요.');
      return;
    }

    let testUrl = rawUrl;
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = 'https://' + testUrl;
    }

    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    if (!urlPattern.test(testUrl)) {
      alert('올바른 URL 형식이 아닙니다. (예: example.com 또는 https://example.com)');
      return;
    }

    let finalUrl = rawUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const textToDisplay = linkText.trim() || finalUrl;
    const targetAttr = linkNewTab ? '_blank' : '_self';
    const linkHtml = `<a href="${finalUrl}" target="${targetAttr}" rel="noopener noreferrer" style="color: #5E6AD2; text-decoration: underline; font-weight: 600;">${textToDisplay}</a>`;

    execFormat('insertHTML', linkHtml);
    setShowLinkModal(false);
  };

  const convertHtmlToMarkdown = (html: string) => {
    let md = html;
    md = md.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
      const cleanInner = inner.replace(/<[^>]*>/g, '').trim();
      return `\n\n> ${cleanInner.split('\n').join('\n> ')}\n\n`;
    });
    md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
      const rows: string[] = [];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch;
      while ((trMatch = trRegex.exec(tableContent)) !== null) {
        const rowCells: string[] = [];
        const tdRegex = /<t(d|h)[^>]*>([\s\S]*?)<\/t(d|h)>/gi;
        let tdMatch;
        while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
          rowCells.push(tdMatch[2].replace(/<[^>]*>/g, '').trim());
        }
        if (rowCells.length > 0) {
          rows.push(`| ${rowCells.join(' | ')} |`);
        }
      }
      if (rows.length > 0) {
        const colCount = rows[0].split('|').length - 2;
        const separator = `| ${Array(colCount).fill('---').join(' | ')} |`;
        rows.splice(1, 0, separator);
        return `\n\n${rows.join('\n')}\n\n`;
      }
      return '';
    });
    md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
    md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
    md = md.replace(/<(strike|s)[^>]*>([\s\S]*?)<\/\1>/gi, '~~$2~~');
    md = md.replace(/<u>([\s\S]*?)<\/u>/gi, '<u>$1</u>');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<\/p>/gi, '\n\n');
    md = md.replace(/<\/div>/gi, '\n\n');
    md = md.replace(/<[^>]*>/g, '');
    md = md.replace(/&nbsp;/g, ' ')
           .replace(/&lt;/g, '<')
           .replace(/&gt;/g, '>')
           .replace(/&amp;/g, '&')
           .replace(/&quot;/g, '"');
    return md.trim();
  };

  const handleExportDocument = (format: 'txt' | 'md' | 'docx') => {
    const editorCanvas = document.querySelector('.novela-editor-content');
    if (!editorCanvas) {
      alert('에디터 내용을 찾을 수 없습니다.');
      return;
    }
    const htmlContent = editorCanvas.innerHTML;
    const titleInput = document.querySelector('input[placeholder="제목 없음"]') as HTMLInputElement;
    const docTitle = (titleInput?.value || 'Untitled').trim();
    let blob: Blob;
    let extension = '';
    if (format === 'txt') {
      let txt = htmlContent;
      txt = txt.replace(/<br\s*\/?>/gi, '\n');
      txt = txt.replace(/<\/p>/gi, '\n\n');
      txt = txt.replace(/<\/div>/gi, '\n\n');
      txt = txt.replace(/<[^>]*>/g, '');
      txt = txt.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"');
      blob = new Blob([txt.trim()], { type: 'text/plain;charset=utf-8' });
      extension = 'txt';
    } else if (format === 'md') {
      const markdown = convertHtmlToMarkdown(htmlContent);
      const fullMd = `# ${docTitle}\n\n${markdown}`;
      blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
      extension = 'md';
    } else {
      const docHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <style>
            body { font-family: 'Nanum Gothic', 'Malgun Gothic', sans-serif; line-height: 1.8; }
            p { margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #cccccc; padding: 8px; }
            blockquote { border-left: 4px solid #5E6AD2; background-color: #f3f4f6; padding: 10px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <h1>${docTitle}</h1>
          <div class="content">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;
      blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
      extension = 'doc';
    }
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${docTitle}.${extension}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setShowExportDropdown(false);
  };

  const handleToggleBlockquote = () => {
    saveSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    
    let container = range.startContainer as HTMLElement;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement as HTMLElement;
    }
    
    const blockquote = container.closest('blockquote');
    if (blockquote) {
      execFormat('formatBlock', '<p>');
    } else {
      execFormat('formatBlock', '<blockquote>');
    }
  };

  const toggleDividerDropdown = () => {
    if (!showDividerDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
    setShowDividerDropdown(!showDividerDropdown);
  };

  const openDividerConfigModal = (config: any) => {
    setActiveDividerConfig(config);
    setDividerAlign('center');
    setDividerWidth('100');
    setDividerSize(config.type === 'line' ? '2' : '16');
    setShowDividerDropdown(false);
  };

  const addToRecentDividers = (divider: any) => {
    setRecentDividers(prev => {
      const filtered = prev.filter(d => d.html !== divider.html);
      const updated = [divider, ...filtered].slice(0, 3);
      localStorage.setItem('novelflow_recent_dividers', JSON.stringify(updated));
      return updated;
    });
  };

  const getLineText = (style: string) => {
    let char = '─'; // solid default
    if (style === 'dashed') {
      char = '┄';
    } else if (style === 'double') {
      char = '═';
    }
    
    // Always use 150 characters to cover any editor width, clipped by overflow: hidden
    return char.repeat(150);
  };

  const convertDividerHtmlToText = (html: string): string => {
    if (html.includes('class="novela-divider-text"') || html.includes('class=\'novela-divider-text\'')) {
      return html;
    }

    if (html.includes('<hr') || html.includes('novela-divider-line')) {
      let style = 'solid';
      if (html.includes('dashed')) {
        style = 'dashed';
      } else if (html.includes('double')) {
        style = 'double';
      }
      
      let widthPercent = 100;
      const widthMatch = html.match(/width:\s*(\d+)%/);
      if (widthMatch) {
        widthPercent = parseInt(widthMatch[1]) || 100;
      }
      
      let thickness = '2';
      const borderTopMatch = html.match(/border-top:\s*(\d+)px/);
      if (borderTopMatch) {
        thickness = borderTopMatch[1];
      }
      
      let align = 'center';
      if (html.includes('margin: 24px auto 24px 0') || html.includes('margin: 24px 0 24px 0') || html.includes('margin: 24px auto 24px 0;')) {
        align = 'left';
      } else if (html.includes('margin: 24px 0 24px auto') || html.includes('margin: 24px 0 24px auto;')) {
        align = 'right';
      }

      let marginStyle = 'margin: 24px auto;';
      if (align === 'left') {
        marginStyle = 'margin: 24px auto 24px 0;';
      } else if (align === 'right') {
        marginStyle = 'margin: 24px 0 24px auto;';
      }

      const lineText = getLineText(style);
      return `<p class="novela-divider-text" style="text-align: ${align}; ${marginStyle} color: #888888; font-size: ${thickness === '2' ? '16' : thickness}px; font-weight: bold; letter-spacing: 2px; overflow: hidden; white-space: nowrap; width: ${widthPercent}%; display: block;">${lineText}</p>`;
    }
    
    if (html.includes('<div') || html.includes('novela-divider-text')) {
      const textMatch = html.match(/>([^<]+)<\/div>/);
      let symbol = '◆ ◆ ◆';
      if (textMatch) {
        symbol = textMatch[1].trim();
      }
      
      let align = 'center';
      const alignMatch = html.match(/text-align:\s*(\w+)/);
      if (alignMatch) {
        align = alignMatch[1];
      }
      
      let size = '16';
      const sizeMatch = html.match(/font-size:\s*(\d+)px/);
      if (sizeMatch) {
        size = sizeMatch[1];
      }

      let marginStyle = 'margin: 24px auto;';
      if (align === 'left') {
        marginStyle = 'margin: 24px auto 24px 0;';
      } else if (align === 'right') {
        marginStyle = 'margin: 24px 0 24px auto;';
      }

      return `<p class="novela-divider-text" style="text-align: ${align}; ${marginStyle} color: #888888; font-size: ${size}px; letter-spacing: 6px; font-weight: bold; font-family: sans-serif; display: block;">${symbol}</p>`;
    }

    return html;
  };

  const handleInsertDividerWithRecent = (name: string, html: string) => {
    const textHtml = convertDividerHtmlToText(html);
    execFormat('insertHTML', textHtml);
    setShowDividerDropdown(false);
    
    const tempDivider = {
      id: `temp_${Date.now()}`,
      name,
      html: textHtml
    };
    addToRecentDividers(tempDivider);
  };

  const handleInsertConfiguredDivider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDividerConfig) return;

    let marginStyle = 'margin: 24px auto;'; // center
    if (dividerAlign === 'left') {
      marginStyle = 'margin: 24px auto 24px 0;';
    } else if (dividerAlign === 'right') {
      marginStyle = 'margin: 24px 0 24px auto;';
    }

    let html = '';
    const styleOrSymbol = activeDividerConfig.type === 'line' 
      ? activeDividerConfig.style 
      : activeDividerConfig.symbol;

    if (activeDividerConfig.type === 'line') {
      const lineText = getLineText(styleOrSymbol);
      html = `<p class="novela-divider-text" style="text-align: ${dividerAlign}; ${marginStyle} color: #888888; font-size: ${dividerSize === '2' ? '16' : dividerSize}px; font-weight: bold; letter-spacing: 2px; overflow: hidden; white-space: nowrap; width: ${dividerWidth}%; display: block;">${lineText}</p>`;
    } else {
      html = `<p class="novela-divider-text" style="text-align: ${dividerAlign}; ${marginStyle} color: #888888; font-size: ${dividerSize}px; letter-spacing: 6px; font-weight: bold; font-family: sans-serif; display: block;">${styleOrSymbol}</p>`;
    }

    const typeLabel = activeDividerConfig.type === 'line' 
      ? (styleOrSymbol === 'dashed' ? '점선' : styleOrSymbol === 'solid' ? '실선' : '이중선')
      : (styleOrSymbol === '★ ★ ★' ? '별장식' : styleOrSymbol === '~ ~ ~' ? '물결선' : '기호선');
    const comboName = `${dividerSize}px ${typeLabel} (${dividerWidth}%, ${dividerAlign})`;

    const newCombo = {
      id: `combo_${Date.now()}`,
      name: comboName,
      html
    };

    execFormat('insertHTML', html);
    addToRecentDividers(newCombo);
    
    setActiveDividerConfig(null);
  };

  const handleCreateCustomDivider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDividerName.trim()) return;

    let html = '';
    if (newDividerType === 'line') {
      const lineText = getLineText(newDividerStyle);
      html = `<p class="novela-divider-text" style="text-align: center; margin: 24px auto; color: #888888; font-size: ${newDividerSize === '2' ? '16' : newDividerSize}px; font-weight: bold; letter-spacing: 2px; overflow: hidden; white-space: nowrap; width: 100%; display: block;">${lineText}</p>`;
    } else {
      html = `<p class="novela-divider-text" style="text-align: center; margin: 24px auto; color: #888888; font-size: ${newDividerSize}px; letter-spacing: 6px; font-weight: bold; display: block;">${newDividerSymbol}</p>`;
    }

    const newDivider = {
      id: `div_${Date.now()}`,
      name: newDividerName.trim(),
      type: newDividerType,
      styleOrSymbol: newDividerType === 'line' ? newDividerStyle : newDividerSymbol,
      color: '#888888',
      sizeOrThickness: newDividerSize,
      html
    };

    const updatedCustom = [newDivider, ...customDividers];
    setCustomDividers(updatedCustom);
    localStorage.setItem('novelflow_custom_dividers', JSON.stringify(updatedCustom));

    execFormat('insertHTML', html);
    addToRecentDividers(newDivider);
    
    setNewDividerName('');
    setShowCreateDividerModal(false);
  };



  return (
    <div className="flex flex-col shrink-0 select-none">
      {/* 1. 에디터 툴바 */}
      <div className={`px-4 py-2 border-b flex items-center justify-between gap-3 shrink-0 ${themeStyles.toolbar}`}>
        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('undo')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="실행 취소 (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('redo')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="다시 실행 (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 커스텀 폰트 선택 드롭다운 */}
          <div className="relative shrink-0 font-sans" ref={fontDropdownRef}>
            <button
              onClick={() => setShowFontDropdown(!showFontDropdown)}
              onMouseDown={e => e.preventDefault()}
              className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${themeStyles.input}`}
            >
              <span className="truncate max-w-[120px]">
                {currentFontFamily === 'mixed' ? '여러 폰트' : (allFonts.find(f => f.family === currentFontFamily)?.label || currentFontFamily)}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {showFontDropdown && (
              <div className={`absolute left-0 mt-1 z-50 py-2 w-64 rounded-xl border shadow-2xl flex flex-col ${
                isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
              }`}>
                {/* 폰트 업로드 */}
                <div className="px-2 pb-1.5 border-b border-gray-500/10">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowFontDropdown(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-center bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-colors"
                  >
                    + 폰트 업로드 하기
                  </button>
                </div>

                {/* 최근 사용 폰트 */}
                {recentFontIds.length > 0 && (
                  <div className="px-2 py-1.5 border-b border-gray-500/10">
                    <div className="text-[10px] text-gray-500 font-semibold px-2 mb-1">최근에 쓴 폰트</div>
                    <div className="flex flex-col gap-0.5">
                      {recentFontIds.slice(0, 3).map(fontId => {
                        const font = allFonts.find(f => f.id === fontId);
                        if (!font) return null;
                        return (
                          <button
                            key={fontId}
                            type="button"
                            onClick={() => {
                              execFormat('fontName', font.family);
                              setShowFontDropdown(false);
                            }}
                            onMouseDown={e => e.preventDefault()}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${
                              currentFontFamily === font.family ? 'text-[#7480E2] font-bold' : ''
                            }`}
                          >
                            {font.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 전체 폰트 목록 */}
                <div className="max-h-60 overflow-y-auto px-2 py-1">
                  {Object.entries(groupedFonts).map(([category, fonts]) => (
                    <div key={category} className="mb-2 last:mb-0">
                      <div className="text-[9px] text-gray-500 font-bold px-2 py-0.5 uppercase tracking-wider">
                        {FONT_CATEGORY_LABELS[category as keyof typeof FONT_CATEGORY_LABELS]}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {fonts.map(font => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => {
                              execFormat('fontName', font.family);
                              setShowFontDropdown(false);
                            }}
                            onMouseDown={e => e.preventDefault()}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${
                              currentFontFamily === font.family ? 'text-[#7480E2] font-bold' : ''
                            }`}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFontUpload(file);
              e.currentTarget.value = '';
            }}
          />

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 폰트 크기 */}
          <div className="flex items-center gap-1 shrink-0 font-sans">
            <div className={`flex items-center border rounded-lg overflow-hidden ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              <input
                type="text"
                value={fontSizeInput}
                onMouseDown={() => saveSelection()}
                onChange={e => {
                  const valStr = e.target.value;
                  if (valStr === '' || /^[0-9]+$/.test(valStr)) {
                    const val = parseInt(valStr);
                    if (!isNaN(val)) {
                      if (val > 100) {
                        setFontSizeInput('100');
                      } else {
                        setFontSizeInput(valStr);
                      }
                    } else {
                      setFontSizeInput('');
                    }
                  } else {
                    const defaultSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                    setFontSizeInput(defaultSize.toString());
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                  }
                }}
                onBlur={() => {
                  const val = parseInt(fontSizeInput);
                  const defaultSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                  if (!isNaN(val) && val > 0 && val <= 100) {
                    execFormat('fontSize', val.toString());
                  } else {
                    setFontSizeInput(defaultSize.toString());
                  }
                }}
                className={`w-10 py-1 px-1.5 text-center text-xs font-bold bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'text-white' : 'text-black'}`}
              />
              <div className={`flex flex-col border-l shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <button
                  onClick={() => {
                    const baseSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                    const nextSize = Math.min(100, baseSize + 1);
                    execFormat('fontSize', nextSize.toString());
                  }}
                  onMouseDown={e => e.preventDefault()}
                  className={`p-0.5 hover:bg-white/[0.04] border-b text-gray-500 hover:text-white shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => {
                    const baseSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                    const nextSize = Math.max(1, baseSize - 1);
                    execFormat('fontSize', nextSize.toString());
                  }}
                  onMouseDown={e => e.preventDefault()}
                  className="p-0.5 hover:bg-white/[0.04] text-gray-500 hover:text-white shrink-0"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 서식 스타일 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('bold')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] font-bold shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="굵게 (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('italic')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] italic shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="기울임 (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('underline')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] underline shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="밑줄 (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('strikeThrough')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] line-through shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="취소선"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 정렬 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('justifyLeft')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="왼쪽 정렬"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('justifyCenter')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="가운데 정렬 (웹소설 시/편지용)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('justifyRight')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="오른쪽 정렬"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('justifyFull')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="양쪽 정렬"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 들여쓰기/내어쓰기 및 서식 지우기 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('indent')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="들여쓰기 적용"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('outdent')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="내어쓰기 적용"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('clearFormat')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="서식 지우기 (초기화)"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 색상 및 서식 제거 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 글자 색상 */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (showColorPicker) {
                    setShowColorPicker(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setColorPickerPos({
                      top: rect.bottom + window.scrollY + 6,
                      left: rect.left + window.scrollX
                    });
                    setShowColorPicker(true);
                    setShowBgColorPicker(false);
                  }
                }}
                className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center font-bold text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                title="글자 색상"
              >
                A
                <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
              </button>
              {showColorPicker && colorPickerPos && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    top: `${colorPickerPos.top}px`,
                    left: `${colorPickerPos.left}px`,
                  }}
                  className={`z-[9999] p-2 rounded-lg border shadow-xl flex gap-1 ${isDark ? 'bg-[#1E1F22] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
                >
                  {['#EDEDEF', '#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#121316'].map(color => (
                    <div
                      key={color}
                      onClick={() => { execFormat('foreColor', color); setShowColorPicker(false); }}
                      className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 형광펜 효과 */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (showBgColorPicker) {
                    setShowBgColorPicker(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setBgColorPickerPos({
                      top: rect.bottom + window.scrollY + 6,
                      left: rect.left + window.scrollX
                    });
                    setShowBgColorPicker(true);
                    setShowColorPicker(false);
                  }
                }}
                className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                title="형광펜 효과"
              >
                <span className="bg-yellow-500 text-black px-0.5 rounded text-[10px]">ab</span>
                <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
              </button>
              {showBgColorPicker && bgColorPickerPos && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    top: `${bgColorPickerPos.top}px`,
                    left: `${bgColorPickerPos.left}px`,
                  }}
                  className={`z-[9999] p-2 rounded-lg border shadow-xl flex gap-1 ${isDark ? 'bg-[#1E1F22] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
                >
                  {['transparent', '#3F3F46', '#FCA5A5', '#FED7AA', '#FEF08A', '#86EFAC', '#93C5FD', '#C084FC'].map(color => (
                    <div
                      key={color}
                      onClick={() => { execFormat('hiliteColor', color); setShowBgColorPicker(false); }}
                      className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/20"
                      style={{ backgroundColor: color }}
                      title={color === 'transparent' ? '지우기' : undefined}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => execFormat('removeFormat')}
              className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}
              title="모든 스타일 서식 제거"
            >
              서식지우기
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pl-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${editorSaveStatus === 'saved' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}
            title={editorSaveStatus === 'saved' ? '저장 완료' : '저장 중...'}
          />
          <button
            onClick={() => {
              setShowFindReplace(!showFindReplace);
            }}
            title="찾기 및 바꾸기 (Ctrl+F)"
            className={`p-1.5 rounded-lg border transition-all duration-150 ${
              showFindReplace
                ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                : isDark
                  ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                  : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? "집중 모드 종료" : "집중 모드 시작"}
            className={`p-1.5 rounded-lg border transition-all duration-150 ${isFocusMode
              ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
              : isDark
                ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
              }`}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <div className="relative" ref={statsDropdownRef}>
            <button
              onClick={() => setShowStatsDropdown(!showStatsDropdown)}
              className={`px-3 py-1 rounded text-xs font-semibold border flex items-center gap-1 transition-all ${isDark
                ? 'bg-[#1F2023] border-white/[0.08] text-gray-300 hover:text-white'
                : 'bg-[#F3F4F6] border-black/[0.08] text-gray-700 hover:text-black'
                }`}
            >
              {charCountWithSpaces.toLocaleString()}자
              <ChevronDown className="w-3 h-3" />
            </button>

            {showStatsDropdown && (
              <div
                className={`absolute right-0 mt-2 z-40 p-4 rounded-xl border shadow-2xl w-60 flex flex-col gap-3 ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'}`}
              >
                <h4 className="text-xs font-bold border-b pb-1.5 flex justify-between items-center">
                  상세 자수 통계
                  <span className="text-[10px] text-gray-500 font-normal">200자 원고지 기준</span>
                </h4>

                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">공백 포함 글자수</span>
                    <span className="font-bold">{charCountWithSpaces.toLocaleString()}자</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">공백 제외 글자수</span>
                    <span className="font-bold">{charCountWithoutSpaces.toLocaleString()}자</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 mt-1 border-gray-500/10">
                    <span className="text-gray-500 font-medium">원고지 환산 매수</span>
                    <span className="text-[#5E6AD2] font-bold">{manuscriptPages} 장</span>
                  </div>

                  <div className="border-t pt-2 mt-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 font-medium">목표 달성도 ({targetWordCount.toLocaleString()}자)</span>
                      <span className="text-[#5E6AD2] font-bold">{progressPercent}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                      <div className="h-full bg-[#5E6AD2] rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 보조 설정 바 */}
      {!isFocusMode && (
        <div className={`px-6 py-2 border-b flex items-center justify-between gap-4 text-xs overflow-visible flex-wrap ${themeStyles.toolbar}`}>
          {/* 특수 편집 도구 */}
          <div className="flex items-center gap-3 shrink-0">

            <div className="relative shrink-0">
              <button
                ref={buttonRef}
                onClick={toggleDividerDropdown}
                className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 shrink-0 ${
                  isDark
                    ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400'
                    : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                }`}
                title="장면 전환용 구분선 종류 선택"
              >
                <span>구분선</span>
                <span className="text-[8px] opacity-60">▼</span>
              </button>

              {showDividerDropdown && (
                <div
                  onMouseLeave={() => setShowDividerDropdown(false)}
                  style={dropdownCoords ? { top: `${dropdownCoords.top}px`, left: `${dropdownCoords.left}px` } : undefined}
                  className={`fixed w-72 rounded-xl border p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 max-h-80 overflow-y-auto backdrop-blur-md ${
                    isDark
                      ? 'bg-[#1E1F22]/95 border-white/[0.08] text-gray-200 shadow-black/80'
                      : 'bg-white/95 border-black/[0.08] text-gray-800 shadow-black/10'
                  }`}
                >
                  {/* 최근 사용 구분선 */}
                  {recentDividers.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-gray-500 px-3.5 py-1.5 leading-none">최근 구분선</div>
                      {recentDividers.map((div: any) => (
                        <button
                          key={div.id}
                          onClick={() => handleInsertDividerWithRecent(div.name, div.html)}
                          className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                          title={div.name}
                        >
                          <span className="truncate block w-full">{div.name}</span>
                        </button>
                      ))}
                      <div className={`h-[1px] my-1 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />
                    </>
                  )}

                  {/* 기본 구분선 */}
                  <div className="text-[10px] font-bold text-gray-500 px-3.5 py-1.5 leading-none">기본 구분선</div>
                  <button
                    onClick={() => openDividerConfigModal({ type: 'line', style: 'dashed', defaultName: '점선 구분선' })}
                    className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                  >
                    점선 구분선 (설정 후 삽입)
                  </button>
                  <button
                    onClick={() => openDividerConfigModal({ type: 'line', style: 'solid', defaultName: '실선 구분선' })}
                    className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                  >
                    실선 구분선 (설정 후 삽입)
                  </button>
                  <button
                    onClick={() => openDividerConfigModal({ type: 'line', style: 'double', defaultName: '이중선 구분선' })}
                    className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                  >
                    이중선 구분선 (설정 후 삽입)
                  </button>
                  <button
                    onClick={() => openDividerConfigModal({ type: 'text', symbol: '★ ★ ★', defaultName: '별 장식선' })}
                    className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                  >
                    별 장식선 (★ ★ ★)
                  </button>
                  <button
                    onClick={() => openDividerConfigModal({ type: 'text', symbol: '~ ~ ~', defaultName: '물결선' })}
                    className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                  >
                    물결선 (~ ~ ~)
                  </button>

                  {/* 저장된 커스텀 구분선 */}
                  {customDividers.length > 0 && (
                    <>
                      <div className={`h-[1px] my-1 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />
                      <div className="text-[10px] font-bold text-gray-500 px-3.5 py-1.5 leading-none">마이 커스텀 구분선</div>
                      {customDividers.map((div: any) => (
                        <button
                          key={div.id}
                          onClick={() => handleInsertDividerWithRecent(div.name, div.html)}
                          className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal"
                          title={div.name}
                        >
                          <span className="truncate block w-full">{div.name}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* 커스텀 구분선 만들기 (가장 하단) */}
                  <div className={`h-[1px] my-1 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />
                  <button
                    onClick={() => {
                      setShowDividerDropdown(false);
                      setShowCreateDividerModal(true);
                    }}
                    className="w-full text-left px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#5E6AD2] hover:bg-[#5E6AD2]/10 transition-colors h-8 flex items-center leading-normal"
                  >
                    ➕ 커스텀 구분선 만들기
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleToggleBlockquote}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="인용구 블록 설정/해제"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openTableInsertModal}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="표 삽입"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openLinkInsertModal}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="링크 삽입"
            >
              <Link className="w-3.5 h-3.5" />
            </button>

            <div className="relative flex items-center shrink-0" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} flex items-center gap-1`}
                title="원고 내보내기"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">내보내기</span>
              </button>

              {showExportDropdown && (
                <div className={`absolute right-0 top-7 z-30 w-32 py-1 rounded-lg border shadow-xl text-xs flex flex-col ${
                  isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                }`}>
                  <button
                    onClick={() => handleExportDocument('txt')}
                    className={`w-full text-left px-3.5 py-2 transition-colors ${
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                    }`}
                  >
                    TXT 파일
                  </button>
                  <button
                    onClick={() => handleExportDocument('md')}
                    className={`w-full text-left px-3.5 py-2 transition-colors ${
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => handleExportDocument('docx')}
                    className={`w-full text-left px-3.5 py-2 transition-colors ${
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                    }`}
                  >
                    MS Word
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 줄간격, 문단간격, 타이프라이터, 스냅샷, 이력 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">줄간격</span>
              <select
                value={lineHeight}
                onChange={e => setLineHeight(e.target.value)}
                className={`px-2 py-0.5 rounded text-[10px] border outline-none cursor-pointer ${themeStyles.input}`}
              >
                <option value="1.2">1.2</option>
                <option value="1.5">1.5</option>
                <option value="1.8">1.8 (표준)</option>
                <option value="2.0">2.0</option>
                <option value="2.5">2.5</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">문단간격</span>
              <select
                value={paragraphSpacing}
                onChange={e => setParagraphSpacing(parseInt(e.target.value))}
                className={`px-2 py-0.5 rounded text-[10px] border outline-none cursor-pointer ${themeStyles.input}`}
              >
                <option value="0">0px</option>
                <option value="4">4px</option>
                <option value="8">8px (기본)</option>
                <option value="12">12px</option>
                <option value="16">16px</option>
                <option value="20">20px</option>
              </select>
            </div>



            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={firstLineIndent}
                onChange={e => setFirstLineIndent(e.target.checked)}
                className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-3.5 h-3.5"
              />
              <span className="text-[10px] text-gray-500 font-semibold">첫줄 들여쓰기</span>
            </label>

            <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={typewriterMode}
                onChange={e => setTypewriterMode(e.target.checked)}
                className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-3.5 h-3.5"
              />
              <span className="text-[10px] text-gray-500 font-semibold">타이프라이터 모드</span>
            </label>

            <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

            <button
              onClick={handleCreateSnapshot}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'}`}
              title="스냅샷 저장"
            >
              버전 스냅샷
            </button>

            {historySnapshotsCount > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/10 text-[#7480E2] hover:bg-[#5E6AD2]/20"
                title="버전 기록 목록 열기"
              >
                이력 ({historySnapshotsCount})
              </button>
            )}


          </div>
        </div>
      )}

      {/* 구분선 스타일 설정 모달 */}
      {activeDividerConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">⚙️ 구분선 스타일 설정 및 생성</h3>
              <button 
                onClick={() => setActiveDividerConfig(null)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInsertConfiguredDivider} className="flex flex-col gap-3.5 text-xs">
              {/* 구분선 형태 명시 */}
              <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-gray-500/5 border border-gray-500/10">
                <span className="font-semibold text-gray-400 text-[10px]">선택한 형태</span>
                <span className="font-bold text-sm">
                  {activeDividerConfig.defaultName} 
                  {activeDividerConfig.type === 'text' ? ` (${activeDividerConfig.symbol})` : ` (${activeDividerConfig.style})`}
                </span>
              </div>

              {/* 정렬 위치 */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-gray-400">정렬 위치</span>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setDividerAlign(align)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold transition-all ${
                        dividerAlign === align
                          ? 'border-[#5E6AD2] bg-[#5E6AD2]/10 text-[#7480E2]'
                          : isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                      }`}
                    >
                      {align === 'left' ? '왼쪽' : align === 'center' ? '가운데' : '오른쪽'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 길이 설정 (Line 타입인 경우 활성화) */}
              {activeDividerConfig.type === 'line' && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-gray-400">길이 (비율)</span>
                  <select
                    value={dividerWidth}
                    onChange={(e) => setDividerWidth(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                    }`}
                  >
                    <option value="100">100% (전체)</option>
                    <option value="80">80% (보통)</option>
                    <option value="50">50% (절반)</option>
                    <option value="30">30% (짧게)</option>
                  </select>
                </div>
              )}

              {/* 두께/크기 설정 */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-gray-400">
                  {activeDividerConfig.type === 'line' ? '선 두께 (px)' : '글자 크기 (px)'}
                </span>
                <select
                  value={dividerSize}
                  onChange={(e) => setDividerSize(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                    isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                  }`}
                >
                  {activeDividerConfig.type === 'line' ? (
                    <>
                      <option value="1">1px (가장 얇게)</option>
                      <option value="2">2px (보통)</option>
                      <option value="3">3px (두껍게)</option>
                      <option value="4">4px (가장 두껍게)</option>
                    </>
                  ) : (
                    <>
                      <option value="12">12px (작게)</option>
                      <option value="16">16px (보통)</option>
                      <option value="20">20px (크게)</option>
                      <option value="24">24px (가장 크게)</option>
                    </>
                  )}
                </select>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveDividerConfig(null)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                    isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                  }`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
                >
                  생성 및 삽입
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 커스텀 구분선 만들기 모달 */}
      {showCreateDividerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">➕ 나만의 커스텀 구분선 만들기</h3>
              <button 
                onClick={() => setShowCreateDividerModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomDivider} className="flex flex-col gap-3.5 text-xs">
              {/* 이름 */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-gray-400">구분선 이름</span>
                <input
                  type="text"
                  required
                  placeholder="예: 내 장미 기호 구분선"
                  value={newDividerName}
                  onChange={(e) => setNewDividerName(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              {/* 유형 */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-gray-400">구분선 종류</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewDividerType('line'); setNewDividerSize('2'); }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold transition-all ${
                      newDividerType === 'line'
                        ? 'border-[#5E6AD2] bg-[#5E6AD2]/10 text-[#7480E2]'
                        : isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                    }`}
                  >
                    선형 (Line)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewDividerType('text'); setNewDividerSize('16'); }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold transition-all ${
                      newDividerType === 'text'
                        ? 'border-[#5E6AD2] bg-[#5E6AD2]/10 text-[#7480E2]'
                        : isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                    }`}
                  >
                    문자기호형 (Text)
                  </button>
                </div>
              </div>

              {/* 형태 스타일/기호 입력 */}
              {newDividerType === 'line' ? (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-gray-400">선 스타일</span>
                  <select
                    value={newDividerStyle}
                    onChange={(e) => setNewDividerStyle(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                    }`}
                  >
                    <option value="solid">실선 (Solid)</option>
                    <option value="dashed">점선 (Dashed)</option>
                    <option value="double">이중선 (Double)</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-gray-400">구분 기호 문자</span>
                  <input
                    type="text"
                    required
                    placeholder="예: ◆ ◆ ◆ 또는 ◇ ◇ ◇ 또는 ★ ★ ★"
                    value={newDividerSymbol}
                    onChange={(e) => setNewDividerSymbol(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border outline-none ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                    }`}
                  />
                </div>
              )}

              {/* 두께/크기 설정 */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-gray-400">
                  {newDividerType === 'line' ? '선 두께 (px)' : '글자 크기 (px)'}
                </span>
                <select
                  value={newDividerSize}
                  onChange={(e) => setNewDividerSize(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                    isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                  }`}
                >
                  {newDividerType === 'line' ? (
                    <>
                      <option value="1">1px (가장 얇게)</option>
                      <option value="2">2px (보통)</option>
                      <option value="3">3px (두껍게)</option>
                      <option value="4">4px (가장 두껍게)</option>
                    </>
                  ) : (
                    <>
                      <option value="12">12px (작게)</option>
                      <option value="16">16px (보통)</option>
                      <option value="20">20px (크게)</option>
                      <option value="24">24px (가장 크게)</option>
                    </>
                  )}
                </select>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDividerModal(false)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                    isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                  }`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
                >
                  저장 및 삽입
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 표 삽입 모달 */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-80 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">📊 표(Table) 삽입</h3>
              <button 
                onClick={() => setShowTableModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={executeInsertTable} className="flex flex-col gap-3.5 text-xs">
              <div className="flex gap-3">
                {/* 행 */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">행 (Rows)</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                    }`}
                  />
                </div>
                {/* 열 */}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-semibold text-gray-400">열 (Cols)</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                    }`}
                  />
                </div>
              </div>

              {/* 너비 선택 */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-400">가로폭 너비 (%)</span>
                <select
                  value={tableWidth}
                  onChange={(e) => setTableWidth(parseInt(e.target.value) || 100)}
                  className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                    isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                  }`}
                >
                  <option value="100">100% (전체)</option>
                  <option value="80">80% (보통)</option>
                  <option value="50">50% (절반)</option>
                  <option value="30">30% (좁게)</option>
                </select>
              </div>

              {/* 첫 줄 헤더 행 여부 */}
              <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                <input
                  type="checkbox"
                  checked={tableHasHeader}
                  onChange={(e) => setTableHasHeader(e.target.checked)}
                  className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4"
                />
                <span className="font-semibold text-gray-400">첫 행을 제목 열(Header)로 지정</span>
              </label>

              {/* 버튼 그룹 */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                    isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                  }`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all"
                >
                  표 삽입
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 링크 삽입 모달 */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-80 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">🔗 링크(Link) 삽입</h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={executeInsertLink} className="flex flex-col gap-3.5 text-xs">
              {/* 표시할 글자 */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-400">표시할 텍스트</span>
                <input
                  type="text"
                  placeholder="미입력 시 URL이 그대로 노출됩니다"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              {/* URL 주소 */}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-400">링크 주소 (URL)</span>
                <input
                  type="text"
                  required
                  placeholder="예: naver.com 또는 google.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              {/* 새 창에서 열기 */}
              <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4"
                />
                <span className="font-semibold text-gray-400">새 탭에서 링크 열기 (target="_blank")</span>
              </label>

              {/* 버튼 그룹 */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                    isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                  }`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all"
                >
                  링크 삽입
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
