/**
 * Placeholder UI components for ui-kit package
 * This will be expanded during the training program
 */

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'default';
  disabled?: boolean;
}

export interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Placeholder Button component
 */
export function Button(_props: ButtonProps): JSX.Element {
  throw new Error('Not implemented yet - placeholder for training');
}

/**
 * Placeholder Input component
 */
export function Input(_props: InputProps): JSX.Element {
  throw new Error('Not implemented yet - placeholder for training');
}