/** Coerces null to an empty string for controlled inputs. */
export function str(value: string | null | undefined): string {
  return value ?? "";
}
