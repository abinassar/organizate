export interface Aviso {
  name: string;
  description: string;
  percentage: number; // Guardado como decimal (ej. 0.8 para 80%)
}

export interface Objetivo {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  typeId: string;
  typeCode?: string;
  alerts: Aviso[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
