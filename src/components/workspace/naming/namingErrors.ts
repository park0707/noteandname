export type NamingErrorType = 'network' | 'auth' | 'quota' | 'server' | 'unknown';

export interface NamingErrorInfo {
  type: NamingErrorType;
  title: string;
  description: string;
  troubleshooting?: string[];
  rawMessage?: string;
}

/**
 * 에러 객체 또는 메시지를 분석하여 규격화된 NamingErrorInfo로 분류합니다.
 */
export function classifyNamingError(error: any): NamingErrorInfo {
  const msg = (error?.message || String(error) || '').toLowerCase();

  // 1. 네트워크 오프라인 / 연결 끊김
  if (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('connection refused') ||
    msg.includes('internet') ||
    msg.includes('offline')
  ) {
    return {
      type: 'network',
      title: '네트워크 연결 실패',
      description: '인터넷 연결이 원활하지 않거나 AI 서비스 서버에 도달할 수 없습니다.',
      troubleshooting: [
        '네트워크 Wi-Fi 또는 유선 랜 연결 상태를 확인해 주세요.',
        '방화벽, VPN 또는 보안 프로그램이 AI API 통신을 차단하고 있는지 점검해 주세요.',
        '네트워크가 정상 복구된 후 다시 시도해 주세요.'
      ],
      rawMessage: error?.message || String(error)
    };
  }

  // 2. API 키 미설정 또는 인증 실패 (401, 403, API_KEY_INVALID 등)
  if (
    msg.includes('api key') ||
    msg.includes('api_key') ||
    msg.includes('unauthorized') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('forbidden') ||
    msg.includes('invalid') ||
    msg.includes('미설정') ||
    msg.includes('permission')
  ) {
    return {
      type: 'auth',
      title: 'API 키 인증 오류',
      description: 'Google AI Studio 또는 Groq API 키가 설정되지 않았거나 유효하지 않습니다.',
      troubleshooting: [
        '환경변수(.env) 또는 시스템 설정에 올바른 API 키가 등록되어 있는지 확인해 주세요.',
        'Google AI Studio (Gemini) 또는 Groq Cloud 콘솔에서 발급받은 키의 권한 상태를 확인해 주세요.',
        'API 키 값 앞뒤에 불필요한 공백이나 오탈자가 없는지 점검해 주세요.'
      ],
      rawMessage: error?.message || String(error)
    };
  }

  // 3. 쿼터/할당량 소진 또는 요청 속도 제한 (429 Rate Limit / Resource Exhausted)
  if (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('too many requests')
  ) {
    return {
      type: 'quota',
      title: 'AI 쿼터 및 요청 한도 초과',
      description: 'AI 제공사의 분당 요청 한도(RPM) 또는 1일 무료 사용 쿼터가 소진되었습니다.',
      troubleshooting: [
        '무료 플랜의 일시적 분당 요청 제한일 수 있으니 1~2분 뒤 다시 시도해 주세요.',
        '1일 무료 쿼터(Google 1,500회)가 소진된 경우 보조 API(Groq 등)를 등록하시거나 다음 날 초기화 후 이용 가능합니다.'
      ],
      rawMessage: error?.message || String(error)
    };
  }

  // 4. 서버 장애 또는 타임아웃 (500, 502, 503, 504, Timeout 등)
  if (
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('overloaded') ||
    msg.includes('timeout') ||
    msg.includes('gateway') ||
    msg.includes('service unavailable')
  ) {
    return {
      type: 'server',
      title: 'AI 서비스 일시적 장애',
      description: 'AI 모델 제공사(Google/Groq) 서버에 일시적인 트래픽 과부하 또는 점검이 발생했습니다.',
      troubleshooting: [
        'AI 제공업체의 일시적인 인프라 과부하 상태입니다.',
        '잠시 후 다시 작명 실행을 눌러 재시도해 주세요.'
      ],
      rawMessage: error?.message || String(error)
    };
  }

  // 5. 기타 예외
  return {
    type: 'unknown',
    title: 'AI 작명 생성 실패',
    description: '작명 생성 처리 중 예기치 않은 오류가 발생했습니다.',
    troubleshooting: [
      '입력하신 서사 묘사문에 특수문자나 문제가 없는지 확인해 주세요.',
      '페이지를 새로고침한 후 다시 시도해 주세요.'
    ],
    rawMessage: error?.message || String(error)
  };
}

