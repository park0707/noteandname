// --- WritingSpace 및 EditorToolbar용 공통 유틸리티 함수 집합 ---

/**
 * 스냅샷 저장을 위한 타임스탬프 문자열 포맷터 (YYYY-MM-DD-HH-Min)
 */
export const formatSnapshotTimestamp = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}-${min}`;
};

/**
 * 구분선 선형 스타일 문자기호 생성기 (가로폭을 채우기 위한 150자 반복)
 */
export const getLineText = (style: string): string => {
  let char = '─'; // solid default
  if (style === 'dashed') {
    char = '┄';
  } else if (style === 'double') {
    char = '═';
  }
  return char.repeat(150);
};

/**
 * 레거시 구분선 HTML 마크업을 신규 문자기호형(p.novela-divider-text)으로 변환해 주는 호환성 파서
 */
export const convertDividerHtmlToText = (html: string): string => {
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

/**
 * 에디터 HTML 데이터를 원고 내보내기용 마크다운(Markdown) 포맷으로 변환하는 파서
 */
export const convertHtmlToMarkdown = (html: string): string => {
  let md = html;
  
  // blockquote 변환
  md = md.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const cleanInner = inner.replace(/<[^>]*>/g, '').trim();
    return `\n\n> ${cleanInner.split('\n').join('\n> ')}\n\n`;
  });
  
  // table 변환
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
  
  // 텍스트 서식 변환
  md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  md = md.replace(/<(strike|s)[^>]*>([\s\S]*?)<\/\1>/gi, '~~$2~~');
  md = md.replace(/<u>([\s\S]*?)<\/u>/gi, '<u>$1</u>');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<\/div>/gi, '\n\n');
  
  // 기타 모든 HTML 태그 제거
  md = md.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 복원
  md = md.replace(/&nbsp;/g, ' ')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&amp;/g, '&')
         .replace(/&quot;/g, '"');
         
  return md.trim();
};
