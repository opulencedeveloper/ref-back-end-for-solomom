export interface IPackage {
  name: string;
  commission: number;
  point: number;
  amount: number;
  stockistAmount: number;
}

export interface IUpdatePackage {
  id: string;
  name?: string;
  commission?: number;
  point?: number;
  amount?: number;
  stockistAmount?: number;
}
