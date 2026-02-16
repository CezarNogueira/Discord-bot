/**
 * Definições de tipos para comandos de RPG com suporte a actions avançadas
 */

/**
 * Tipos de ações disponíveis
 */
export type ActionType = 
  | 'send_message'       // Enviar mensagem no canal atual
  | 'send_channel'       // Enviar mensagem em canal específico
  | 'send_dm'            // Enviar DM para usuário
  | 'random_reply'       // Resposta aleatória
  | 'add_role'           // Adicionar role ao usuário
  | 'remove_role'        // Remover role do usuário
  | 'delete_message'     // Deletar mensagem
  | 'timeout_user';      // Timeout no usuário

/**
 * Tipos de condições disponíveis
 */
export type ConditionType =
  | 'comparison'    // Comparação entre valores
  | 'chance'        // Chance aleatória
  | 'permission'    // Permissões do servidor
  | 'role'          // Roles do usuário
  | 'channel'       // Canal específico
  | 'user';         // Usuário específico

/**
 * Interface para condição
 */
export interface Condition {
  /** Tipo da condição */
  type: ConditionType;
  
  // Para comparison
  /** Valor 1 para comparação */
  value1?: string | number;
  /** Operador de comparação */
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
  /** Valor 2 para comparação */
  value2?: string | number;
  
  // Para chance
  /** Porcentagem de chance (0-100) */
  chance?: number;
  
  // Para permission
  /** Permissão necessária */
  permission?: string;
  
  // Para role
  /** ID da role necessária */
  roleId?: string;
  /** Nome da role necessária */
  roleName?: string;
  
  // Para channel
  /** ID do canal necessário */
  channelId?: string;
  
  // Para user
  /** ID do usuário necessário */
  userId?: string;
}

/**
 * Interface para uma ação (precisa ser declarada antes de Button por causa das referências circulares)
 */
export interface Action {
  /** Tipo da ação */
  type: ActionType;
  
  /** Condições para executar a ação */
  conditions?: Condition[];
  
  // Para send_message e random_reply
  /** Conteúdo da mensagem */
  content?: string;
  /** Mensagens para random reply */
  messages?: string[];
  
  // Para send_channel
  /** ID do canal de destino */
  channelId?: string;
  
  // Para send_dm
  /** ID do usuário para DM */
  userId?: string;
  
  // Para roles
  /** ID da role */
  roleId?: string;
  
  // Para timeout
  /** Duração do timeout em segundos */
  duration?: number;
  
  // Componentes interativos
  /** Botões para adicionar */
  buttons?: Button[];
  /** Menu select para adicionar */
  selectMenu?: SelectMenu;
  
  // Embed customizado para esta ação
  /** Embed da ação */
  embed?: {
    title?: string;
    description?: string;
    color?: string;
    image?: string;
    thumbnail?: string;
    footer?: string;
  };
}

/**
 * Interface para botão interativo
 */
export interface Button {
  /** Label do botão */
  label: string;
  /** Estilo do botão (Primary, Secondary, Success, Danger, Link) */
  style: 'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link';
  /** ID customizado para identificar o botão */
  customId?: string;
  /** URL (apenas para botões Link) */
  url?: string;
  /** Emoji do botão */
  emoji?: string;
  /** Ações a executar quando clicado */
  actions?: Action[];
}

/**
 * Interface para opção de menu select
 */
export interface SelectOption {
  /** Label da opção */
  label: string;
  /** Valor da opção */
  value: string;
  /** Descrição da opção */
  description?: string;
  /** Emoji da opção */
  emoji?: string;
  /** Ações a executar quando selecionado */
  actions?: Action[];
}

/**
 * Interface para menu select
 */
export interface SelectMenu {
  /** ID customizado do menu */
  customId: string;
  /** Placeholder do menu */
  placeholder?: string;
  /** Mínimo de seleções */
  minValues?: number;
  /** Máximo de seleções */
  maxValues?: number;
  /** Opções do menu */
  options: SelectOption[];
}

/**
 * Interface para um comando completo com actions
 */
export interface Command {
  /** Descrição completa do comando */
  description: string;
  /** URL do GIF para ilustrar o comando */
  gif?: string;
  /** Cooldown em segundos */
  cooldown?: number;
  /** Cor do embed */
  color?: string;
  /** Título do embed */
  title?: string;
  /** Nome do autor */
  author_name?: string;
  /** URL do autor */
  author_url?: string;
  /** Ícone do autor */
  author_icon?: string;
  /** URL da thumbnail */
  thumbnail_url?: string;
  /** Texto do footer */
  footer_text?: string;
  /** Ícone do footer */
  footer_icon?: string;
  
  /** Lista de ações a executar */
  actions?: Action[];
  
  /** Requer confirmação antes de executar */
  requireConfirmation?: boolean;
  /** Mensagem de confirmação */
  confirmationMessage?: string;
}

/**
 * Interface para coleção de comandos
 */
export interface CommandBook {
  [commandName: string]: Command | string;
}

// Mantém compatibilidade com nomes antigos (deprecated)
/** @deprecated Use Command em vez de Spell */
export interface Spell extends Command {}

/** @deprecated Use CommandBook em vez de SpellBook */
export interface SpellBook extends CommandBook {}