export type OrderStatus =
  | "PENDING"
  | "CUTTING"
  | "STITCHING"
  | "READY"
  | "DELIVERED";

export type GarmentType = "QAMEEZ" | "SHALWAR" | "WAISTCOAT";

export type GarmentMeasurements = Record<string, number | undefined>;

export type GarmentStyling = {
  collarType?: string;
  cuffSize?: string;
  sidePocket?: boolean;
  frontPocket?: string;
};

export type Garment = {
  id: string;
  type: GarmentType;
  measurements: GarmentMeasurements;
  styling: GarmentStyling;
};

export type Payment = {
  id: string;
  amount: number;
  paidAt: number;
};

export type Order = {
  id: string;
  orderNo: string;
  createdAt: number;
  updatedAt: number;
  customer: {
    name: string;
    phone: string;
  };
  status: OrderStatus;
  deliveryDate: number; // epoch ms
  garments: Garment[];
  notes?: string;
  drawingSvgPath?: string; // placeholder for later canvas export
  fabricPhotoUris: string[];
  price: number;
  advance: number;
  payments: Payment[];
  deviceToken?: string;
  syncedAt?: number;
};