/**
 * 에러 모달 동작 테스트를 위한 종류별 사전 정의 프리셋
 */
export const TEST_ERROR_PRESETS: { type: NamingErrorType; label: string; error: NamingErrorInfo }[] = [
  {
    type: 'network',
    label: '인터넷 연결 없음 (Network Error)',
    error: {
      type: 'network',
      title: '네트워크 연결 실패',
      description: '인터넷 연결이 원활하지 않거나 AI 서비스 서버에 도달할 수 없습니다.',
      troubleshooting: [
        '네트워크 Wi-Fi 또는 유선 랜 연결 상태를 확인해 주세요.',
        '방화벽, VPN 또는 보안 프로그램이 AI API 통신을 차단하고 있는지 점검해 주세요.',
        '네트워크가 정상 복구된 후 다시 시도해 주세요.'
      ],
      rawMessage: 'TypeError: Failed to fetch (NetworkError when attempting to fetch resource from generativelanguage.googleapis.com)'
    }
  },
  {
    type: 'auth',
    label: 'API 키 오류 (인증 실패/미설정)',
    error: {
      type: 'auth',
      title: 'API 키 인증 오류',
      description: 'Google AI Studio 또는 Groq API 키가 설정되지 않았거나 유효하지 않습니다.',
      troubleshooting: [
        '환경변수(.env) 또는 시스템 설정에 올바른 API 키가 등록되어 있는지 확인해 주세요.',
        'Google AI Studio (Gemini) 또는 Groq Cloud 콘솔에서 발급받은 키의 권한 상태를 확인해 주세요.',
        'API 키 값 앞뒤에 불필요한 공백이나 오탈자가 없는지 점검해 주세요.'
      ],
      rawMessage: 'Google AI Studio Error (401): API_KEY_INVALID - Your API key is not valid. Please pass a valid API key.'
    }
  },
  {
    type: 'quota',
    label: '쿼터 초과 (Rate Limit / 429)',
    error: {
      type: 'quota',
      title: 'AI 쿼터 및 요청 한도 초과',
      description: 'AI 제공사의 분당 요청 한도(RPM) 또는 1일 무료 사용 쿼터가 소진되었습니다.',
      troubleshooting: [
        '무료 플랜의 일시적 분당 요청 제한일 수 있으니 1~2분 뒤 다시 시도해 주세요.',
        '1일 무료 쿼터(Google 1,500회)가 소진된 경우 보조 API(Groq 등)를 등록하시거나 다음 날 초기화 후 이용 가능합니다.'
      ],
      rawMessage: 'Gemini Error (429): ResourceExhausted - Quota exceeded for quota metric "generateContent requests" (RPM / RPD limit)'
    }
  },
  {
    type: 'server',
    label: '서버 일시 장애 (503 / 과부하)',
    error: {
      type: 'server',
      title: 'AI 서비스 일시적 장애',
      description: 'AI 모델 제공사(Google/Groq) 서버에 일시적인 트래픽 과부하 또는 점검이 발생했습니다.',
      troubleshooting: [
        'AI 제공업체의 일시적인 인프라 과부하 상태입니다.',
        '잠시 후 다시 작명 실행을 눌러 재시도해 주세요.'
      ],
      rawMessage: 'Groq Error (503): Service Unavailable - The server is temporarily unable to service your request due to high load.'
    }
  },
  {
    type: 'unknown',
    label: '기타/알 수 없는 오류',
    error: {
      type: 'unknown',
      title: 'AI 작명 생성 실패',
      description: '작명 생성 처리 중 예기치 않은 오류가 발생했습니다.',
      troubleshooting: [
        '입력하신 서사 묘사문에 특수문자나 문제가 없는지 확인해 주세요.',
        '페이지를 새로고침한 후 다시 시도해 주세요.'
      ],
      rawMessage: 'SyntaxError: Unexpected token < in JSON at position 0 (AI response parsing failed)'
    }
  }
];
