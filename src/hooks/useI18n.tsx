import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ko' | 'zh';

interface Translations {
  [key: string]: { [key: string]: string };
}

const translations: Translations = {
  en: {
    discover: 'Discover',
    search: 'Search',
    people: 'People',
    yourLibrary: 'Your Library',
    likedStations: 'Liked Stations',
    profile: 'Profile',
    logOut: 'Log out',
    searchStations: 'Search stations...',
    searchUsers: 'Search users by name or username...',
    follow: 'Follow',
    following: 'Following',
    message: 'Message',
    listeningTo: 'Listening to',
    offline: 'Offline',
    noResults: 'No results found',
    send: 'Send',
    typeMessage: 'Type a message...',
    language: 'Language',
    admin: 'Admin',
    analytics: 'Analytics',
    back: 'Back',
    profileSettings: 'Profile Settings',
    save: 'Save Changes',
    account: 'Account',
    memberSince: 'Member since',
    conversations: 'Conversations',
  },
  es: {
    discover: 'Descubrir',
    search: 'Buscar',
    people: 'Personas',
    yourLibrary: 'Tu Biblioteca',
    likedStations: 'Estaciones Favoritas',
    profile: 'Perfil',
    logOut: 'Cerrar sesión',
    searchStations: 'Buscar estaciones...',
    searchUsers: 'Buscar usuarios por nombre...',
    follow: 'Seguir',
    following: 'Siguiendo',
    message: 'Mensaje',
    listeningTo: 'Escuchando',
    offline: 'Desconectado',
    noResults: 'Sin resultados',
    send: 'Enviar',
    typeMessage: 'Escribe un mensaje...',
    language: 'Idioma',
    admin: 'Admin',
    analytics: 'Analíticas',
    back: 'Atrás',
    profileSettings: 'Configuración de perfil',
    save: 'Guardar cambios',
    account: 'Cuenta',
    memberSince: 'Miembro desde',
    conversations: 'Conversaciones',
  },
  fr: {
    discover: 'Découvrir',
    search: 'Rechercher',
    people: 'Personnes',
    yourLibrary: 'Votre Bibliothèque',
    likedStations: 'Stations Aimées',
    profile: 'Profil',
    logOut: 'Se déconnecter',
    searchStations: 'Rechercher des stations...',
    searchUsers: 'Rechercher des utilisateurs...',
    follow: 'Suivre',
    following: 'Suivi',
    message: 'Message',
    listeningTo: 'Écoute',
    offline: 'Hors ligne',
    noResults: 'Aucun résultat',
    send: 'Envoyer',
    typeMessage: 'Tapez un message...',
    language: 'Langue',
    admin: 'Admin',
    analytics: 'Analytique',
    back: 'Retour',
    profileSettings: 'Paramètres du profil',
    save: 'Sauvegarder',
    account: 'Compte',
    memberSince: 'Membre depuis',
    conversations: 'Conversations',
  },
  de: {
    discover: 'Entdecken',
    search: 'Suchen',
    people: 'Leute',
    yourLibrary: 'Deine Bibliothek',
    likedStations: 'Lieblingsstationen',
    profile: 'Profil',
    logOut: 'Abmelden',
    searchStations: 'Stationen suchen...',
    searchUsers: 'Benutzer suchen...',
    follow: 'Folgen',
    following: 'Gefolgt',
    message: 'Nachricht',
    listeningTo: 'Hört',
    offline: 'Offline',
    noResults: 'Keine Ergebnisse',
    send: 'Senden',
    typeMessage: 'Nachricht eingeben...',
    language: 'Sprache',
    admin: 'Admin',
    analytics: 'Analytik',
    back: 'Zurück',
    profileSettings: 'Profileinstellungen',
    save: 'Änderungen speichern',
    account: 'Konto',
    memberSince: 'Mitglied seit',
    conversations: 'Unterhaltungen',
  },
  pt: {
    discover: 'Descobrir', search: 'Buscar', people: 'Pessoas', yourLibrary: 'Sua Biblioteca',
    likedStations: 'Estações Curtidas', profile: 'Perfil', logOut: 'Sair',
    searchStations: 'Buscar estações...', searchUsers: 'Buscar usuários...',
    follow: 'Seguir', following: 'Seguindo', message: 'Mensagem', listeningTo: 'Ouvindo',
    offline: 'Offline', noResults: 'Sem resultados', send: 'Enviar', typeMessage: 'Digite uma mensagem...',
    language: 'Idioma', admin: 'Admin', analytics: 'Análises', back: 'Voltar',
    profileSettings: 'Configurações do perfil', save: 'Salvar', account: 'Conta', memberSince: 'Membro desde',
    conversations: 'Conversas',
  },
  ja: {
    discover: '発見', search: '検索', people: 'ユーザー', yourLibrary: 'ライブラリ',
    likedStations: 'お気に入り', profile: 'プロフィール', logOut: 'ログアウト',
    searchStations: 'ステーションを検索...', searchUsers: 'ユーザーを検索...',
    follow: 'フォロー', following: 'フォロー中', message: 'メッセージ', listeningTo: '再生中',
    offline: 'オフライン', noResults: '結果なし', send: '送信', typeMessage: 'メッセージを入力...',
    language: '言語', admin: '管理', analytics: '分析', back: '戻る',
    profileSettings: 'プロフィール設定', save: '保存', account: 'アカウント', memberSince: '登録日',
    conversations: '会話',
  },
  ko: {
    discover: '탐색', search: '검색', people: '사람', yourLibrary: '라이브러리',
    likedStations: '좋아요 스테이션', profile: '프로필', logOut: '로그아웃',
    searchStations: '스테이션 검색...', searchUsers: '사용자 검색...',
    follow: '팔로우', following: '팔로잉', message: '메시지', listeningTo: '듣는 중',
    offline: '오프라인', noResults: '결과 없음', send: '전송', typeMessage: '메시지 입력...',
    language: '언어', admin: '관리', analytics: '분석', back: '뒤로',
    profileSettings: '프로필 설정', save: '저장', account: '계정', memberSince: '가입일',
    conversations: '대화',
  },
  zh: {
    discover: '发现', search: '搜索', people: '用户', yourLibrary: '我的库',
    likedStations: '喜欢的电台', profile: '个人资料', logOut: '退出',
    searchStations: '搜索电台...', searchUsers: '搜索用户...',
    follow: '关注', following: '已关注', message: '消息', listeningTo: '正在收听',
    offline: '离线', noResults: '无结果', send: '发送', typeMessage: '输入消息...',
    language: '语言', admin: '管理', analytics: '分析', back: '返回',
    profileSettings: '个人资料设置', save: '保存', account: '账户', memberSince: '注册时间',
    conversations: '对话',
  },
};

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: typeof LANGUAGE_LABELS;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('streamjet-lang');
    return (saved as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('streamjet-lang', lang);
  };

  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t, languages: LANGUAGE_LABELS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
