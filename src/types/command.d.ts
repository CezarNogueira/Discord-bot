/**
 * Definições de tipos para comandos de RPG
 * 
 * Este arquivo define as interfaces utilizadas para representar
 * comandos/spells de RPG com metadados e suporte a GIFs
 */

/**
 * Interface para um comando/spell completo
 * Inclui descrição obrigatória e metadados opcionais
 */
export interface Command {
  /** Descrição completa do comando com formatação */
  description: string;
  /** URL do GIF para ilustrar o comando */
  gif?: string;
  /** Rank/nível necessário para usar o comando */
  cooldown?: number;
}

/**
 * Interface para coleção de comandos
 * Suporta tanto formato simples (string) quanto completo (objeto)
 * para manter compatibilidade com versões anteriores
 */
export interface CommandBook {
  [commandName: string]: Command | string;
}

// Mantém compatibilidade com nomes antigos (deprecated)
/** @deprecated Use Command em vez de Spell */
export interface Spell extends Command {}

/** @deprecated Use CommandBook em vez de SpellBook */
export interface SpellBook extends CommandBook {}