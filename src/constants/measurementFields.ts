import type { GarmentType } from "@/src/types/order";

export const GARMENT_LABEL_KEY: Record<GarmentType, string> = {
  QAMEEZ: "garment.qameez",
  SHALWAR: "garment.shalwar",
  WAISTCOAT: "garment.waistcoat",
};

export const GARMENT_MEASUREMENT_FIELDS: Record<GarmentType, string[]> = {
  QAMEEZ: ["length", "sleeve", "shoulder", "neck", "chest", "waist", "ghera"],
  SHALWAR: ["length", "paancha"],
  WAISTCOAT: ["length", "chest", "waist"],
};

export const GARMENT_STITCHING_FIELDS: Record<
  GarmentType,
  Array<"collarType" | "cuffSize" | "frontPocket" | "sidePocket">
> = {
  QAMEEZ: ["collarType", "cuffSize", "frontPocket", "sidePocket"],
  SHALWAR: ["frontPocket", "sidePocket"],
  WAISTCOAT: ["collarType", "frontPocket", "sidePocket"],
};

export const MEASUREMENT_LABEL_KEYS: Record<string, string> = {
  length: "measurement.length",
  sleeve: "measurement.sleeve",
  shoulder: "measurement.shoulder",
  neck: "measurement.neck",
  chest: "measurement.chest",
  waist: "measurement.waist",
  ghera: "measurement.ghera",
  paancha: "measurement.paancha",
};

export const STITCHING_LABEL_KEYS = {
  collarType: "orderDetail.collarType",
  cuffSize: "orderDetail.cuffSize",
  frontPocket: "orderDetail.frontPocket",
  sidePocket: "orderDetail.sidePocket",
} as const;
