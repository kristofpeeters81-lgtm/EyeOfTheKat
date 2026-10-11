/**
 * Basistypes van de detectiemotor. De motor is puur TypeScript zonder React of DOM (#14, #27),
 * zodat B-world hem letterlijk kan overnemen en hij in Node getest kan worden.
 */

/** Eén camerabeeld op analysegrootte: RGBA, zoals `ImageData.data`. Bestaat enkel in het geheugen (#3). */
export interface Frame {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Rechthoek in analysepixels (x0/y0 inclusief, x1/y1 exclusief). */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Eén samenhangende vlek in een masker. */
export interface MaskBlob extends Rect {
  label: number;
  area: number;
  cx: number;
  cy: number;
}

/** Het silhouet van de speler (de grootste vlek), met kenmerken in analysepixels. */
export interface Silhouette extends Rect {
  area: number;
  cx: number;
  cy: number;
  /** Bovenste rij met lichaam (hoofd of handen). */
  top: number;
  /** Onderste rij met lichaam (voeten). */
  bottom: number;
  width: number;
  height: number;
  /** Raakt het silhouet de rand van het beeld? (ruimte-check, #26) */
  touches: { left: boolean; right: boolean; top: boolean; bottom: boolean };
}

/** Lichaamsmaten bij de kalibratie (#30): het kind staat rechtop in de voetstappen. */
export interface BodyCalibration {
  top: number;
  bottom: number;
  height: number;
  width: number;
  cx: number;
  area: number;
  frameWidth: number;
  frameHeight: number;
}

/**
 * Het silhouet uitgedrukt tegenover de kalibratie. Alle waarden zijn relatief tot de lichaamslengte,
 * zodat afstand tot de camera, lengte van het kind en liggend/staand niet uitmaken (#11).
 */
export interface BodyPose {
  /** Huidige hoogte / gekalibreerde hoogte (1 = rechtop, 0,7 = gehurkt). */
  heightRatio: number;
  /** Huidige breedte / gekalibreerde breedte (>1,5 = armen/benen gespreid). */
  widthRatio: number;
  /** Hoeveel hoger de bovenkant is dan bij de kalibratie (+ = hoger), in lichaamslengtes. */
  topRise: number;
  /** Hoeveel hoger de onderkant (voeten) is dan bij de kalibratie (+ = voeten los), in lichaamslengtes. */
  feetRise: number;
  /** Horizontale verschuiving van het zwaartepunt (+ = naar rechts op het scherm), in lichaamslengtes. */
  shift: number;
}
