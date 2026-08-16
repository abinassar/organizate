export interface Category {
  id?: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
