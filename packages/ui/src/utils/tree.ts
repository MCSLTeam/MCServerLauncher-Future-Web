export type TreeNode = {
  key: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  disabled?: boolean;
  selectable?: boolean;
};
