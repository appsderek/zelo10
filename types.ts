

// --- MÓDULOS DO SISTEMA (para controle de acesso) ---
export type ModuleKey = 
  | 'members' 
  | 'groups' 
  | 'schedule' 
  | 'chairman_readers' 
  | 'field_service' 
  | 'duties' 
  | 'cleaning' 
  | 'reports' 
  | 'attendance' 
  | 'access'
  | 'public_talks'
  | 'idea_bank'
  | 'report_inbox';

export const ALL_MODULES: Record<ModuleKey, string> = {
  members: 'Publicadores',
  groups: 'Grupos de Campo',
  schedule: 'Vida e Ministério',
  chairman_readers: 'Presidentes e Leitores',
  field_service: 'Saídas de Campo',
  duties: 'Designações de Apoio',
  cleaning: 'Limpeza do Salão',
  reports: 'Relatórios de Campo',
  attendance: 'Assistência',
  access: 'Controle de Acesso',
  public_talks: 'Discursos Públicos',
  idea_bank: 'Banco de Ideias (IA)',
  report_inbox: 'Caixa de Entrada (Relatórios)'
};

// --- CONTROLE DE ACESSO ---
export enum SystemRole {
  TOTAL = 'Total',           // Acesso total (Admin Padrão)
  SELECTIVE = 'Seletivo',      // Acesso customizado (Anciãos/Servos)
  RESTRICTED = 'Restrito',     // Acesso somente leitura (Publicadores)
}


export enum MemberStatus {
  ACTIVE = 'Ativo',
  IRREGULAR = 'Irregular',
  INACTIVE = 'Inativo'
}

export enum MemberPrivilege {
  PUBLISHER = 'Publicador',
  UNBAPTIZED_PUBLISHER = 'Publicador Não Batizado',
  MINISTERIAL_SERVANT = 'Servo Ministerial',
  ELDER = 'Ancião'
}

export enum PioneerStatus {
  NONE = 'Nenhum',
  AUXILIARY = 'Pioneiro Auxiliar',
  REGULAR = 'Pioneiro Regular'
}

// Lista de Funções Administrativas / Tags
export const ADMIN_ROLES = [
  'Coordenador',
  'Secretário',
  'Sup. Serviço',
  'Sup. NVM',
  'Servo de Contas',
  'Sup. A/V',
  'Sup. Presidentes e Leitores',
  'Sup. Indicadores e Volantes',
  'Sup. de Manutenção e Limpeza'
];

export interface AppSettings {
  adminPassword?: string; 
}

export enum MeetingType {
  MIDWEEK = 'Vida e Ministério',
  WEEKEND = 'Discurso Público & Sentinela'
}

export interface Group {
  id: string;
  name: string;
  overseer?: string; 
  assistant?: string;
  meetingPlace?: string;
}

export interface Member {
  id: string;
  fullName: string;
  birthDate: string;
  baptismDate: string;
  address: string;
  phone: string;
  email?: string; 
  emergencyContact: string;
  serviceGroup: string; 
  status: MemberStatus;
  privilege: MemberPrivilege;
  pioneerStatus: PioneerStatus;
  auxiliaryPioneerPeriod?: string; 
  observations?: string;
  
  // Funções Administrativas (Tags)
  roles?: string[]; 

  // Segurança e Permissões
  password?: string;
  customRole: SystemRole;
  permissions: Partial<Record<ModuleKey, boolean>>; // { members: true, groups: false, ... }
}

export interface AttendanceRecord {
  id: string;
  date: string;
  count: number;
  type: MeetingType;
}

export interface ServiceReport {
  id: string; // composite: month-memberId
  month: string; // YYYY-MM
  memberId: string;
  participated: boolean;
  hours: number;
  bibleStudies: number;
  remarks?: string;
}

export interface InboxMessage {
  id: string;
  date: string;
  fromMemberId: string;
  fromMemberName: string;
  targetOverseerName?: string; // Nome do dirigente alvo (para filtro)
  content: string;
  read: boolean;
  type: 'report' | 'system';
  reportData?: {
    month: string;
    hours: number;
    studies: number;
    participated: boolean;
  }
}

export interface MeetingPart {
  id: string;
  time?: string;
  theme: string;
  duration?: string;
  assignedTo: string; 
  assistant?: string; 
  isBHall?: boolean; 
  assignedToB?: string; 
  assistantB?: string; 
}

export interface WeekSchedule {
  id: string;
  date: string;
  congregationName: string;
  chairman: string;
  auxClassCounselor: string;
  
  openingSongTime?: string;
  openingSong: string;
  openingPrayer: string;
  openingCommentsTime?: string;
  openingComments: string; 

  treasuresParts: MeetingPart[]; 

  ministryParts: MeetingPart[]; 

  middleSongTime?: string;
  middleSong: string;
  livingParts: MeetingPart[]; 
  
  congregationStudyTime?: string;
  congregationStudy: {
    theme: string;
    conductor: string;
    reader: string;
  };
  
  closingCommentsTime?: string;
  closingComments: string; 
  closingSongTime?: string;
  closingSong: string;
  closingPrayerTime?: string;
  closingPrayer: string;
}

export interface DutyAssignment {
  id: string;
  date: string;
  attendants: string; 
  microphones: string; 
  soundVideo: string; 
}

export interface CleaningAssignment {
  id: string;
  date: string;
  groupId: string; 
  observations?: string;
}

export interface ChairmanReaderAssignment {
  id: string;
  date: string;
  chairman: string; 
  reader: string; 
}

export interface FieldServiceMeeting {
  id: string;
  dayOfWeek: string; 
  territory: string; 
  conductor: string;
  meetingPlace: string;
  time: string;
}

export interface PublicTalk {
  id: string;
  date: string;
  speaker: string;
  congregation: string;
  outlineNumber: string;
  theme?: string;
}

export interface PublicTalkOutline {
  number: string;
  theme: string;
  hasImage: boolean;
  hasVideo: boolean;
}